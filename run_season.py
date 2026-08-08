"""
Scrape one Big West WBB season across all 11 teams and emit the 4 linked CSVs.

Usage: python3 run_season.py 2025-26 [--teams ucdavis,ucsd,...] [--out-dir DIR]
"""
import argparse
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bigwest_scraper import (
    TEAMS, get_team_schedule, resolve_iso_date, parse_boxscore, parse_boxscore_v2, fetch, slugify,
)

QUARTER_LABEL_MAP = {
    "1st Quarter": "q1", "2nd Quarter": "q2", "3rd Quarter": "q3", "4th Quarter": "q4",
}


def ot_key(label):
    # 'OT 1' -> 'ot1'
    digits = "".join(ch for ch in label if ch.isdigit())
    return f"ot{digits}" if digits else "ot"


def parse_footer_int(fields, key):
    val = fields.get(key, "")
    if not val or val.lower() == "none":
        return 0
    digits = "".join(ch for ch in val if ch.isdigit() or ch == "-")
    try:
        return int(digits)
    except ValueError:
        return 0


def build_stub_key(team_display_name, opponent_name, iso_date):
    a, b = sorted([slugify(team_display_name), slugify(opponent_name)])
    return (iso_date, a, b)


def collect_schedule_stubs(season, team_keys, use_cache=True):
    all_stubs = []
    for tk in team_keys:
        domain, display_name = TEAMS[tk]
        print(f"[schedule] fetching {display_name} ({domain}) {season}...", flush=True)
        games, template = get_team_schedule(tk, season, use_cache=use_cache)
        print(f"[schedule]   {len(games)} games found (template={template})", flush=True)
        for g in games:
            try:
                iso = resolve_iso_date(g.date_text, season)
            except ValueError as e:
                print(f"[warn] {e}", file=sys.stderr)
                continue
            all_stubs.append((tk, display_name, iso, g, template))
    return all_stubs


def dedupe_stubs(all_stubs):
    by_key = {}
    for tk, display_name, iso, g, template in all_stubs:
        key = build_stub_key(display_name, g.opponent, iso)
        by_key.setdefault(key, []).append((tk, display_name, iso, g, template))

    chosen = []
    for key, candidates in by_key.items():
        home_candidates = [c for c in candidates if c[3].home_away == "home"]
        pick = home_candidates[0] if home_candidates else candidates[0]
        chosen.append(pick)
    return chosen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("season", help="e.g. 2025-26")
    ap.add_argument("--teams", default=",".join(TEAMS.keys()))
    ap.add_argument("--out-dir", default=os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output"))
    ap.add_argument("--no-cache", action="store_true")
    args = ap.parse_args()

    season = args.season
    team_keys = args.teams.split(",")
    use_cache = not args.no_cache
    os.makedirs(args.out_dir, exist_ok=True)

    all_stubs = collect_schedule_stubs(season, team_keys, use_cache=use_cache)
    chosen = dedupe_stubs(all_stubs)
    print(f"[dedupe] {len(all_stubs)} raw schedule entries -> {len(chosen)} unique games", flush=True)

    csv1_rows = []
    csv2_rows = []
    csv3_rows = []
    csv4_rows = []
    seen_game_ids = set()
    skipped_dupes = 0

    for idx, (tk, display_name, iso, g, template) in enumerate(sorted(chosen, key=lambda c: c[2])):
        print(f"[boxscore] ({idx+1}/{len(chosen)}) {iso} {display_name} vs {g.opponent} -> {g.box_url} [{template}]", flush=True)
        try:
            html = fetch(g.box_url, use_cache=use_cache)
            if not html:
                print(f"[warn] empty response for {g.box_url}, skipping", file=sys.stderr)
                continue
            parser = parse_boxscore_v2 if template == "v2" else parse_boxscore
            data = parser(html, season)
        except Exception as e:
            print(f"[error] failed parsing {g.box_url}: {e}", file=sys.stderr)
            continue

        if not data.away_team or not data.home_team or data.away_score is None:
            print(f"[warn] incomplete boxscore data for {g.box_url}, skipping", file=sys.stderr)
            continue

        game_id = f"{data.date_iso}_{slugify(data.home_team)}_{slugify(data.away_team)}"

        # Safety net: pre-fetch dedup keys off opponent display-name text, which
        # can differ across sites (e.g. "CSU Bakersfield" vs "Cal State
        # Bakersfield"); the box score's own team names are canonical, so
        # collapse any leftover collisions here too.
        if game_id in seen_game_ids:
            print(f"[dedupe] dropping duplicate {game_id} (already captured from another site)", flush=True)
            skipped_dupes += 1
            continue
        seen_game_ids.add(game_id)

        winner = data.home_team if (data.home_score or 0) > (data.away_score or 0) else data.away_team

        csv1_rows.append({
            "game_id": game_id,
            "date": data.date_iso,
            "home_team": data.home_team,
            "away_team": data.away_team,
            "home_score": data.home_score,
            "away_score": data.away_score,
            "winner": winner,
            "site_location": g.site_location or data.site,
            "home_away_neutral": g.home_away,
            "is_conference_game": g.is_conference,
            "season": season,
            "source_url": g.box_url,
        })

        for p in data.players:
            row = {"game_id": game_id}
            row.update(p)
            csv2_rows.append(row)

        for pbp in data.playbyplay:
            row = {"game_id": game_id}
            row.update(pbp)
            csv3_rows.append(row)

        for pa in data.play_analysis:
            row = {"game_id": game_id, "team": pa["team"]}
            total_fg_m = total_fg_a = total_3p_m = total_3p_a = total_ft_m = total_ft_a = 0
            for label, vals in pa["quarters"].items():
                key = QUARTER_LABEL_MAP.get(label, ot_key(label))
                row[f"{key}_fg"] = vals["fg"]
                row[f"{key}_3p"] = vals["3p"]
                row[f"{key}_ft"] = vals["ft"]
                for stat, m_a in (("fg", vals["fg"]), ("3p", vals["3p"]), ("ft", vals["ft"])):
                    if "-" in m_a:
                        m, a = m_a.split("-")
                        try:
                            m, a = int(m), int(a)
                        except ValueError:
                            continue
                        if stat == "fg":
                            total_fg_m += m; total_fg_a += a
                        elif stat == "3p":
                            total_3p_m += m; total_3p_a += a
                        else:
                            total_ft_m += m; total_ft_a += a
            row["total_fg"] = f"{total_fg_m}-{total_fg_a}"
            row["total_3p"] = f"{total_3p_m}-{total_3p_a}"
            row["total_ft"] = f"{total_ft_m}-{total_ft_a}"

            footer = pa.get("footer", {})
            row["technical_fouls"] = parse_footer_int(footer, "Technical Fouls")
            row["second_chance_pts"] = parse_footer_int(footer, "Second Chance Points")
            row["scores_tied"] = parse_footer_int(footer, "Scores Tied")
            row["pts_in_paint"] = parse_footer_int(footer, "Points in the Paint")
            row["fast_break_pts"] = parse_footer_int(footer, "Fast Break Points")
            row["lead_changes"] = parse_footer_int(footer, "Lead Changed")
            row["pts_off_turnovers"] = parse_footer_int(footer, "Points off Turnovers")
            row["bench_pts"] = parse_footer_int(footer, "Bench Points")
            csv4_rows.append(row)

    write_csv1(os.path.join(args.out_dir, "csv1_game_index.csv"), csv1_rows)
    write_csv2(os.path.join(args.out_dir, "csv2_boxscore_players.csv"), csv2_rows)
    write_csv3(os.path.join(args.out_dir, "csv3_playbyplay.csv"), csv3_rows)
    write_csv4(os.path.join(args.out_dir, "csv4_play_analysis.csv"), csv4_rows)

    print(f"[done] wrote {len(csv1_rows)} games, {len(csv2_rows)} player rows, "
          f"{len(csv3_rows)} pbp rows, {len(csv4_rows)} play-analysis rows to {args.out_dir} "
          f"(dropped {skipped_dupes} post-fetch duplicate games)")


CSV1_FIELDS = ["game_id", "date", "home_team", "away_team", "home_score", "away_score",
               "winner", "site_location", "home_away_neutral", "is_conference_game",
               "season", "source_url"]

CSV2_FIELDS = ["game_id", "team", "jersey", "player", "started", "min", "fg_m", "fg_a",
               "fg_pct", "3p_m", "3p_a", "3p_pct", "ft_m", "ft_a", "ft_pct", "oreb",
               "dreb", "reb", "pf", "ast", "to", "blk", "stl", "pts"]

CSV3_FIELDS = ["game_id", "period", "time_remaining", "team", "player", "play",
               "away_score", "home_score"]


def write_csv1(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV1_FIELDS)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def write_csv2(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV2_FIELDS)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def write_csv3(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV3_FIELDS)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def write_csv4(path, rows):
    base = ["game_id", "team"]
    quarter_cols = []
    for r in rows:
        for k in r.keys():
            if k not in base and k not in quarter_cols and k not in (
                "total_fg", "total_3p", "total_ft", "technical_fouls",
                "second_chance_pts", "scores_tied", "pts_in_paint",
                "fast_break_pts", "lead_changes", "pts_off_turnovers", "bench_pts",
            ):
                quarter_cols.append(k)

    def sort_key(c):
        # q1,q2,q3,q4 before ot1,ot2,... ; group by period then stat order fg,3p,ft
        stat_order = {"fg": 0, "3p": 1, "ft": 2}
        period, stat = c.rsplit("_", 1)
        is_ot = period.startswith("ot")
        num = int("".join(ch for ch in period if ch.isdigit()) or 0)
        return (is_ot, num, stat_order.get(stat, 9))

    quarter_cols.sort(key=sort_key)
    tail = ["total_fg", "total_3p", "total_ft", "technical_fouls", "second_chance_pts",
            "scores_tied", "pts_in_paint", "fast_break_pts", "lead_changes",
            "pts_off_turnovers", "bench_pts"]
    fieldnames = base + quarter_cols + tail

    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, restval="")
        w.writeheader()
        for r in rows:
            w.writerow(r)


if __name__ == "__main__":
    main()
