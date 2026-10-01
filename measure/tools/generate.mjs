#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { facts, freshnessErrors, projectRoot, writeFacts } from './common.mjs';

function usage() {
  console.error('Usage: node measure/tools/generate.mjs [--check] [--root PATH]');
}

function argumentsFor(argv) {
  let check = false;
  let root;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--check') check = true;
    else if (argv[index] === '--root') root = argv[++index];
    else {
      usage();
      process.exitCode = 2;
      return null;
    }
  }
  return { check, root: projectRoot(root) };
}

const options = argumentsFor(process.argv.slice(2));
if (options) {
  if (options.check) {
    const errors = freshnessErrors(options.root);
    if (errors.length) {
      for (const error of errors) console.error(`error: ${error}`);
      process.exitCode = 1;
    } else {
      console.log(`Measure facts are current (${facts(options.root).size} files).`);
    }
  } else {
    mkdirSync(join(options.root, 'measure', 'generated'), { recursive: true });
    writeFacts(options.root);
    console.log(`Generated ${facts(options.root).size} Measure facts.`);
  }
}
