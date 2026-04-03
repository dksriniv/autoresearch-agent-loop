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

Current optimized commit history includes:

- `baseline: slow site`
- `baseline: optimized`

## Current Performance Summary

The best measured result so far from the logged runs is:

- `mean_wall_ms`: `942.4`
- `p50_wall_ms`: `992.8`
- `p95_wall_ms`: `993.7`

Compared to baseline:

- mean improved from `1116.5` to `942.4`
- p95 improved from `1596.6` to `993.7`

The page is now much more stable across runs, especially on the high tail.

## Important Observation

At the end of the current optimization loop, the remaining wall time appears to be influenced heavily by the benchmark harness waiting on `networkidle0`, not only by real page work. That means future optimization effort may be better spent on:

- refining the benchmark methodology
- separating cold-load vs repeat-view measurements
- capturing more meaningful frontend metrics such as LCP-like timings or resource timing summaries

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
