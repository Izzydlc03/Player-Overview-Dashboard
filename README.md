# Player-Overview-Dashboard
Dashboard that has player overview and team overview

## Bart Torvik WBB ratings

Compare Teams uses a local Bart Torvik WBB team results CSV for D1-only,
opponent-adjusted national context.

Update the 2025-26 file from Bart:

```sh
python3 scripts/fetch_bart_wbb_ratings.py 2025-26
```

Import a downloaded CSV instead:

```sh
python3 scripts/fetch_bart_wbb_ratings.py 2025-26 --source ~/Downloads/2026_team_results.csv
```

The script writes to `data/bart_2026_team_results.csv`.

Import Bart-style WBB player advanced stats:

```sh
python3 scripts/import_bart_wbb_player_stats.py 2025-26 --source opponents/overall_data/wbb_d1_processed_players.csv
```

The script writes to `data/bart_2026_player_stats.csv`.
