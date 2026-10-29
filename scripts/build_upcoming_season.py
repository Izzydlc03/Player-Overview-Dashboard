"""Builds data/2026-27.json for the upcoming season: every team UCSD plays
(non-conference opponents plus the 2026-27 Big West field), each with its
current roster scraped from the school's athletics site. No official games
have been played yet, so every stat is zero and every game list is empty.

    python3 scripts/build_upcoming_season.py

Re-run after rosters change. Once real games exist, scrape the season with
run_season.py and build it with build_data.py instead (then delete this file's
output so the two don't fight over data/2026-27.json).
"""
import json
import os
import re
import sys

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from bigwest_scraper import fetch  # noqa: E402  (cached, rate-limited HTTP GET)

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


def main():
    out = {}
    for key, name, short, mascot, domain in TEAMS:
        try:
            roster = fetch_roster(domain)
        except Exception as exc:  # keep going: a team with no roster is still a valid (empty) team
            print(f"[warn] {name}: roster fetch failed ({exc})")
            roster = []
        print(f"{name}: {len(roster)} players")
        out[key] = {
            "name": name, "short": short, "mascot": mascot,
            "players": [
                {"num": p["num"], "name": p["name"], "pos": p["pos"], "cls": p["cls"], **ZERO_STATS, "advanced": None}
                for p in roster
            ],
            "games": [],
        }
    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump(out, fh, separators=(",", ":"), ensure_ascii=False)
    print(f"wrote {OUT_PATH} ({len(out)} teams)")


if __name__ == "__main__":
    main()
