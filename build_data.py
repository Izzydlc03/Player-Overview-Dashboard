"""Aggregates the scraped per-season CSVs (csv1_game_index / csv2_boxscore_players)
into per-season JSON files under data/<season>.json, shaped for script.js:

  { teamKey: { name, short, mascot, players: [...], games: [...] } }

Run after re-scraping a season:
    python3 build_data.py
"""
import csv
import glob
import json
import os
import re
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
}


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


def normalize_player_name(name):
    # Mirrors script.js's normalizePlayerName() exactly — this is the key
    # playerTrendGames() looks up into a team's playerGameLogs by.
    parts = [p.strip() for p in name.split(",")]
    if len(parts) == 2:
        name = f"{parts[1]} {parts[0]}"
    name = re.sub(r"\.", "", name)
    name = re.sub(r"\s+", " ", name).strip().lower()
    return name


def game_pct(made, att):
    return (made / att * 100) if att > 0 else 0


def opp_display(raw_name):
    meta = TEAM_META.get(raw_name)
    return meta["name"] if meta else raw_name


def build_season(season_dir, season):
    game_index_path = os.path.join(season_dir, "csv1_game_index.csv")
    boxscore_path = os.path.join(season_dir, "csv2_boxscore_players.csv")
    if not (os.path.exists(game_index_path) and os.path.exists(boxscore_path)):
        return None

    with open(game_index_path, newline="", encoding="utf-8") as fh:
        game_rows = list(csv.DictReader(fh))
    with open(boxscore_path, newline="", encoding="utf-8") as fh:
        box_rows = list(csv.DictReader(fh))

    # game_id -> {home_team, away_team, home_score, away_score}
    games_by_id = {r["game_id"]: r for r in game_rows}

    # (team, game_id) -> summed box totals, for per-game team rows in the game log
    team_game_totals = defaultdict(lambda: {"fgm": 0, "fga": 0, "oreb": 0, "dreb": 0, "ast": 0, "to": 0})
    # (team, jersey_norm) -> accumulated season totals + per-game appearance count
    player_agg = defaultdict(lambda: {
        "names": defaultdict(int), "jersey_display": defaultdict(int),
        "gp": 0, "min_sum": 0.0,
        "fgm": 0, "fga": 0, "tpm": 0, "tpa": 0, "ftm": 0, "fta": 0,
        "oreb": 0, "dreb": 0, "ast": 0, "stl": 0, "blk": 0, "to": 0, "pts": 0,
    })
    # (team, normalized_player_name) -> per-game entries, for the player-detail
    # trend chart. Without this, playerTrendGames() in script.js falls back to
    # the TEAM's per-game totals (e.g. ~30 rebounds/game) as if they were a
    # single player's — wildly wrong and well outside that player's own axis.
    player_game_logs = defaultdict(list)

    for r in box_rows:
        if r["player"] == "TEAM":
            continue
        team, jersey = r["team"], r["jersey"].strip()
        jersey_norm = str(int(jersey)) if re.fullmatch(r"\d+", jersey) else jersey

        tg = team_game_totals[(team, r["game_id"])]
        tg["fgm"] += num(r["fg_m"], int); tg["fga"] += num(r["fg_a"], int)
        tg["oreb"] += num(r["oreb"], int); tg["dreb"] += num(r["dreb"], int)
        tg["ast"] += num(r["ast"], int); tg["to"] += num(r["to"], int)

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

        g = games_by_id.get(r["game_id"])
        if g:
            is_home = g["home_team"] == team
            opp_raw = g["away_team"] if is_home else g["home_team"]
            pf = num(g["home_score"] if is_home else g["away_score"], int)
            pa = num(g["away_score"] if is_home else g["home_score"], int)
            fgm, fga = num(r["fg_m"], int), num(r["fg_a"], int)
            tpm, tpa = num(r["3p_m"], int), num(r["3p_a"], int)
            ftm, fta = num(r["ft_m"], int), num(r["ft_a"], int)
            oreb, dreb = num(r["oreb"], int), num(r["dreb"], int)
            player_game_logs[(team, normalize_player_name(display_name(r["player"])))].append({
                "gameId": r["game_id"], "date": g["date"], "opp": opp_display(opp_raw),
                "home": is_home, "win": pf > pa,
                "min": num(r["min"], float),
                "fgm": fgm, "fga": fga, "tpm": tpm, "tpa": tpa, "ftm": ftm, "fta": fta,
                "oreb": oreb, "dreb": dreb, "reb": oreb + dreb,
                "ast": num(r["ast"], int), "stl": num(r["stl"], int), "blk": num(r["blk"], int),
                "to": num(r["to"], int), "pts": num(r["pts"], int),
                "fgPct": game_pct(fgm, fga), "tpPct": game_pct(tpm, tpa), "ftPct": game_pct(ftm, fta),
            })

    teams = {}
    for raw_name, meta in TEAM_META.items():
        team_rows = [g for g in game_rows if g["home_team"] == raw_name or g["away_team"] == raw_name]
        if not team_rows:
            continue

        games = []
        for g in sorted(team_rows, key=lambda g: g["date"]):
            is_home = g["home_team"] == raw_name
            opp_raw = g["away_team"] if is_home else g["home_team"]
            pf = num(g["home_score"] if is_home else g["away_score"], int)
            pa = num(g["away_score"] if is_home else g["home_score"], int)
            tg = team_game_totals.get((raw_name, g["game_id"]), {"fgm": 0, "fga": 0, "oreb": 0, "dreb": 0, "ast": 0, "to": 0})
            games.append({
                "date": g["date"], "opp": opp_display(opp_raw), "home": is_home,
                "pf": pf, "pa": pa, "win": pf > pa,
                "fgm": tg["fgm"], "fga": tg["fga"],
                "reb": tg["oreb"] + tg["dreb"], "ast": tg["ast"], "to": tg["to"],
            })

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

        player_game_logs_out = {}
        for (team, norm_name), entries in player_game_logs.items():
            if team != raw_name:
                continue
            player_game_logs_out[norm_name] = sorted(entries, key=lambda e: e["date"])

        teams[meta["key"]] = {
            "name": meta["name"], "short": meta["short"], "mascot": meta["mascot"],
            "players": players, "games": games, "playerGameLogs": player_game_logs_out,
        }

    return teams


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    season_dirs = sorted(
        d for d in glob.glob(os.path.join(ROOT, "20*-*"))
        if os.path.isdir(d) and re.fullmatch(r"\d{4}-\d{2}", os.path.basename(d))
    )
    for season_dir in season_dirs:
        season = os.path.basename(season_dir)
        teams = build_season(season_dir, season)
        if teams is None:
            print(f"skip {season}: missing csv1/csv2")
            continue
        out_path = os.path.join(OUT_DIR, f"{season}.json")
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(teams, fh, separators=(",", ":"))
        print(f"wrote {out_path} ({len(teams)} teams)")


if __name__ == "__main__":
    main()
