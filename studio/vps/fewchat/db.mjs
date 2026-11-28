// Builds or migrates FewChat's local D1 database the same way scripts/setup.mjs does on Cloudflare.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const TRACK = "_fewchat_migrations";
const name = JSON.parse(readFileSync("fewchat.config.json", "utf8")).worker_name || "fewchat";
const w = (args) => {
  const r = spawnSync("npx", ["wrangler", "d1", "execute", name, "--local", "--persist-to", "/data", ...args], { encoding: "utf8" });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
  return r.stdout;
};
const q = (sql) => JSON.parse(w(["--json", "--command", sql]))[0].results;
const record = (ns) => `CREATE TABLE IF NOT EXISTS ${TRACK} (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);\n` +
  ns.map((n) => `INSERT OR IGNORE INTO ${TRACK} (name, applied_at) VALUES ('${n}', ${Date.now()});`).join("\n") + "\n";
const all = readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort();
const has = new Set(q(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('leads','${TRACK}')`).map((r) => r.name));
if (!has.has("leads")) {
  writeFileSync("/tmp/fresh.sql", [readFileSync("schema.sql", "utf8"), ...all.map((f) => readFileSync(`migrations/${f}`, "utf8")), record(all)].map((t) => t.trim()).join("\n\n") + "\n");
  w(["--file", "/tmp/fresh.sql", "-y"]); console.log("db: fresh install,", all.length, "migrations");
} else {
  const done = new Set(has.has(TRACK) ? q(`SELECT name FROM ${TRACK}`).map((r) => r.name) : []);
  for (const f of all.filter((f) => !done.has(f))) {
    writeFileSync("/tmp/m.sql", readFileSync(`migrations/${f}`, "utf8") + "\n\n" + record([f]));
    w(["--file", "/tmp/m.sql", "-y"]); console.log("db: applied", f);
  }
}
