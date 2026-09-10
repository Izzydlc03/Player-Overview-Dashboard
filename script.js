/* ============================= REAL DATA LOADER =============================
   Season data is pre-aggregated from the scraped CSVs by build_data.py into
   data/<season>.json — one file per season, shaped as:
     { teamKey: { name, short, mascot, players:[...], games:[...] } }
   TEAMS/TEAM_KEYS are populated by loadSeason() before the first render and
   whenever the season picker changes; every view function below just reads
   them as plain globals.
*/
const ICONS = {
  overview: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="10.5" width="3.4" height="7"/><rect x="8.3" y="5.5" width="3.4" height="12"/><rect x="14.1" y="2.5" width="3.4" height="15"/></svg>',
  gamelog: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="3.2" width="15" height="14" rx="1.6"/><path d="M2.5 8h15M7 3.2v-1M13 3.2v-1"/></svg>',
  roster: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="6.3" r="3"/><path d="M3.3 17c0-3.6 3-6 6.7-6s6.7 2.4 6.7 6"/></svg>',
  cplayers: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6.5" cy="6.5" r="2.6"/><circle cx="13.5" cy="6.5" r="2.6"/><path d="M2 17c0-2.8 2-4.7 4.5-4.7M18 17c0-2.8-2-4.7-4.5-4.7"/></svg>',
  cteams: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2.3l2.2 4.4 4.9.7-3.5 3.4.8 4.9L10 13.3l-4.4 2.4.8-4.9-3.5-3.4 4.9-.7z"/></svg>',
};

let TEAMS = {};
let TEAM_KEYS = [];
const SEASON_CACHE = {};

function injectDynamicTeams(){
  for(const key in OPPONENT_TEAMS){
    if(REMOTE_TEAM_SEASONS[key]?.includes(state.season) && !TEAMS[key]){
      const cfg = OPPONENT_TEAMS[key];
      TEAMS[key] = { name: cfg.name, short: cfg.short, mascot: cfg.mascot, players: [], games: [] };
    }
  }
}

async function loadSeason(season){
  if(!SEASON_CACHE[season]){
    const res = await fetch(`data/${season}.json`);
    if(!res.ok) throw new Error(`Failed to load data/${season}.json (${res.status})`);
    SEASON_CACHE[season] = await res.json();
  }
  TEAMS = { ...SEASON_CACHE[season] };
  injectDynamicTeams();
  TEAM_KEYS = Object.keys(TEAMS);
  // A team can be missing from a given season (e.g. CSUN sat out 2020-21) —
  // fall back to the first available team for any state pointing at one
  // that doesn't exist in the season we just loaded.
  const fallback = TEAM_KEYS[0];
  if(!TEAMS[state.team]) state.team = fallback;
  if(!TEAMS[state.t1]) state.t1 = fallback;
  if(!TEAMS[state.t2]) state.t2 = TEAM_KEYS[1] || fallback;
  if(!TEAMS[state.p1.team]) state.p1 = {team:fallback, idx:0};
  if(!TEAMS[state.p2.team]) state.p2 = {team:TEAM_KEYS[1] || fallback, idx:0};
}

/* Team logo filenames, sitting alongside index.html/style.css/script.js.
   Keys match every Big West team build_data.py aggregates into TEAMS. */
const TEAM_LOGOS = {
  ucsd: 'Team_Logos/ucsdLogo.jpg',
  ucirvine: 'Team_Logos/uciLogo.webp',
  csub: 'Team_Logos/csubLogo.jpg',
  csulb: 'Team_Logos/csulbLogo.jpg',
  ucr: 'Team_Logos/ucrLogo.jpg',
  ucsb: 'Team_Logos/ucsbLogo.jpg',
  csun: 'Team_Logos/csunLogo.jpg',
  calpoly: 'Team_Logos/calpolyLogo.jpg',
  csuf: 'Team_Logos/csufLogo.jpg',
  lmu: 'opponent_team_logos/LMU/loyola-marymount.svg',
};

const ROSTER_HEADSHOTS = {
  lmu: {
    'jess lawson': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Jess_Lawson.jpg?width=600&quality=90',
    'mari somvichian': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Mari_Somvichian.jpg?width=600&quality=90',
    'allison clarke': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Allison_Clarke.jpg?width=600&quality=90',
    'carly heidger': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Carly_Heidger.jpg?width=600&quality=90',
    'ana milanovic': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Ana_Milanovic.jpg?width=600&quality=90',
    'lova lagerlid': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Lova_Lagerlid.jpg?width=600&quality=90',
    'ivana krajina': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Ivana_Krajina.jpg?width=600&quality=90',
    "ali'a matavao": 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Ali_a_Matavao.jpg?width=600&quality=90',
    'kayla jones': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Kayla_Jones.jpg?width=600&quality=90',
    'andjela matic': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Andjela_Matic.jpg?width=600&quality=90',
    'paula reus piza': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Paula_Reus_Piza.jpg?width=600&quality=90',
    'zawadi ogot': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Zawadi_Ogot.jpg?width=600&quality=90',
    'maya hernandez': 'https://d2vhz6gv4pigvw.cloudfront.net/images/2025/10/2/Maya_Hernandez.jpg?width=600&quality=90',
  },
};
/* Returns an <img> tag if a logo exists for this team key, otherwise falls
   back to the given initials/text inside the same circle. */
function avatarContent(teamKey, fallbackText){
  const logo = TEAM_LOGOS[teamKey];
  return logo ? `<img src="${logo}" alt="${teamKey} logo">` : fallbackText;
}
function displayPos(pos){
  return pos && pos !== '—' ? pos : '';
}
function displayPlayerName(name){
  const parts = name.split(',').map(part => part.trim());
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}
function displayClassYear(player){
  const cls = player.advanced?.cls || '';
  const labels = {
    FR: 'Fr.',
    SO: 'So.',
    JR: 'Jr.',
    SR: 'Sr.',
    GR: 'Gr.',
    'R-SO': 'R-So.',
    'R-JR': 'R-Jr.',
    'R-SR': 'R-Sr.',
  };
  return labels[cls] || cls || state.season.slice(2);
}
function displayListedPosition(player){
  return displayPos(player.advanced?.pos || player.pos) || 'Player';
}
function playerHeadshot(teamKey, playerName){
  return ROSTER_HEADSHOTS[teamKey]?.[normalizePlayerName(playerName)] || '';
}
function teamColor(key){ return key===state.team ? 'var(--series-a)' : 'var(--series-b)'; }

/* Non-conference opponents scraped straight into opponents/<folder>/<season>/
   and loaded client-side (current season only) rather than pre-aggregated by
   build_data.py — see opponents/OPPONENT_ANALYSIS_PLAN.md. boxscoreName must
   match the team-name string exactly as scraped into csv1/csv2; advancedName
   matches the "team" column in opponents/overall_data/wbb_d1_processed_players.csv. */
const OPPONENT_TEAMS = {
  lmu: { folder: 'LMU', boxscoreName: 'LMU (CA)', advancedName: 'Loyola Marymount',
    name: 'Loyola Marymount', short: 'LMU', mascot: 'Lions',
    nonD1GameIds: new Set(['2025-12-16_lmu_ca_chapman']) },
  washington: { folder: 'Washington', boxscoreName: 'Washington', advancedName: 'Washington',
    name: 'Washington', short: 'UW', mascot: 'Huskies', nonD1GameIds: new Set() },
  usandiego: { folder: 'USD', boxscoreName: 'San Diego', advancedName: 'San Diego',
    name: 'San Diego', short: 'USD', mascot: 'Toreros', nonD1GameIds: new Set() },
  portlandstate: { folder: 'PortlandState', boxscoreName: 'Portland St.', advancedName: 'Portland St.',
    name: 'Portland State', short: 'PSU', mascot: 'Vikings',
    nonD1GameIds: new Set(['2025-10-30_portland_st_warner_pacific']) },
  usf: { folder: 'USF', boxscoreName: 'San Francisco', advancedName: 'San Francisco',
    name: 'San Francisco', short: 'USF', mascot: 'Dons', nonD1GameIds: new Set() },
  nau: { folder: 'NAU', boxscoreName: 'Northern Ariz.', advancedName: 'Northern Arizona',
    name: 'Northern Arizona', short: 'NAU', mascot: 'Lumberjacks', nonD1GameIds: new Set() },
};

const REMOTE_TEAM_SEASONS = Object.fromEntries(
  Object.keys(OPPONENT_TEAMS).map(key => [key, ['2025-26']])
);

const teamDataCache = {};
const teamLoadCache = {};
let advancedRowsPromise = null;

function teamCacheKey(teamKey, season){
  return `${teamKey}::${season}`;
}

function availableSeasonsForTeam(teamKey){
  return REMOTE_TEAM_SEASONS[teamKey] || seasonOptions();
}

function preferredSeasonForTeam(teamKey, currentSeason){
  const seasons = availableSeasonsForTeam(teamKey);
  return seasons.includes(currentSeason) ? currentSeason : seasons[0];
}

function hasSeasonData(teamKey, season){
  return availableSeasonsForTeam(teamKey).includes(season);
}

function isDynamicTeam(teamKey){
  return teamKey in REMOTE_TEAM_SEASONS;
}

function getTeamData(teamKey, season){
  return teamDataCache[teamCacheKey(teamKey, season)] || TEAMS[teamKey];
}

function parseCsv(text){
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for(let i = 0; i < text.length; i++){
    const ch = text[i];
    if(inQuotes){
      if(ch === '"'){
        if(text[i + 1] === '"'){
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if(ch === '"'){
      inQuotes = true;
    } else if(ch === ','){
      row.push(cell);
      cell = '';
    } else if(ch === '\n'){
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if(cell.length || row.length){
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }

  if(!rows.length) return [];
  const [header, ...body] = rows;
  return body
    .filter(cols => cols.length && cols.some(val => val !== ''))
    .map(cols => Object.fromEntries(header.map((key, idx) => [key, cols[idx] || ''])));
}

function parseMadeAttempt(stat){
  const [made, att] = stat.split('-').map(Number);
  return { made, att };
}

function normalizePlayerName(name){
  const parts = name.split(',').map(p => p.trim());
  if(parts.length === 2) name = `${parts[1]} ${parts[0]}`;
  return name.replace(/\./g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function pointsFromSplit(fg, tp, ft){
  const fgSplit = parseMadeAttempt(fg);
  const tpSplit = parseMadeAttempt(tp);
  const ftSplit = parseMadeAttempt(ft);
  return (2 * fgSplit.made) + tpSplit.made + ftSplit.made;
}

async function loadAdvancedRowsIndex(){
  if(!advancedRowsPromise){
    advancedRowsPromise = fetch('opponents/overall_data/wbb_d1_processed_players.csv')
      .then(r => r.text())
      .then(text => parseCsv(text));
  }
  return advancedRowsPromise;
}

async function loadAdvancedRowsFor(teamName){
  const rows = await loadAdvancedRowsIndex();
  const filtered = rows.filter(row => row.team === teamName);
  return Object.fromEntries(filtered.map(row => [normalizePlayerName(row.name), row]));
}

async function loadOpponentSeason(teamKey, season){
  const cfg = OPPONENT_TEAMS[teamKey];
  const base = `opponents/${cfg.folder}/${season}`;
  const [csv1Text, csv2Text, csv4Text, advancedRows] = await Promise.all([
    fetch(`${base}/csv1_game_index.csv`).then(r => r.text()),
    fetch(`${base}/csv2_boxscore_players.csv`).then(r => r.text()),
    fetch(`${base}/csv4_play_analysis.csv`).then(r => r.text()),
    loadAdvancedRowsFor(cfg.advancedName),
  ]);

  const csv1 = parseCsv(csv1Text);
  const csv2 = parseCsv(csv2Text);
  const csv4 = parseCsv(csv4Text);
  const teamName = cfg.boxscoreName;
  const nonD1GameIds = cfg.nonD1GameIds;

  const gameRows = csv1.filter(row => row.home_team === teamName || row.away_team === teamName);
  const playerRows = csv2.filter(row => row.team === teamName);
  const analysisRows = csv4.filter(row => row.team === teamName);

  const analysisByGame = Object.fromEntries(analysisRows.map(row => [row.game_id, row]));
  const playerRowsByGame = {};
  playerRows.forEach(row => {
    if(!playerRowsByGame[row.game_id]) playerRowsByGame[row.game_id] = [];
    playerRowsByGame[row.game_id].push(row);
  });

  const games = gameRows.map(row => {
    const teamIsHome = row.home_team === teamName;
    const teamScore = Number(teamIsHome ? row.home_score : row.away_score);
    const oppScore = Number(teamIsHome ? row.away_score : row.home_score);
    const analysis = analysisByGame[row.game_id];
    const shooting = analysis ? parseMadeAttempt(analysis.total_fg) : { made: 0, att: 0 };
    const boxRows = playerRowsByGame[row.game_id] || [];
    const totals = boxRows.reduce((acc, playerRow) => {
      acc.reb += Number(playerRow.reb || 0);
      acc.ast += Number(playerRow.ast || 0);
      acc.to += Number(playerRow.to || 0);
      if(playerRow.player !== 'TEAM'){
        acc.fouls += Number(playerRow.pf || 0);
      }
      return acc;
    }, { reb: 0, ast: 0, to: 0, fouls: 0 });
    const quarterPoints = analysis ? ['q1', 'q2', 'q3', 'q4'].map(q =>
      pointsFromSplit(analysis[`${q}_fg`], analysis[`${q}_3p`], analysis[`${q}_ft`])
    ) : [0, 0, 0, 0];

    return {
      game_id: row.game_id,
      date: row.date,
      opp: teamIsHome ? row.away_team : row.home_team,
      home: row.home_away_neutral === 'home',
      pf: teamScore,
      pa: oppScore,
      fgm: shooting.made,
      fga: shooting.att,
      reb: totals.reb,
      ast: totals.ast,
      to: totals.to,
      fouls: totals.fouls,
      quarterPoints,
      isD1: !nonD1GameIds.has(row.game_id),
      win: teamScore > oppScore,
    };
  });

  function aggregatePlayers(rows){
    const playersByKey = {};
    rows
      .filter(row => row.player !== 'TEAM')
      .forEach(row => {
        const key = row.player;
        if(!playersByKey[key]){
          playersByKey[key] = {
            num: row.jersey,
            name: row.player,
            pos: '—',
            gp: 0,
            minTotal: 0,
            fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
            oreb: 0, dreb: 0, ast: 0, stl: 0, blk: 0, to: 0, pts: 0,
            jerseyCounts: {},
          };
        }
        const player = playersByKey[key];
        player.jerseyCounts[row.jersey] = (player.jerseyCounts[row.jersey] || 0) + 1;
        player.gp += 1;
        player.minTotal += Number(row.min || 0);
        player.fgm += Number(row.fg_m || 0);
        player.fga += Number(row.fg_a || 0);
        player.tpm += Number(row['3p_m'] || 0);
        player.tpa += Number(row['3p_a'] || 0);
        player.ftm += Number(row.ft_m || 0);
        player.fta += Number(row.ft_a || 0);
        player.oreb += Number(row.oreb || 0);
        player.dreb += Number(row.dreb || 0);
        player.ast += Number(row.ast || 0);
        player.stl += Number(row.stl || 0);
        player.blk += Number(row.blk || 0);
        player.to += Number(row.to || 0);
        player.pts += Number(row.pts || 0);
      });

    return Object.values(playersByKey)
      .map(player => {
        const primaryJersey = Object.entries(player.jerseyCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || player.num;
        return {
          num: primaryJersey,
          name: player.name,
          pos: player.pos,
          gp: player.gp,
          min: Math.round((player.minTotal / Math.max(player.gp, 1)) * 10) / 10,
          fgm: player.fgm,
          fga: player.fga,
          tpm: player.tpm,
          tpa: player.tpa,
          ftm: player.ftm,
          fta: player.fta,
          oreb: player.oreb,
          dreb: player.dreb,
          ast: player.ast,
          stl: player.stl,
          blk: player.blk,
          to: player.to,
          pts: player.pts,
          advanced: advancedRows[normalizePlayerName(player.name)] || null,
        };
      })
      .sort((a, b) => b.pts - a.pts);
  }

  const players = aggregatePlayers(playerRows);
  const d1Players = aggregatePlayers(playerRows.filter(row => !nonD1GameIds.has(row.game_id)));
  const d1Games = games.filter(game => game.isD1);
  const d1GameMeta = Object.fromEntries(d1Games.map(game => [game.game_id, game]));
  const playerGameLogs = {};
  playerRows
    .filter(row => row.player !== 'TEAM' && !nonD1GameIds.has(row.game_id))
    .forEach(row => {
      const key = normalizePlayerName(row.player);
      const game = d1GameMeta[row.game_id];
      if(!game) return;
      if(!playerGameLogs[key]) playerGameLogs[key] = [];
      const fgm = Number(row.fg_m || 0);
      const fga = Number(row.fg_a || 0);
      const tpm = Number(row['3p_m'] || 0);
      const tpa = Number(row['3p_a'] || 0);
      const ftm = Number(row.ft_m || 0);
      const fta = Number(row.ft_a || 0);
      const oreb = Number(row.oreb || 0);
      const dreb = Number(row.dreb || 0);
      playerGameLogs[key].push({
        gameId: row.game_id,
        date: game.date,
        opp: game.opp,
        home: game.home,
        win: game.win,
        min: Number(row.min || 0),
        fgm, fga, tpm, tpa, ftm, fta,
        oreb, dreb,
        reb: oreb + dreb,
        ast: Number(row.ast || 0),
        stl: Number(row.stl || 0),
        blk: Number(row.blk || 0),
        to: Number(row.to || 0),
        pts: Number(row.pts || 0),
        fgPct: pct(fgm, fga),
        tpPct: pct(tpm, tpa),
        ftPct: pct(ftm, fta),
      });
    });

  return {
    name: cfg.name,
    short: cfg.short,
    mascot: cfg.mascot,
    players,
    games,
    d1Players,
    d1Games,
    playerGameLogs,
  };
}

function analysisTeam(team){
  if(team.d1Players && team.d1Games){
    return { ...team, players: team.d1Players, games: team.d1Games };
  }
  return team;
}

async function ensureTeamData(teamKey, season){
  const cacheKey = teamCacheKey(teamKey, season);
  if(teamDataCache[cacheKey] || !isDynamicTeam(teamKey) || !hasSeasonData(teamKey, season)){
    return teamDataCache[cacheKey] || TEAMS[teamKey];
  }
  if(!teamLoadCache[cacheKey]){
    teamLoadCache[cacheKey] = loadOpponentSeason(teamKey, season).then(data => {
      teamDataCache[cacheKey] = data;
      return data;
    });
  }
  return teamLoadCache[cacheKey];
}

function loadingCard(teamKey, season){
  return `<div class="card"><div class="card-title"><h3>Loading ${TEAMS[teamKey].name}</h3><span class="hint">${season}</span></div><p class="muted">Pulling the local ${TEAMS[teamKey].short} season data into the dashboard.</p></div>`;
}

function unavailableCard(teamKey, season){
  const fallback = preferredSeasonForTeam(teamKey, season);
  return `<div class="card"><div class="card-title"><h3>${TEAMS[teamKey].name}</h3><span class="hint">Season unavailable</span></div><p class="muted">This dashboard currently has ${TEAMS[teamKey].name} data for ${fallback} only.</p></div>`;
}

/* ============================= DERIVED STATS ============================= */
function pct(m,a){ return a>0 ? (m/a*100) : 0; }
function fmtPct(m,a){ return a>0 ? (m/a*100).toFixed(1)+'%' : '—'; }
function avg(sum,gp){ return gp>0 ? sum/gp : 0; }
function fmt1(n){ return n.toFixed(1); }

function seasonTotals(team){
  const p = team.players;
  const sum = k => p.reduce((s,x)=>s+x[k],0);
  const gp = Math.max(...p.map(x=>x.gp));
  const totals = {
    gp, fgm:sum('fgm'), fga:sum('fga'), tpm:sum('tpm'), tpa:sum('tpa'),
    ftm:sum('ftm'), fta:sum('fta'), oreb:sum('oreb'), dreb:sum('dreb'),
    ast:sum('ast'), stl:sum('stl'), blk:sum('blk'), to:sum('to'), pts:sum('pts'),
  };
  totals.reb = totals.oreb + totals.dreb;
  const g = team.games;
  const record = { w:g.filter(x=>x.win).length, l:g.filter(x=>!x.win).length };
  const oppPts = g.reduce((s,x)=>s+x.pa,0)/Math.max(g.length,1);
  return {...totals, record, gpFromGames:g.length, ppg:avg(totals.pts,gp), rpg:avg(totals.reb,gp),
    apg:avg(totals.ast,gp), topg:avg(totals.to,gp), stlpg:avg(totals.stl,gp), blkpg:avg(totals.blk,gp),
    oppPpg:oppPts, fgPct:pct(totals.fgm,totals.fga), tpPct:pct(totals.tpm,totals.tpa), ftPct:pct(totals.ftm,totals.fta)};
}

/* Extends seasonTotals with the derived efficiency stats used on the
   Compare Teams page. Possessions use the standard box-score estimate:
   POSS ≈ FGA − OREB + TOV + 0.44·FTA. Offensive/Defensive Rating are
   points scored/allowed per 100 possessions. AST% approximates the share
   of made field goals that were assisted (AST / FGM). TS% is points per
   true shooting attempt. DREB%, OREB%, opponent FG%, and forced-TOV% aren't
   derivable from this schema (we don't track opponent box scores), so —
   like this dashboard's other illustrative stats (fouls, shot chart,
   individual +/-) — they're seeded deterministically per team. */
function teamAdvancedStats(team){
  const s = seasonTotals(team);
  const poss = s.gp>0 ? (s.fga - s.oreb + s.to + 0.44*s.fta) / s.gp : 0;
  const ppp = poss>0 ? s.ppg/poss : 0;
  const ortg = poss>0 ? (s.ppg/poss)*100 : 0;
  const drtg = poss>0 ? (s.oppPpg/poss)*100 : 0;
  const tovPct = poss>0 ? (s.topg/poss)*100 : 0;
  const astPct = s.fgm>0 ? (s.ast/s.fgm)*100 : 0;
  const plusMinus = s.ppg - s.oppPpg;
  const tsPct = (s.fga+0.44*s.fta)>0 ? (s.pts/(2*(s.fga+0.44*s.fta)))*100 : 0;
  const drebPct = seededVal(team.short+'teamDrebPct', 64, 78);
  const orebPct = seededVal(team.short+'teamOrebPct', 22, 36);
  const oppFgPct = seededVal(team.short+'oppFgPct', 36, 46);
  const forcedTovPct = seededVal(team.short+'forcedTovPct', 14, 23);
  return {...s, poss, ppp, ortg, drtg, tovPct, astPct, plusMinus, tsPct, drebPct, orebPct, oppFgPct, forcedTovPct};
}

function playerPerGame(pl){
  return {
    ppg:avg(pl.pts,pl.gp), rpg:avg(pl.oreb+pl.dreb,pl.gp), apg:avg(pl.ast,pl.gp),
    stlpg:avg(pl.stl,pl.gp), blkpg:avg(pl.blk,pl.gp), topg:avg(pl.to,pl.gp),
    fgPct:pct(pl.fgm,pl.fga), tpPct:pct(pl.tpm,pl.tpa), ftPct:pct(pl.ftm,pl.fta), mpg:pl.min, /* pl.min is already a per-game average in the mock data — don't divide by gp again */
  };
}
/* Effective FG% — weights made 3s at 1.5x, standard advanced-stat formula. */
function efgPct(pl){ return pl.fga>0 ? ((pl.fgm + 0.5*pl.tpm)/pl.fga*100) : 0; }
/* Assist-to-turnover ratio. */
function astToRatio(pl){ return pl.to>0 ? pl.ast/pl.to : pl.ast; }
/* Usage Rate — standard box-score estimate: share of a team's total plays
   (shot attempts + free-throw trips + turnovers) that a player used while
   on the floor, scaled by minutes share. Team minutes are approximated as
   a standard 40-minute college game (5 players) times games played, since
   we don't track actual team minutes in this schema. */
function usageRate(team, pl){
  const s = seasonTotals(team);
  const teamMin = 5*40*s.gp;
  const playerMin = pl.min*pl.gp;
  if(playerMin<=0 || s.gp<=0) return 0;
  const num = (pl.fga + 0.44*pl.fta + pl.to) * teamMin;
  const den = playerMin * (s.fga + 0.44*s.fta + s.to);
  return den>0 ? (num/den)*100 : 0;
}
function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join(''); }

/* Deterministic pseudo-random per-game series for a player's trend
   sparkline (illustrative only until real per-game rows are wired in).
   opts.decimals controls rounding precision (default 0, whole numbers);
   opts.min/opts.max clamp the range (default min:0, max:Infinity) — pass
   min:-Infinity for stats like plus/minus that can go negative. */
function seededSeries(seed, n, mean, spread, opts){
  opts = opts || {};
  const decimals = opts.decimals || 0;
  const lo = opts.min===undefined ? 0 : opts.min;
  const hi = opts.max===undefined ? Infinity : opts.max;
  let s = seed;
  const rnd = () => { s = (s*9301+49297)%233280; return s/233280; };
  const f = Math.pow(10, decimals);
  return Array.from({length:n},()=>{
    const v = Math.max(lo, Math.min(hi, mean + (rnd()-.5)*2*spread));
    return Math.round(v*f)/f;
  });
}

/* Deterministic pseudo-random single value from a string seed, mapped to [min,max].
   Used for "made up" illustrative stats (quarter splits, fouls, shot chart)
   so numbers stay stable across re-renders instead of flickering. */
function seededVal(seedStr, min, max){
  let s = 0;
  for(let i=0;i<seedStr.length;i++) s += seedStr.charCodeAt(i)*(i+7);
  s = (s*9301+49297)%233280;
  return min + (s/233280)*(max-min);
}

/* Made-up quarter-by-quarter scoring split that sums to the team's PPG. */
function quarterAverages(team){
  if(team.games.length && team.games.every(g => Array.isArray(g.quarterPoints) && g.quarterPoints.length === 4)){
    return [0,1,2,3].map(idx => avg(team.games.reduce((sum, g) => sum + g.quarterPoints[idx], 0), team.games.length));
  }
  const ppg = seasonTotals(team).ppg;
  const weights = [0,1,2,3].map(q => 0.85 + seededVal(team.short+'q'+q, 0, 0.3));
  const total = weights.reduce((a,b)=>a+b,0);
  return weights.map(wgt => (wgt/total)*ppg);
}

/* Made-up per-game team foul counts, aligned 1:1 with team.games. */
function foulsForGames(games){
  if(games.length && games.every(g => typeof g.fouls === 'number')){
    return games.map(g => g.fouls);
  }
  return games.map(g => Math.round(seededVal(g.date+g.opp, 12, 22)));
}

/* ============================= STATE / NAV ============================= */
const state = { view:'overview', team:'ucsd', season:'2025-26', gameSort:{key:'date',dir:1},
  p1:{team:'ucsd',idx:0}, p2:{team:'ucsb',idx:0}, t1:'ucsd', t2:'ucsb',
  selectedPlayer:null, rosterCardPlayer:null, leaderTab:'scorers', playerStatKey:'pts', playerTrendWindow:'all', playerGameFocus:null, rosterMode:'pergame', rosterTableView:'main', shootingMode:'basic', rosterScrollLeft:0,
  rosterSortMain:{key:'ppg',dir:-1}, rosterSortShooting:{key:'tsPct',dir:-1}, rosterSortEfficiency:{key:'tsPct',dir:-1},
  compareTeamsSection:'overview' };

const NAV = [
  {id:'overview', label:'Team Overview'},
  {id:'gamelog', label:'Game Log'},
  {id:'roster', label:'Players'},
  {id:'cplayers', label:'Compare Players'},
  {id:'cteams', label:'Compare Teams'},
];

function renderNav(){
  const nav = document.getElementById('nav');
  nav.innerHTML = '<div class="eyebrow nav-label">Views</div>' + NAV.map(v=>`
    <button class="nav-btn ${state.view===v.id?'active':''}" data-view="${v.id}">
      ${ICONS[v.id]}<span>${v.label}</span>
    </button>`).join('');
  nav.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>{
    state.view = b.dataset.view; state.selectedPlayer=null; state.playerGameFocus=null; render();
  }));
}

function teamSelect(id, selected, opts){
  opts = opts || {};
  return `<select id="${id}" ${opts.attrs||''}>${TEAM_KEYS.map(k=>{
    const team = getTeamData(k, state.season);
    return `<option value="${k}" ${k===selected?'selected':''}>${team.name} ${opts.mascot?('· '+team.mascot):''}</option>`;
  }
  ).join('')}</select>`;
}

function seasonOptions(){
  const seasons = [];
  for(let startYear=2025; startYear >= 2019; startYear--){
    const end = String(startYear + 1).slice(-2);
    seasons.push(`${startYear}-${end}`);
  }
  return seasons;
}

function seasonSelect(id, selected){
  const opts = seasonOptions()
    .map(s => `<option value="${s}" ${s===selected?'selected':''}>${s}</option>`)
    .join('');
  return `<select id="${id}">${opts}</select>`;
}

/* ============================= TOPBAR ============================= */
function renderTopbar(){
  const bar = document.getElementById('topbar');
  const titles = {
    overview:['Team Overview','Season averages for your team'],
    gamelog:['Game Log','Every game this season, sortable'],
    roster:['Stats Page','Full roster with season per-game averages'],
    rostercards:['Roster Page','Visual player cards for the current roster'],
    cplayers:['Compare Players','Any two players, same team or different teams'],
    cteams:['Compare Teams','Season-long team stats, side by side'],
  };
  const [title,sub] = titles[state.view];
  let controls = '';
  if(['overview','gamelog','roster','rostercards'].includes(state.view)){
    controls = `
      <div class="topbar-controls">
        <span class="vslabel">Select Team</span>${teamSelect('team-picker', state.team)}
        <span class="vslabel">Select Season</span>${seasonSelect('season-picker', state.season)}
      </div>`;
  } else if(['cplayers','cteams'].includes(state.view)){
    controls = `
      <div class="topbar-controls">
        <span class="vslabel">Select Season</span>${seasonSelect('season-picker', state.season)}
      </div>`;
  }

  bar.innerHTML = `<div><h1>${title}</h1><div class="sub">${sub}</div></div>${controls}`;

  const tp = document.getElementById('team-picker');
  if(tp) tp.addEventListener('change', e=>{
    state.team = e.target.value;
    state.season = preferredSeasonForTeam(state.team, state.season);
    state.selectedPlayer = null;
    state.playerGameFocus = null;
    render();
  });

  const sp = document.getElementById('season-picker');
  if(sp) sp.addEventListener('change', async e=>{
    state.season = e.target.value;
    state.selectedPlayer = null;
    state.playerGameFocus = null;
    await loadSeason(state.season);
    render();
  });
}

/* ============================= LINE CHART (points trend) ============================= */
function lineChart(games, w, h){
  const pad = {l:30,r:14,t:14,b:22};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;
  const vals = games.flatMap(g=>[g.pf,g.pa]);
  const max = Math.ceil(Math.max(...vals)/10)*10 + 5;
  const min = Math.max(0, Math.floor(Math.min(...vals)/10)*10 - 5);
  const x = i => pad.l + (games.length===1?0:i/(games.length-1))*iw;
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;
  const path = arr => arr.map((g,i)=> (i===0?'M':'L')+x(i).toFixed(1)+','+y(g).toFixed(1)).join(' ');
  const gridY = [0,.25,.5,.75,1].map(t=> min + t*(max-min));

  const pts = games.map((g,i)=>`<circle class="pt-a" cx="${x(i)}" cy="${y(g.pf)}" r="3" fill="var(--series-a)" data-i="${i}"/>
    <circle class="pt-b" cx="${x(i)}" cy="${y(g.pa)}" r="3" fill="var(--series-b)" data-i="${i}"/>`).join('');
  const hitW = games.length>1 ? iw/(games.length-1) : iw;

  return `<div class="chart-wrap" data-chart="trend">
    <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
      ${gridY.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axislabel" x="2" y="${y(v)+3}">${Math.round(v)}</text>`).join('')}
      <path d="${path(games.map(g=>g.pf))}" fill="none" stroke="var(--series-a)" stroke-width="2"/>
      <path d="${path(games.map(g=>g.pa))}" fill="none" stroke="var(--series-b)" stroke-width="2" stroke-dasharray="4 3"/>
      ${pts}
      <line id="hoverline" class="hover-x" x1="0" x2="0" y1="${pad.t}" y2="${h-pad.b}"/>
      ${games.map((g,i)=>`<rect class="hit" x="${x(i)-hitW/2}" y="${pad.t}" width="${hitW}" height="${ih}" data-i="${i}"/>`).join('')}
    </svg>
  </div>`;
}
function wireTrendChart(container, games){
  const wrap = container.querySelector('[data-chart="trend"]');
  if(!wrap) return;
  const svg = wrap.querySelector('svg');
  const tooltip = document.getElementById('tooltip');
  const hoverline = wrap.querySelector('#hoverline');
  svg.querySelectorAll('.hit').forEach(hit=>{
    hit.addEventListener('mouseenter', ()=>{
      const i = +hit.dataset.i, g = games[i];
      const cA = svg.querySelector(`.pt-a[data-i="${i}"]`);
      hoverline.setAttribute('x1', cA.getAttribute('cx')); hoverline.setAttribute('x2', cA.getAttribute('cx'));
      hoverline.style.opacity = 1;
      const rect = svg.getBoundingClientRect(), wrapAbs = wrap.getBoundingClientRect();
      const px = (cA.getAttribute('cx')/svg.viewBox.baseVal.width)*rect.width;
      const py = (cA.getAttribute('cy')/svg.viewBox.baseVal.height)*rect.height;
      tooltip.innerHTML = `<div>${g.win?'W':'L'} ${g.pf}–${g.pa} <span class="t-sub">vs ${g.opp}</span></div>`;
      tooltip.style.transform = 'translate(-50%,-125%)';
      tooltip.style.left = (wrapAbs.left+window.scrollX+px)+'px'; tooltip.style.top = (wrapAbs.top+window.scrollY+py)+'px';
      tooltip.classList.add('show');
    });
    hit.addEventListener('mouseleave', ()=>{ hoverline.style.opacity=0; tooltip.classList.remove('show'); });
  });
}

/* ============================= QUARTER-BY-QUARTER BAR CHART ============================= */
function quarterBarChart(quarters, w, h){
  const pad = {l:26,r:10,t:16,b:22};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;
  const max = Math.ceil(Math.max(...quarters)/5)*5 + 5;
  const gap = iw/quarters.length, bw = gap*0.64;
  const gridY = [0,.5,1].map(t=>t*max);
  const bars = quarters.map((v,i)=>{
    const bh = (v/max)*ih;
    const x = pad.l + i*gap + (gap-bw)/2;
    const y = pad.t + ih - bh;
    return `<rect class="quarter-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="8" fill="var(--series-a)" data-i="${i}"/>
      <text class="axislabel quarter-axislabel" x="${(x+bw/2).toFixed(1)}" y="${h-4}" text-anchor="middle">Q${i+1}</text>
      <text class="quarter-val" x="${(x+bw/2).toFixed(1)}" y="${(y-8).toFixed(1)}" text-anchor="middle">${v.toFixed(1)}</text>
      <rect class="hit" x="${x.toFixed(1)}" y="${pad.t}" width="${bw.toFixed(1)}" height="${ih}" data-i="${i}" fill="transparent"/>`;
  }).join('');
  return `<div class="chart-wrap" data-chart="quarters">
    <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
      ${gridY.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${(pad.t+ih-(v/max)*ih).toFixed(1)}" y2="${(pad.t+ih-(v/max)*ih).toFixed(1)}"/>`).join('')}
      ${bars}
    </svg>
  </div>`;
}
function wireQuarterChart(container, quarters){
  const wrap = container.querySelector('[data-chart="quarters"]');
  if(!wrap) return;
  const svg = wrap.querySelector('svg');
  const tooltip = document.getElementById('tooltip');
  svg.querySelectorAll('.hit').forEach(hit=>{
    hit.addEventListener('mouseenter', ()=>{
      const i = +hit.dataset.i;
      const bar = svg.querySelector(`.quarter-bar[data-i="${i}"]`);
      const rect = svg.getBoundingClientRect(), wrapAbs = wrap.getBoundingClientRect();
      const px = ((Number(bar.getAttribute('x')) + Number(bar.getAttribute('width')) / 2)/svg.viewBox.baseVal.width)*rect.width;
      const py = (Number(bar.getAttribute('y'))/svg.viewBox.baseVal.height)*rect.height;
      tooltip.innerHTML = `<div>Q${i+1}: ${quarters[i].toFixed(1)} points</div>`;
      tooltip.style.transform = 'translate(-50%,-125%)';
      tooltip.style.left = (wrapAbs.left+window.scrollX+px)+'px';
      tooltip.style.top = (wrapAbs.top+window.scrollY+py)+'px';
      tooltip.classList.add('show');
    });
    hit.addEventListener('mouseleave', ()=>{ tooltip.classList.remove('show'); });
  });
}

/* ============================= TEAM FOULS PER GAME CHART ============================= */
function foulsChart(games, w, h){
  const fouls = foulsForGames(games);
  const pad = {l:26,r:10,t:14,b:22};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;
  const max = Math.max(...fouls)+2, min = Math.max(0, Math.min(...fouls)-2);
  const x = i => pad.l + (games.length===1?0:i/(games.length-1))*iw;
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;
  const path = fouls.map((v,i)=>(i===0?'M':'L')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
  const gridY = [0,.5,1].map(t=>min+t*(max-min));
  const hitW = games.length>1 ? iw/(games.length-1) : iw;
  const dots = games.map((g,i)=>`<circle class="foul-pt" cx="${x(i)}" cy="${y(fouls[i])}" r="3.5" fill="${g.win?'var(--good)':'var(--critical)'}" data-i="${i}"/>`).join('');

  return `<div class="chart-wrap" data-chart="fouls">
    <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
      ${gridY.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axislabel" x="1" y="${y(v)+3}">${Math.round(v)}</text>`).join('')}
      <path d="${path}" fill="none" stroke="var(--series-a)" stroke-width="2"/>
      ${dots}
      <line id="foul-hoverline" class="hover-x" x1="0" x2="0" y1="${pad.t}" y2="${h-pad.b}"/>
      ${games.map((g,i)=>`<rect class="hit" x="${x(i)-hitW/2}" y="${pad.t}" width="${hitW}" height="${ih}" data-i="${i}"/>`).join('')}
    </svg>
  </div>`;
}
function wireFoulsChart(container, games){
  const wrap = container.querySelector('[data-chart="fouls"]');
  if(!wrap) return;
  const svg = wrap.querySelector('svg');
  const tooltip = document.getElementById('tooltip');
  const hoverline = wrap.querySelector('#foul-hoverline');
  const fouls = foulsForGames(games);
  svg.querySelectorAll('.hit').forEach(hit=>{
    hit.addEventListener('mouseenter', ()=>{
      const i = +hit.dataset.i, g = games[i];
      const pt = svg.querySelector(`.foul-pt[data-i="${i}"]`);
      hoverline.setAttribute('x1', pt.getAttribute('cx')); hoverline.setAttribute('x2', pt.getAttribute('cx'));
      hoverline.style.opacity = 1;
      const rect = svg.getBoundingClientRect(), wrapAbs = wrap.getBoundingClientRect();
      const px = (pt.getAttribute('cx')/svg.viewBox.baseVal.width)*rect.width;
      const py = (pt.getAttribute('cy')/svg.viewBox.baseVal.height)*rect.height;
      tooltip.innerHTML = `<div>${g.win?'W':'L'} ${fouls[i]} fouls <span class="t-sub">vs ${g.opp}</span></div>`;
      tooltip.style.transform = 'translate(-50%,-125%)';
      tooltip.style.left = (wrapAbs.left+window.scrollX+px)+'px'; tooltip.style.top = (wrapAbs.top+window.scrollY+py)+'px';
      tooltip.classList.add('show');
    });
    hit.addEventListener('mouseleave', ()=>{ hoverline.style.opacity=0; tooltip.classList.remove('show'); });
  });
}

/* Interpolate between two hex colors; t is 0..1 */
function hexToRgb(hex){
  const h = hex.replace('#','');
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
function mixHex(h1, h2, t){
  const c1 = hexToRgb(h1), c2 = hexToRgb(h2);
  const r = Math.round(c1.r + (c2.r-c1.r)*t);
  const g = Math.round(c1.g + (c2.g-c1.g)*t);
  const b = Math.round(c1.b + (c2.b-c1.b)*t);
  return `rgb(${r},${g},${b})`;
}
/* Shot-chart heat color: blends across the four Pantone stops (1245 -> 144 -> 116 -> 3945)
   based on cell intensity 0..1, instead of a single hue at varying opacity. */
const HEAT_STOPS = ['#FFCD00','#FC8900','#C0524A'];
function heatColor(val){
  const scaled = Math.max(0, Math.min(1, val)) * (HEAT_STOPS.length-1);
  const idx = Math.min(HEAT_STOPS.length-2, Math.floor(scaled));
  const t = scaled - idx;
  return mixHex(HEAT_STOPS[idx], HEAT_STOPS[idx+1], t);
}

/* ============================= SHOT HEATMAP (illustrative) =============================
   Hexbin-style heatmap: a grid of hexagons is sampled against a set of "hot zone"
   gaussians (paint, wings, corners, mid-range, top of key) so density fades smoothly
   the way a real shot chart does, then rendered as discrete hexagons (size + color
   both track intensity) instead of blurred blobs.

   Court geometry: baseline/hoop sits near the TOP of the box (y small). The
   three-point line is drawn as actual circular-arc geometry centered on the hoop,
   with two short straight "corner three" segments running from the baseline down
   to where they meet the arc — not a single flattened curve. */
function heatHexPath(cx, cy, r){
  const pts = [];
  for(let i=0;i<6;i++){
    const angle = Math.PI/180*(60*i-30);
    pts.push(`${(cx+r*Math.cos(angle)).toFixed(1)},${(cy+r*Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}
function shotHeatmap(team, w, h){
  const pad = {l:16, r:16, t:16, b:16};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;

  // Hot zones as fractions of the court box, converted to pixel space, each with
  // a gaussian falloff so the density field is continuous (sampled per hexagon).
  const baseZones = [
    {cx:.50, cy:.14, sx:.16, sy:.13, base:0.95}, // paint / restricted area
    {cx:.18, cy:.50, sx:.13, sy:.17, base:0.72}, // left wing three
    {cx:.82, cy:.50, sx:.13, sy:.17, base:0.72}, // right wing three
    {cx:.50, cy:.80, sx:.15, sy:.12, base:0.42}, // top of key / above the break
    {cx:.06, cy:.10, sx:.09, sy:.09, base:0.30}, // left corner three
    {cx:.94, cy:.10, sx:.09, sy:.09, base:0.30}, // right corner three
    {cx:.32, cy:.28, sx:.10, sy:.12, base:0.26}, // left mid-range
    {cx:.68, cy:.28, sx:.10, sy:.12, base:0.26}, // right mid-range
  ];
  const zones = baseZones.map((z,i)=>{
    const intensity = Math.max(.15, Math.min(1, z.base + seededVal(team.short+'zone'+i, -0.12, 0.12)));
    return { cx: pad.l+z.cx*iw, cy: pad.t+z.cy*ih, sx: z.sx*iw, sy: z.sy*ih, intensity };
  });
  const densityAt = (x,y) => {
    let val = 0;
    zones.forEach(z=>{
      const dx = (x-z.cx)/z.sx, dy = (y-z.cy)/z.sy;
      val += z.intensity * Math.exp(-(dx*dx+dy*dy));
    });
    return Math.min(1, val);
  };

  // Hexagon grid (pointy-top, offset rows).
  const hexR = Math.max(7, iw/38);
  const hexW = Math.sqrt(3)*hexR;
  const vertStep = hexR*1.5;
  let hexes = '';
  let row = 0;
  for(let y = pad.t+hexR; y <= pad.t+ih-hexR*0.3; y += vertStep){
    const offsetX = (row%2===1) ? hexW/2 : 0;
    for(let x = pad.l+hexR+offsetX; x <= pad.l+iw-hexR*0.3; x += hexW){
      const val = densityAt(x,y);
      if(val > 0.045){
        const r = hexR*(0.4+0.6*val);
        hexes += `<polygon points="${heatHexPath(x,y,r)}" fill="${heatColor(val)}" opacity="${(0.5+val*0.5).toFixed(2)}"/>`;
      }
    }
    row++;
  }

  // Real NCAA three-point arc, verified against the "basketball-court" npm
  // package's rendered output (Wikipedia-sourced dimensions) to confirm the
  // correct arc flags and corner-intersection sign:
  // - Court width = 50ft, so scale = px per foot = iw/50
  // - Arc center sits 5'3" (63") off the baseline, directly under the rim
  // - Arc radius = 22'1.75" from that center point
  // - Straight segment sits 40.125" in from the sideline (25ft half-width minus
  //   that offset = 21.65625ft from center court)
  // - The corner segment meets the arc at the FAR circle intersection
  //   (hoop.y + d), which lands at ~9.88ft from the baseline — matching the
  //   diagram's measured 9'10.75" straight-segment length almost exactly.
  const scale = iw/50;
  const hoop = { x: pad.l+iw*0.5, y: pad.t + 5.25*scale };
  const R = 22.1458*scale;
  const cornerHalfW = (25 - 40.125/12)*scale;
  const yAtCorner = hoop.y + Math.sqrt(Math.max(0, R*R - cornerHalfW*cornerHalfW));
  const leftX = hoop.x-cornerHalfW, rightX = hoop.x+cornerHalfW;
  const arcPath = `M ${leftX.toFixed(1)} ${pad.t.toFixed(1)} L ${leftX.toFixed(1)} ${yAtCorner.toFixed(1)} A ${R.toFixed(1)} ${R.toFixed(1)} 0 0 0 ${rightX.toFixed(1)} ${yAtCorner.toFixed(1)} L ${rightX.toFixed(1)} ${pad.t.toFixed(1)}`;

  // Free-throw lane + circle, same real-world scale: lane is 12ft wide, 15ft
  // long (outside edge), circle radius = half the lane width, centered on
  // the free-throw line.
  const laneW = 12*scale, laneH = 15*scale;
  const laneX = hoop.x-laneW/2;
  const ftCircleY = pad.t+laneH;

  const courtLines = `
    <rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <rect x="${laneX.toFixed(1)}" y="${pad.t}" width="${laneW.toFixed(1)}" height="${laneH.toFixed(1)}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <circle cx="${hoop.x.toFixed(1)}" cy="${ftCircleY.toFixed(1)}" r="${(laneW/2).toFixed(1)}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <path d="${arcPath}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <line x1="${(hoop.x-3*scale).toFixed(1)}" y1="${(pad.t+4*scale).toFixed(1)}" x2="${(hoop.x+3*scale).toFixed(1)}" y2="${(pad.t+4*scale).toFixed(1)}" stroke="rgba(255,255,255,.7)" stroke-width="2.4"/>
    <circle cx="${hoop.x.toFixed(1)}" cy="${hoop.y.toFixed(1)}" r="${(0.75*scale).toFixed(1)}" fill="none" stroke="rgba(255,150,70,.8)" stroke-width="1.8"/>
  `;

  /* preserveAspectRatio="none" lets this fill whatever box its flex container gives it,
     so the card matches the height of the leaderboard card next to it. */
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="#0F2038"/>
    ${hexes}
    ${courtLines}
  </svg>`;
}

/* ============================= VIEW: OVERVIEW ============================= */
function teamSectionTabs(){
  const tabs = [
    {id:'overview', label:'Team Summary'},
    {id:'roster', label:'Stats Page'},
    {id:'rostercards', label:'Roster Page'},
  ];
  return `<div class="team-section-tabs" role="tablist" aria-label="Team section views">
    ${tabs.map(tab=>`<button class="team-section-tab ${state.view===tab.id?'active':''}" data-team-view="${tab.id}" role="tab" aria-selected="${state.view===tab.id}">${tab.label}</button>`).join('')}
  </div>`;
}

function rosterCardPalette(teamKey){
  const palettes = {
    lmu: {bg:'linear-gradient(180deg,#182b49 0%,#102039 100%)', border:'#c8a14d', accent:'#f1c75b', accentSoft:'rgba(241,199,91,.18)'},
    ucsd: {bg:'linear-gradient(180deg,#182b49 0%,#102039 100%)', border:'#c8a14d', accent:'#f1c75b', accentSoft:'rgba(241,199,91,.18)'},
    ucirvine: {bg:'linear-gradient(180deg,#0e4578 0%,#0b2e50 100%)', border:'#f0b53a', accent:'#ffd36f', accentSoft:'rgba(255,211,111,.18)'},
    washington: {bg:'linear-gradient(180deg,#4b2e83 0%,#331f5c 100%)', border:'#b7a57a', accent:'#e8dcb0', accentSoft:'rgba(232,220,176,.18)'},
    usandiego: {bg:'linear-gradient(180deg,#003b71 0%,#00274d 100%)', border:'#83b2d6', accent:'#a9cbe8', accentSoft:'rgba(169,203,232,.18)'},
    portlandstate: {bg:'linear-gradient(180deg,#154734 0%,#0d3024 100%)', border:'#b8b8b8', accent:'#e8e8e8', accentSoft:'rgba(232,232,232,.18)'},
    usf: {bg:'linear-gradient(180deg,#00543c 0%,#003a29 100%)', border:'#fdbb30', accent:'#ffd166', accentSoft:'rgba(255,209,102,.18)'},
    nau: {bg:'linear-gradient(180deg,#002554 0%,#001938 100%)', border:'#ffc72c', accent:'#ffd966', accentSoft:'rgba(255,217,102,.18)'},
  };
  return palettes[teamKey] || {bg:'linear-gradient(180deg,#182b49 0%,#102039 100%)', border:'#c8a14d', accent:'#f1c75b', accentSoft:'rgba(241,199,91,.18)'};
}

function rosterPageCards(team){
  const leaders = [...team.players]
    .map((player, idx) => ({ player, idx, pg: playerPerGame(player) }))
    .sort((a, b) => b.pg.mpg - a.pg.mpg);
  const palette = rosterCardPalette(state.team);
  return `<div class="roster-page-grid">
    ${leaders.map(({player, idx, pg}, rank)=>{
      const headshot = playerHeadshot(state.team, player.name);
      return `<button class="roster-spotlight-card" data-roster-card="${idx}" style="--card-bg:${palette.bg};--card-border:${palette.border};--card-accent:${palette.accent};--card-accent-soft:${palette.accentSoft};">
        <div class="roster-spotlight-top">
          <span class="roster-spotlight-rank">#${player.num}</span>
          <span class="roster-spotlight-season">${displayListedPosition(player)}</span>
        </div>
        <div class="roster-spotlight-art">
          <div class="roster-spotlight-logo">${avatarContent(state.team, team.short)}</div>
          ${headshot
            ? `<img class="roster-spotlight-photo" src="${headshot}" alt="${displayPlayerName(player.name)} headshot">`
            : `<div class="roster-spotlight-monogram">${initials(displayPlayerName(player.name))}</div>`}
        </div>
        <div class="roster-spotlight-name">${displayPlayerName(player.name)}</div>
        <div class="roster-spotlight-stats">
          <div class="roster-spotlight-stat"><span>PPG</span><strong>${fmt1(pg.ppg)}</strong></div>
          <div class="roster-spotlight-stat"><span>RPG</span><strong>${fmt1(pg.rpg)}</strong></div>
          <div class="roster-spotlight-stat"><span>APG</span><strong>${fmt1(pg.apg)}</strong></div>
          <div class="roster-spotlight-stat"><span>MPG</span><strong>${fmt1(pg.mpg)}</strong></div>
        </div>
      </button>`;
    }).join('')}
  </div>`;
}

function viewRosterCards(){
  if(!hasSeasonData(state.team, state.season)) return unavailableCard(state.team, state.season);
  const baseTeam = getTeamData(state.team, state.season);
  if(isDynamicTeam(state.team) && !baseTeam.players.length){
    ensureTeamData(state.team, state.season).then(()=>render());
    return loadingCard(state.team, state.season);
  }
  const team = analysisTeam(baseTeam);
  return `
    ${teamSectionTabs()}
    ${rosterPageCards(team)}
    ${state.rosterCardPlayer && state.rosterCardPlayer.team===state.team ? playerModal(team, state.rosterCardPlayer.idx, 'rosterCardPlayer') : ''}
  `;
}

function playerModal(team, idx, stateKey){
  return `<div class="roster-modal-backdrop" data-player-modal-close="${stateKey}">
    <div class="roster-modal-shell player-modal-shell" role="dialog" aria-modal="true" aria-label="${displayPlayerName(team.players[idx].name)} profile" data-player-modal-shell>
      <button class="roster-modal-close" type="button" data-player-modal-button="${stateKey}" aria-label="Close player window">×</button>
      ${playerDetail(team, idx, stateKey)}
    </div>
  </div>`;
}

function overviewTiles(team){
  const s = seasonTotals(team);
  const tile = (label,val,unit)=>`<div class="tile"><div class="eyebrow">${label}</div><div class="val num">${val}${unit?`<small>${unit}</small>`:''}</div></div>`;
  return `<div class="tiles team-summary-tiles">
    ${tile('Record', s.record.w+'–'+s.record.l)}
    ${tile('PPG', fmt1(s.ppg))}
    ${tile('Opp PPG', fmt1(s.oppPpg))}
    ${tile('Reb / gm', fmt1(s.rpg))}
    ${tile('Ast / gm', fmt1(s.apg))}
    ${tile('FG%', s.fgPct.toFixed(1),'%')}
    ${tile('3P%', s.tpPct.toFixed(1),'%')}
    ${tile('TO / gm', fmt1(s.topg))}
  </div>`;
}

function viewOverview(){
  if(!hasSeasonData(state.team, state.season)) return unavailableCard(state.team, state.season);
  const baseTeam = getTeamData(state.team, state.season);
  if(isDynamicTeam(state.team) && !baseTeam.games.length){
    ensureTeamData(state.team, state.season).then(()=>render());
    return loadingCard(state.team, state.season);
  }
  const team = analysisTeam(baseTeam);
  const quarters = quarterAverages(team);
  const fouls = foulsForGames(team.games);
  const avgFouls = fouls.reduce((a,b)=>a+b,0)/fouls.length;
  const scorers = [...team.players].sort((a,b)=>b.pts-a.pts);
  const rebounders = [...team.players].sort((a,b)=>(b.oreb+b.dreb)-(a.oreb+a.dreb));
  const assisters = [...team.players].sort((a,b)=>b.ast-a.ast);

  const tile = (label,val,unit)=>`<div class="tile"><div class="eyebrow">${label}</div><div class="val num">${val}${unit?`<small>${unit}</small>`:''}</div></div>`;

  const LEADER_TABS = [
    {key:'scorers', label:'Top Scorers', list:scorers, statKey:'ppg', statLabel:'PPG', fmt:fmt1},
    {key:'rebounders', label:'Top Rebounders', list:rebounders, statKey:'rpg', statLabel:'RPG', fmt:fmt1},
    {key:'playmakers', label:'Top Playmakers', list:assisters, statKey:'apg', statLabel:'APG', fmt:fmt1},
  ];
  const leaderCard = (tabs, activeKey)=>{
    const active = tabs.find(t=>t.key===activeKey) || tabs[0];
    return `
      <div class="card stretch">
        <div class="card-title"><h3>Roster Leaders</h3><span class="hint">Full roster</span></div>
        <div class="tab-row">
          ${tabs.map(t=>`<button class="tab-btn ${t.key===active.key?'active':''}" data-tab="${t.key}">${t.label}</button>`).join('')}
        </div>
        <div class="leaderboard-list">
          ${active.list.map((p,i)=>`
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;${i<active.list.length-1?'border-bottom:1px solid var(--border);':''}">
              <span class="muted num" style="width:16px;font-size:11px;">${i+1}</span>
              <span class="jersey">${p.num}</span>
              <span class="leader-name">${p.name}</span>
              <span class="num leader-stat">${active.fmt(playerPerGame(p)[active.statKey])}</span>
              <span class="stat-unit">${active.statLabel}</span>
            </div>`).join('')}
        </div>
      </div>`;
  };

  return `
    ${teamSectionTabs()}
    ${overviewTiles(team)}

    <div class="grid-3">
      <div class="card">
        <div class="card-title">
          <h3>Points Scored vs Allowed</h3>
          <div class="legend">
            <span class="legend-item"><span class="swatch" style="background:var(--series-a)"></span>${team.short}</span>
            <span class="legend-item"><span class="swatch" style="background:var(--series-b);border-radius:0;height:2px;"></span>Opponent</span>
          </div>
        </div>
        <div id="trend-holder">${lineChart(team.games, 400, 200)}</div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Average Points per Quarter</h3><span class="hint">Season</span></div>
        ${quarterBarChart(quarters, 400, 200)}
      </div>
      <div class="card">
        <div class="card-title"><h3>Team Fouls per Game</h3><span class="hint">Avg ${fmt1(avgFouls)} · dot = W/L</span></div>
        ${foulsChart(team.games, 400, 200)}
      </div>
    </div>

    <div class="grid-2-even">
      <div class="card stretch">
        <div class="card-title"><h3>Shot Chart</h3><span class="hint">Season frequency</span></div>
        <div class="chart-fill">${shotHeatmap(team, 600, 460)}</div>
        <div class="heat-legend"><span>Lower</span><span class="heat-legend-bar"></span><span>Higher</span></div>
        <p class="heat-caption">Color represents shot frequency — how many shots were made from that area of the court.</p>
      </div>
      ${leaderCard(LEADER_TABS, state.leaderTab)}
    </div>
  `;
}

/* Show each leaderboard's scrollbar only while actively scrolling; fade it
   back out ~800ms after the last scroll event. */
function wireLeaderboardScroll(container){
  container.querySelectorAll('.leaderboard-list').forEach(list=>{
    let hideTimer = null;
    list.addEventListener('scroll', ()=>{
      list.classList.add('scrolling');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(()=> list.classList.remove('scrolling'), 800);
    }, {passive:true});
  });
}

/* Switch which stat list (scorers/rebounders/playmakers) the combined
   leaderboard card is showing. */
function wireLeaderTabs(container){
  container.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    state.leaderTab = btn.dataset.tab; render();
  }));
}

function wireTeamSectionTabs(container){
  container.querySelectorAll('[data-team-view]').forEach(btn=>btn.addEventListener('click', ()=>{
    state.view = btn.dataset.teamView;
    render();
  }));
}

/* ============================= VIEW: GAME LOG ============================= */
const GAME_COLS = [
  {key:'date', label:'Date'}, {key:'opp', label:'Opponent'}, {key:'loc', label:'Loc'},
  {key:'result', label:'Result'}, {key:'fgpct', label:'FG%', num:true},
  {key:'reb', label:'Reb', num:true}, {key:'ast', label:'Ast', num:true}, {key:'to', label:'TO', num:true},
];
function viewGameLog(){
  if(!hasSeasonData(state.team, state.season)) return unavailableCard(state.team, state.season);
  const team = getTeamData(state.team, state.season);
  if(isDynamicTeam(state.team) && !team.games.length){
    ensureTeamData(state.team, state.season).then(()=>render());
    return loadingCard(state.team, state.season);
  }
  let rows = team.games.map(g=>({...g, fgpct:pct(g.fgm,g.fga)}));
  const {key,dir} = state.gameSort;
  const sortVal = g => key==='result' ? (g.win?1:0) : key==='loc' ? (g.home?1:0) : key==='opp' ? g.opp : g[key];
  rows = rows.sort((a,b)=>{ const av=sortVal(a), bv=sortVal(b); return av<bv?-1*dir:av>bv?1*dir:0; });

  return `
    <div class="card">
      <div class="card-title"><h3>${team.name} · ${team.games.length} games</h3><span class="hint">Click a row for that game's box score</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr>${GAME_COLS.map(c=>`<th class="${c.num?'num':''}"><button class="th-sort" data-key="${c.key}">${c.label} ${key===c.key?(dir>0?'↑':'↓'):''}</button></th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(g=>`
              <tr class="clickable" data-date="${g.date}">
                <td class="muted">${g.date}</td>
                <td class="rowname">${g.opp}</td>
                <td class="muted">${g.home?'H':'A'}</td>
                <td><span class="pill ${g.win?'win':'loss'}">${g.win?'W':'L'}</span> <span class="num">${g.pf}–${g.pa}</span></td>
                <td class="num">${g.fgpct.toFixed(1)}%</td>
                <td class="num">${g.reb}</td>
                <td class="num">${g.ast}</td>
                <td class="num">${g.to}</td>
              </tr>
              <tr class="boxrow" data-boxfor="${g.date}" style="display:none;"><td colspan="${GAME_COLS.length}" style="background:var(--surface-2);padding:14px 16px;">
                <div class="eyebrow" style="margin-bottom:8px;">Team box · ${g.home?'vs':'@'} ${g.opp}</div>
                <div class="tiles" style="grid-template-columns:repeat(5,1fr)">
                  <div class="tile"><div class="eyebrow">FG</div><div class="val num" style="font-size:16px;">${g.fgm}-${g.fga}</div></div>
                  <div class="tile"><div class="eyebrow">Reb</div><div class="val num" style="font-size:16px;">${g.reb}</div></div>
                  <div class="tile"><div class="eyebrow">Ast</div><div class="val num" style="font-size:16px;">${g.ast}</div></div>
                  <div class="tile"><div class="eyebrow">TO</div><div class="val num" style="font-size:16px;">${g.to}</div></div>
                  <div class="tile"><div class="eyebrow">Final</div><div class="val num" style="font-size:16px;">${g.pf}-${g.pa}</div></div>
                </div>
              </td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
function wireGameLog(container){
  container.querySelectorAll('.th-sort').forEach(b=>b.addEventListener('click',()=>{
    const key = b.dataset.key;
    state.gameSort = { key, dir: state.gameSort.key===key ? -state.gameSort.dir : 1 };
    render();
  }));
  container.querySelectorAll('tr.clickable').forEach(row=>row.addEventListener('click',()=>{
    const boxrow = container.querySelector(`tr.boxrow[data-boxfor="${row.dataset.date}"]`);
    const open = boxrow.style.display !== 'none';
    container.querySelectorAll('tr.boxrow').forEach(r=>r.style.display='none');
    boxrow.style.display = open ? 'none' : 'table-row';
  }));
}

/* ============================= VIEW: ROSTER / PLAYER DETAIL ============================= */
function viewRoster(){
  if(!hasSeasonData(state.team, state.season)) return unavailableCard(state.team, state.season);
  const baseTeam = getTeamData(state.team, state.season);
  if(isDynamicTeam(state.team) && !baseTeam.players.length){
    ensureTeamData(state.team, state.season).then(()=>render());
    return loadingCard(state.team, state.season);
  }
  const team = analysisTeam(baseTeam);
  const summary = `${teamSectionTabs()}${overviewTiles(team)}${rosterGrid(team)}`;
  if(state.selectedPlayer && state.selectedPlayer.team===state.team){
    return summary + playerModal(team, state.selectedPlayer.idx, 'selectedPlayer');
  }
  return summary;
}

function advancedNumber(player, key, fallback = 0){
  const raw = player.advanced?.[key];
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

function advancedPercent(player, key, fallback = 0){
  return advancedNumber(player, key, fallback) * 100;
}

function playerPer40(player, key){
  const per40Key = {
    pts: 'pts_per_40',
    reb: 'reb_per_40',
    ast: 'ast_per_40',
    stl: 'stl_per_40',
    blk: 'blk_per_40',
    to: 'tov_per_40',
  }[key];
  if(per40Key && player.advanced?.[per40Key] !== undefined){
    return advancedNumber(player, per40Key);
  }
  const mpg = player.min || 0;
  return mpg > 0 ? (player[key] / Math.max(player.gp, 1)) * (40 / mpg) : 0;
}

function rosterPlayerMetrics(team, player, idx){
  const pg = playerPerGame(player);
  const rimMakesTotal = advancedNumber(player, 'rimmade');
  const rimAttTotal = advancedNumber(player, 'rimatt');
  const midMakesTotal = advancedNumber(player, 'midmade');
  const midAttTotal = advancedNumber(player, 'midatt');
  const rimMakes = avg(rimMakesTotal, Math.max(player.gp, 1));
  const rimAtt = avg(rimAttTotal, Math.max(player.gp, 1));
  const midMakes = avg(midMakesTotal, Math.max(player.gp, 1));
  const midAtt = avg(midAttTotal, Math.max(player.gp, 1));
  const threeMakes = avg(player.tpm, Math.max(player.gp, 1));
  const threeAtt = avg(player.tpa, Math.max(player.gp, 1));
  const rimAssistShare = advancedNumber(player, 'pct_rim_made_assisted');
  const midAssistShare = advancedNumber(player, 'pct_mid_made_assisted');
  const threeAssistShare = advancedNumber(player, 'pct_three_made_assisted');
  const assistedMakesTotal = (rimMakesTotal * rimAssistShare) + (midMakesTotal * midAssistShare) + (player.tpm * threeAssistShare);
  const totalAssistPct = player.fgm > 0 ? (assistedMakesTotal / player.fgm) * 100 : 0;
  const tsPct = player.advanced?.ts !== undefined
    ? advancedPercent(player, 'ts')
    : ((player.fga + 0.44 * player.fta) > 0 ? (player.pts / (2 * (player.fga + 0.44 * player.fta))) * 100 : 0);
  const fgPct = player.advanced?.fg !== undefined ? advancedPercent(player, 'fg') : pg.fgPct;
  const tpPct = player.advanced?.tp !== undefined ? advancedPercent(player, 'tp') : pg.tpPct;
  const ftPct = player.advanced?.ft !== undefined ? advancedPercent(player, 'ft') : pg.ftPct;
  const astTo = player.advanced?.ast_tov !== undefined ? advancedNumber(player, 'ast_tov') : astToRatio(player);
  const usg = player.advanced?.usg !== undefined ? advancedPercent(player, 'usg') : usageRate(team, player);
  const metrics = {
    name: player.name,
    gp: player.gp,
    mpg: pg.mpg,
    ppg: pg.ppg,
    rpg: pg.rpg,
    apg: pg.apg,
    spg: pg.stlpg,
    bpg: pg.blkpg,
    topg: pg.topg,
    fgPct,
    tpPct,
    ftPct,
    pts40: playerPer40(player, 'pts'),
    reb40: playerPer40(player, 'reb'),
    ast40: playerPer40(player, 'ast'),
    stl40: playerPer40(player, 'stl'),
    blk40: playerPer40(player, 'blk'),
    to40: playerPer40(player, 'to'),
    tsPct,
    usg,
    rimMakes,
    rimAtt,
    midMakes,
    midAtt,
    threeMakes,
    threeAtt,
    astTo,
    astPct: advancedPercent(player, 'ast_pct'),
    toPct: advancedPercent(player, 'to_pct'),
    drbPct: advancedPercent(player, 'drb_pct'),
    orbPct: advancedPercent(player, 'orb_pct'),
    stlPct: advancedPercent(player, 'stl_pct'),
    blkPct: advancedPercent(player, 'blk_pct'),
    rimShare: advancedPercent(player, 'rim_pct_of_total_attempts'),
    midShare: advancedPercent(player, 'mid_pct_of_total_attempts'),
    threeShare: advancedPercent(player, 'three_pct_of_total_attempts'),
    rimAssistPct: rimAssistShare * 100,
    midAssistPct: midAssistShare * 100,
    threeAssistPct: threeAssistShare * 100,
    totalAssistPct,
    rimFgPct: advancedPercent(player, 'rim_pct'),
    midFgPct: advancedPercent(player, 'mid_pct'),
  };

  return { p: player, i: idx, pg, metrics };
}

function rosterToggle(){
  const tabs = [
    {key:'pergame', label:'Per Game'},
    {key:'per40', label:'Per 40'},
  ];
  return `<div class="mini-toggle" role="tablist" aria-label="Roster stat mode">
    ${tabs.map(tab=>`<button class="mini-toggle-btn ${state.rosterMode===tab.key?'active':''}" data-roster-mode="${tab.key}" role="tab" aria-selected="${state.rosterMode===tab.key}">${tab.label}</button>`).join('')}
  </div>`;
}

function rosterTableViewToggle(){
  const tabs = [
    {key:'main', label:'General'},
    {key:'shooting', label:'Shooting'},
    {key:'efficiency', label:'Efficiency'},
  ];
  return `<div class="mini-toggle" role="tablist" aria-label="Roster table view">
    ${tabs.map(tab=>`<button class="mini-toggle-btn ${state.rosterTableView===tab.key?'active':''}" data-roster-view="${tab.key}" role="tab" aria-selected="${state.rosterTableView===tab.key}">${tab.label}</button>`).join('')}
  </div>`;
}

function shootingToggle(){
  const tabs = [
    {key:'basic', label:'Standard'},
    {key:'advanced', label:'Area Split'},
  ];
  return `<div class="mini-toggle" role="tablist" aria-label="Shooting detail mode">
    ${tabs.map(tab=>`<button class="mini-toggle-btn ${state.shootingMode===tab.key?'active':''}" data-shooting-mode="${tab.key}" role="tab" aria-selected="${state.shootingMode===tab.key}">${tab.label}</button>`).join('')}
  </div>`;
}

function renderTableHead({tableKey, columns, sortState, headerRows}){
  if(headerRows?.length){
    return headerRows.map(row=>`<tr>
      ${row.map(cell=>{
        const attrs = [
          cell.num ? 'class="num"' : '',
          cell.colSpan ? `colspan="${cell.colSpan}"` : '',
          cell.rowSpan ? `rowspan="${cell.rowSpan}"` : '',
        ].filter(Boolean).join(' ');
        if(cell.key){
          return `<th ${attrs}><button class="th-sort" data-roster-table="${tableKey}" data-roster-sort="${cell.key}">${cell.label} ${sortState.key===cell.key?(sortState.dir>0?'↑':'↓'):''}</button></th>`;
        }
        return `<th ${attrs}>${cell.label}</th>`;
      }).join('')}
    </tr>`).join('');
  }
  return `<tr>
    ${columns.map(col=>`<th class="${col.num?'num':''}"><button class="th-sort" data-roster-table="${tableKey}" data-roster-sort="${col.key}">${col.label} ${sortState.key===col.key?(sortState.dir>0?'↑':'↓'):''}</button></th>`).join('')}
  </tr>`;
}

function rosterSectionCard({title, hint, tableKey, columns, rows, sortState, headerRows = null, controls = ''}){
  const sorted = [...rows].sort((a,b)=>{
    const av = a.metrics[sortState.key];
    const bv = b.metrics[sortState.key];
    if(typeof av === 'string' || typeof bv === 'string'){
      return String(av).localeCompare(String(bv)) * sortState.dir;
    }
    return (av < bv ? -1 : av > bv ? 1 : 0) * sortState.dir;
  });

  return `<div class="card roster-section-card">
    <div class="card-title">
      <div class="card-title-copy">
        <h3>${title}</h3>
        <span class="hint">${hint}</span>
      </div>
      <div class="card-title-actions roster-card-controls">
        ${controls}
      </div>
    </div>
    <div class="table-wrap roster-table-wrap">
      <table class="roster-table">
        <thead>
          ${renderTableHead({tableKey, columns, sortState, headerRows})}
        </thead>
        <tbody>
          ${sorted.map(({p, i, metrics})=>{
            const active = state.selectedPlayer && state.selectedPlayer.team===state.team && state.selectedPlayer.idx===i;
            const headshot = playerHeadshot(state.team, p.name);
            return `<tr class="clickable ${active?'selected':''}" data-idx="${i}">
              ${columns.map(col=>{
                if(col.key === 'name'){
                  return `<td class="rowname">
                    <div class="roster-namecell">
                      <span class="roster-table-photo">
                        ${headshot ? `<img src="${headshot}" alt="${displayPlayerName(p.name)} headshot">` : avatarContent(state.team, initials(p.name))}
                      </span>
                      <span class="roster-identity">
                        <span class="roster-player">${displayPlayerName(p.name)} <span class="roster-inline-num">#${p.num}</span></span>
                        <span class="roster-meta">${displayListedPosition(p)} · ${displayClassYear(p)}</span>
                      </span>
                    </div>
                  </td>`;
                }
                return `<td class="${col.num?'num':''}">${col.render(metrics)}</td>`;
              }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function rosterGrid(team){
  const rows = team.players.map((player, idx) => rosterPlayerMetrics(team, player, idx));
  const countingPrefix = state.rosterMode === 'per40' ? '/40' : 'PG';
  const mainColumns = [
    {key:'name', label:'Name'},
    {key:'gp', label:'GP', num:true, render:m => `${m.gp}`},
    {key:'mpg', label:'MPG', num:true, render:m => fmt1(m.mpg)},
    {key:state.rosterMode === 'per40' ? 'pts40' : 'ppg', label:state.rosterMode === 'per40' ? 'PTS/40' : 'PPG', num:true, render:m => fmt1(state.rosterMode === 'per40' ? m.pts40 : m.ppg)},
    {key:state.rosterMode === 'per40' ? 'reb40' : 'rpg', label:state.rosterMode === 'per40' ? 'REB/40' : 'RPG', num:true, render:m => fmt1(state.rosterMode === 'per40' ? m.reb40 : m.rpg)},
    {key:state.rosterMode === 'per40' ? 'ast40' : 'apg', label:state.rosterMode === 'per40' ? 'AST/40' : 'APG', num:true, render:m => fmt1(state.rosterMode === 'per40' ? m.ast40 : m.apg)},
    {key:state.rosterMode === 'per40' ? 'stl40' : 'spg', label:state.rosterMode === 'per40' ? 'STL/40' : 'STLPG', num:true, render:m => fmt1(state.rosterMode === 'per40' ? m.stl40 : m.spg)},
    {key:state.rosterMode === 'per40' ? 'blk40' : 'bpg', label:state.rosterMode === 'per40' ? 'BLK/40' : 'BPG', num:true, render:m => fmt1(state.rosterMode === 'per40' ? m.blk40 : m.bpg)},
    {key:state.rosterMode === 'per40' ? 'to40' : 'topg', label:state.rosterMode === 'per40' ? 'TOV/40' : 'TOVPG', num:true, render:m => fmt1(state.rosterMode === 'per40' ? m.to40 : m.topg)},
    {key:'fgPct', label:'FG%', num:true, render:m => m.fgPct.toFixed(1)},
    {key:'tpPct', label:'3PT%', num:true, render:m => m.tpPct.toFixed(1)},
    {key:'ftPct', label:'FT%', num:true, render:m => m.ftPct.toFixed(1)},
  ];
  const shootingColumnsBasic = [
    {key:'name', label:'Name'},
    {key:'gp', label:'GP', num:true, render:m => `${m.gp}`},
    {key:'mpg', label:'MPG', num:true, render:m => fmt1(m.mpg)},
    {key:'tpPct', label:'3PT%', num:true, render:m => m.tpPct.toFixed(1)},
    {key:'ftPct', label:'FT%', num:true, render:m => m.ftPct.toFixed(1)},
    {key:'tsPct', label:'TS%', num:true, render:m => m.tsPct.toFixed(1)},
    {key:'usg', label:'USG%', num:true, render:m => m.usg.toFixed(1)},
    {key:'ppg', label:'PPG', num:true, render:m => fmt1(m.ppg)},
    {key:'threeMakes', label:'3PM/G', num:true, render:m => fmt1(m.threeMakes)},
    {key:'threeAtt', label:'3PA/G', num:true, render:m => fmt1(m.threeAtt)},
  ];
  const shootingColumnsAdvanced = [
    {key:'name', label:'Name'},
    {key:'rimMakes', label:'Rim M/G', num:true, render:m => fmt1(m.rimMakes)},
    {key:'rimAtt', label:'Rim A/G', num:true, render:m => fmt1(m.rimAtt)},
    {key:'rimAssistPct', label:'Rim Ast%', num:true, render:m => m.rimAssistPct.toFixed(1)},
    {key:'midMakes', label:'Mid M/G', num:true, render:m => fmt1(m.midMakes)},
    {key:'midAtt', label:'Mid A/G', num:true, render:m => fmt1(m.midAtt)},
    {key:'midAssistPct', label:'Mid Ast%', num:true, render:m => m.midAssistPct.toFixed(1)},
    {key:'threeMakes', label:'3PM/G', num:true, render:m => fmt1(m.threeMakes)},
    {key:'threeAtt', label:'3PA/G', num:true, render:m => fmt1(m.threeAtt)},
    {key:'threeAssistPct', label:'3 Ast%', num:true, render:m => m.threeAssistPct.toFixed(1)},
    {key:'totalAssistPct', label:'Ast Total%', num:true, render:m => m.totalAssistPct.toFixed(1)},
  ];
  const shootingHeaderRows = [
    [
      {key:'name', label:'Name', rowSpan:3},
      {label:'Area', colSpan:9},
      {key:'totalAssistPct', label:'Ast Total%', num:true, rowSpan:3},
    ],
    [
      {label:'Rim', colSpan:3},
      {label:'Mid', colSpan:3},
      {label:'3PT', colSpan:3},
    ],
    [
      {key:'rimMakes', label:'M/G', num:true},
      {key:'rimAtt', label:'A/G', num:true},
      {key:'rimAssistPct', label:'Ast%', num:true},
      {key:'midMakes', label:'M/G', num:true},
      {key:'midAtt', label:'A/G', num:true},
      {key:'midAssistPct', label:'Ast%', num:true},
      {key:'threeMakes', label:'M/G', num:true},
      {key:'threeAtt', label:'A/G', num:true},
      {key:'threeAssistPct', label:'Ast%', num:true},
    ],
  ];
  const efficiencyColumns = [
    {key:'name', label:'Name'},
    {key:'gp', label:'GP', num:true, render:m => `${m.gp}`},
    {key:'mpg', label:'MPG', num:true, render:m => fmt1(m.mpg)},
    {key:'fgPct', label:'FG%', num:true, render:m => m.fgPct.toFixed(1)},
    {key:'tpPct', label:'3PT%', num:true, render:m => m.tpPct.toFixed(1)},
    {key:'ftPct', label:'FT%', num:true, render:m => m.ftPct.toFixed(1)},
    {key:'astTo', label:'AST/TO', num:true, render:m => m.astTo.toFixed(2)},
    {key:'usg', label:'USG%', num:true, render:m => m.usg.toFixed(1)},
    {key:'astPct', label:'AST%', num:true, render:m => m.astPct.toFixed(1)},
    {key:'toPct', label:'TO%', num:true, render:m => m.toPct.toFixed(1)},
    {key:'drbPct', label:'DRB%', num:true, render:m => m.drbPct.toFixed(1)},
    {key:'orbPct', label:'ORB%', num:true, render:m => m.orbPct.toFixed(1)},
    {key:'stlPct', label:'STL%', num:true, render:m => m.stlPct.toFixed(1)},
    {key:'blkPct', label:'BLK%', num:true, render:m => m.blkPct.toFixed(1)},
  ];
  const tableViews = {
    main: {
      title: `${team.name} general`,
      hint: `${team.players.length} players · click a row for player detail`,
      tableKey: 'main',
      columns: mainColumns,
      rows,
      sortState: state.rosterSortMain,
      controls: `${rosterToggle()}${rosterTableViewToggle()}`,
    },
    shooting: {
      title: `${team.name} shooting`,
      hint: state.shootingMode === 'advanced' ? 'Grouped area shooting with makes, attempts, and assisted rates.' : 'Efficiency first with core shooting volume.',
      tableKey: 'shooting',
      columns: state.shootingMode === 'advanced' ? shootingColumnsAdvanced : shootingColumnsBasic,
      rows,
      sortState: state.rosterSortShooting,
      headerRows: state.shootingMode === 'advanced' ? shootingHeaderRows : null,
      controls: `${shootingToggle()}${rosterTableViewToggle()}`,
    },
    efficiency: {
      title: `${team.name} efficiency`,
      hint: 'Advanced rate, usage, shot-share, and assisted-finishing stats.',
      tableKey: 'efficiency',
      columns: efficiencyColumns,
      rows,
      sortState: state.rosterSortEfficiency,
      controls: rosterTableViewToggle(),
    },
  };
  return rosterSectionCard(tableViews[state.rosterTableView] || tableViews.main);
}
/* All stats shown as clickable tiles on the player detail card. `val` is the
   season per-game (or ratio/%) value shown on the tile; `decimals`/`min`/`max`
   control how the illustrative game-by-game trend is generated and clamped.
   Plus/Minus, OREB%, and DREB% aren't derivable from our current box-score
   fields, so — like the rest of this mock dashboard's illustrative charts
   (fouls, quarter splits, shot chart) — they're seeded deterministically per
   player rather than left out. */
function playerStatDefs(team, p, pg){
  const plusMinus = seededVal(team.short+p.name+'pm', -8, 12);
  return [
    {key:'min', label:'MIN', trendLabel:'Minutes', val:pg.mpg, fmt:fmt1, decimals:1},
    {key:'pts', label:'PTS', trendLabel:'Points', val:pg.ppg, fmt:fmt1, decimals:0},
    {key:'reb', label:'REB', trendLabel:'Rebounds', val:pg.rpg, fmt:fmt1, decimals:0},
    {key:'ast', label:'AST', trendLabel:'Assists', val:pg.apg, fmt:fmt1, decimals:0},
    {key:'stl', label:'STL', trendLabel:'Steals', val:pg.stlpg, fmt:fmt1, decimals:1},
    {key:'blk', label:'BLK', trendLabel:'Blocks', val:pg.blkpg, fmt:fmt1, decimals:1},
    {key:'fgpct', label:'FG%', trendLabel:'FG%', val:pg.fgPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'tppct', label:'3P%', trendLabel:'3P%', val:pg.tpPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'ftpct', label:'FT%', trendLabel:'FT%', val:pg.ftPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'pm', label:'+/-', trendLabel:'Plus/Minus', val:plusMinus, fmt:v=>(v>=0?'+':'')+v.toFixed(1), decimals:1, min:-Infinity},
  ];
}

/* ============================= PLAYER STAT TREND CHART (x/y axis) =============================
   Full axis chart used by the player-detail view: labeled y-axis (gridlines +
   value ticks using the active stat's own formatter) and labeled x-axis
   (game number, sparse-ticked so labels don't collide on long seasons),
   plus a hover crosshair + tooltip on every point (not just the last one). */
/* Axis bounds are derived from the actual series being plotted (with a
   per-stat floor so a quiet game/season doesn't zoom the axis in too far),
   never a bare fixed cap — otherwise any value above that cap renders
   outside the chart entirely (SVG has overflow:visible so it doesn't even
   clip, it just draws over whatever is above the card). */
function trendAxisSpec(active, series){
  const seriesMax = Math.max(...series, 0);
  const seriesMin = Math.min(...series, 0);

  // True 0-100 bounds — percentages can't exceed this, so no need to scale.
  if(active.key==='fgpct' || active.key==='tppct' || active.key==='ftpct'){
    return { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] };
  }

  const stepByKey = { min:10, pts:10, reb:5, ast:5, stl:2, blk:2, pm:5 };
  const step = stepByKey[active.key] || 5;

  if(active.key==='pm'){
    // Can go negative — scale symmetrically around 0 to whichever side needs more room.
    const bound = Math.max(step*2, Math.ceil(Math.max(seriesMax, -seriesMin) / step) * step);
    return { min: -bound, max: bound, ticks: [-bound, -bound/2, 0, bound/2, bound] };
  }

  const floorByKey = { min:40, pts:40, reb:20, ast:20, stl:10, blk:10 };
  const floor = floorByKey[active.key] || step*4;
  const max = Math.max(floor, Math.ceil(seriesMax / step) * step);
  return { min: 0, max, ticks: [0, max*0.25, max*0.5, max*0.75, max] };
}

function statTrendChart(series, active, games, w, h, selectedGameId = null){
  const pad = {l:46, r:16, t:16, b:34};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;
  const axis = trendAxisSpec(active, series);
  const min = axis.min;
  const max = axis.max;

  const n = series.length;
  const x = i => pad.l + (n===1?iw/2:(i/(n-1))*iw);
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;

  const yAxis = axis.ticks.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="axislabel" x="${pad.l-6}" y="${(y(v)+3).toFixed(1)}" text-anchor="end">${formatTrendAxisValue(v)}</text>`).join('');

  const xTickEvery = Math.max(1, Math.ceil(n/8));
  const xAxis = series.map((v,i)=> (i%xTickEvery===0 || i===n-1) ? `<text class="axislabel" x="${x(i).toFixed(1)}" y="${h-pad.b+16}" text-anchor="middle">G${i+1}</text>` : '').join('');

  const linePath = series.map((v,i)=>(i===0?'M':'L')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
  const areaPath = linePath + ` L${x(n-1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;

  const dots = series.map((v,i)=>{
    const fill = games && games[i % games.length] ? (games[i % games.length].win ? 'var(--good)' : 'var(--critical)') : 'var(--series-a)';
    const selected = selectedGameId && games?.[i]?.gameId === selectedGameId;
    return `<circle class="trend-pt" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${selected?5.5:(i===n-1?4.5:3)}" fill="${fill}" ${(i===n-1 || selected)?'stroke="white" stroke-width="1.5"':''} data-i="${i}"/>`;
  }).join('');
  const hitW = n>1 ? iw/(n-1) : iw;
  const hits = series.map((v,i)=>`<rect class="trend-hit" x="${(x(i)-hitW/2).toFixed(1)}" y="${pad.t}" width="${hitW.toFixed(1)}" height="${ih}" data-i="${i}"/>`).join('');

  return `<div class="chart-wrap" data-chart="stat-trend">
    <svg class="chart chart--trend" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      ${yAxis}
      <line class="gridline" x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${h-pad.b}"/>
      <line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${h-pad.b}" y2="${h-pad.b}"/>
      ${xAxis}
      <text class="axistitle" x="${(pad.l+w-pad.r)/2}" y="${h-4}" text-anchor="middle">Game number</text>
      <text class="axistitle" x="${12}" y="${(pad.t+h-pad.b)/2}" text-anchor="middle" transform="rotate(-90 12 ${(pad.t+h-pad.b)/2})">${active.label}</text>
      <path d="${areaPath}" fill="var(--series-a)" opacity=".12"/>
      <path d="${linePath}" fill="none" stroke="var(--series-a)" stroke-width="2.25"/>
      ${dots}
      <line id="stat-hoverline" class="hover-x" x1="0" x2="0" y1="${pad.t}" y2="${h-pad.b}"/>
      ${hits}
    </svg>
  </div>`;
}

function formatTrendTooltipValue(active, value){
  if(['min','pts','reb','ast','stl','blk'].includes(active.key)){
    return `${Math.round(value)}`;
  }
  if(active.key === 'pm'){
    const rounded = Math.round(value);
    return `${rounded >= 0 ? '+' : ''}${rounded}`;
  }
  return active.fmt(value);
}

function wireStatTrendChart(container, series, active, games, onSelectGame = null){
  const wrap = container.querySelector('[data-chart="stat-trend"]');
  if(!wrap) return;
  const svg = wrap.querySelector('svg');
  const tooltip = document.getElementById('tooltip');
  const hoverline = wrap.querySelector('#stat-hoverline');
  svg.querySelectorAll('.trend-hit').forEach(hit=>{
    hit.addEventListener('mouseenter', ()=>{
      const i = +hit.dataset.i;
      const pt = svg.querySelector(`.trend-pt[data-i="${i}"]`);
      hoverline.setAttribute('x1', pt.getAttribute('cx')); hoverline.setAttribute('x2', pt.getAttribute('cx'));
      hoverline.style.opacity = 1;
      const rect = svg.getBoundingClientRect(), wrapAbs = wrap.getBoundingClientRect();
      const px = (pt.getAttribute('cx')/svg.viewBox.baseVal.width)*rect.width;
      const py = (pt.getAttribute('cy')/svg.viewBox.baseVal.height)*rect.height;
      const g = games && games.length ? games[i % games.length] : null;
      const sub = g ? `Game ${i+1} · ${g.win?'W':'L'} vs ${g.opp}` : `Game ${i+1}`;
      const displayValue = formatTrendTooltipValue(active, series[i]);
      tooltip.innerHTML = `<div>${displayValue} ${active.label} <span class="t-sub">${sub}</span></div>`;
      tooltip.style.transform = 'translate(-50%,-125%)';
      tooltip.style.left = (wrapAbs.left+window.scrollX+px)+'px'; tooltip.style.top = (wrapAbs.top+window.scrollY+py)+'px';
      tooltip.classList.add('show');
    });
    hit.addEventListener('mouseleave', ()=>{ hoverline.style.opacity=0; tooltip.classList.remove('show'); });
    hit.addEventListener('click', ()=>{
      const i = +hit.dataset.i;
      if(onSelectGame && games[i]){
        onSelectGame(games[i], i);
      }
    });
  });
}

function shotSliceColor(fgPct){
  if(fgPct >= 50) return 'var(--good)';
  if(fgPct >= 35) return '#D5A437';
  return 'var(--critical)';
}

function polarPoint(cx, cy, radius, degrees){
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function pieSlicePath(cx, cy, radius, startAngle, endAngle){
  const start = polarPoint(cx, cy, radius, endAngle);
  const end = polarPoint(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function shotDistributionChart(rows){
  const cx = 140;
  const cy = 120;
  const radius = 92;
  const insideLabelThreshold = 8;
  const orderedRows = [
    rows.find(row => row.label === 'Rim'),
    rows.find(row => row.label === '3PT'),
    rows.find(row => row.label === 'Mid'),
  ].filter(row => row && row.share > 0.05);
  const rimRow = orderedRows.find(row => row.label === 'Rim');
  let startAngle = rimRow ? -(rimRow.share / 100) * 180 : 0;
  const slices = orderedRows.map(row=>{
    const sweep = (row.share / 100) * 360;
    const endAngle = startAngle + sweep;
    const path = pieSlicePath(cx, cy, radius, startAngle, endAngle);
    const midAngle = startAngle + (sweep / 2);
    const labelPoint = polarPoint(cx, cy, radius * 0.58, midAngle);
    const outerPoint = polarPoint(cx, cy, radius * 1.04, midAngle);
    const calloutPoint = polarPoint(cx, cy, radius * 1.22, midAngle);
    const calloutDirection = calloutPoint.x >= cx ? 1 : -1;
    const rawCalloutX = calloutPoint.x + (calloutDirection * 14);
    const slice = {
      ...row,
      path,
      labelX: labelPoint.x,
      labelY: labelPoint.y,
      outerX: outerPoint.x,
      outerY: outerPoint.y,
      calloutX: Math.max(32, Math.min(248, rawCalloutX)),
      calloutY: calloutPoint.y,
      textAnchor: calloutDirection > 0 ? 'start' : 'end',
      labelInside: row.share >= insideLabelThreshold,
      color: shotSliceColor(row.fg),
    };
    startAngle = endAngle;
    return slice;
  });
  return `<div class="shot-pie-layout" data-shot-distribution>
    <svg class="shot-pie" viewBox="0 0 280 240" aria-label="Shot distribution pie chart">
      ${slices.map((slice, idx)=>`
        <path
          class="shot-pie-slice"
          d="${slice.path}"
          fill="${slice.color}"
          data-shot-slice="${idx}"
          data-area-key="${slice.label.toLowerCase()}"
          data-label="${slice.label}"
          data-share="${slice.share.toFixed(1)}"
          data-fg="${slice.fg.toFixed(1)}"
          data-assist-pct="${slice.assist.toFixed(1)}"
          data-assist-makes="${slice.assistMakes.toFixed(1)}"
        ></path>
      `).join('')}
      ${slices.map(slice=>`
        ${slice.labelInside
          ? `<text class="shot-pie-label" x="${slice.labelX.toFixed(1)}" y="${slice.labelY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${slice.label}</text>`
          : `
            <path class="shot-pie-callout" d="M ${slice.outerX.toFixed(1)} ${slice.outerY.toFixed(1)} L ${slice.calloutX.toFixed(1)} ${slice.calloutY.toFixed(1)}"></path>
            <text class="shot-pie-label shot-pie-label-outside" x="${slice.calloutX.toFixed(1)}" y="${slice.calloutY.toFixed(1)}" text-anchor="${slice.textAnchor}" dominant-baseline="middle">
              ${slice.label}
            </text>
          `}
      `).join('')}
    </svg>
  </div>`;
}

function wireShotDistributionChart(container){
  const wrap = container.querySelector('[data-shot-distribution]');
  if(!wrap) return;
  const tooltip = document.getElementById('tooltip');
  const showShotTooltip = (target, event)=>{
    tooltip.innerHTML = `<div>${target.dataset.label} <span class="t-sub">${target.dataset.share}% of all FGA · ${target.dataset.fg}% FG · ${target.dataset.assistPct}% assisted</span></div>`;
    tooltip.style.transform = 'translate(-50%,-125%)';
    tooltip.style.left = `${event.pageX}px`;
    tooltip.style.top = `${event.pageY}px`;
    tooltip.classList.add('show');
    const areaKey = target.dataset.areaKey;
    wrap.querySelector(`[data-shot-slice][data-area-key="${areaKey}"]`)?.classList.add('active');
  };
  const hideShotTooltip = target=>{
    tooltip.classList.remove('show');
    const areaKey = target.dataset.areaKey;
    wrap.querySelector(`[data-shot-slice][data-area-key="${areaKey}"]`)?.classList.remove('active');
  };
  wrap.querySelectorAll('[data-shot-slice]').forEach(slice=>{
    slice.addEventListener('mouseenter', event=>{
      showShotTooltip(slice, event);
    });
    slice.addEventListener('mousemove', event=>{
      tooltip.style.left = `${event.pageX}px`;
      tooltip.style.top = `${event.pageY}px`;
    });
    slice.addEventListener('mouseleave', ()=>{
      hideShotTooltip(slice);
    });
    slice.addEventListener('focus', event=>{
      const rect = slice.getBoundingClientRect();
      showShotTooltip(slice, {
        pageX: rect.left + window.scrollX + (rect.width / 2),
        pageY: rect.top + window.scrollY,
      });
    });
    slice.addEventListener('blur', ()=>{
      hideShotTooltip(slice);
    });
  });
}

function playerRadarChart(metrics){
  const cx = 132;
  const cy = 126;
  const radius = 86;
  const axes = [
    { label: 'Scoring', value: Math.min(100, (metrics.ppg / 20) * 100) },
    { label: 'Shooting', value: Math.min(100, metrics.tsPct) },
    { label: 'Usage', value: Math.min(100, (metrics.usg / 30) * 100) },
    { label: 'Defense', value: Math.min(100, (((metrics.stlPct + metrics.blkPct) / 2) / 6) * 100) },
    { label: 'Rebound', value: Math.min(100, (metrics.rpg / 10) * 100) },
    { label: 'Passing', value: Math.min(100, (metrics.astPct / 35) * 100) },
  ];
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (Math.PI * 2) / axes.length;
  const pointAt = (axisIdx, scale) => {
    const angle = -Math.PI / 2 + (axisIdx * angleStep);
    return {
      x: cx + Math.cos(angle) * radius * scale,
      y: cy + Math.sin(angle) * radius * scale,
    };
  };
  const rings = levels.map(level => {
    const path = axes.map((_, idx) => {
      const pt = pointAt(idx, level);
      return `${idx===0?'M':'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }).join(' ') + ' Z';
    return `<path class="radar-grid-ring" d="${path}"></path>`;
  }).join('');
  const spokes = axes.map((_, idx) => {
    const pt = pointAt(idx, 1);
    return `<line class="radar-grid-spoke" x1="${cx}" y1="${cy}" x2="${pt.x.toFixed(1)}" y2="${pt.y.toFixed(1)}"></line>`;
  }).join('');
  const areaPath = axes.map((axis, idx) => {
    const pt = pointAt(idx, axis.value / 100);
    return `${idx===0?'M':'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }).join(' ') + ' Z';
  const points = axes.map((axis, idx) => {
    const pt = pointAt(idx, axis.value / 100);
    return `<circle class="radar-point" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.5"></circle>`;
  }).join('');
  const labels = axes.map((axis, idx) => {
    const pt = pointAt(idx, 1.18);
    return `<text class="radar-axis-label" x="${pt.x.toFixed(1)}" y="${pt.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${axis.label}</text>`;
  }).join('');
  return `<div class="player-radar-panel">
    <div class="card-title"><h3>Role Profile</h3><span class="hint">Percent-based radar design</span></div>
    <svg class="player-radar" viewBox="0 0 264 252" aria-label="Player role radar chart">
      ${rings}
      ${spokes}
      <path class="radar-area" d="${areaPath}"></path>
      ${points}
      ${labels}
    </svg>
  </div>`;
}

function playerShotProfileCard(team, player){
  const metrics = rosterPlayerMetrics(team, player, 0).metrics;
  const rows = [
    {label:'Rim', share:metrics.rimShare, fg:metrics.rimFgPct, assist:metrics.rimAssistPct, assistMakes:metrics.rimMakes * (metrics.rimAssistPct / 100)},
    {label:'Mid', share:metrics.midShare, fg:metrics.midFgPct, assist:metrics.midAssistPct, assistMakes:metrics.midMakes * (metrics.midAssistPct / 100)},
    {label:'3PT', share:metrics.threeShare, fg:metrics.tpPct, assist:metrics.threeAssistPct, assistMakes:metrics.threeMakes * (metrics.threeAssistPct / 100)},
  ];
  return `<div class="pdetail-shot-profile">
    <div class="player-visual-grid">
      <div class="player-shot-panel">
        <div class="card-title"><h3>Shot Distribution</h3><span class="hint">Hover an area for share, FG%, and assisted%</span></div>
        ${shotDistributionChart(rows)}
      </div>
      ${playerRadarChart(metrics)}
    </div>
  </div>`;
}

function playerModalOptions(team, idx){
  return team.players
    .map((player, playerIdx)=>({ player, playerIdx, mpg: playerPerGame(player).mpg }))
    .sort((a,b)=> b.mpg - a.mpg || displayPlayerName(a.player.name).localeCompare(displayPlayerName(b.player.name)))
    .map(({ player, playerIdx })=>`<option value="${playerIdx}" ${playerIdx===idx?'selected':''}>#${player.num} ${displayPlayerName(player.name)}</option>`)
    .join('');
}

function playerTrendWindowOptions(){
  const options = [
    { value: 'all', label: 'All Games' },
    { value: '10', label: 'Last 10' },
    { value: '5', label: 'Last 5' },
    { value: '3', label: 'Last 3' },
  ];
  return options.map(option => `<option value="${option.value}" ${state.playerTrendWindow===option.value?'selected':''}>${option.label}</option>`).join('');
}

function playerTrendGames(team, player){
  const playerLogs = team.playerGameLogs?.[normalizePlayerName(player.name)];
  const availableGames = (playerLogs && playerLogs.length)
    ? playerLogs
    : team.games.slice(-Math.min(team.games.length, player.gp));
  if(state.playerTrendWindow === 'all') return availableGames;
  const count = Number(state.playerTrendWindow);
  return Number.isFinite(count) && count > 0 ? availableGames.slice(-count) : availableGames;
}

function playerTrendSeries(team, player, active, entries){
  const actualSeriesKey = {
    min: 'min',
    pts: 'pts',
    reb: 'reb',
    ast: 'ast',
    stl: 'stl',
    blk: 'blk',
    fgpct: 'fgPct',
    tppct: 'tpPct',
    ftpct: 'ftPct',
  }[active.key];
  if(actualSeriesKey && entries.length && entries[0][actualSeriesKey] !== undefined){
    return entries.map(entry => Number(entry[actualSeriesKey] || 0));
  }
  const spread = Math.max(0.5, Math.abs(active.val)*0.35);
  const seed = player.num*7 + player.name.length + active.key.length*13;
  return seededSeries(seed, Math.max(entries.length, 1), active.val, spread, {decimals:active.decimals, min:active.min, max:active.max});
}

function playerGameStatDefs(gameLog){
  return [
    {key:'min', label:'MIN', trendLabel:'Minutes', val:gameLog.min, fmt:fmt1, decimals:1},
    {key:'pts', label:'PTS', trendLabel:'Points', val:gameLog.pts, fmt:v => `${v}`, decimals:0},
    {key:'reb', label:'REB', trendLabel:'Rebounds', val:gameLog.reb, fmt:v => `${v}`, decimals:0},
    {key:'ast', label:'AST', trendLabel:'Assists', val:gameLog.ast, fmt:v => `${v}`, decimals:0},
    {key:'stl', label:'STL', trendLabel:'Steals', val:gameLog.stl, fmt:v => `${v}`, decimals:0},
    {key:'blk', label:'BLK', trendLabel:'Blocks', val:gameLog.blk, fmt:v => `${v}`, decimals:0},
    {key:'fgpct', label:'FG', trendLabel:'FG%', val:`${gameLog.fgm}-${gameLog.fga}`, fmt:v => v, decimals:1, max:100},
    {key:'tppct', label:'3PT', trendLabel:'3P%', val:`${gameLog.tpm}-${gameLog.tpa}`, fmt:v => v, decimals:1, max:100},
    {key:'ftpct', label:'FT', trendLabel:'FT%', val:`${gameLog.ftm}-${gameLog.fta}`, fmt:v => v, decimals:1, max:100},
    {key:'pm', label:'TOV', trendLabel:'Turnovers', val:gameLog.to, fmt:v => `${v}`, decimals:0, min:0},
  ];
}

function formatTrendAxisValue(value){
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, '');
}

function playerDetail(team, idx, stateKey = ''){
  const p = team.players[idx], pg = playerPerGame(p);
  const trendGames = playerTrendGames(team, p);
  const activeGame = state.playerGameFocus && state.playerGameFocus.team===state.team && state.playerGameFocus.idx===idx
    ? trendGames.find(game => game.gameId === state.playerGameFocus.gameId) || null
    : null;
  const defs = activeGame ? playerGameStatDefs(activeGame) : playerStatDefs(team, p, pg);
  const active = defs.find(d=>d.key===state.playerStatKey) || defs[0];
  const displayName = displayPlayerName(p.name);
  const headshot = playerHeadshot(state.team, p.name);
  const series = playerTrendSeries(team, p, active, trendGames);
  const contextLabel = activeGame
    ? `${activeGame.date} ${activeGame.home ? 'vs' : '@'} ${activeGame.opp}`
    : `${state.playerTrendWindow === 'all' ? 'Season' : `Last ${state.playerTrendWindow}`} view`;

  return `<div class="card" id="player-detail">
    <div class="pdetail-head">
      <div class="pdetail-avatar">${headshot ? `<img src="${headshot}" alt="${displayName} headshot">` : avatarContent(state.team, initials(p.name))}</div>
      <div>
        <h3 class="pdetail-name">${displayName} <span class="muted" style="font-weight:700;">#${p.num}</span></h3>
        <div class="pdetail-meta">${displayListedPosition(p)} · ${displayClassYear(p)} · ${team.name} · ${p.gp} games</div>
      </div>
    </div>

    <div class="pdetail-body">
      <div class="pdetail-stats-col">
        <div class="pdetail-stats-head">
          <div class="eyebrow">${activeGame ? 'Game Stats' : 'Select a stat'}</div>
          <span class="pdetail-context-label">${contextLabel}</span>
          ${activeGame ? `<button type="button" class="btn link" data-clear-player-game>Back to season</button>` : ''}
        </div>
        <div class="stat-tile-grid">
          ${defs.map(d=>`
            <button class="tile stat-tile ${d.key===active.key?'active':''}" data-stat="${d.key}">
              <div class="eyebrow">${d.label}</div><div class="val num">${d.fmt(d.val)}</div>
            </button>`).join('')}
        </div>
      </div>
      <div class="pdetail-chart-col">
        <div class="card-title">
          <h3>${active.trendLabel}, game by game</h3>
          <div class="player-detail-actions">
            ${stateKey ? `
              <label class="player-detail-picker">
                <span>Choose Player</span>
                <select data-player-picker="${stateKey}" aria-label="Choose player">
                  ${playerModalOptions(team, idx)}
                </select>
              </label>
              <label class="player-detail-picker player-detail-picker--compact">
                <span>Window</span>
                <select data-player-trend-window="${stateKey}" aria-label="Choose game window">
                  ${playerTrendWindowOptions()}
                </select>
              </label>
            ` : ''}
            <span class="hint">${team.playerGameLogs?.[normalizePlayerName(p.name)]?.length ? 'Click a point for game stats' : 'Illustrative trend'}</span>
          </div>
        </div>
        ${statTrendChart(series, active, trendGames, 640, 265, activeGame?.gameId || null)}
        ${playerShotProfileCard(team, p)}
      </div>
    </div>
  </div>`;
}
function wireRoster(container){
  const team = analysisTeam(getTeamData(state.team, state.season));
  container.querySelectorAll('[data-roster-view]').forEach(btn=>btn.addEventListener('click', ()=>{
    state.rosterScrollLeft = 0;
    state.rosterTableView = btn.dataset.rosterView;
    render();
  }));
  container.querySelectorAll('[data-shooting-mode]').forEach(btn=>btn.addEventListener('click', ()=>{
    const wrap = container.querySelector('.roster-table-wrap');
    state.rosterScrollLeft = wrap ? wrap.scrollLeft : 0;
    state.shootingMode = btn.dataset.shootingMode;
    render();
  }));
  container.querySelectorAll('[data-roster-mode]').forEach(btn=>btn.addEventListener('click', ()=>{
    const wrap = container.querySelector('.roster-table-wrap');
    state.rosterScrollLeft = wrap ? wrap.scrollLeft : 0;
    state.rosterMode = btn.dataset.rosterMode;
    state.rosterSortMain = {
      key: state.rosterMode === 'per40' ? 'pts40' : 'ppg',
      dir: -1,
    };
    render();
  }));
  container.querySelectorAll('[data-roster-sort]').forEach(btn=>btn.addEventListener('click', e=>{
    e.stopPropagation();
    const wrap = container.querySelector('.roster-table-wrap');
    state.rosterScrollLeft = wrap ? wrap.scrollLeft : 0;
    const key = btn.dataset.rosterSort;
    const sortKey = btn.dataset.rosterTable;
    const stateKey = sortKey === 'shooting'
      ? 'rosterSortShooting'
      : sortKey === 'efficiency'
        ? 'rosterSortEfficiency'
        : 'rosterSortMain';
    const current = state[stateKey];
    state[stateKey] = { key, dir: current.key===key ? -current.dir : (key==='name' ? 1 : -1) };
    render();
  }));
  container.querySelectorAll('.roster-table tbody tr[data-idx]').forEach(row=>row.addEventListener('click',()=>{
    const idx = +row.dataset.idx;
    const isSame = state.selectedPlayer && state.selectedPlayer.team===state.team && state.selectedPlayer.idx===idx;
    state.selectedPlayer = isSame ? null : {team:state.team, idx};
    state.playerStatKey='pts';
    state.playerGameFocus = null;
    render();
  }));
  container.querySelectorAll('.stat-tile').forEach(btn=>btn.addEventListener('click',()=>{
    state.playerStatKey = btn.dataset.stat; render();
  }));

  if(state.selectedPlayer && state.selectedPlayer.team===state.team){
    wirePlayerModal(container, team, 'selectedPlayer', state.selectedPlayer.idx);
  }
}

function wireRosterCards(container){
  const team = analysisTeam(getTeamData(state.team, state.season));
  container.querySelectorAll('[data-roster-card]').forEach(card=>card.addEventListener('click', ()=>{
    state.rosterCardPlayer = { team: state.team, idx: Number(card.dataset.rosterCard) };
    state.playerStatKey = 'pts';
    state.playerGameFocus = null;
    render();
  }));

  if(state.rosterCardPlayer && state.rosterCardPlayer.team===state.team){
    wirePlayerModal(container, team, 'rosterCardPlayer', state.rosterCardPlayer.idx);
  }
}

function wirePlayerModal(container, team, stateKey, idx){
  container.querySelectorAll(`[data-player-modal-close="${stateKey}"]`).forEach(backdrop=>backdrop.addEventListener('click', e=>{
    if(e.target.closest('[data-player-modal-shell]') && !e.target.matches(`[data-player-modal-button="${stateKey}"]`)) return;
    state[stateKey] = null;
    render();
  }));
  container.querySelector(`[data-player-modal-button="${stateKey}"]`)?.addEventListener('click', ()=>{
    state[stateKey] = null;
    state.playerGameFocus = null;
    render();
  });
  container.querySelector(`[data-player-picker="${stateKey}"]`)?.addEventListener('change', e=>{
    state[stateKey] = { team: state.team, idx: Number(e.target.value) };
    state.playerGameFocus = null;
    render();
  });
  container.querySelector(`[data-player-trend-window="${stateKey}"]`)?.addEventListener('change', e=>{
    state.playerTrendWindow = e.target.value;
    state.playerGameFocus = null;
    render();
  });
  container.querySelector('[data-clear-player-game]')?.addEventListener('click', ()=>{
    state.playerGameFocus = null;
    render();
  });
  container.querySelectorAll('.stat-tile').forEach(btn=>btn.addEventListener('click', ()=>{
    state.playerStatKey = btn.dataset.stat;
    render();
  }));

  const p = team.players[idx];
  const pg = playerPerGame(p);
  const trendGames = playerTrendGames(team, p);
  const activeGame = state.playerGameFocus && state.playerGameFocus.team===state.team && state.playerGameFocus.idx===idx
    ? trendGames.find(game => game.gameId === state.playerGameFocus.gameId) || null
    : null;
  const defs = activeGame ? playerGameStatDefs(activeGame) : playerStatDefs(team, p, pg);
  const active = defs.find(d=>d.key===state.playerStatKey) || defs[0];
  const series = playerTrendSeries(team, p, active, trendGames);
  wireStatTrendChart(container, series, active, trendGames, game=>{
    const isSame = state.playerGameFocus && state.playerGameFocus.team===state.team && state.playerGameFocus.idx===idx && state.playerGameFocus.gameId===game.gameId;
    state.playerGameFocus = isSame ? null : { team: state.team, idx, gameId: game.gameId };
    render();
  });
  wireShotDistributionChart(container);
}


/* ============================= VIEW: COMPARE PLAYERS ============================= */
/* Shared "vs" row renderer for the Compare Players / Compare Teams pages:
   one row per stat, value+bar for each side, colored by --series-a/-b,
   with the higher (or lower, if lowerBetter) value highlighted. `min`
   lets a stat's bar scale start below zero (e.g. Plus/Minus). */
function diffRowsHtml(stats, obj1, obj2){
  return stats.map(s=>{
    const v1=obj1[s.key], v2=obj2[s.key];
    const aBetter = s.lowerBetter ? v1<v2 : v1>v2;
    const bBetter = s.lowerBetter ? v2<v1 : v2>v1;
    const lo = s.min||0;
    const w1 = Math.max(0, Math.min(100, (v1-lo)/(s.max-lo)*100));
    const w2 = Math.max(0, Math.min(100, (v2-lo)/(s.max-lo)*100));
    return `<div class="diffrow ${aBetter?'a-wins':''} ${bBetter?'b-wins':''}">
      <div class="stat-label has-tip" data-tip="${s.desc||''}">${s.label}</div>
      <div class="diff-bar-row">
        <div class="bar-track"><div class="bar-fill a" style="width:${w1}%"></div></div>
        <div class="diffval a">${s.fmt(v1)}</div>
      </div>
      <div class="diff-bar-row">
        <div class="bar-track"><div class="bar-fill b" style="width:${w2}%"></div></div>
        <div class="diffval b">${s.fmt(v2)}</div>
      </div>
    </div>`;
  }).join('');
}

/* Hover a stat's abbreviation to see what it stands for + what it measures,
   via data-tip set by diffRowsHtml from each stat def's `desc`. */
function wireStatTooltips(container){
  container.querySelectorAll('.has-tip[data-tip]').forEach(el=>{
    if(!el.dataset.tip) return;
    el.addEventListener('mouseenter', ()=>{
      const tooltip = document.getElementById('tooltip');
      const rect = el.getBoundingClientRect();
      const halfWidth = 115, margin = 8; // matches .tooltip.wide's max-width:220px
      const left = Math.max(halfWidth+margin, Math.min(window.innerWidth-halfWidth-margin, rect.left+rect.width/2));
      tooltip.innerHTML = `<div>${el.dataset.tip}</div>`;
      tooltip.classList.add('wide');
      tooltip.style.transform = 'translate(-50%,-115%)';
      tooltip.style.left = (left + window.scrollX) + 'px';
      tooltip.style.top = (rect.top + window.scrollY) + 'px';
      tooltip.classList.add('show');
    });
    el.addEventListener('mouseleave', ()=>{
      document.getElementById('tooltip').classList.remove('show', 'wide');
    });
  });
}

const CP_STATS = [
  {key:'ppg', label:'PPG', desc:'Points Per Game — average points scored per game.', fmt:fmt1, max:30},
  {key:'rpg', label:'RPG', desc:'Rebounds Per Game — average total rebounds per game.', fmt:fmt1, max:14},
  {key:'apg', label:'APG', desc:'Assists Per Game — average assists per game.', fmt:fmt1, max:9},
  {key:'stlpg', label:'STL', desc:'Steals Per Game — average steals per game.', fmt:fmt1, max:3.5},
  {key:'blkpg', label:'BLK', desc:'Blocks Per Game — average blocks per game.', fmt:fmt1, max:2.5},
  {key:'topg', label:'TO', desc:'Turnovers Per Game — average turnovers committed per game (lower is better).', fmt:fmt1, max:4.5, lowerBetter:true},
  {key:'efgPct', label:'eFG%', desc:'Effective Field Goal % — field goal % adjusted to give 3-pointers extra credit for being worth more.', fmt:v=>v.toFixed(1), max:65},
  {key:'fgPct', label:'FG%', desc:'Field Goal % — percentage of field goal attempts made.', fmt:v=>v.toFixed(1), max:65},
  {key:'tpPct', label:'3P%', desc:'Three-Point % — percentage of three-point attempts made.', fmt:v=>v.toFixed(1), max:50},
  {key:'ftPct', label:'FT%', desc:'Free Throw % — percentage of free throw attempts made.', fmt:v=>v.toFixed(1), max:100},
  {key:'plusMinus', label:'+/-', desc:'Plus/Minus — point differential (points scored minus points allowed) while this player is on the floor.', fmt:v=>(v>=0?'+':'')+v.toFixed(1), min:-10, max:15},
  {key:'usg', label:'USG%', desc:'Usage Rate — estimated share of the team\'s possessions this player uses (shots, free throws, turnovers) while on the floor.', fmt:v=>v.toFixed(1), max:35},
];
function playerOptionsForTeam(teamKey, selectedIdx){
  const team = getTeamData(teamKey, state.season);
  return team.players.map((p,i)=>
    `<option value="${i}" ${i===selectedIdx?'selected':''}>#${p.num} ${p.name}</option>`
  ).join('');
}
function viewComparePlayers(){
  const team1 = getTeamData(state.p1.team, state.season), team2 = getTeamData(state.p2.team, state.season);
  if((isDynamicTeam(state.p1.team) && !team1.players.length) || (isDynamicTeam(state.p2.team) && !team2.players.length)){
    if(isDynamicTeam(state.p1.team)) ensureTeamData(state.p1.team, state.season).then(()=>render());
    if(isDynamicTeam(state.p2.team)) ensureTeamData(state.p2.team, state.season).then(()=>render());
    return loadingCard(isDynamicTeam(state.p1.team) ? state.p1.team : state.p2.team, state.season);
  }
  const p1 = team1.players[state.p1.idx], pg1 = playerPerGame(p1);
  const p2 = team2.players[state.p2.idx], pg2 = playerPerGame(p2);
  pg1.efgPct = efgPct(p1); pg1.plusMinus = seededVal(team1.short+p1.name+'pm', -8, 12); pg1.usg = usageRate(team1, p1);
  pg2.efgPct = efgPct(p2); pg2.plusMinus = seededVal(team2.short+p2.name+'pm', -8, 12); pg2.usg = usageRate(team2, p2);
  return `
    <div class="compare-picker-row">
      <div class="compare-picker-group">
        ${teamSelect('p1-team-pick', state.p1.team)}
        <select id="p1-player-pick">${playerOptionsForTeam(state.p1.team, state.p1.idx)}</select>
      </div>
      <span></span>
      <div class="compare-picker-group right">
        ${teamSelect('p2-team-pick', state.p2.team, {attrs:'class="picker-right"'})}
        <select id="p2-player-pick" class="picker-right">${playerOptionsForTeam(state.p2.team, state.p2.idx)}</select>
      </div>
    </div>
    <div class="card">
      <div class="compare-heads">
        <div class="compare-side">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-a) 22%, var(--surface-3));color:var(--series-a)">${avatarContent(state.p1.team, initials(p1.name))}</div>
          <div><div class="compare-name">${p1.name}</div><div class="compare-meta">#${p1.num} ${p1.pos} · ${team1.name}</div></div>
        </div>
        <div class="compare-vs">VS</div>
        <div class="compare-side right">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-b) 22%, var(--surface-3));color:var(--series-b)">${avatarContent(state.p2.team, initials(p2.name))}</div>
          <div><div class="compare-name">${p2.name}</div><div class="compare-meta">#${p2.num} ${p2.pos} · ${team2.name}</div></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><h3>Per-game averages</h3>
        <div class="legend">
          <span class="legend-item"><span class="swatch" style="background:var(--series-a)"></span>${p1.name.split(' ').slice(-1)}</span>
          <span class="legend-item"><span class="swatch" style="background:var(--series-b)"></span>${p2.name.split(' ').slice(-1)}</span>
        </div>
      </div>
      ${diffRowsHtml(CP_STATS, pg1, pg2)}
    </div>
  `;
}
function wireComparePlayers(container){
  const p1Team = container.querySelector('#p1-team-pick'), p1Player = container.querySelector('#p1-player-pick');
  const p2Team = container.querySelector('#p2-team-pick'), p2Player = container.querySelector('#p2-player-pick');
  if(!p1Team || !p1Player || !p2Team || !p2Player) return; // view rendered a loadingCard() while dynamic team data fetches — no pickers to wire yet
  p1Team.addEventListener('change', e=>{ state.p1={team:e.target.value, idx:0}; render(); });
  p1Player.addEventListener('change', e=>{ state.p1={team:state.p1.team, idx:+e.target.value}; render(); });
  p2Team.addEventListener('change', e=>{ state.p2={team:e.target.value, idx:0}; render(); });
  p2Player.addEventListener('change', e=>{ state.p2={team:state.p2.team, idx:+e.target.value}; render(); });
  wireStatTooltips(container);
}

/* ============================= VIEW: COMPARE TEAMS ============================= */
const CT_SEASON_STATS = [
  {key:'ppg', label:'PPG', desc:'Points Per Game — average points scored per game.', fmt:fmt1, max:90},
  {key:'oppPpg', label:'Opp PPG', desc:'Opponent Points Per Game — average points allowed per game (lower is better).', fmt:fmt1, max:90, lowerBetter:true},
  {key:'ortg', label:'ORTG', desc:'Offensive Rating — estimated points produced per 100 possessions.', fmt:fmt1, max:130},
  {key:'drtg', label:'DRTG', desc:'Defensive Rating — estimated points allowed per 100 possessions (lower is better).', fmt:fmt1, max:130, lowerBetter:true},
  {key:'rpg', label:'RPG', desc:'Rebounds Per Game — average total rebounds per game.', fmt:fmt1, max:50},
  {key:'apg', label:'APG', desc:'Assists Per Game — average assists per game.', fmt:fmt1, max:25},
  {key:'topg', label:'TOPG', desc:'Turnovers Per Game — average turnovers committed per game (lower is better).', fmt:fmt1, max:20, lowerBetter:true},
  {key:'poss', label:'POSS', desc:'Possessions — estimated number of possessions per game; a measure of pace.', fmt:fmt1, max:80},
  {key:'ppp', label:'PPP', desc:'Points Per Possession — scoring efficiency: points scored per possession used.', fmt:v=>v.toFixed(2), max:1.3},
  {key:'tovPct', label:'TOV%', desc:'Turnover % — estimated turnovers per 100 possessions (lower is better).', fmt:v=>v.toFixed(1), max:30, lowerBetter:true},
  {key:'astPct', label:'AST%', desc:'Assist % — share of made field goals that were set up by an assist.', fmt:v=>v.toFixed(1), max:75},
  {key:'plusMinus', label:'+/-', desc:'Plus/Minus — average point differential (points scored minus points allowed) per game.', fmt:v=>(v>=0?'+':'')+v.toFixed(1), min:-20, max:20},
];
const CT_SHOOTING_STATS = [
  {key:'fgPct', label:'FG%', desc:'Field Goal % — percentage of field goal attempts made.', fmt:v=>v.toFixed(1), max:65},
  {key:'tpPct', label:'3P%', desc:'Three-Point % — percentage of three-point attempts made.', fmt:v=>v.toFixed(1), max:50},
  {key:'ftPct', label:'FT%', desc:'Free Throw % — percentage of free throw attempts made.', fmt:v=>v.toFixed(1), max:100},
  {key:'tsPct', label:'TS%', desc:'True Shooting % — overall shooting efficiency, accounting for 2s, 3s, and free throws together.', fmt:v=>v.toFixed(1), max:70},
];
const CT_DEFENSE_STATS = [
  {key:'drebPct', label:'DREB%', desc:'Defensive Rebound % — share of available defensive rebounds this team grabbed.', fmt:v=>v.toFixed(1), max:100},
  {key:'orebPct', label:'OREB%', desc:'Offensive Rebound % — share of available offensive rebounds this team grabbed.', fmt:v=>v.toFixed(1), max:100},
  {key:'stlpg', label:'STL', desc:'Steals Per Game — average steals forced per game.', fmt:fmt1, max:12},
  {key:'blkpg', label:'BLK', desc:'Blocks Per Game — average shots blocked per game.', fmt:fmt1, max:8},
  {key:'oppFgPct', label:'Opp FG%', desc:'Opponent Field Goal % — field goal % allowed to opponents (lower is better).', fmt:v=>v.toFixed(1), max:60, lowerBetter:true},
  {key:'forcedTovPct', label:'Forced TOV%', desc:'Forced Turnover % — share of opponent possessions that end in a turnover.', fmt:v=>v.toFixed(1), max:30},
];

function ctLegend(t1, t2){
  return `<div class="legend">
    <span class="legend-item"><span class="swatch" style="background:var(--series-a)"></span>${t1.short}</span>
    <span class="legend-item"><span class="swatch" style="background:var(--series-b)"></span>${t2.short}</span>
  </div>`;
}

const CT_SECTIONS = [
  {id:'overview', label:'Overview'},
  {id:'offense', label:'Offense'},
  {id:'defense', label:'Defense'},
];

function viewCompareTeams(){
  const t1 = getTeamData(state.t1, state.season), t2 = getTeamData(state.t2, state.season);
  if((isDynamicTeam(state.t1) && !t1.players.length) || (isDynamicTeam(state.t2) && !t2.players.length)){
    if(isDynamicTeam(state.t1)) ensureTeamData(state.t1, state.season).then(()=>render());
    if(isDynamicTeam(state.t2)) ensureTeamData(state.t2, state.season).then(()=>render());
    return loadingCard(isDynamicTeam(state.t1) ? state.t1 : state.t2, state.season);
  }
  const s1 = teamAdvancedStats(t1), s2 = teamAdvancedStats(t2);
  const section = state.compareTeamsSection;
  const sectionHtml = section==='offense'
    ? `<div class="card">
        <div class="card-title"><h3>Shooting splits</h3>${ctLegend(t1,t2)}</div>
        ${diffRowsHtml(CT_SHOOTING_STATS, s1, s2)}
      </div>`
    : section==='defense'
    ? `<div class="card">
        <div class="card-title"><h3>Defensive breakdown</h3>${ctLegend(t1,t2)}</div>
        ${diffRowsHtml(CT_DEFENSE_STATS, s1, s2)}
      </div>`
    : `<div class="card">
        <div class="card-title"><h3>Season averages</h3>${ctLegend(t1,t2)}</div>
        ${diffRowsHtml(CT_SEASON_STATS, s1, s2)}
      </div>`;
  return `
    <div class="compare-picker-row">
      ${teamSelect('t1-pick', state.t1, {mascot:true})}
      <span></span>
      ${teamSelect('t2-pick', state.t2, {mascot:true, attrs:'class="picker-right"'})}
    </div>
    <div class="card">
      <div class="compare-heads">
        <div class="compare-side">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-a) 22%, var(--surface-3));color:var(--series-a);font-size:11px;">${avatarContent(state.t1, t1.short)}</div>
          <div><div class="compare-name">${t1.name}</div><div class="compare-meta">${s1.record.w}-${s1.record.l} · ${t1.mascot}</div></div>
        </div>
        <div class="compare-vs">VS</div>
        <div class="compare-side right">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-b) 22%, var(--surface-3));color:var(--series-b);font-size:11px;">${avatarContent(state.t2, t2.short)}</div>
          <div><div class="compare-name">${t2.name}</div><div class="compare-meta">${s2.record.w}-${s2.record.l} · ${t2.mascot}</div></div>
        </div>
      </div>
    </div>
    <div class="team-section-tabs" role="tablist" aria-label="Compare teams sections">
      ${CT_SECTIONS.map(sec=>`<button class="team-section-tab ${section===sec.id?'active':''}" data-ct-section="${sec.id}" role="tab" aria-selected="${section===sec.id}">${sec.label}</button>`).join('')}
    </div>
    ${sectionHtml}
  `;
}
function wireCompareTeams(container){
  const t1 = container.querySelector('#t1-pick'), t2 = container.querySelector('#t2-pick');
  if(!t1 || !t2) return; // view rendered a loadingCard() while dynamic team data fetches — no pickers to wire yet
  t1.addEventListener('change', e=>{ state.t1=e.target.value; state.season = preferredSeasonForTeam(state.t1, state.season); render(); });
  t2.addEventListener('change', e=>{ state.t2=e.target.value; state.season = preferredSeasonForTeam(state.t2, state.season); render(); });
  container.querySelectorAll('[data-ct-section]').forEach(btn=>btn.addEventListener('click', ()=>{
    state.compareTeamsSection = btn.dataset.ctSection;
    render();
  }));
  wireStatTooltips(container);
}

/* ============================= RENDER DISPATCH ============================= */
function render(){
  renderNav();
  renderTopbar();
  const root = document.getElementById('view');
  if(state.view==='overview'){
    root.innerHTML = viewOverview();
    const currentTeam = analysisTeam(getTeamData(state.team, state.season));
    if(currentTeam.games.length){
      wireTrendChart(root, currentTeam.games);
      wireQuarterChart(root, quarterAverages(currentTeam));
      wireFoulsChart(root, currentTeam.games);
    }
    wireTeamSectionTabs(root);
    wireLeaderboardScroll(root);
    wireLeaderTabs(root);
  }
  else if(state.view==='gamelog'){ root.innerHTML = viewGameLog(); wireGameLog(root); }
  else if(state.view==='roster'){
    root.innerHTML = viewRoster();
    wireTeamSectionTabs(root);
    wireRoster(root);
    const wrap = root.querySelector('.roster-table-wrap');
    if(wrap){
      requestAnimationFrame(()=>{ wrap.scrollLeft = state.rosterScrollLeft || 0; });
    }
  }
  else if(state.view==='rostercards'){
    root.innerHTML = viewRosterCards();
    wireTeamSectionTabs(root);
    wireRosterCards(root);
  }
  else if(state.view==='cplayers'){ root.innerHTML = viewComparePlayers(); wireComparePlayers(root); }
  else if(state.view==='cteams'){ root.innerHTML = viewCompareTeams(); wireCompareTeams(root); }
}

/* Sidebar collapse/expand — the sidebar shell itself is static markup
   (only #nav/#topbar/#view get rebuilt by render()), so this only needs
   to be wired up once. */
function wireSidebarToggle(){
  const app = document.querySelector('.app');
  const btn = document.getElementById('sidebar-toggle');
  btn.addEventListener('click', ()=>{
    const collapsed = app.classList.toggle('collapsed');
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    btn.title = label; btn.setAttribute('aria-label', label);
  });
}
wireSidebarToggle();
loadSeason(state.season).then(render).catch(err=>{
  console.error(err);
  document.getElementById('view').innerHTML = `<div class="card">Couldn't load season data: ${err.message}</div>`;
});
