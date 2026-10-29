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

## Big West standings

The Team Overview standings card shows the official conference standings scraped
from bigwest.org (every dashboard season, in the site's tiebreak order):

```sh
python3 scripts/fetch_bigwest_standings.py
```

The script writes to `data/standings.json`.

## Upcoming season (2026-27)

Until real games are played, `data/2026-27.json` holds every team on UCSD's
2026-27 schedule (plus the 2026-27 Big West field) with its current roster and
schedule from the school's athletics site. All stats are zero and every game
list is empty; the Game Log shows each team's scheduled opponents with zeroed stats.

```sh
python3 scripts/build_upcoming_season.py
```

Each roster player also carries a `prior` block: their 2025-26 stats, matched by
name against `opponents/overall_data/wbb_d1_processed_players.csv` (and the Big West
box-score data when available), so transfers bring their numbers from their old school.
True freshmen and anyone not confidently matched have no `prior` block and show zeros.

In the 2026-27 season only, Compare Players and Compare Teams get a **Stats Shown**
dropdown: "2025-26 stats (placeholder)" (default) or "2026-27 (no games yet)".

Once games exist, scrape the season with `run_season.py` and build it with
`build_data.py`; delete the placeholder `data/2026-27.json` first so the two
don't conflict.
