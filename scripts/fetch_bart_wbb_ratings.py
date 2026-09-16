#!/usr/bin/env python3
"""Fetch or import Bart Torvik WBB team ratings for the dashboard.

Examples:
    python3 scripts/fetch_bart_wbb_ratings.py 2025-26
    python3 scripts/fetch_bart_wbb_ratings.py 2025-26 --source ~/Downloads/2026_team_results.csv

The dashboard expects files at data/bart_<ending_year>_team_results.csv.
For the 2025-26 season, that is data/bart_2026_team_results.csv.
"""
import argparse
import csv
import os
import shutil
import sys
import tempfile
import urllib.request


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
REQUIRED_COLUMNS = {"team", "conf", "record", "adjoe", "adjde", "barthag", "sos", "WAB", "adjt"}


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
    if rows < 300:
        raise ValueError(f"CSV has only {rows} data rows; expected a national D1 WBB file")
    return rows


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Player-Overview-Dashboard/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise RuntimeError(f"download failed with HTTP {resp.status}")
        with open(dest, "wb") as fh:
            shutil.copyfileobj(resp, fh)


def main():
    parser = argparse.ArgumentParser(description="Fetch/import Bart Torvik WBB team ratings CSV.")
    parser.add_argument("season", help="Season, e.g. 2025-26. Also accepts ending year, e.g. 2026.")
    parser.add_argument("--source", help="Local CSV to import instead of downloading from barttorvik.com.")
    parser.add_argument("--out-dir", default=DATA_DIR, help="Output directory. Defaults to ./data.")
    args = parser.parse_args()

    year = bart_year(args.season)
    os.makedirs(args.out_dir, exist_ok=True)
    out_path = os.path.join(args.out_dir, f"bart_{year}_team_results.csv")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = os.path.join(tmpdir, "team_results.csv")
        if args.source:
            shutil.copyfile(os.path.expanduser(args.source), tmp_path)
            source_label = os.path.expanduser(args.source)
        else:
            url = f"https://barttorvik.com/ncaaw/{year}_team_results.csv"
            download(url, tmp_path)
            source_label = url

        rows = validate_csv(tmp_path)
        shutil.copyfile(tmp_path, out_path)

    print(f"wrote {out_path} ({rows} teams) from {source_label}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
