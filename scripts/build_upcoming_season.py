"""Builds data/2026-27.json for the upcoming season: every team UCSD plays
(non-conference opponents plus the 2026-27 Big West field), each with its
current roster and 2026-27 schedule scraped from the school's athletics site.
No official games have been played yet, so every stat is zero and every game
list is empty; the schedule is kept separately (team["schedule"]) so it never
counts toward a record.

Each roster player also gets an optional "prior" block: last season's
(2025-26) individual stats, matched by name against the national player file
(and the Big West box-score data when available). It powers the "2025-26
stats" placeholder option on the Compare pages. True freshmen and anyone we
can't confidently match have no "prior" block (the dashboard shows zeros).

    python3 scripts/build_upcoming_season.py

Re-run after rosters change. Once real games exist, scrape the season with
run_season.py and build it with build_data.py instead (then delete this file's
output so the two don't fight over data/2026-27.json).
"""
import csv
import json
import os
import re
import sys
import unicodedata

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from bigwest_scraper import fetch, resolve_iso_date  # noqa: E402  (cached, rate-limited HTTP GET)

SEASON = "2026-27"
OUT_PATH = os.path.join(ROOT, "data", f"{SEASON}.json")

# key, display name, short, mascot, athletics domain (roster page lives under it).
# Keys match the ones script.js already uses for these schools.
TEAMS = [
    ("ucsd", "UC San Diego", "UCSD", "Tritons", "ucsdtritons.com"),
    # 2026-27 Big West field
    ("ucirvine", "UC Irvine", "UCI", "Anteaters", "ucirvinesports.com"),
    ("calpoly", "Cal Poly", "CP", "Mustangs", "gopoly.com"),
    ("csub", "Cal State Bakersfield", "CSUB", "Roadrunners", "gorunners.com"),
    ("csuf", "Cal State Fullerton", "CSUF", "Titans", "fullertontitans.com"),
    ("csun", "Cal State Northridge", "CSUN", "Matadors", "gomatadors.com"),
    ("csulb", "Long Beach State", "LBSU", "The Beach", "longbeachstate.com"),
    ("ucr", "UC Riverside", "UCR", "Highlanders", "gohighlanders.com"),
    ("ucsb", "UC Santa Barbara", "UCSB", "Gauchos", "ucsbgauchos.com"),
    ("cbu", "California Baptist", "CBU", "Lancers", "cbulancers.com"),
    ("sacstate", "Sacramento State", "SAC", "Hornets", "hornetsports.com"),
    ("utahvalley", "Utah Valley", "UVU", "Wolverines", "wolverinegreen.com"),
    # Non-conference opponents on UCSD's 2026-27 schedule
    ("washington", "Washington", "UW", "Huskies", "gohuskies.com"),
    ("usandiego", "San Diego", "USD", "Toreros", "usdtoreros.com"),
    ("portlandstate", "Portland State", "PSU", "Vikings", "goviks.com"),
    ("usf", "San Francisco", "USF", "Dons", "usfdons.com"),
    ("whittier", "Whittier", "WHIT", "Poets", "wcpoets.com"),
    ("nau", "Northern Arizona", "NAU", "Lumberjacks", "nauathletics.com"),
    ("csusm", "Cal State San Marcos", "CSUSM", "Cougars", "csusmcougars.com"),
    ("pacific", "Pacific", "PAC", "Tigers", "pacifictigers.com"),
    ("lasalle", "La Salle", "LSU", "Explorers", "goexplorers.com"),
]

# How the national player file spells each school (used to recognise returning players).
NATIONAL_TEAM_NAMES = {
    "ucsd": "UC San Diego", "ucirvine": "UC Irvine", "calpoly": "Cal Poly", "csub": "Cal St. Bakersfield",
    "csuf": "Cal St. Fullerton", "csun": "Cal St. Northridge", "csulb": "Long Beach St.", "ucr": "UC Riverside",
    "ucsb": "UC Santa Barbara", "cbu": "Cal Baptist", "sacstate": "Sacramento St.", "utahvalley": "Utah Valley",
    "washington": "Washington", "usandiego": "San Diego", "portlandstate": "Portland St.", "usf": "San Francisco",
    "nau": "Northern Arizona", "pacific": "Pacific", "lasalle": "La Salle",
}
NATIONAL_CSV = os.path.join(ROOT, "opponents", "overall_data", "wbb_d1_processed_players.csv")
PRIOR_JSON = os.path.join(ROOT, "data", "2025-26.json")
PRIOR_SEASON = "2025-26"

ZERO_STATS = {
    "gp": 0, "min": 0, "fgm": 0, "fga": 0, "tpm": 0, "tpa": 0, "ftm": 0, "fta": 0,
    "oreb": 0, "dreb": 0, "ast": 0, "stl": 0, "blk": 0, "to": 0, "pts": 0,
}


def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()


def text_of(parent, selector):
    el = parent.select_one(selector)
    return clean(el.get_text()) if el else ""


# Some sites spell positions out; the dashboard uses the short forms.
POSITION_SHORT = {"Guard": "G", "Point Guard": "G", "Forward": "F", "Center": "C", "Post": "F/C"}


def parse_jersey(raw):
    raw = clean(raw)
    return int(raw) if raw.isdigit() else raw


def parse_roster_v1(soup):
    players = []
    for li in soup.select("li.sidearm-roster-player"):
        name_el = li.select_one(".sidearm-roster-player-name h3, .sidearm-roster-player-name a")
        if not name_el:
            continue
        pos_spans = li.select(".sidearm-roster-player-position-long-short")
        players.append({
            "num": parse_jersey(text_of(li, ".sidearm-roster-player-jersey-number")),
            "name": clean(name_el.get_text()),
            "pos": clean(pos_spans[-1].get_text()) if pos_spans else "",
            "cls": text_of(li, ".sidearm-roster-player-academic-year"),
        })
    return players


def parse_roster_v2(soup):
    players = []
    for card in soup.select(".s-person-card--list"):
        tokens = [clean(t) for t in card.get_text("|", strip=True).split("|") if clean(t)]

        def after(label):
            return tokens[tokens.index(label) + 1] if label in tokens and tokens.index(label) + 1 < len(tokens) else ""

        if "Jersey Number" not in tokens:
            continue
        jersey_idx = tokens.index("Jersey Number")
        name = tokens[jersey_idx + 2] if jersey_idx + 2 < len(tokens) else ""
        if not name:
            continue
        players.append({
            "num": parse_jersey(after("Jersey Number")),
            "name": name,
            "pos": after("Position"),
            "cls": after("Academic Year"),
        })
    return players


def fetch_roster(domain):
    url = f"https://{domain}/sports/womens-basketball/roster/{SEASON}"
    soup = BeautifulSoup(fetch(url), "lxml")
    players = parse_roster_v1(soup) or parse_roster_v2(soup)
    seen, unique = set(), []
    for p in players:
        key = (p["num"], p["name"].lower())
        if key not in seen:
            seen.add(key)
            unique.append(p)
    for p in unique:
        p["pos"] = POSITION_SHORT.get(p["pos"], p["pos"])
    unique.sort(key=lambda p: (not isinstance(p["num"], int), p["num"] if isinstance(p["num"], int) else 0, p["name"]))
    return unique


TIME_RE = re.compile(r"\b(\d{1,2}(?::\d{2})?\s*[AaPp]\.?[Mm]\.?|Noon|TBD|TBA)\b")
DATE_RE = re.compile(r"[A-Za-z]{3}\s+\d{1,2}")


def clean_opponent(name):
    # Drop rankings/seeds the site prefixes: "#15 Washington", "(9) USC", "[3] Santa Clara", "RV Minnesota".
    return re.sub(r"^(?:#\s*\d+|\(\d+\)|\[\d+\]|No\.\s*\d+|RV)\s+", "", clean(name))


def make_game(date_text, time_text, opponent, home_away, conference, location):
    match = DATE_RE.search(date_text or "")
    if not match or not opponent:
        return None
    try:
        iso = resolve_iso_date(match.group(0), SEASON)
    except (ValueError, KeyError):
        return None
    time_match = TIME_RE.search(time_text or "")
    return {
        "date": iso,
        "opp": clean_opponent(opponent),
        "home": home_away,
        "conf": bool(conference),
        "time": time_match.group(1).upper().replace(".", "") if time_match else "",
        "location": clean(location),
    }


def parse_schedule_v1(soup):
    games = []
    for li in soup.select("li.sidearm-schedule-game"):
        classes = li.get("class", [])
        home_away = ("home" if "sidearm-schedule-home-game" in classes
                     else "away" if "sidearm-schedule-away-game" in classes else "neutral")
        date_el = li.select_one(".sidearm-schedule-game-opponent-date")
        date_text = date_el.get_text(" ", strip=True) if date_el else ""
        conf_el = li.select_one(".sidearm-schedule-game-conference")
        conference = bool(conf_el and (conf_el.get_text(strip=True) or conf_el.select_one("img[alt]")))
        game = make_game(date_text, date_text.split(")", 1)[-1] if ")" in date_text else date_text,
                         text_of(li, ".sidearm-schedule-game-opponent-name"), home_away, conference,
                         text_of(li, ".sidearm-schedule-game-location"))
        if game:
            games.append(game)
    return games


def parse_schedule_v2(soup):
    games = []
    for card in soup.select(".s-game-card"):
        opp_el = card.select_one('[data-test-id="s-game-card-standard__header-team-opponent-link"]')
        stamp = text_of(card, ".s-stamp__text")
        home_away = "away" if stamp == "at" else "home" if stamp == "vs" else "neutral"
        card_text = card.get_text(" ", strip=True)
        descriptors = [clean(d.get_text()).lower() for d in card.select(".s-descriptor__text")]
        game = make_game(card_text, card_text, clean(opp_el.get_text()) if opp_el else "", home_away,
                         any("conference" in d for d in descriptors),
                         text_of(card, '[data-test-id="s-game-card-facility-and-location__standard-location-details"]'))
        if game:
            games.append(game)
    return games


def fetch_schedule(domain):
    soup = BeautifulSoup(fetch(f"https://{domain}/sports/womens-basketball/schedule/{SEASON}"), "lxml")
    games = parse_schedule_v1(soup) or parse_schedule_v2(soup)
    return sorted(games, key=lambda g: (g["date"], g["opp"]))


# ---- last season's individual stats ("prior") ----------------------------------------------
def norm_name(name):
    name = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode()
    name = re.sub(r"[^\w\s-]", "", name.lower())
    return re.sub(r"[\s-]+", " ", name).strip()


CLASS_RANK = {"fr": 1, "so": 2, "jr": 3, "sr": 4, "gr": 5, "5th": 5, "6th": 5}


def class_rank(label):
    return CLASS_RANK.get(clean(label).lower().replace("r-", "").replace(".", ""))


def class_is_plausible(roster_cls, national_cls, same_school):
    """Can a player listed as `roster_cls` in 2026-27 be the `national_cls` player from 2025-26?"""
    if clean(roster_cls) == "Fr.":
        return False  # true freshmen have no college stats
    now, before = class_rank(roster_cls), class_rank(national_cls)
    if now is None or before is None:
        return False
    diff = now - before
    redshirt = clean(roster_cls).lower().startswith("r-")
    if diff == 1 or (diff == 0 and (redshirt or now == 5)):
        return True
    # Rosters and the national file disagree on class labels for some returners; trust the school match.
    return same_school and 0 <= diff <= 2 or now == 5 and diff == 2


def num(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def totals_from_national(row):
    gp = round(num(row["gp"]))
    tpm, tpa = num(row["tpm"]), num(row["tpa"])
    reb = round(num(row["rpg"]) * gp)
    orb, drb = num(row["orb_pct"]), num(row["drb_pct"])
    oreb = round(reb * orb / (orb + drb)) if orb + drb > 0 else 0  # boards aren't split in the file; estimate from rebound rates
    return {
        "gp": gp, "min": round(num(row["mpg"]), 1),
        "fgm": round(num(row["twopm"]) + tpm), "fga": round(num(row["twopa"]) + tpa),
        "tpm": round(tpm), "tpa": round(tpa), "ftm": round(num(row["ftm"])), "fta": round(num(row["fta"])),
        "oreb": oreb, "dreb": reb - oreb,
        "ast": round(num(row["apg"]) * gp), "stl": round(num(row["spg"]) * gp),
        "blk": round(num(row["bpg"]) * gp), "to": round(num(row["tov"]) * gp),
        "pts": round(num(row["ppg"]) * gp),
    }


def attach_prior_stats(out):
    if not (os.path.exists(NATIONAL_CSV) and os.path.exists(PRIOR_JSON)):
        print("[warn] national player file or 2025-26 data missing; skipping prior stats")
        return
    with open(NATIONAL_CSV, newline="", encoding="utf-8") as fh:
        by_name = {}
        for row in csv.DictReader(fh):
            by_name.setdefault(norm_name(row["name"]), []).append(row)
    with open(PRIOR_JSON, encoding="utf-8") as fh:
        box_by_name = {}
        for team in json.load(fh).values():
            for player in team["players"]:
                box_by_name.setdefault(norm_name(player["name"]), []).append(player)

    matched = 0
    for key, team in out.items():
        national_team = NATIONAL_TEAM_NAMES.get(key)
        for player in team["players"]:
            candidates = [
                row for row in by_name.get(norm_name(player["name"]), [])
                if class_is_plausible(player["cls"], row["cls"], row["team"] == national_team)
            ]
            if len(candidates) != 1:
                continue  # none (freshman / non-D1 / new name spelling) or ambiguous: leave at zeros
            row = candidates[0]
            totals = totals_from_national(row)
            source = "national"
            boxes = box_by_name.get(norm_name(player["name"]), [])
            if len(boxes) == 1 and abs(boxes[0]["gp"] - totals["gp"]) <= 1:
                # Big West players: exact box-score totals beat the approximated national ones.
                totals = {k: boxes[0][k] for k in totals}
                source = "box score"
            player["prior"] = {"team": row["team"], "name": row["name"], "season": PRIOR_SEASON, "source": source, **totals}
            matched += 1
    total = sum(len(t["players"]) for t in out.values())
    print(f"prior stats: matched {matched} of {total} roster players")


def main():
    out = {}
    for key, name, short, mascot, domain in TEAMS:
        try:
            roster = fetch_roster(domain)
        except Exception as exc:  # keep going: a team with no roster is still a valid (empty) team
            print(f"[warn] {name}: roster fetch failed ({exc})")
            roster = []
        try:
            schedule = fetch_schedule(domain)
        except Exception as exc:
            print(f"[warn] {name}: schedule fetch failed ({exc})")
            schedule = []
        print(f"{name}: {len(roster)} players, {len(schedule)} scheduled games")
        out[key] = {
            "name": name, "short": short, "mascot": mascot,
            "players": [
                {"num": p["num"], "name": p["name"], "pos": p["pos"], "cls": p["cls"], **ZERO_STATS, "advanced": None}
                for p in roster
            ],
            "games": [],
            "schedule": schedule,
        }
    attach_prior_stats(out)
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(out, fh, separators=(",", ":"), ensure_ascii=False)
    print(f"wrote {OUT_PATH} ({len(out)} teams)")


if __name__ == "__main__":
    main()
