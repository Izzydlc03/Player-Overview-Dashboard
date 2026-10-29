# Player-Overview-Dashboard
Dashboard that has player overview and team overview

## Official 2026–27 rosters

The dashboard opens to the 2026–27 team overview, using the same overview,
player statistics, roster cards, profiles, and comparison layouts as historical
seasons for the nine tracked Big West teams and six tracked non-conference
opponents. Statistics not yet imported appear as dashes or empty chart panels.
Select a previous season for game
logs and statistical analysis. Current rosters are stored separately from
historical box scores in `data/rosters-2026-27.json`, with each school's source
URL, retrieval time, and player bio links.

For 2026–27 only, **Show last season's stats** overlays matched players' 2025–26
statistics from `data/bart_2026_player_stats.csv` in player tables, cards,
profiles, and player comparisons. Transfers retain their current roster details;
stats are labeled with their prior school. Unmatched players remain blank.
Matched player profiles retain the interactive shooting distribution and role
radar, using 2025–26 metrics and national percentiles. Game-by-game trends use
saved logs from the player's prior school, merging verified name variants.
When those logs are unavailable, season charts remain visible with an explicit
game-log availability message.
Compare Players also uses those prior-season metrics for its overlapping radar
and shooting charts. A player without matched stats keeps an unavailable state;
their missing data is not plotted as zero.
In Compare Teams, the switch also restores the top-five rotation comparison,
ranking current roster players by their own 2025–26 MPG and showing their prior
school, averages, archetypes, and percentile tags. Players without a matched
prior-season record are excluded from that ranking.
The same on/off switch shows each team's actual 2025–26 totals, scoring and foul
trends, game log, and team comparisons using the saved historical team data.
These team numbers are independent of the current roster's player stats.
Quarter scoring comes from the saved quarter FG/3PT/FT splits. The prior-season
Shot Chart combines actual 2025–26 rim, mid-range, and three-point totals for
the current roster, including transfers at their prior schools. It reports player
coverage and excludes unmatched players and players who left the team. The chart
uses the national player dataset and does not imply exact shot coordinates.
The switch starts off, persists between views during the session, and does not
affect historical seasons.

Refresh from official school athletics sites:

```sh
.venv/bin/python scripts/fetch_official_rosters.py 2026-27
```

Refresh selected teams with `--teams ucsd,ucirvine`. Requires `requests` and
`beautifulsoup4`. The importer verifies the page's season heading, checks the
player count and duplicate names, and preserves saved rosters if a source
fails validation. Review any `NEEDS REVIEW` messages before using an update.

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

The dashboard combines this file's additional schools and schedules with the
verified rosters in `data/rosters-2026-27.json`. For overlapping schools, the
verified roster takes precedence. Refresh both importers when updating schedules
and rosters.

The global **Show last season's stats** switch controls all 2026-27 views,
including the tabbed player and team comparisons. Player stats use the saved
2025-26 national player dataset and verified school-scoped aliases; unmatched
players show dashes. The generated `prior` blocks are retained in the upcoming
season file but the dashboard uses the shared matching logic for every view.
Team stats use each school's saved 2025-26 season where available; additional
schools without saved team data show unavailable values.

When 2026-27 results become available, import the games and update the
roster-only loading path in `loadSeason` to use the new season statistics.
