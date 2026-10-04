import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
let html = await readFile(path.join(root, "template.html"), "utf8");
const dependencies = {
  "/*__LUCIDE__*/": "lucide.min.js",
  "/*__PDFLIB__*/": "pdf-lib.min.js",
  "/*__PDFJS__*/": "pdf.min.js",
  "/*__PDFWORKER__*/": "pdf.worker.min.js",
};
for (const [token, filename] of Object.entries(dependencies)) {
  const source = await readFile(path.join(root, "vendor", filename), "utf8");
  html = html.replace(token, () => source.replace(/<\/script/gi, "<\\/script"));
}
const experience = await readFile(path.join(root, "experience.js"), "utf8");
const controller = (
  await readFile(path.join(root, "controller.js"), "utf8")
).replace("//__EXPERIENCE__", () => experience);
html = html.replace("//__CONTROLLERS__", () => controller);
const output = path.join(root, "..", "prototype.html");
await writeFile(output, html, "utf8");
console.log(
  `Generated ${output} (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB)`,
);
