// Builds dist/linkwash-<version>.zip with only the files Chrome needs.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const { version } = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
fs.mkdirSync("dist", { recursive: true });
const out = `dist/linkwash-${version}.zip`;
fs.rmSync(out, { force: true });
const icons = ["16", "32", "48", "128"].map((s) => `icons/${s}.png`);
const src = fs.readdirSync("src").map((f) => `src/${f}`);
execFileSync("zip", ["-q", "-X", out, "manifest.json", "LICENSE", ...icons, ...src], { stdio: "inherit" });
console.log(out);
