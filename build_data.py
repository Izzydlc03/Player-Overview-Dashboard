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
    "UC Davis":         {"key": "ucdavis", "name": "UC Davis",         "short": "UCD",  "mascot": "Aggies"},
    "UC Irvine":        {"key": "ucirvine","name": "UC Irvine",        "short": "UCI",  "mascot": "Anteaters"},
    "Hawaii":           {"key": "hawaii",  "name": "Hawai'i",          "short": "HAW",  "mascot": "Rainbow Wahine"},
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

        teams[meta["key"]] = {
            "name": meta["name"], "short": meta["short"], "mascot": meta["mascot"],
            "players": players, "games": games,
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
