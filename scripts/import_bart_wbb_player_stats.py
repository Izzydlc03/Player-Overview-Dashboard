#!/usr/bin/env python3
"""Import a Bart-style WBB player advanced stats CSV for the dashboard.

Example:
    python3 scripts/import_bart_wbb_player_stats.py 2025-26 --source opponents/overall_data/wbb_d1_processed_players.csv

The dashboard expects files at data/bart_<ending_year>_player_stats.csv.
For the 2025-26 season, that is data/bart_2026_player_stats.csv.
"""
import argparse
import csv
import os
import shutil
import sys


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
REQUIRED_COLUMNS = {"name", "team", "gp", "mpg", "ppg", "porpag", "adjoe", "bpm", "usg", "ts", "efg"}


def bart_year(season):
    if season.isdigit() and len(season) == 4:
        return int(season)
    parts = season.split("-")
    if len(parts) != 2 or len(parts[1]) != 2:
        raise ValueError("season must look like 2025-26 or 2026")
    return int(f"20{parts[1]}")


def validate_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.reader(fh)
        try:
            header = next(reader)
        except StopIteration:
            raise ValueError("CSV is empty")
        rows = sum(1 for _ in reader)

    missing = sorted(REQUIRED_COLUMNS - set(header))
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(missing)}")
    if rows < 1000:
        raise ValueError(f"CSV has only {rows} data rows; expected a national D1 WBB player file")
    return rows


def main():
    parser = argparse.ArgumentParser(description="Import Bart-style WBB player advanced stats CSV.")
    parser.add_argument("season", help="Season, e.g. 2025-26. Also accepts ending year, e.g. 2026.")
    parser.add_argument("--source", required=True, help="Local player CSV to import.")
    parser.add_argument("--out-dir", default=DATA_DIR, help="Output directory. Defaults to ./data.")
    args = parser.parse_args()

    year = bart_year(args.season)
    src = os.path.expanduser(args.source)
    os.makedirs(args.out_dir, exist_ok=True)
    rows = validate_csv(src)
    out_path = os.path.join(args.out_dir, f"bart_{year}_player_stats.csv")
    shutil.copyfile(src, out_path)
    print(f"wrote {out_path} ({rows} players) from {src}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
