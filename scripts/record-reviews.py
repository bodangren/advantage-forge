#!/usr/bin/env python3
"""Record the ratings of an independent reviewer in docs/character-reviews.json.

Usage: python3 scripts/record-reviews.py <reviews.json> [--group Wildlife] [--reviewer independent-agent]

The input is the reviewer's JSON (see measure/tracks/asset_review_audit_20261005/reviewer-brief.md):
{name: {overall, scores[11], summary, strengths, issues, next}}. Each entry replaces the old one
for that name and records who rated it.
"""
import argparse
import datetime
import json

KEYS = ['mockup', 'silhouette', 'proportion', 'shape', 'color', 'materials', 'detail', 'technical', 'gameReady', 'sprite', 'motion']
PATH = 'docs/character-reviews.json'


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('reviews')
    ap.add_argument('--group', default=None)
    ap.add_argument('--reviewer', default='independent-agent')
    a = ap.parse_args()
    d = json.load(open(PATH))
    new = json.load(open(a.reviews))
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    for name, r in new.items():
        old = d.get(name, {})
        d[name] = {
            'overall': r['overall'],
            'group': a.group or old.get('group', 'Wildlife'),
            'scores': dict(zip(KEYS, r['scores'])),
            'summary': r['summary'],
            'strengths': r['strengths'],
            'issues': r['issues'],
            'next': r['next'],
            'reviewer': a.reviewer,
            'reviewedAt': now,
        }
    with open(PATH, 'w') as f:
        json.dump(d, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print('recorded', ', '.join(f"{k} {v['overall']}" for k, v in new.items()))


if __name__ == '__main__':
    main()
