#!/usr/bin/env node

// Simple website benchmark runner.
// Starts the local Express app, loads it in Puppeteer a few times, and reports timings.

import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import puppeteer from "puppeteer";

const TARGET_URL = process.env.BENCHMARK_URL || "http://127.0.0.1:3000";
const RUNS = Number.parseInt(process.env.BENCHMARK_RUNS || "5", 10);
const SERVER_STARTUP_TIMEOUT_MS = 10_000;

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, p) {
  if (values.length === 1) {
    return values[0];
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

async function waitForServer(browser, url, timeoutMs) {
  const page = await browser.newPage();
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 1_500,
      });
      if (response?.ok()) {
        await page.close();
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }

  await page.close();
  throw new Error(`Server did not become ready: ${lastError?.message || "timeout"}`);
}

async function runBenchmark() {
  const server = spawn(process.execPath, ["server.js"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PORT: "3000",
    },
  });

  let serverLogs = "";
  server.stdout.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    await waitForServer(browser, TARGET_URL, SERVER_STARTUP_TIMEOUT_MS);

    const results = [];
    for (let run = 1; run <= RUNS; run += 1) {
      const page = await browser.newPage();
      const loadStartedAt = performance.now();
      const response = await page.goto(TARGET_URL, {
        waitUntil: "load",
        timeout: 30_000,
      });
      const loadEndedAt = performance.now();
      const networkIdleStartedAt = performance.now();
      await page.waitForNetworkIdle({
        idleTime: 500,
        timeout: 30_000,
      });
      const networkIdleEndedAt = performance.now();

      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        return {
          domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null,
          loadEventMs: nav ? nav.loadEventEnd : null,
          transferSizeBytes: nav ? nav.transferSize : null,
          encodedBodySizeBytes: nav ? nav.encodedBodySize : null,
        };
      });

      const heroExists = (await page.$(".hero")) !== null;
      const projectCards = await page.$$eval(".project-card", (nodes) => nodes.length);

      const sample = {
        run,
        status: response?.status() ?? null,
        wallTimeMs: Number((loadEndedAt - loadStartedAt).toFixed(1)),
        networkIdleTimeMs: Number(
          (loadEndedAt - loadStartedAt + (networkIdleEndedAt - networkIdleStartedAt)).toFixed(1),
        ),
        domContentLoadedMs:
          metrics.domContentLoadedMs === null
            ? null
            : Number(metrics.domContentLoadedMs.toFixed(1)),
        loadEventMs:
          metrics.loadEventMs === null ? null : Number(metrics.loadEventMs.toFixed(1)),
        transferSizeBytes: metrics.transferSizeBytes,
        encodedBodySizeBytes: metrics.encodedBodySizeBytes,
        heroExists,
        projectCards,
      };

      results.push(sample);
      console.log(
        `run ${run}/${RUNS} status=${sample.status} wall=${sample.wallTimeMs}ms idle=${sample.networkIdleTimeMs}ms dcl=${sample.domContentLoadedMs}ms load=${sample.loadEventMs}ms cards=${sample.projectCards}`,
      );
      await page.close();
    }

    const wallTimes = results.map((sample) => sample.wallTimeMs);
    const networkIdleTimes = results.map((sample) => sample.networkIdleTimeMs);
    const summary = {
      url: TARGET_URL,
      runs: RUNS,
      meanWallTimeMs: Number(mean(wallTimes).toFixed(1)),
      minWallTimeMs: Math.min(...wallTimes),
      p50WallTimeMs: percentile(wallTimes, 50),
      p95WallTimeMs: percentile(wallTimes, 95),
      maxWallTimeMs: Math.max(...wallTimes),
      meanNetworkIdleTimeMs: Number(mean(networkIdleTimes).toFixed(1)),
      p50NetworkIdleTimeMs: percentile(networkIdleTimes, 50),
      p95NetworkIdleTimeMs: percentile(networkIdleTimes, 95),
    };

    console.log("");
    console.log("summary");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
    server.kill("SIGTERM");
    await delay(250);
    if (server.exitCode === null) {
      server.kill("SIGKILL");
    }
    if (serverLogs.trim()) {
      console.log("");
      console.log("server");
      console.log(serverLogs.trim());
    }
  }
}

runBenchmark().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
