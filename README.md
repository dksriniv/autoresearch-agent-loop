# autoresearch website

This directory contains a small Express-based static website and a local benchmarking harness for measuring page-load performance with Puppeteer.

The site was built as a simple portfolio-style landing page with:

- a sticky navigation bar
- a large hero section
- an About section with profile photo and paragraph
- a Projects section with 4 image cards
- static styling served from Express

## Project Structure

- `server.js`
  Express server that serves the static site from `public/`.
- `public/index.html`
  Main page markup.
- `public/styles.css`
  Site styling.
- `public/images/`
  Local image assets originally sourced from `picsum.photos`.
- `benchmark.mjs`
  Puppeteer-based benchmark runner that starts the local server, opens the page, and reports timing metrics.
- `program.md`
  Autonomous optimization workflow modeled after Karpathy's `autoresearch` project, adapted for web performance iteration.
- `results.tsv`
  Log of baseline and experiment runs.

## What Was Built

The first version of the website was created under a `website/` folder as an isolated Node app using:

- `express` for the server
- plain static HTML and CSS for the frontend
- real photos from `picsum.photos`

After initial placement inside `/opt/projects/autoresearch/original/website`, the app was moved to:

`/opt/projects/autoresearch/website`

## Benchmarking Setup

To measure page-load performance, a `benchmark.mjs` script was added. It:

1. starts the local Express server on port `3000`
2. launches Puppeteer
3. loads the home page repeatedly
4. records per-run metrics such as:
   - HTTP status
   - wall time
   - DOM content loaded timing
   - load event timing
   - content checks for hero and project cards
5. prints a JSON summary at the end

Typical usage:

```sh
npm run benchmark
```

Optional environment variables:

```sh
BENCHMARK_RUNS=10 npm run benchmark
BENCHMARK_URL=http://127.0.0.1:3000 npm run benchmark
```

Note: in this environment, Puppeteer required running outside the sandbox to launch Chromium successfully.

## Optimization Workflow

A `program.md` file was created using the structure and spirit of Karpathy's `autoresearch` `program.md`, but adapted for website speed work.

The workflow was:

1. read the in-scope files
2. run a baseline benchmark
3. create `results.tsv`
4. make one focused optimization at a time
5. rerun the benchmark after each change
6. keep, revert, or replace changes based on measured results

## Baseline Benchmark

Initial baseline recorded in `results.tsv`:

- `mean_wall_ms`: `1116.5`
- `p50_wall_ms`: `997.3`
- `p95_wall_ms`: `1596.6`

This first version depended on:

- external Google Fonts
- external remote images from `picsum.photos`

Those external requests were the clearest initial bottlenecks.

## Optimization Attempts So Far

The following iterations were completed and logged in `results.tsv`.

### 1. Remove external Google Fonts and lazy-load noncritical images

Changes:

- removed Google Fonts stylesheet and preconnect tags
- switched to local/system font stacks
- added image dimensions
- set noncritical images to `loading="lazy"` and `decoding="async"`

Result:

- `mean_wall_ms`: `948.2`
- `p50_wall_ms`: `996.5`
- `p95_wall_ms`: `1140.5`

This was the largest early improvement and removed the long first-load tail.

### 2. Localize Picsum images

Changes:

- downloaded the Picsum images into `public/images/`
- updated HTML to use local static image paths instead of remote URLs

Result:

- `mean_wall_ms`: `952.8`
- `p50_wall_ms`: `996.3`
- `p95_wall_ms`: `998.1`

This removed dependence on external image requests and stabilized repeated runs.

### 3. Recompress local images

Changes:

- resized and recompressed local JPEGs using `sips`
- reduced image byte size to better match rendered dimensions

Result:

- `mean_wall_ms`: `949.9`
- `p50_wall_ms`: `996.6`
- `p95_wall_ms`: `997.6`

This helped payload size but only marginally affected the benchmark summary.

### 4. Reduce paint cost

Changes:

- removed sticky nav blur effect
- added `content-visibility: auto` to below-the-fold sections

Result:

- `mean_wall_ms`: `949.0`
- `p50_wall_ms`: `995.7`
- `p95_wall_ms`: `996.0`

This was a small but valid improvement.

### 5. Add static cache headers

Changes:

- disabled ETags in Express static serving
- added cache directives for static assets

Result:

- `mean_wall_ms`: `942.4`
- `p50_wall_ms`: `992.8`
- `p95_wall_ms`: `993.7`

This was the best measured result in the experiment sequence.

### 6. Preload hero image

Changes:

- added a preload hint for the hero image

Result:

- `mean_wall_ms`: `944.7`
- `p50_wall_ms`: `991.3`
- `p95_wall_ms`: `994.5`

This did not improve the page enough to justify keeping it, so it was reverted.

### 7. Cache HTML for short repeat views

Changes:

- changed the document cache header to allow short-lived caching

Result:

- `mean_wall_ms`: `942.6`
- `p50_wall_ms`: `990.8`
- `p95_wall_ms`: `994.0`

This kept performance roughly flat with a slightly improved median.

## Current State

The current site now:

- uses local static images instead of remote image URLs
- uses system fonts instead of external Google Fonts
- lazy-loads noncritical images
- has cheaper rendering for below-the-fold sections
- serves static assets with improved cache headers
- includes a reproducible benchmark harness and experiment log

## Apr 18 2026 Run Notes

Work continued from `/opt/projects/autoresearch/website` on branch:

- `autoresearch/apr18-speed`

The first step was to re-establish a baseline on the current `main` implementation. That produced:

- `mean_wall_ms`: `947.2`
- `p50_wall_ms`: `994.4`
- `p95_wall_ms`: `995.8`

Two quick app-level attempts were then tested and reverted:

1. Right-size and recompress the eager hero image
2. Add an inline favicon to remove the extra `/favicon.ico` request

Neither improved the original benchmark enough to keep.

## Benchmark Harness Correction

During the Apr 18 run, the benchmark was inspected more closely. A timed Puppeteer trace showed:

- all actual page requests were completing in roughly `48 ms`
- the reported `wall` metric was still landing near `990 ms`
- the gap came from `waitUntil: "networkidle0"` rather than meaningful page work

Because of that, `benchmark.mjs` was updated to:

- measure primary `wallTimeMs` using `waitUntil: "load"`
- keep a separate `networkIdleTimeMs` metric for diagnostics
- continue reporting the existing navigation timings and content checks

This was logged in `results.tsv` as:

- `apr18-speed / 3 / refine_benchmark_to_measure_load_wall / ok`

## Current Active Baseline

After correcting the benchmark, a new load-based baseline was recorded.

5-run calibrated baseline:

- `mean_wall_ms`: `36.4`
- `p50_wall_ms`: `36.9`
- `p95_wall_ms`: `37.9`

Then a 3-run calibration was recorded for the active short-loop workflow:

- `mean_wall_ms`: `35.8`
- `p50_wall_ms`: `35.3`
- `p95_wall_ms`: `37.3`
- `mean_network_idle_ms`: `538.0`

The key takeaway is that actual page load completion is already fast locally, while the remaining `network idle` tail is a separate measurement artifact or secondary concern rather than the main user-facing bottleneck.

## Apr 18 Experiments Logged

These additional rows were added to `results.tsv` during the Apr 18 run:

- `baseline current_main_baseline` -> `947.2 / 994.4 / 995.8`
- `1 right_size_and_recompress_hero_image` -> reverted
- `2 inline_favicon_to_remove_extra_request` -> reverted
- `3 refine_benchmark_to_measure_load_wall` -> kept
- `4 inline_stylesheet_into_document` -> reverted
- `baseline-3run current_load_harness_baseline` -> `35.8 / 35.3 / 37.3`
- `5 inline_favicon_again_on_load_harness` -> reverted

## Current Performance Summary

There are now two meaningful benchmark contexts in this repo:

1. Historical `networkidle0`-style results in the `~942-947 ms` range, useful for comparing against the earlier Apr 3 run log.
2. Corrected load-based results in the `35-38 ms` range, which are the active baseline for future optimization attempts.

For future work, the corrected load-based benchmark should be treated as the primary decision metric.

## Important Observation

The main finding from the Apr 18 run is that benchmark methodology mattered more than additional page tweaks. The next meaningful improvements are more likely to come from:

- separating cold-load and repeat-view scenarios explicitly
- tracking resource-level timings or transfer summaries per run
- increasing run counts when comparing sub-5 ms changes
- only keeping app changes that beat the corrected load-based baseline, not the old inflated wall metric

## Git Notes

A local git repository was initialized in this directory and the following commits were created:

- `aa42ef1` `baseline: slow site`
- `386cac0` `baseline: optimized`

At the time this README was written, no git remote had been configured yet.

## Next Useful Steps

- create a GitHub repository and add a remote
- push the current repo
- continue experiments with improved benchmark methodology
- consider adding explicit metrics for:
  - cold cache runs
  - repeat cache runs
  - asset transfer sizes
  - screenshot-based regression checks
