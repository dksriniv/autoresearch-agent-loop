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

## Design Guardrails

- Preserve an editorial-first above-the-fold hierarchy. The first screen should read in this order: brand/navigation, eyebrow, headline, supporting copy, primary CTA, then hero image.
- The hero is the dominant first impression, not a compact utility header. Performance changes may simplify implementation, but must not flatten the page into a generic fast-loading shell.
- Keep the current major sections and their visual pacing: hero first, then About, then Projects, then footer contact.
- Treat the hero image and supporting photography as enhancement, not structure. If media loads late or fails, the layout, copy, and CTA hierarchy must still read cleanly.
- Reserve space for key media so the page does not jump during load. Do not accept optimizations that create collapsed boxes, major layout shift, or a visibly broken composition.
- When testing an optimization, evaluate both measured speed and trust at a glance: the page should still feel intentional within the first few seconds on desktop and mobile.
- Do not "SaaS-ify" the page during optimization. Reject changes that turn it into a generic card-heavy template, a centered marketing stack, or a compact utility layout that loses the current editorial character.
- Keep the warm, restrained tone of the current implementation. Optimizations may reduce ornament and weight, but should not replace the page with generic "clean modern" defaults.

## User Journey Storyboard

| Step | User does | User feels | Plan requirement |
| --- | --- | --- | --- |
| 1 | Lands on the page | Calm confidence | The first viewport must feel composed and immediately legible, with the hero carrying the strongest visual weight. |
| 2 | Scans the hero copy and CTA | Clear orientation | The brand, value proposition, and primary action must be readable without hunting or scrolling. |
| 3 | Moves into About | Credibility | The About section should reinforce that the work is thoughtful and deliberate, not decorative filler. |
| 4 | Browses Projects | Evidence and momentum | The project grid should feel like proof of work, with all four cards readable, stable, and visually consistent. |
| 5 | Reaches the footer/contact area | Low-friction next step | Contact details should remain obvious and easy to reach without a dead-end feeling. |

## Visual Vocabulary

- Preserve the warm, neutral color direction of the current site. Avoid shifts toward cold, corporate, or default blue-purple SaaS palettes.
- Keep display typography distinct from body typography. Headlines should remain more expressive and editorial than the supporting copy.
- Preserve a restrained, calm surface treatment: soft panels, light borders, and moderate shadows used sparingly.
- Keep spacing generous enough that the page breathes. Do not compress the layout so aggressively that sections feel crowded or transactional.
- Project cards should remain image-led and readable at a glance. They are evidence of work, not decorative filler or tiny metadata boxes.
- Simplify with subtraction, not flattening. Removing visual weight is acceptable; removing the page's tone and hierarchy is not.

## Responsive And Accessibility Guardrails

- Mobile is an intentional layout, not a desktop stack accident. The hero copy must remain clearly first, with the primary CTA easy to find before the user reaches the image.
- Keep navigation links visible on mobile for this site's small information architecture. Do not replace a simple 3-link nav with a hamburger menu unless the page scope changes substantially.
- Preserve readable spacing and type scale on smaller screens. Do not trade away legibility for minor benchmark gains.
- Keep tap targets comfortably usable on touch devices, with navigation and primary actions sized and spaced for quick tapping.
- Maintain visible keyboard focus states for links and primary actions. Optimizations must not remove the user's ability to see where focus is.
- Preserve clear text contrast and readable body copy. Do not introduce lighter text, thinner weights, or low-contrast overlays just to make the page look lighter.
- Keep image aspect ratios and reserved space stable across breakpoints so media does not cause major layout shifts.
- Treat semantic HTML as a baseline, not the whole accessibility story. Any optimization that changes interaction styling must preserve keyboard and screen-reader usability.

## What Already Exists

- The current implementation already establishes the intended structure: sticky nav, editorial hero, About section, 4 image-led project cards, and footer contact.
- The current CSS already establishes the visual baseline the optimization loop should protect: warm neutral palette, expressive display type, restrained body copy, soft surfaces, and generous spacing.
- The existing mobile approach keeps navigation links visible instead of hiding them behind a menu. This is the preferred pattern for the current site scope.

## NOT In Scope

- Rebranding the site into a different visual category such as a corporate SaaS page or a dashboard product.
- Expanding the information architecture beyond the current single-page portfolio structure.
- Replacing the visible mobile navigation with a hidden-menu pattern for the current 3-link site.
- Chasing benchmark wins by removing required content, collapsing the hero composition, or stripping the page down to a generic template.

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
2. The page still contains the required sections and preserves the intended hierarchy, with an editorial-first hero and graceful media fallbacks.
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

## Design Review Completion Summary

| Area | Status |
| --- | --- |
| System Audit | No `DESIGN.md`, no `TODOS.md`, no current diff against `main`; review performed against the existing single-page site and optimization plan |
| Step 0 | Initial overall design completeness: 5/10 |
| Pass 1, Information Architecture | 4/10 -> 7/10 after preserving an editorial-first hero hierarchy |
| Pass 2, Interaction State Coverage | 3/10 -> 7/10 after requiring graceful media degradation and stable reserved space |
| Pass 3, User Journey & Emotional Arc | 4/10 -> 8/10 after adding a page-level storyboard from landing to contact |
| Pass 4, AI Slop Risk | 5/10 -> 8/10 after banning SaaS-ification and generic template drift |
| Pass 5, Design System Alignment | 4/10 -> 8/10 after documenting the current visual vocabulary directly in the plan |
| Pass 6, Responsive & Accessibility | 3/10 -> 8/10 after adding mobile hierarchy, visible mobile nav, and accessibility guardrails |
| Pass 7, Unresolved Decisions | 1 major decision resolved, 0 unresolved |
| What Already Exists | Written |
| NOT In Scope | Written, 4 items |
| Approved Mockups | None generated, designer unavailable in this environment |
| Decisions Deferred | 3 proposed `TODOS.md` items |
| Overall Design Score | 5/10 -> 8/10 |

### Deferred TODO Candidates

1. Add a lightweight visual QA checklist for each optimization attempt.
2. Add explicit image-fallback implementation guidance.
3. Create a dedicated `DESIGN.md` if the site expands beyond this single landing page.
