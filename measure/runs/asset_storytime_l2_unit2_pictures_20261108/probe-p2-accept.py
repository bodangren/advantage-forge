#!/usr/bin/env python3
"""Probe: unit 2 book spend, guard diff, costs row times, git PNG/JPG."""
import csv, glob, os, subprocess, sys

ROOT = '/home/daniebo/Desktop/advantage-forge'
files = sorted(glob.glob(ROOT + '/out/storytime/l2/unit2/w*/muse/costs.tsv')
               + glob.glob(ROOT + '/out/storytime/l2/unit2/w*/muse/elements/costs.tsv'))
tot = 0.0
rows = 0
maxcost = 0.0
maxrow = ''
maxtime = ''
mintime = ''
kindsum = {}
for f in files:
    with open(f) as fh:
        for r in csv.DictReader(fh, delimiter='\t'):
            c = float(r['usage_cost'])
            tot += c
            rows += 1
            maxcost = max(maxcost, c)
            if c == maxcost:
                maxrow = r['time'] + ' ' + r['row']
            k = r['kind']
            kindsum[k] = kindsum.get(k, 0, ) if False else kindsum.get(k, 0) + 1
            t = r['time']
            maxtime = max(maxtime, t)
            mintime = t if not mintime else min(mintime, t)
print('files', len(files), 'rows', rows, 'sum %.2f' % tot, 'max %.4f' % maxcost, maxrow)
print('kinds', kindsum)
print('time range', mintime, '->', maxtime)
fw = glob.glob(ROOT + '/out/storytime/l2/unit2/family-words/**/costs.tsv', recursive=True)
print('family-words costs.tsv:', fw)
