#!/usr/bin/env node

/**
 * Sync Magento CSV translations → frontend JSON files
 *
 * Reads ar_SA.csv and en_US.csv from the Magento project and
 * auto-generates ALL translations into the frontend JSON files
 * under the "m." namespace.
 *
 * No manual key mapping needed — every CSV entry is synced automatically.
 * When Magento adds new strings to the CSV, just re-run this script.
 *
 * Usage:
 *   npm run sync:translations              # default CSV dir: ../altalayi_API
 *   npm run sync:translations /path/to/csv # custom CSV dir
 *
 * Key format:  "m.<slug>"
 *   e.g.  "Add to Cart"  →  "m.add-to-cart"
 *         "In Stock"      →  "m.in-stock"
 *         "VAT (15%)"     →  "m.vat-15"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Config ─────────────────────────────────────────────────────────────────

// const csvDir = process.argv[2] || path.resolve(ROOT, "../altalayi_API");
const csvDir = process.argv[2] || path.resolve(ROOT, "public/csv");
const arCsvPath = path.join(csvDir, "ar_SA.csv");
const enCsvPath = path.join(csvDir, "en_US.csv");
const enJsonPath = path.join(ROOT, "public/locales/en.json");
const arJsonPath = path.join(ROOT, "public/locales/ar.json");

// ─── CSV Parser ─────────────────────────────────────────────────────────────

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseMagentoCsv(filePath) {
  const map = new Map();
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ CSV not found: ${filePath}`);
    return map;
  }

  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line.trim());
    if (fields.length >= 2) {
      const key = fields[0].trim();
      const value = fields[1].trim();
      if (key && value) {
        map.set(key, value);
      }
    }
  }
  return map;
}

// ─── Slug Generator ─────────────────────────────────────────────────────────

/**
 * Convert an English string to a URL-safe slug for use as a JSON key.
 *
 *   "Add to Cart"       → "add-to-cart"
 *   "In Stock"          → "in-stock"
 *   "Order #"           → "order"
 *   "VAT (15%)"         → "vat-15"
 *   "Zip/Postal Code"   → "zip-postal-code"
 *   "Loading..."        → "loading"
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[''""]/g, "")          // remove quotes
    .replace(/[()%#*@!?.,:;]+/g, "") // remove special chars
    .replace(/[^a-z0-9\s-]/g, "-")  // non-alphanumeric → dash
    .replace(/\s+/g, "-")           // spaces → dash
    .replace(/-+/g, "-")            // collapse dashes
    .replace(/^-|-$/g, "");          // trim dashes
}

// ─── Filter: skip long admin/system strings ─────────────────────────────────

/**
 * Only sync strings that are likely UI labels (short, no HTML, no placeholders).
 * Skip: long sentences, HTML tags, %1 %2 placeholders, internal paths.
 */
function isUiString(key) {
  if (key.length > 80) return false;                    // too long for a label
  if (key.includes("<") || key.includes(">")) return false; // HTML
  if (key.includes("\\")) return false;                 // PHP class paths
  if (key.includes("%1") || key.includes("%2")) return false; // Magento placeholders
  if (key.includes("{{")) return false;                 // Magento template vars
  if (key.includes("http")) return false;               // URLs
  if (key.startsWith("The ") && key.length > 40) return false; // error sentences
  if (key.startsWith("We ") && key.length > 40) return false;
  if (key.startsWith("You ") && key.length > 40) return false;
  if (key.startsWith("Please ") && key.length > 40) return false;
  if (key.startsWith("More ") && key.length > 40) return false;
  if (key.startsWith("This ") && key.length > 40) return false;
  return true;
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log("📦 Syncing Magento CSV translations → frontend JSON\n");

// 1. Parse CSVs
console.log(`  Reading: ${arCsvPath}`);
const arMap = parseMagentoCsv(arCsvPath);
console.log(`  → ${arMap.size} Arabic translations found`);

console.log(`  Reading: ${enCsvPath}`);
const enMap = parseMagentoCsv(enCsvPath);
console.log(`  → ${enMap.size} English overrides found\n`);

// 2. Load existing JSON files
const enJson = JSON.parse(fs.readFileSync(enJsonPath, "utf-8"));
const arJson = JSON.parse(fs.readFileSync(arJsonPath, "utf-8"));

// 3. Remove old magento keys (m.* and magento.*) to start fresh
for (const key of Object.keys(enJson)) {
  if (key.startsWith("m.") || key.startsWith("magento.")) delete enJson[key];
}
for (const key of Object.keys(arJson)) {
  if (key.startsWith("m.") || key.startsWith("magento.")) delete arJson[key];
}

// 4. Build unique slug map from ar_SA.csv (primary source — has all strings)
const slugMap = new Map(); // slug → { en, ar }
const duplicateSlugs = new Set();

for (const [enKey, arValue] of arMap) {
  if (!isUiString(enKey)) continue;

  const slug = slugify(enKey);
  if (!slug) continue;

  // Handle duplicate slugs: keep the shorter/simpler English key
  if (slugMap.has(slug)) {
    const existing = slugMap.get(slug);
    if (enKey.length < existing.enKey.length) {
      slugMap.set(slug, { enKey, en: enMap.get(enKey) || enKey, ar: arValue });
    }
    duplicateSlugs.add(slug);
  } else {
    slugMap.set(slug, { enKey, en: enMap.get(enKey) || enKey, ar: arValue });
  }
}

// 5. Also process en_US.csv overrides (custom English labels)
for (const [enKey, enOverride] of enMap) {
  if (!isUiString(enKey)) continue;

  const slug = slugify(enKey);
  if (!slug) continue;

  if (slugMap.has(slug)) {
    // Update EN value with the override
    const entry = slugMap.get(slug);
    entry.en = enOverride;
  } else {
    // en_US.csv has a key not in ar_SA.csv — add it with EN override only
    slugMap.set(slug, { enKey, en: enOverride, ar: null });
  }
}

// 6. Merge into JSON
let added = 0;
for (const [slug, { en, ar }] of slugMap) {
  const frontendKey = `m.${slug}`;
  enJson[frontendKey] = en;
  if (ar) arJson[frontendKey] = ar;
  added++;
}

// 7. Write back
fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2) + "\n", "utf-8");
fs.writeFileSync(arJsonPath, JSON.stringify(arJson, null, 2) + "\n", "utf-8");

// 8. Report
const customEn = Object.keys(enJson).filter(k => !k.startsWith("m.")).length;
const magentoEn = Object.keys(enJson).filter(k => k.startsWith("m.")).length;
const customAr = Object.keys(arJson).filter(k => !k.startsWith("m.")).length;
const magentoAr = Object.keys(arJson).filter(k => k.startsWith("m.")).length;

console.log(`  ✅ Synced ${added} Magento UI strings`);
if (duplicateSlugs.size > 0) {
  console.log(`  ⚠  ${duplicateSlugs.size} duplicate slugs resolved (kept shortest key)`);
}
console.log(`\n  EN: ${customEn} custom + ${magentoEn} magento = ${Object.keys(enJson).length} total`);
console.log(`  AR: ${customAr} custom + ${magentoAr} magento = ${Object.keys(arJson).length} total`);
console.log(`\n  Usage in components: t("m.add-to-cart"), t("m.in-stock"), t("m.place-order"), etc.`);
console.log("\nDone! 🎉\n");
