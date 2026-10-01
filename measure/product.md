# Product definition

Fantasy Asset Forge supports two connected workstreams: reusable fantasy assets and reading games that use those assets.

## Asset production

Authors describe reusable assets in TypeScript with signed distance shapes.
Forge creates textured GLBs, animation clips, color variants, and derived pixel sprites.
The production catalog defines 856 targets. The scene catalog defines 100 blueprints.
These catalogs define scope, not acceptance.

## Games

Each game uses one deterministic rules core with a three.js view and a Phaser view.
The 2D view supports older hardware. Both views use the same learning content and evidence contract.
The initial six games establish the platform. The next program ports the platform and rewrites the 23 listed legacy games.

## Users and success

Asset authors need repeatable visual review, stable source files, and usable exports.
Players need readable controls, clear feedback, and progress based on learning evidence.
Maintainers need one indexed record of scope, status, dependencies, debt, and lessons.

A delivered model, a source file, and an accepted game asset represent different states.
A local game, a tested cartridge, and a monorepo deployment also represent different states.
The plans record these states separately.

## Boundaries

This migration changes project management. It preserves the application architecture and existing paths.
The adjacent monorepo owns its implementation commits and deployment checks.
This repository records port dependencies and evidence links.
Deferred features enter bounded tracks before implementation.
