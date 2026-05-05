import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:5179/";
const output = process.argv[3] || "docs/smoke-preview.png";
const width = Number(process.argv[4] || 1280);
const height = Number(process.argv[5] || 720);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(4200);
await page.screenshot({ path: output });

const result = await page.evaluate(() => {
  const probe = window.__clothDemoProbe || null;
  const canvas = document.querySelector("#cloth-canvas");
  const rect = canvas.getBoundingClientRect();
  return {
    title: document.title,
    probe,
    rect: { width: rect.width, height: rect.height },
  };
});

await browser.close();

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors, result }, null, 2));
  process.exit(1);
}

if (!result.probe || result.probe.particleCount < 1000 || !result.probe.hasTexture) {
  console.error(JSON.stringify({ ok: false, reason: "Probe did not report a rendered cloth scene.", result }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, result, output }, null, 2));
