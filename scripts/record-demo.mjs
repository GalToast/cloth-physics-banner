import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:5179/";
const output = process.argv[3] || "docs/drag-demo.webm";
const width = 1280;
const height = 720;

await mkdir("docs/videos", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width, height },
  recordVideo: {
    dir: "docs/videos",
    size: { width, height },
  },
});

const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

await page.mouse.move(650, 360);
await page.mouse.down();
await page.mouse.move(780, 285, { steps: 18 });
await page.mouse.move(560, 430, { steps: 24 });
await page.mouse.move(715, 365, { steps: 20 });
await page.mouse.up();
await page.waitForTimeout(1400);

const video = page.video();
await page.close();

if (!video) {
  console.error("No video was recorded.");
  process.exit(1);
}

await video.saveAs(output);
await context.close();
await browser.close();
console.log(`Recorded ${output}`);
