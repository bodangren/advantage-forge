# Specification: the game page dev server serves the test story fixtures

## Finding (2026-10-21)

The advantage-pr session asked to check its method for wave 3 of the What's New series (28 game
cards) before it records. The method opens the Forge game page with `?qc=1&stories=fixtures`
(`ef5b8cb7`, 2026-10-06, track `apk_pack_release_20261006`), so that the games use the Primary
story fixture `pip-the-curious-puppy-feels`.

That mode did not work in a browser. With `?stories=fixtures`, the host reads
`<base>tests/fixtures/stories/index.json`. The game page dev server (`vite.demo.config.ts`) has the
root `demo/`, so it answered that path with the page HTML (821 bytes, `text/html`), and the story
list did not load. Only unit tests checked `ef5b8cb7`. The default Vite config (`pnpm dev`) is the
asset viewer: it serves `tests/` but not the game page packs in `demo/public/`.

## Rule

The dev server of `vite.demo.config.ts` serves `tests/fixtures/` at `/tests/fixtures/`. A path
outside that folder, or a missing file, goes to the next handler. The build (`dist-demo/`) does not
carry the fixtures, as before.

## Acceptance

- `/tests/fixtures/stories/index.json` and the story files answer with their content.
- In headless Chromium, `?qc=1&stories=fixtures#/play/rune-match/pip-the-curious-puppy-feels`
  loads the fixture story in 3D and 2D, with no page error.
- A game without `auto()` plays from its QC bot (`src/games/<id>/qc/bot.ts`, imported from the dev
  server) through the test hook `state()` and `dispatch()`.
