import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function loadExportConstObject(tsFilePath, exportName) {
  const source = fs.readFileSync(tsFilePath, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: path.basename(tsFilePath),
  }).outputText;

  const sandbox = { exports: {}, module: { exports: {} }, require };
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { filename: tsFilePath });
  const mod = sandbox.module.exports;
  const exp = sandbox.exports;

  const candidate = (mod && mod[exportName]) ?? (exp && exp[exportName]);
  if (!candidate || typeof candidate !== "object") {
    throw new Error(
      `Could not load export '${exportName}' from ${tsFilePath}. Got: ${typeof candidate}`,
    );
  }
  return candidate;
}

function listLeafPaths(obj, prefix = "") {
  const out = new Set();
  if (!obj || typeof obj !== "object") return out;

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Include object nodes too (helps detect missing whole sections)
      out.add(next);
      for (const p of listLeafPaths(value, next)) out.add(p);
    } else {
      out.add(next);
    }
  }

  return out;
}

function diffKeys(base, target) {
  const missingInTarget = [];
  for (const k of base) {
    if (!target.has(k)) missingInTarget.push(k);
  }
  missingInTarget.sort();
  return missingInTarget;
}

const localesDir = path.resolve("src/src/locales");
const enPath = path.join(localesDir, "en.ts");
const hePath = path.join(localesDir, "he.ts");

const en = loadExportConstObject(enPath, "en");
const he = loadExportConstObject(hePath, "he");

const enKeys = listLeafPaths(en);
const heKeys = listLeafPaths(he);

const missingInHe = diffKeys(enKeys, heKeys);
const missingInEn = diffKeys(heKeys, enKeys);

console.log(`en keys: ${enKeys.size}`);
console.log(`he keys: ${heKeys.size}`);
console.log(`Missing in he: ${missingInHe.length}`);
if (missingInHe.length) console.log(missingInHe.join("\n"));
console.log("\n---\n");
console.log(`Missing in en: ${missingInEn.length}`);
if (missingInEn.length) console.log(missingInEn.join("\n"));
