# autoresearch website

This is an experiment to have the LLM improve a website by measuring page load times, making targeted optimizations, and validating whether each change actually helps.

## Setup

To set up a new optimization run, work with the user to:

1. **Agree on a run tag**: propose a short tag based on today's date or goal, e.g. `apr3-speed`. The branch `autoresearch/<tag>` should be fresh.
2. **Create the branch**: `git checkout -b autoresearch/<tag>` from the current branch.
3. **Read the in-scope files**: the repo is small. Read these files fully before changing anything:
   - `program.md` — operating procedure for the optimization loop.
   - `package.json` — runnable scripts and dependencies.
   - `server.js` — Express server behavior.
   - `public/index.html` — markup and asset loading behavior.
   - `public/styles.css` — rendering, layout, and style cost.
   - `benchmark.mjs` — benchmark harness and reported metrics.
4. **Verify dependencies exist**: ensure `node_modules/` is present. If not, run `npm install`.
5. **Initialize results.tsv**: create `results.tsv` with a header row if it does not exist yet. The first benchmark run establishes the baseline.
6. **Confirm the benchmark path**: the benchmark should run against the local site on port `3000` via `npm run benchmark`.
7. **Begin the loop**: once the benchmark works, the optimization cycle starts and should continue until the human stops it.

Suggested `results.tsv` header:

```tsv
run_tag	attempt	change	status	mean_wall_ms	p50_wall_ms	p95_wall_ms	notes
```

## Goal

Improve perceived and measured page load speed without breaking the site.

The target is not "change things until numbers move". The target is disciplined iteration:

- establish a baseline
- make one focused optimization at a time
- benchmark again
- keep changes that help
- revert or replace changes that do not help

The page should still look good, keep the same major sections, and remain easy to maintain.

## Constraints

- Keep the site simple. Prefer changes that reduce bytes, requests, blocking work, or layout cost.
- Do not degrade the visual quality just to game one metric.
- Do not remove required content: sticky nav, hero, About section, and 4 project cards must remain.
- Prefer real improvements over synthetic tricks.
- Keep each attempt understandable. If multiple changes are bundled together, you lose attribution.

## Optimization Loop

For each attempt:

1. **Benchmark the current state**: run `npm run benchmark` and record the summary in `results.tsv`.
2. **Inspect the bottleneck**: determine whether the likely cost comes from images, fonts, CSS, layout, render-blocking resources, or server behavior.
3. **Choose one concrete change**: examples:
   - resize or compress large images
   - lazy-load non-critical images
   - preload or remove fonts
   - reduce CSS weight or expensive effects
   - reduce server overhead
   - simplify above-the-fold markup
4. **Implement the change**: edit only what is needed.
5. **Benchmark again**: rerun `npm run benchmark` with the same conditions.
6. **Compare against baseline**: record whether the change improved mean, p50, or p95 wall time.
7. **Decide**:
   - if the change helps and the site still looks correct, keep it
   - if the change hurts or causes regressions, revert it and try another idea
8. **Log the result**: append a row to `results.tsv` with the change, status, and metrics.
9. **Continue immediately**: do not stop after one win. Look for the next bottleneck.

## What To Try

Try the obvious things first:

1. Reduce image cost in the hero and project cards.
2. Avoid loading assets before they are needed.
3. Limit render-blocking dependencies.
4. Cut unnecessary CSS or visually expensive effects.
5. Check whether the benchmark script itself should record more useful metrics.

Then try deeper changes:

1. Replace remote images with controlled local assets if network variance dominates.
2. Inline only the critical CSS needed for above-the-fold paint.
3. Adjust font strategy to reduce blocking or fallback shifts.
4. Add caching headers or static asset fingerprints if the benchmark scenario benefits.
5. Refine the benchmark to capture repeat-view behavior separately from cold loads.

## Benchmark Discipline

- Keep run conditions stable. Do not compare a 1-run sample against a 20-run sample and call it progress.
- Prefer multiple runs over single-run anecdotes.
- Record the exact change made on each attempt.
- If a benchmark crashes, log `crash` in `results.tsv` and move on after diagnosing the likely cause.
- If results are noisy, increase `BENCHMARK_RUNS` and compare medians as well as averages.

## Definition Of Success

An optimization is successful only if all of the following are true:

1. The benchmark completes successfully.
2. The page still contains the required sections and renders correctly.
3. The measured load times improve in a meaningful way.
4. The code remains clear enough for the next iteration.

## Default Operating Mode

Once the loop begins, continue autonomously:

- benchmark
- inspect
- change
- benchmark again
- log
- repeat

Do not stop to ask whether to continue after each attempt. Continue until the human interrupts the run or gives a new objective.
