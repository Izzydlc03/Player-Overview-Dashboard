"""Aggregates the scraped per-season CSVs (csv1_game_index / csv2_boxscore_players)
into per-season JSON files under data/<season>.json, shaped for script.js:

  { teamKey: { name, short, mascot, players: [...], games: [...] } }

Run after re-scraping a season:
    python3 build_data.py            # every season folder
    python3 build_data.py 2026-27    # just the named season(s)

The in-progress 2026-27 season is special: data/2026-27.json starts life as a
roster-and-schedule shell (scripts/build_upcoming_season.py). When that shell
is already on disk, the scraped games are MERGED into it - rosters, class
years, positions, last-season "prior" stats, the schedule and the non-Big-West
opponents are all kept; only the Big West teams' played games, player totals
and per-player game logs are filled in from the scraped CSVs.
"""
import csv
import difflib
import glob
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(ROOT, "data")

# Only these are actual Big West conference members — everything else that
# shows up in a game_index row is a non-conference opponent and only ever
# appears as an "opp" string in a Big West team's game log, never as its
# own TEAMS entry.
TEAM_META = {
    "UC San Diego":     {"key": "ucsd",    "name": "UC San Diego",     "short": "UCSD", "mascot": "Tritons"},
    "UC Irvine":        {"key": "ucirvine","name": "UC Irvine",        "short": "UCI",  "mascot": "Anteaters"},
    "Cal Poly":         {"key": "calpoly", "name": "Cal Poly",         "short": "CP",   "mascot": "Mustangs"},
    "CSU Bakersfield":  {"key": "csub",    "name": "Cal State Bakersfield", "short": "CSUB", "mascot": "Roadrunners"},
    "Cal St. Fullerton":{"key": "csuf",    "name": "Cal State Fullerton",   "short": "CSUF", "mascot": "Titans"},
    "CSUN":             {"key": "csun",    "name": "Cal State Northridge",  "short": "CSUN", "mascot": "Matadors"},
    "Long Beach St.":   {"key": "csulb",   "name": "Long Beach State", "short": "LBSU", "mascot": "The Beach"},
    "UC Riverside":     {"key": "ucr",     "name": "UC Riverside",     "short": "UCR",  "mascot": "Highlanders"},
    "UC Santa Barbara": {"key": "ucsb",    "name": "UC Santa Barbara", "short": "UCSB", "mascot": "Gauchos"},
    # Joined for 2026-27. "from" keeps them out of earlier seasons, where they only
    # appear as the odd non-conference opponent (1-6 games - not a real team season).
    "California Baptist": {"key": "cbu",      "name": "California Baptist", "short": "CBU", "mascot": "Lancers",     "from": "2026-27"},
    "Sacramento St.":     {"key": "sacstate", "name": "Sacramento State",   "short": "SAC", "mascot": "Hornets",     "from": "2026-27"},
    "Utah Valley":        {"key": "utahvalley","name": "Utah Valley",       "short": "UVU", "mascot": "Wolverines",  "from": "2026-27"},
}


def in_season(meta, season):
    return not meta.get("from") or season >= meta["from"]


def num(v, cast=float):
    v = (v or "").strip()
    if v == "":
        return 0
    try:
        return cast(v)
    except ValueError:
        return 0


def display_name(raw):
    # Scraped as "Last, First" — flip to "First Last" for the UI.
    parts = raw.split(",", 1)
    if len(parts) == 2:
        last, first = parts[0].strip(), parts[1].strip()
        return f"{first} {last}"
    return raw.strip()


def opp_display(raw_name, season):
    meta = TEAM_META.get(raw_name)
    return meta["name"] if meta and in_season(meta, season) else raw_name


def pct(made, attempted):
    return (made / attempted * 100) if attempted > 0 else 0


def quarter_points(analysis):
    """Recover actual quarter points from FG/3PT/FT makes, never estimate splits."""
    points = []
    for quarter in range(1, 5):
        splits = [analysis.get(f"q{quarter}_{stat}", "") for stat in ("fg", "3p", "ft")]
        if not all(re.fullmatch(r"\d+-\d+", value.strip()) for value in splits):
            return None
        fg, three, ft = [int(value.split("-")[0]) for value in splits]
        points.append(2 * fg + three + ft)
    return points


def build_season(season_dir, season):
    game_index_path = os.path.join(season_dir, "csv1_game_index.csv")
    boxscore_path = os.path.join(season_dir, "csv2_boxscore_players.csv")
    if not (os.path.exists(game_index_path) and os.path.exists(boxscore_path)):
        return None

    with open(game_index_path, newline="", encoding="utf-8") as fh:
        game_rows = list(csv.DictReader(fh))
    with open(boxscore_path, newline="", encoding="utf-8") as fh:
        box_rows = list(csv.DictReader(fh))
    play_analysis_path = os.path.join(season_dir, "csv4_play_analysis.csv")
    if os.path.exists(play_analysis_path):
        with open(play_analysis_path, newline="", encoding="utf-8") as fh:
            play_analysis_rows = list(csv.DictReader(fh))
    else:
        play_analysis_rows = []

    # game_id -> {home_team, away_team, home_score, away_score}
    games_by_id = {r["game_id"]: r for r in game_rows}
    analysis_by_team_game = {(r["team"], r["game_id"]): r for r in play_analysis_rows}

    # (team, game_id) -> summed box totals, for per-game team rows in the game log.
    # Include TEAM rows here so team rebounds/turnovers are reflected in team-level
    # comparisons, while still excluding those rows from individual player totals.
    team_game_totals = defaultdict(lambda: {
        "fgm": 0, "fga": 0, "tpm": 0, "tpa": 0, "ftm": 0, "fta": 0,
        "oreb": 0, "dreb": 0, "ast": 0, "to": 0, "stl": 0, "blk": 0,
        "pf": 0, "pts": 0,
    })
    # (team, jersey_norm) -> accumulated season totals + per-game appearance count
    player_agg = defaultdict(lambda: {
        "names": defaultdict(int), "jersey_display": defaultdict(int),
        "gp": 0, "min_sum": 0.0,
        "fgm": 0, "fga": 0, "tpm": 0, "tpa": 0, "ftm": 0, "fta": 0,
        "oreb": 0, "dreb": 0, "ast": 0, "stl": 0, "blk": 0, "to": 0, "pts": 0,
    })

    for r in box_rows:
        team = r["team"]
        tg = team_game_totals[(team, r["game_id"])]
        tg["fgm"] += num(r["fg_m"], int); tg["fga"] += num(r["fg_a"], int)
        tg["tpm"] += num(r["3p_m"], int); tg["tpa"] += num(r["3p_a"], int)
        tg["ftm"] += num(r["ft_m"], int); tg["fta"] += num(r["ft_a"], int)
        tg["oreb"] += num(r["oreb"], int); tg["dreb"] += num(r["dreb"], int)
        tg["ast"] += num(r["ast"], int); tg["to"] += num(r["to"], int)
        tg["stl"] += num(r["stl"], int); tg["blk"] += num(r["blk"], int)
        tg["pf"] += num(r["pf"], int); tg["pts"] += num(r["pts"], int)

        if r["player"] == "TEAM":
            continue

        jersey = r["jersey"].strip()
        jersey_norm = str(int(jersey)) if re.fullmatch(r"\d+", jersey) else jersey

        p = player_agg[(team, jersey_norm)]
        p["names"][r["player"]] += 1
        p["jersey_display"][jersey_norm] += 1
        p["gp"] += 1
        p["min_sum"] += num(r["min"], float)
        p["fgm"] += num(r["fg_m"], int); p["fga"] += num(r["fg_a"], int)
        p["tpm"] += num(r["3p_m"], int); p["tpa"] += num(r["3p_a"], int)
        p["ftm"] += num(r["ft_m"], int); p["fta"] += num(r["ft_a"], int)
        p["oreb"] += num(r["oreb"], int); p["dreb"] += num(r["dreb"], int)
        p["ast"] += num(r["ast"], int); p["stl"] += num(r["stl"], int)
        p["blk"] += num(r["blk"], int); p["to"] += num(r["to"], int)
        p["pts"] += num(r["pts"], int)

    teams = {}
    for raw_name, meta in TEAM_META.items():
        if not in_season(meta, season):
            continue
        team_rows = [g for g in game_rows if g["home_team"] == raw_name or g["away_team"] == raw_name]
        if not team_rows:
            continue

        games = []
        for g in sorted(team_rows, key=lambda g: g["date"]):
            is_home = g["home_team"] == raw_name
            opp_raw = g["away_team"] if is_home else g["home_team"]
            pf = num(g["home_score"] if is_home else g["away_score"], int)
            pa = num(g["away_score"] if is_home else g["home_score"], int)
            empty_totals = {
                "fgm": 0, "fga": 0, "tpm": 0, "tpa": 0, "ftm": 0, "fta": 0,
                "oreb": 0, "dreb": 0, "ast": 0, "to": 0, "stl": 0, "blk": 0,
                "pf": 0, "pts": 0,
            }
            tg = team_game_totals.get((raw_name, g["game_id"]), empty_totals)
            og = team_game_totals.get((opp_raw, g["game_id"]), empty_totals)
            analysis = analysis_by_team_game.get((raw_name, g["game_id"]), {})
            games.append({
                "date": g["date"], "opp": opp_display(opp_raw, season), "home": is_home,
                "pf": pf, "pa": pa, "win": pf > pa,
                "fgm": tg["fgm"], "fga": tg["fga"],
                "tpm": tg["tpm"], "tpa": tg["tpa"], "ftm": tg["ftm"], "fta": tg["fta"],
                "oreb": tg["oreb"], "dreb": tg["dreb"], "reb": tg["oreb"] + tg["dreb"],
                "ast": tg["ast"], "to": tg["to"], "stl": tg["stl"], "blk": tg["blk"], "fouls": tg["pf"],
                "oppFgm": og["fgm"], "oppFga": og["fga"],
                "oppTpm": og["tpm"], "oppTpa": og["tpa"], "oppFtm": og["ftm"], "oppFta": og["fta"],
                "oppOreb": og["oreb"], "oppDreb": og["dreb"], "oppReb": og["oreb"] + og["dreb"],
                "oppAst": og["ast"], "oppTo": og["to"], "oppStl": og["stl"], "oppBlk": og["blk"], "oppPf": og["pf"],
                "paintPts": num(analysis.get("pts_in_paint"), int),
                "fastBreakPts": num(analysis.get("fast_break_pts"), int),
                "secondChancePts": num(analysis.get("second_chance_pts"), int),
                "ptsOffTurnovers": num(analysis.get("pts_off_turnovers"), int),
                "benchPts": num(analysis.get("bench_pts"), int),
            })
            quarters = quarter_points(analysis)
            if quarters is not None:
                games[-1]["quarterPoints"] = quarters

        players = []
        for (team, jersey_norm), p in player_agg.items():
            if team != raw_name:
                continue
            name = max(p["names"], key=p["names"].get)
            jersey_disp = max(p["jersey_display"], key=p["jersey_display"].get)
            gp = p["gp"]
            players.append({
                "num": int(jersey_disp) if re.fullmatch(r"\d+", jersey_disp) else jersey_disp,
                "name": display_name(name), "pos": "",
                "gp": gp, "min": round(p["min_sum"] / gp, 1) if gp else 0,
                "fgm": p["fgm"], "fga": p["fga"], "tpm": p["tpm"], "tpa": p["tpa"],
                "ftm": p["ftm"], "fta": p["fta"], "oreb": p["oreb"], "dreb": p["dreb"],
                "ast": p["ast"], "stl": p["stl"], "blk": p["blk"], "to": p["to"], "pts": p["pts"],
            })
        players.sort(key=lambda p: -p["pts"])
        games_by_game_id = {g["game_id"]: g for g in team_rows}
        player_game_logs = defaultdict(list)
        for r in sorted(box_rows, key=lambda row: (games_by_id.get(row["game_id"], {}).get("date", ""), row["game_id"])):
            if r["team"] != raw_name or r["player"] == "TEAM":
                continue
            g = games_by_game_id.get(r["game_id"])
            if not g:
                continue
            is_home = g["home_team"] == raw_name
            opp_raw = g["away_team"] if is_home else g["home_team"]
            pf = num(g["home_score"] if is_home else g["away_score"], int)
            pa = num(g["away_score"] if is_home else g["home_score"], int)
            margin = pf - pa
            fgm = num(r["fg_m"], int)
            fga = num(r["fg_a"], int)
            tpm = num(r["3p_m"], int)
            tpa = num(r["3p_a"], int)
            ftm = num(r["ft_m"], int)
            fta = num(r["ft_a"], int)
            oreb = num(r["oreb"], int)
            dreb = num(r["dreb"], int)
            player_game_logs[re.sub(r"\s+", " ", display_name(r["player"]).strip()).lower()].append({
                "gameId": r["game_id"],
                "date": g["date"],
                "opp": opp_display(opp_raw, season),
                "home": is_home,
                "win": pf > pa,
                "pm": margin,
                "min": num(r["min"], float),
                "fgm": fgm, "fga": fga, "tpm": tpm, "tpa": tpa, "ftm": ftm, "fta": fta,
                "oreb": oreb, "dreb": dreb, "reb": oreb + dreb,
                "ast": num(r["ast"], int),
                "stl": num(r["stl"], int),
                "blk": num(r["blk"], int),
                "to": num(r["to"], int),
                "pts": num(r["pts"], int),
                "fgPct": pct(fgm, fga),
                "tpPct": pct(tpm, tpa),
                "ftPct": pct(ftm, fta),
            })

        teams[meta["key"]] = {
            "name": meta["name"], "short": meta["short"], "mascot": meta["mascot"],
            "players": players, "games": games,
            "playerGameLogs": dict(player_game_logs),
        }

    return teams


STAT_KEYS = ["gp", "min", "fgm", "fga", "tpm", "tpa", "ftm", "fta",
             "oreb", "dreb", "ast", "stl", "blk", "to", "pts"]


def norm_name(name):
    name = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode()
    name = re.sub(r"[^\w\s-]", "", name.lower())
    return re.sub(r"[\s-]+", " ", name).strip()


def is_roster_shell(existing):
    """True for a data file from build_upcoming_season.py (rosters + schedule, no stats)."""
    return any("schedule" in t or any("cls" in p for p in t.get("players", [])) for t in existing.values())


def match_roster_player(box_player, roster):
    """Index of the roster entry for a box-score player, or None.

    Roster pages and box scores spell names differently (nicknames, accents, "Jr."), so after
    an exact normalised-name match we accept the same jersey number with a similar name.
    """
    target = norm_name(box_player["name"])
    for i, rp in enumerate(roster):
        if norm_name(rp["name"]) == target:
            return i, "name"
    best, best_ratio = None, 0.0
    for i, rp in enumerate(roster):
        if rp["num"] != box_player["num"]:
            continue
        name = norm_name(rp["name"])
        ratio = difflib.SequenceMatcher(None, name, target).ratio()
        same_last = name.split()[-1:] == target.split()[-1:]
        if (ratio >= 0.75 or same_last) and ratio > best_ratio:
            best, best_ratio = i, ratio
    return (best, f"jersey #{box_player['num']} ({best_ratio:.2f})") if best is not None else (None, "")


def merge_into_shell(built, existing):
    """Fill the roster shell's Big West teams with scraped games/stats; keep everything else."""
    merged = {key: team for key, team in existing.items()}
    for key, new in built.items():
        shell = existing.get(key)
        if shell is None:
            merged[key] = new
            continue

        roster = [{**p, **{k: 0 for k in STAT_KEYS}} for p in shell["players"]]  # reset: idempotent re-runs
        fresh = []          # box-score players with no roster match
        name_for_logs = {}  # box-score name key -> roster name key
        for bp in new["players"]:
            idx, how = match_roster_player(bp, roster)
            if idx is None:
                fresh.append(bp)
                print(f"  [{key}] no roster match: #{bp['num']} {bp['name']} ({bp['gp']} gp) -> added as new player")
                continue
            rp = roster[idx]
            if how != "name":
                print(f"  [{key}] matched by {how}: box '{bp['name']}' -> roster '{rp['name']}'")
            total_gp = rp["gp"] + bp["gp"]
            rp["min"] = round((rp["min"] * rp["gp"] + bp["min"] * bp["gp"]) / total_gp, 1) if total_gp else 0
            rp["gp"] = total_gp
            for k in STAT_KEYS:
                if k not in ("gp", "min"):
                    rp[k] += bp[k]
            name_for_logs[re.sub(r"\s+", " ", bp["name"].strip()).lower()] = re.sub(r"\s+", " ", rp["name"].strip()).lower()

        for bp in fresh:
            roster.append({**bp, "cls": "", "advanced": None})

        logs = defaultdict(list)
        for log_key, entries in new["playerGameLogs"].items():
            logs[name_for_logs.get(log_key, log_key)].extend(entries)
        for entries in logs.values():
            entries.sort(key=lambda e: e["date"])

        merged[key] = {**shell, "players": roster, "games": new["games"], "playerGameLogs": dict(logs)}
    return merged


def main():
    wanted = set(sys.argv[1:])
    os.makedirs(OUT_DIR, exist_ok=True)
    season_dirs = sorted(
        d for d in glob.glob(os.path.join(ROOT, "20*-*"))
        if os.path.isdir(d) and re.fullmatch(r"\d{4}-\d{2}", os.path.basename(d))
        and (not wanted or os.path.basename(d) in wanted)
    )
    for season_dir in season_dirs:
        season = os.path.basename(season_dir)
        teams = build_season(season_dir, season)
        if teams is None:
            print(f"skip {season}: missing csv1/csv2")
            continue
        out_path = os.path.join(OUT_DIR, f"{season}.json")
        ensure_ascii = True  # completed seasons are written with \u escapes; the roster shell uses literal UTF-8
        if os.path.exists(out_path):
            with open(out_path, encoding="utf-8") as fh:
                existing = json.load(fh)
            if is_roster_shell(existing):
                print(f"merging {season} games into the roster/schedule shell")
                teams = merge_into_shell(teams, existing)
                ensure_ascii = False
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(teams, fh, separators=(",", ":"), ensure_ascii=ensure_ascii)
        print(f"wrote {out_path} ({len(teams)} teams)")


if __name__ == "__main__":
    main()
