"""Import season-verified women's basketball rosters from official school sites.

Usage: .venv/bin/python scripts/fetch_official_rosters.py 2026-27
Failed or wrong-season pages are reported and never replace saved rosters.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SCHOOLS = {
    'ucsd': ('UC San Diego', 'UCSD', 'Tritons', 'ucsdtritons.com'),
    'ucirvine': ('UC Irvine', 'UCI', 'Anteaters', 'ucirvinesports.com'),
    'ucsb': ('UC Santa Barbara', 'UCSB', 'Gauchos', 'ucsbgauchos.com'),
    'calpoly': ('Cal Poly', 'CP', 'Mustangs', 'gopoly.com'),
    'csulb': ('Long Beach State', 'LBSU', 'The Beach', 'longbeachstate.com'),
    'csun': ('Cal State Northridge', 'CSUN', 'Matadors', 'gomatadors.com'),
    'csuf': ('Cal State Fullerton', 'CSUF', 'Titans', 'fullertontitans.com'),
    'csub': ('Cal State Bakersfield', 'CSUB', 'Roadrunners', 'gorunners.com'),
    'ucr': ('UC Riverside', 'UCR', 'Highlanders', 'gohighlanders.com'),
    'lmu': ('Loyola Marymount', 'LMU', 'Lions', 'lmulions.com'),
    'washington': ('Washington', 'UW', 'Huskies', 'gohuskies.com'),
    'usandiego': ('San Diego', 'USD', 'Toreros', 'usdtoreros.com'),
    'portlandstate': ('Portland State', 'PSU', 'Vikings', 'goviks.com'),
    'usf': ('San Francisco', 'USF', 'Dons', 'usfdons.com'),
    'nau': ('Northern Arizona', 'NAU', 'Lumberjacks', 'nauathletics.com'),
}


def text(node, selector):
    found = node.select_one(selector)
    return ' '.join(found.stripped_strings) if found else ''


def parse_roster(html, url, season):
    soup = BeautifulSoup(html, 'html.parser')
    headings = ' '.join(n.get_text(' ', strip=True) for n in soup.select('title, h1, h2'))
    if not re.search(re.escape(season) + r"\s+Women[’']s Basketball Roster", headings, re.I):
        raise ValueError(f'Page does not identify a {season} women\'s basketball roster')
    players = []
    for node in soup.select('li.sidearm-roster-player'):
        link = node.select_one('.sidearm-roster-player-name a')
        if not link:
            continue
        image = node.select_one('.sidearm-roster-player-image img')
        positions = node.select('.sidearm-roster-player-position-long-short')
        photo = (image.get('data-src') or image.get('src') or '') if image else ''
        if any(s in photo.lower() for s in ['no_headshot', 'no-headshot', 'placeholder']):
            photo = ''
        player = {
            'name': link.get_text(' ', strip=True),
            'num': text(node, '.sidearm-roster-player-jersey-number'),
            'pos': positions[-1].get_text(' ', strip=True) if positions else text(node, '.sidearm-roster-player-position .text-bold'),
            'height': text(node, '.sidearm-roster-player-height'),
            'classYear': text(node, '.sidearm-roster-player-academic-year'),
            'hometown': text(node, '.sidearm-roster-player-hometown'),
            'highSchool': text(node, '.sidearm-roster-player-highschool'),
            'previousSchool': text(node, '.sidearm-roster-player-previous-school'),
            'bioUrl': urljoin(url, link['href']),
            'headshot': urljoin(url, photo) if photo else '',
        }
        players.append(player)
    if not players:
        for node in soup.select('[data-test-id="roster-view-type-list__list-item"]'):
            link = node.select_one('[data-test-id="s-person-details__personal-single-line-person-link"]')
            if not link:
                continue
            def field(test_id):
                element = node.select_one(f'[data-test-id="{test_id}"]')
                if not element:
                    return ''
                element = BeautifulSoup(str(element), 'html.parser')
                for label in element.select('.sr-only'):
                    label.decompose()
                value = element.get_text(' ', strip=True)
                return re.sub(r'^Previous School:\s*', '', value)
            image = node.select_one('img')
            players.append({
                'name': link.get_text(' ', strip=True),
                'num': text(node, '.s-stamp__text').replace('Jersey Number', '').strip(),
                'pos': field('s-person-details__bio-stats-person-position-short'),
                'height': field('s-person-details__bio-stats-person-season'),
                'classYear': field('s-person-details__bio-stats-person-title'),
                'hometown': field('s-person-card-list__content-location-person-hometown'),
                'highSchool': field('s-person-card-list__content-location-person-high-school'),
                'previousSchool': field('s-person-card-list__content-location-person-previous-school'),
                'bioUrl': urljoin(url, link['href']),
                'headshot': urljoin(url, image['src']) if image and image.get('src') else '',
            })
    if not 5 <= len(players) <= 25:
        raise ValueError(f'Expected 5–25 players; parsed {len(players)} (unsupported layout or incomplete page)')
    names = [p['name'].casefold() for p in players]
    if len(set(names)) != len(names):
        raise ValueError('Duplicate player names; review page before importing')
    return players


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('season')
    parser.add_argument('--teams', default=','.join(SCHOOLS))
    args = parser.parse_args()
    if not re.fullmatch(r'20\d{2}-\d{2}', args.season):
        parser.error('Season must look like 2026-27')
    path = ROOT / 'data' / f'rosters-{args.season}.json'
    saved = json.loads(path.read_text()) if path.exists() else {'season': args.season, 'teams': {}}
    failures = []
    for key in args.teams.split(','):
        name, short, mascot, domain = SCHOOLS[key]
        url = f'https://{domain}/sports/womens-basketball/roster'
        try:
            response = requests.get(url, timeout=35, headers={'User-Agent': 'Mozilla/5.0'})
            response.raise_for_status()
            players = parse_roster(response.text, response.url, args.season)
            saved['teams'][key] = {
                'name': name, 'short': short, 'mascot': mascot, 'sourceUrl': response.url,
                'season': args.season, 'retrievedAt': datetime.now(timezone.utc).isoformat(),
                'players': players,
            }
            print(f'{key}: {len(players)} players', flush=True)
        except (requests.RequestException, ValueError) as exc:
            failures.append(key)
            print(f'{key}: NEEDS REVIEW — {exc}', flush=True)
        time.sleep(1)
    saved['teams'] = {key: saved['teams'][key] for key in SCHOOLS if key in saved['teams']}
    path.write_text(json.dumps(saved, indent=2, ensure_ascii=False) + '\n')
    print(f'Saved {len(saved["teams"])} verified rosters to {path}')
    if failures:
        print('Not imported: ' + ', '.join(failures))


if __name__ == '__main__':
    main()
