"""Scrapes official Big West women's basketball standings (bigwest.org) for every
season the site lists and writes them to data/standings.json, in site order
(which already applies the conference's tiebreakers).

    python3 scripts/fetch_bigwest_standings.py

Only seasons the dashboard has (a data/<season>.json file) are kept, and seasons
where no conference games have been played yet are skipped.
"""
import json
import os
import re
import time

import requests
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "data", "standings.json")
BASE_URL = "https://bigwest.org/standings.aspx?path=wbball"
SELECT_ID = "ctl00_cplhMainContent_ddl_past_standings"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}
DELAY_SECONDS = 1.0


def get(url):
    resp = requests.get(url, headers=HEADERS, timeout=25)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "lxml")


def list_seasons(soup):
    """[(standings_id, 'YYYY-YY'), ...] newest first, from the season dropdown."""
    select = soup.find("select", id=SELECT_ID)
    seasons = []
    for option in select.find_all("option"):
        match = re.match(r"(\d{4}-\d{2})", option.get_text(strip=True))
        if match:
            seasons.append((option["value"], match.group(1)))
    return seasons


def clean_school(name):
    # Older seasons append tournament seeds / footnote marks, e.g. "UC Davis (1)" or "Cal Poly *".
    return re.sub(r"\s*(\(\d+\)|\*)+\s*$", "", name).strip()


def clean_pct(value):
    try:
        return float(value)
    except ValueError:
        return 0.0


def parse_table(soup):
    table = soup.find("table")
    if table is None:
        return []
    rows = table.find_all("tr")
    header = [c.get_text(" ", strip=True).lower() for c in rows[0].find_all(["th", "td"])]

    def col(name, nth=0):
        hits = [i for i, h in enumerate(header) if h == name]
        return hits[nth] if len(hits) > nth else None

    # The site repeats columns (School/School, Conf/BW, Overall/Overall); take the first of each.
    idx = {
        "school": col("school"),
        "conf": col("conf"),
        "confPct": col("bw pct."),
        "overall": col("overall"),
        "overallPct": col("overall pct."),
        "home": col("home"),
        "away": col("away"),
        "neutral": col("neutral"),
        "last10": col("last 10"),
        "streak": col("streak"),
    }
    teams = []
    for row in rows[1:]:
        cells = [c.get_text(" ", strip=True) for c in row.find_all(["th", "td"])]
        if not cells or idx["school"] is None or idx["school"] >= len(cells):
            continue

        def get_cell(key):
            i = idx[key]
            return cells[i] if i is not None and i < len(cells) else ""

        teams.append({
            "school": clean_school(get_cell("school")),
            "conf": get_cell("conf"),
            "confPct": clean_pct(get_cell("confPct")),
            "overall": get_cell("overall"),
            "overallPct": clean_pct(get_cell("overallPct")),
            "home": get_cell("home"),
            "away": get_cell("away"),
            "neutral": get_cell("neutral"),
            "last10": get_cell("last10"),
            "streak": get_cell("streak"),
        })
    return teams


def has_games(teams):
    return any(t["conf"] and t["conf"] != "0-0" for t in teams)


def main():
    seasons = list_seasons(get(BASE_URL))
    out = {}
    for standings_id, season in seasons:
        if not os.path.exists(os.path.join(ROOT, "data", f"{season}.json")):
            continue
        # Earlier years in the dropdown are labelled by sport year and aren't all women's basketball.
        soup = get(f"{BASE_URL}&standings={standings_id}")
        caption = soup.find("caption")
        if caption is None or "Women's Basketball" not in caption.get_text():
            print(f"skip {season} (id {standings_id}): not a women's basketball table")
            continue
        teams = parse_table(soup)
        if not has_games(teams):
            print(f"skip {season}: no conference games played yet")
            continue
        out[season] = teams
        print(f"{season}: {len(teams)} teams")
        time.sleep(DELAY_SECONDS)

    with open(OUT_PATH, "w", encoding="utf-8") as fh:
        json.dump({"source": BASE_URL, "seasons": out}, fh, separators=(",", ":"))
    print(f"wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
