"""
Big West Women's Basketball scraper.

Scrapes schedule + box score pages (SIDEARM Sports platform) for all 11
Big West Conference member sites and produces 4 linked CSVs:
  csv1_game_index.csv, csv2_boxscore_players.csv,
  csv3_playbyplay.csv, csv4_play_analysis.csv
"""
import csv
import hashlib
import os
import re
import sys
import time
import unicodedata
from dataclasses import dataclass, field

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

REQUEST_DELAY_SECONDS = 1.5
REQUEST_TIMEOUT = 25
MAX_RETRIES = 3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, "cache")

# team_key -> (site domain, canonical display name as it appears on box score pages)
TEAMS = {
    "ucdavis": ("ucdavisaggies.com", "UC Davis"),
    "hawaii": ("hawaiiathletics.com", "Hawai'i"),
    "ucirvine": ("ucirvinesports.com", "UC Irvine"),
    "ucsd": ("ucsdtritons.com", "UC San Diego"),
    "ucsb": ("ucsbgauchos.com", "UC Santa Barbara"),
    "calpoly": ("gopoly.com", "Cal Poly"),
    "lbsu": ("longbeachstate.com", "Long Beach State"),
    "csun": ("gomatadors.com", "CSUN"),
    "csuf": ("fullertontitans.com", "Cal State Fullerton"),
    "csub": ("gorunners.com", "Cal State Bakersfield"),
    "ucr": ("gohighlanders.com", "UC Riverside"),
}


def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^\w\s-]", "", name.lower()).strip()
    name = re.sub(r"[\s-]+", "_", name)
    return name


def _cache_path(url: str) -> str:
    h = hashlib.sha256(url.encode()).hexdigest()[:24]
    safe = re.sub(r"[^a-zA-Z0-9]+", "_", url)[-80:]
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f"{h}_{safe}.html")


def fetch(url: str, use_cache: bool = True) -> str:
    path = _cache_path(url)
    if use_cache and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    last_exc = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 200:
                html = resp.text
                with open(path, "w", encoding="utf-8") as f:
                    f.write(html)
                time.sleep(REQUEST_DELAY_SECONDS)
                return html
            elif resp.status_code == 404:
                time.sleep(REQUEST_DELAY_SECONDS)
                return ""
            else:
                last_exc = RuntimeError(f"HTTP {resp.status_code} for {url}")
        except requests.RequestException as e:
            last_exc = e
        time.sleep(REQUEST_DELAY_SECONDS * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_exc}")


@dataclass
class ScheduleGame:
    team_key: str
    opponent: str
    date_text: str
    home_away: str  # 'home' | 'away' | 'neutral'
    is_conference: bool
    box_url: str
    site_location: str
    result_text: str


def parse_schedule(html: str, team_key: str, domain: str) -> list:
    soup = BeautifulSoup(html, "lxml")
    games = []
    for li in soup.select("li.sidearm-schedule-game"):
        classes = li.get("class", [])
        if "sidearm-schedule-home-game" in classes:
            home_away = "home"
        elif "sidearm-schedule-away-game" in classes:
            home_away = "away"
        elif "sidearm-schedule-neutral-game" in classes:
            home_away = "neutral"
        else:
            home_away = "unknown"

        opp_a = li.select_one(".sidearm-schedule-game-opponent-name a")
        if not opp_a:
            opp_a = li.select_one(".sidearm-schedule-game-opponent-name")
        opponent = opp_a.get_text(strip=True) if opp_a else None

        date_span = li.select_one(".sidearm-schedule-game-opponent-date span")
        date_text = date_span.get_text(strip=True) if date_span else None

        box_a = li.select_one(".sidearm-schedule-game-links-boxscore a")
        if not box_a:
            # exhibition / no box score available - skip
            continue
        box_url = box_a["href"]
        if box_url.startswith("/"):
            box_url = f"https://{domain}{box_url}"

        conf_span = li.select_one(".sidearm-schedule-game-conference-conference span")
        is_conference = bool(conf_span and conf_span.get_text(strip=True))

        loc = li.select_one(".sidearm-schedule-game-location span")
        site_location = loc.get_text(strip=True) if loc else ""

        result = li.select_one(".sidearm-schedule-game-result")
        result_text = result.get_text(" ", strip=True) if result else ""

        if not opponent or not date_text:
            continue

        games.append(
            ScheduleGame(
                team_key=team_key,
                opponent=opponent,
                date_text=date_text,
                home_away=home_away,
                is_conference=is_conference,
                box_url=box_url,
                site_location=site_location,
                result_text=result_text,
            )
        )
    return games


MONTHS = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}


def resolve_iso_date(date_text: str, season: str) -> str:
    """date_text like 'Nov 3 (Mon)'; season like '2025-26'."""
    m = re.match(r"([A-Za-z]{3})\s+(\d{1,2})", date_text)
    if not m:
        raise ValueError(f"Unrecognized date text: {date_text!r}")
    mon_str, day_str = m.groups()
    month = MONTHS[mon_str]
    day = int(day_str)
    start_year = int(season.split("-")[0])
    end_year_suffix = season.split("-")[1]
    end_year = int(str(start_year)[:2] + end_year_suffix) if len(end_year_suffix) == 2 else int(end_year_suffix)
    year = start_year if month >= 8 else end_year
    return f"{year:04d}-{month:02d}-{day:02d}"


def _text(el):
    return el.get_text(" ", strip=True) if el else ""


def _int(s):
    s = (s or "").strip()
    if s in ("", "-", "--"):
        return None
    try:
        return int(s)
    except ValueError:
        return None


def _made_att(s):
    s = (s or "").strip()
    m = re.match(r"(-?\d+)\s*-\s*(-?\d+)", s)
    if not m:
        return None, None
    return int(m.group(1)), int(m.group(2))


def _pct(made, att):
    if made is None or att is None or att == 0:
        return ""
    return round(made / att, 3)


@dataclass
class BoxscoreData:
    date_iso: str
    time_str: str
    attendance: str
    site: str
    away_team: str
    home_team: str
    away_score: int
    home_score: int
    players: list = field(default_factory=list)
    playbyplay: list = field(default_factory=list)
    play_analysis: list = field(default_factory=list)


def parse_boxscore(html: str, season: str) -> BoxscoreData:
    soup = BeautifulSoup(html, "lxml")

    gd = soup.select_one(".game-details")
    gd_map = {}
    if gd:
        dts = gd.select("dt")
        dds = gd.select("dd")
        for dt, dd in zip(dts, dds):
            gd_map[dt.get_text(strip=True)] = dd.get_text(strip=True)

    date_raw = gd_map.get("Date", "")
    dm = re.match(r"(\d{2})/(\d{2})/(\d{2})", date_raw)
    if dm:
        mm, dd, yy = dm.groups()
        start_year = int(season.split("-")[0])
        end_suffix = season.split("-")[1]
        end_year = int(str(start_year)[:2] + end_suffix) if len(end_suffix) == 2 else int(end_suffix)
        month = int(mm)
        year = start_year if month >= 8 else end_year
        date_iso = f"{year:04d}-{mm}-{dd}"
    else:
        date_iso = ""

    bsh = soup.select_one(".box-score-header")
    away_score_el = bsh.select_one(".team.away span") if bsh else None
    home_score_el = bsh.select_one(".team.home span") if bsh else None
    away_score = _int(_text(away_score_el))
    home_score = _int(_text(home_score_el))

    tables = soup.select("table.sidearm-table")

    # Team Score By Half table (index 0) gives full canonical team names.
    away_team = home_team = ""
    if tables:
        rows = tables[0].select("tbody tr")
        names = []
        for r in rows:
            name_span = r.select("td")[0].select("span.hide-on-small-down")
            if name_span:
                names.append(name_span[-1].get_text(strip=True))
        if len(names) == 2:
            away_team, home_team = names[0], names[1]

    data = BoxscoreData(
        date_iso=date_iso,
        time_str=gd_map.get("Time", ""),
        attendance=gd_map.get("Attendance", ""),
        site=gd_map.get("Site", ""),
        away_team=away_team,
        home_team=home_team,
        away_score=away_score,
        home_score=home_score,
    )

    # Walk tables in order, classifying by caption / class.
    team_order = [away_team, home_team]
    team_idx = 0
    pending_team_for_splits = None
    player_tables_seen = 0

    i = 0
    n = len(tables)
    while i < n:
        t = tables[i]
        classes = t.get("class", [])
        caption = t.find("caption")
        caption_text = caption.get_text(strip=True) if caption else ""

        if (
            "overall-stats" in classes and caption_text and caption_text != "Team Summary"
            and player_tables_seen < len(team_order)
        ):
            # player box score table for team_order[team_idx]. Some pages
            # (seen on fullertontitans.com in 2022-23) also render extra
            # per-quarter player tables after the two real full-game
            # rosters, reusing the same "overall-stats"+caption shape - cap
            # at one table per team so those aren't picked up as rosters.
            player_tables_seen += 1
            team_name = team_order[team_idx] if team_idx < len(team_order) else caption_text
            for row in t.select("tbody tr"):
                cells = row.find_all("td")
                if not cells:
                    continue
                jersey = cells[0].get_text(strip=True)
                player_cell = cells[1] if len(cells) > 1 else None
                player_name = ""
                if player_cell:
                    for span in player_cell.select("span"):
                        span.extract()
                    player_name = player_cell.get_text(strip=True)
                by_label = {}
                for c in cells:
                    lbl = c.get("data-label")
                    if lbl:
                        by_label[lbl] = c.get_text(strip=True)
                gs_cell = cells[2] if len(cells) > 2 else None
                started = bool(gs_cell and gs_cell.get_text(strip=True) == "*")

                fg_m, fg_a = _made_att(by_label.get("FG"))
                tp_m, tp_a = _made_att(by_label.get("3PT"))
                ft_m, ft_a = _made_att(by_label.get("FT"))
                oreb, dreb = _made_att(by_label.get("ORB-DRB"))
                if oreb is None:
                    o = by_label.get("ORB-DRB", "")
                    parts = o.split("-")
                    if len(parts) == 2:
                        try:
                            oreb, dreb = int(parts[0]), int(parts[1])
                        except ValueError:
                            oreb, dreb = None, None

                is_team_row = jersey.upper() == "TM" or player_name.upper() == "TEAM"
                if not is_team_row:
                    player_name = re.sub(r"^([^,]+),(\S)", r"\1, \2", player_name)
                data.players.append({
                    "team": team_name,
                    "jersey": jersey,
                    "player": "TEAM" if is_team_row else player_name,
                    "started": started,
                    "min": _int(by_label.get("MIN")),
                    "fg_m": fg_m, "fg_a": fg_a, "fg_pct": _pct(fg_m, fg_a),
                    "3p_m": tp_m, "3p_a": tp_a, "3p_pct": _pct(tp_m, tp_a),
                    "ft_m": ft_m, "ft_a": ft_a, "ft_pct": _pct(ft_m, ft_a),
                    "oreb": oreb, "dreb": dreb, "reb": _int(by_label.get("REB")),
                    "pf": _int(by_label.get("PF")),
                    "ast": _int(by_label.get("A")),
                    "to": _int(by_label.get("TO")),
                    "blk": _int(by_label.get("BLK")),
                    "stl": _int(by_label.get("STL")),
                    "pts": _int(by_label.get("PTS")),
                })
            pending_team_for_splits = team_name
            i += 1
            continue

        if "overall-stats" in classes and caption_text == "":
            head = t.find("thead")
            if head and "Team Summary" in head.get_text():
                quarters = {}
                for row in t.select("tbody tr"):
                    th = row.find("td", attrs={"scope": "row"})
                    if th:
                        label = th.get_text(strip=True)
                        tds = row.find_all("td")
                        fg = tds[1].get_text(strip=True) if len(tds) > 1 else ""
                        tp = tds[2].get_text(strip=True) if len(tds) > 2 else ""
                        ft = tds[3].get_text(strip=True) if len(tds) > 3 else ""
                        quarters[label] = {"fg": fg, "3p": tp, "ft": ft}
                data.play_analysis.append({
                    "team": pending_team_for_splits,
                    "quarters": quarters,
                })
            i += 1
            continue

        if "summary-footer" in classes:
            text = t.get_text(" | ", strip=True)
            fields = {}
            for chunk in text.split(" | "):
                if ":" not in chunk:
                    continue
                k, v = chunk.split(":", 1)
                fields[k.strip()] = v.strip()
            if data.play_analysis and data.play_analysis[-1]["team"] == pending_team_for_splits:
                data.play_analysis[-1]["footer"] = fields
            team_idx += 1
            i += 1
            continue

        if caption_text.startswith("Play By Play"):
            period_raw = caption_text.replace("Play By Play - ", "").strip()
            period = {
                "1st": "1", "2nd": "2", "3rd": "3", "4th": "4",
            }.get(period_raw, period_raw.replace(" ", ""))

            for row in t.select("tbody tr"):
                cells = row.find_all("td")
                if len(cells) < 9:
                    continue
                time_remaining = cells[0].get_text(strip=True)
                away_text = cells[1].get_text(" ", strip=True)
                home_text = cells[5].get_text(" ", strip=True)
                away_score_cell = cells[2].get_text(strip=True)
                home_score_cell = cells[4].get_text(strip=True)

                if away_text:
                    team = data.away_team
                    play_text = away_text
                elif home_text:
                    team = data.home_team
                    play_text = home_text
                else:
                    continue

                play_text = re.sub(r"\s+", " ", play_text).strip()
                m = re.search(r"\bby\s+(.+)$", play_text)
                player = ""
                if m:
                    player = m.group(1).split("(")[0].strip()

                def score_num(s):
                    s = s.strip()
                    if not s:
                        return ""
                    mm = re.match(r"(-?\d+)", s)
                    return mm.group(1) if mm else ""

                away_score_val = score_num(away_score_cell)
                home_score_val = score_num(home_score_cell)

                data.playbyplay.append({
                    "period": period,
                    "time_remaining": time_remaining,
                    "team": team,
                    "player": player,
                    "play": play_text,
                    "away_score": away_score_val,
                    "home_score": home_score_val,
                })
            i += 1
            continue

        i += 1

    return data


def detect_template(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    if soup.select("li.sidearm-schedule-game") or soup.select("table.sidearm-table"):
        return "v1"
    if soup.select(".s-game-card") or soup.select(".c-boxscore-page__content"):
        return "v2"
    return "v1"


def parse_schedule_v2(html: str, team_key: str, domain: str) -> list:
    soup = BeautifulSoup(html, "lxml")
    games = []
    for card in soup.select(".s-game-card"):
        opp_a = card.select_one('[data-test-id="s-game-card-standard__header-team-opponent-link"]')
        opponent = opp_a.get_text(strip=True) if opp_a else None

        stamp = card.select_one(".s-stamp__text")
        stamp_text = stamp.get_text(strip=True) if stamp else None
        if stamp_text == "at":
            home_away = "away"
        elif stamp_text == "vs":
            home_away = "home"
        else:
            home_away = "neutral"

        date_el = card.select_one('[data-test-id="s-game-card-standard__header-game-date-details"]')
        date_text = date_el.get_text(strip=True) if date_el else None

        box_a = card.select_one('a[href*="boxscore"]')
        if not box_a:
            continue
        box_url = box_a["href"]
        if box_url.startswith("/"):
            box_url = f"https://{domain}{box_url}"

        descs = [d.get_text(strip=True) for d in card.select(".s-descriptor__text")]
        is_conference = "Big West" in descs

        loc_el = card.select_one('[data-test-id="s-game-card-facility-and-location__standard-location-details"]')
        site_location = loc_el.get_text(strip=True) if loc_el else ""

        if not opponent or not date_text:
            continue

        games.append(
            ScheduleGame(
                team_key=team_key,
                opponent=opponent,
                date_text=date_text,
                home_away=home_away,
                is_conference=is_conference,
                box_url=box_url,
                site_location=site_location,
                result_text="",
            )
        )
    return games


def _kv_pairs_from_text(text: str) -> dict:
    tokens = [t.strip() for t in text.split(" | ") if t.strip() != ""]
    pairs = {}
    for k, v in zip(tokens[0::2], tokens[1::2]):
        pairs[k.rstrip(":").strip()] = v.strip()
    return pairs


def parse_boxscore_v2(html: str, season: str) -> BoxscoreData:
    soup = BeautifulSoup(html, "lxml")

    date_el = soup.find(string=lambda s: s and s.strip().startswith("Date:"))
    gd_map = {}
    if date_el:
        container = date_el.parent.parent.parent
        for child in container.find_all("div", recursive=False):
            text = child.get_text(" ", strip=True)
            if ":" in text:
                k, v = text.split(":", 1)
                gd_map[k.strip()] = v.strip()

    date_raw = gd_map.get("Date", "")
    dm = re.match(r"(\d{2})/(\d{2})/(\d{2})", date_raw)
    if dm:
        mm, dd, yy = dm.groups()
        start_year = int(season.split("-")[0])
        end_suffix = season.split("-")[1]
        end_year = int(str(start_year)[:2] + end_suffix) if len(end_suffix) == 2 else int(end_suffix)
        month = int(mm)
        year = start_year if month >= 8 else end_year
        date_iso = f"{year:04d}-{mm}-{dd}"
    else:
        date_iso = ""

    tables = soup.find_all("table")
    away_team = home_team = ""
    away_score = home_score = None
    if tables:
        rows = tables[0].select("tbody tr")
        names_scores = []
        for r in rows:
            tds = r.find_all("td")
            if not tds:
                continue
            name = tds[0].get_text(" ", strip=True)
            total = tds[-1].get_text(strip=True)
            names_scores.append((name, total))
        if len(names_scores) == 2:
            away_team, away_score = names_scores[0][0], _int(names_scores[0][1])
            home_team, home_score = names_scores[1][0], _int(names_scores[1][1])

    data = BoxscoreData(
        date_iso=date_iso,
        time_str=gd_map.get("Time", ""),
        attendance=gd_map.get("Attendance", ""),
        site=gd_map.get("Site", ""),
        away_team=away_team,
        home_team=home_team,
        away_score=away_score,
        home_score=home_score,
    )

    # Player box score + shooting-split tables: identify by header content.
    player_tables = []
    splits_tables = []
    for t in tables:
        headers = [th.get_text(" ", strip=True).lower() for th in t.select("thead th")]
        joined = " ".join(headers)
        if "player" in joined and "fg" in joined:
            player_tables.append(t)
        elif "team summary" in joined:
            splits_tables.append(t)

    team_order = [away_team, home_team]
    for idx, t in enumerate(player_tables[:2]):
        team_name = team_order[idx] if idx < len(team_order) else ""
        for row in t.select("tbody tr"):
            tds = row.find_all("td")
            if len(tds) < 15:
                continue
            vals = [td.get_text(" ", strip=True) for td in tds]
            jersey, player_name, gs, minutes, fg, tp, ft, orbdrb, reb, pf, ast, to, blk, stl, pts = vals[:15]

            is_team_row = jersey.upper() == "TM" or player_name.upper() == "TEAM"

            fg_m, fg_a = _made_att(fg)
            tp_m, tp_a = _made_att(tp)
            ft_m, ft_a = _made_att(ft)
            oreb, dreb = _made_att(orbdrb)

            data.players.append({
                "team": team_name,
                "jersey": jersey,
                "player": "TEAM" if is_team_row else player_name,
                "started": gs.strip() == "*",
                "min": _int(minutes),
                "fg_m": fg_m, "fg_a": fg_a, "fg_pct": _pct(fg_m, fg_a),
                "3p_m": tp_m, "3p_a": tp_a, "3p_pct": _pct(tp_m, tp_a),
                "ft_m": ft_m, "ft_a": ft_a, "ft_pct": _pct(ft_m, ft_a),
                "oreb": oreb, "dreb": dreb, "reb": _int(reb),
                "pf": _int(pf),
                "ast": _int(ast),
                "to": _int(to),
                "blk": _int(blk),
                "stl": _int(stl),
                "pts": _int(pts),
            })

    # Quarterly shooting splits + footer summary, per team.
    footer_texts = []
    for el in soup.find_all(string=lambda s: s and s.strip() == "Technical Fouls:"):
        node = el.parent
        for _ in range(2):
            node = node.parent
        footer_texts.append(node.get_text(" | ", strip=True))

    period_row_label_map = {
        "1st Quarter": "1st Quarter", "2nd Quarter": "2nd Quarter",
        "3rd Quarter": "3rd Quarter", "4th Quarter": "4th Quarter",
    }
    for idx, t in enumerate(splits_tables[:2]):
        team_name = team_order[idx] if idx < len(team_order) else ""
        quarters = {}
        rows = t.select("tbody tr")
        i = 0
        while i < len(rows):
            tds = rows[i].find_all("td")
            if not tds:
                i += 1
                continue
            label = tds[0].get_text(strip=True)
            if label in period_row_label_map or re.match(r"^(OT ?\d*|1st Quarter|2nd Quarter|3rd Quarter|4th Quarter)$", label):
                vals = [td.get_text(strip=True) for td in tds]
                if len(vals) >= 4:
                    quarters[label] = {"fg": vals[1], "3p": vals[2], "ft": vals[3]}
            i += 1

        footer = {}
        if idx < len(footer_texts):
            footer = _kv_pairs_from_text(footer_texts[idx])

        data.play_analysis.append({"team": team_name, "quarters": quarters, "footer": footer})

    # Play-by-play: locate the top-level tab button labeled "Play-by-play"
    # and select its panel by id (avoids matching nested/unrelated tabpanels).
    pbp_panel = None
    for btn in soup.select('button[role="tab"]'):
        if btn.get_text(" ", strip=True).lower() == "play-by-play":
            panel_id = btn.get("aria-controls")
            if panel_id:
                pbp_panel = soup.find(id=panel_id)
            break
    if pbp_panel is not None:
        sub_buttons = pbp_panel.select('button[role="tab"]')
        sub_panels = pbp_panel.select('[role="tabpanel"]')
        period_labels = []
        for b in sub_buttons:
            txt = b.get_text(" ", strip=True)
            first_word = txt.split(" ")[0] if txt else ""
            period_labels.append({
                "1st": "1", "2nd": "2", "3rd": "3", "4th": "4",
            }.get(first_word, re.sub(r"\s+", "", txt)))

        for pidx, sp in enumerate(sub_panels):
            period = period_labels[pidx] if pidx < len(period_labels) else str(pidx + 1)
            rows = sp.select(".stats, .sscore, .substitution")
            for row in rows:
                time_el = row.select_one(".timeline__point")
                time_remaining = time_el.get_text(strip=True) if time_el else ""

                home_content = row.select_one(".home-content")
                away_content = row.select_one(".away-content")
                home_text = home_content.get_text(" ", strip=True) if home_content else ""
                away_text = away_content.get_text(" ", strip=True) if away_content else ""

                if away_text:
                    team = data.away_team
                    play_text = away_text
                elif home_text:
                    team = data.home_team
                    play_text = home_text
                else:
                    continue

                play_text = re.sub(r"\s+", " ", play_text).strip()
                m = re.search(r"\bby\s+(.+)$", play_text)
                player = m.group(1).split("(")[0].strip() if m else ""

                away_score_val = home_score_val = ""
                if "sscore" in row.get("class", []):
                    # NOTE: this template's '.home-score'/'.away-score' class
                    # names are fixed left/right layout slots, NOT tied to
                    # actual home/away team - match by logo alt text instead.
                    score_by_team = {}
                    for side in row.select(".home-score, .away-score"):
                        img = side.select_one("img")
                        score_p = side.select_one(".s-team__team-score")
                        if img and score_p:
                            score_by_team[img.get("alt", "").strip()] = score_p.get_text(strip=True)
                    away_score_val = score_by_team.get(data.away_team, "")
                    home_score_val = score_by_team.get(data.home_team, "")

                data.playbyplay.append({
                    "period": period,
                    "time_remaining": time_remaining,
                    "team": team,
                    "player": player,
                    "play": play_text,
                    "away_score": away_score_val,
                    "home_score": home_score_val,
                })

    return data


# Sites whose schedule URL needs a season slug other than the standard
# "YYYY-YY". hawaiiathletics.com silently redirects "YYYY-YY" to its generic
# /schedule (current season) endpoint instead of 404ing, so a naive request
# for any historical season there would quietly return current-season data.
SEASON_URL_OVERRIDES = {
    "hawaii": lambda season: f"{season.split('-')[0]}-{int(season.split('-')[0][:2] + season.split('-')[1])}",
}


def format_season_url(team_key: str, season: str) -> str:
    override = SEASON_URL_OVERRIDES.get(team_key)
    return override(season) if override else season


def get_team_schedule(team_key: str, season: str, use_cache=True):
    domain, _ = TEAMS[team_key]
    season_slug = format_season_url(team_key, season)
    url = f"https://{domain}/sports/womens-basketball/schedule/{season_slug}"
    html = fetch(url, use_cache=use_cache)

    # Some sites silently redirect an out-of-range/misformatted season slug
    # to a generic "current season" page instead of 404ing (seen on
    # hawaiiathletics.com). The canonical link tag echoes the season the
    # page actually resolved to, so cross-check it rather than trusting the
    # requested URL blindly.
    canon = re.search(r'<link rel="canonical" href="[^"]*?/schedule/([^"/]+)"', html)
    if canon and canon.group(1) != season_slug:
        raise RuntimeError(
            f"{domain} schedule for season_slug={season_slug!r} silently resolved to "
            f"{canon.group(1)!r} instead (likely an invalid/unsupported season for this site)"
        )

    template = detect_template(html)
    if template == "v2":
        return parse_schedule_v2(html, team_key, domain), template
    return parse_schedule(html, team_key, domain), template
