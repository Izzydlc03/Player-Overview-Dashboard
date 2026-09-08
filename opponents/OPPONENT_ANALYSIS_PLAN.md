# Opponent Analysis Plan

## Scope

For non-conference opponents, add an opponent analysis section with two pages/views.

This is mainly for the early part of the season, when current-season team sample sizes are too small or games have not been played yet.

## Page 1: Last Season Overview

Purpose: show how the opponent played last season.

Suggested content:

- Team-level stats from last season
- `PPG`
- `RPG`
- `APG`
- `FG%`
- `3PT%`
- `Opp PPG`
- Overall record
- Conference record
- Season results / notable outcomes
- Basic summary of style or team identity

This page should answer:

- How good were they last year?
- What kind of team were they?
- What were their results over the full season?

## Page 2: Current Season Overview

Purpose: focus on the current roster and what the opponent looks like right now.

For now, if no current-season games have been played:

- Leave team stats like `PPG`, `RPG`, and similar team averages blank
- Still show roster-based player information

Suggested content:

- Team header
- Opponent name
- Season (`2025-26`, `2026-27`, etc.)
- Current roster table
- Returning players
- New players / transfers / freshmen
- Position
- Height / class if available
- Last season individual stats

This page should answer:

- Who are their main players right now?
- Who returned from last season?
- Who are the new additions?
- Which players are most important to scout?

## Player Table Interaction

The main feature on the current-season page should be a player table.

Suggested behavior:

- Show a table with one row per player
- Include quick stats in the row
- Clicking a player row opens a deeper player detail view

Suggested row fields:

- Player name
- Position
- Class
- Games played
- Minutes
- Points
- Rebounds
- Assists
- FG%
- 3PT%

Suggested expanded player detail:

- Per-game stats
- Per-40 or per-100 metrics if available later
- Shooting splits
- Recent game log once games exist
- Role notes
- Transfer / previous school info if relevant

## Early-Season Rules

Until more games are played:

- Prioritize last-season team stats for overall team evaluation
- Prioritize current roster and player-level information for current-season scouting
- Do not force current-season team averages when the sample is empty or too small

## Recommended Layout

One simple structure:

1. Opponent landing/header
2. Tab or toggle for `Last Season`
3. Tab or toggle for `This Season`
4. Clickable player table inside `This Season`
5. Player detail panel, modal, or expanded section

## Initial Build Order

1. Build the last-season overview page with team stats and season results
2. Build the current-season roster/player table page
3. Add click-to-expand player detail behavior
4. Add current-season team stats later, once enough games are played

## Notes For Data

Possible data buckets for each opponent:

- Last-season team summary stats
- Last-season results / schedule outcomes
- Current roster
- Last-season player stats for returning players
- Current-season player stats once games begin

The existing `opponents/` folder can hold opponent-specific season data as this expands.
