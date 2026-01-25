import { translations, type Lang } from "../client/src/lib/i18n";

type Dict = Record<string, string>;

const baseLang: Lang = "en";
const targetLangs: Lang[] = ["it", "fr", "de", "es"];

function missingKeys(base: Dict, other: Dict): string[] {
  const missing: string[] = [];
  for (const key of Object.keys(base)) {
    const value = other[key];
    if (value === undefined || value === null || value === "") {
      missing.push(key);
    }
  }
  return missing.sort();
}

function extraKeys(base: Dict, other: Dict): string[] {
  const baseSet = new Set(Object.keys(base));
  return Object.keys(other)
    .filter((k) => !baseSet.has(k))
    .sort();
}

const base = translations[baseLang];
let hasErrors = false;

for (const lang of targetLangs) {
  const dict = translations[lang];
  const missing = missingKeys(base, dict);
  if (missing.length > 0) {
    hasErrors = true;
    console.error(`\n[i18n] Missing ${missing.length} key(s) in '${lang}' (compared to '${baseLang}'):`);
    for (const k of missing) console.error(`- ${k}`);
  }

  const extras = extraKeys(base, dict);
  if (extras.length > 0) {
    // Extras are not necessarily wrong (could be intentional), so keep as a warning.
    console.warn(`\n[i18n] Warning: ${extras.length} extra key(s) in '${lang}' (not present in '${baseLang}'):`);
    for (const k of extras) console.warn(`- ${k}`);
  }
}

if (hasErrors) {
  console.error("\n[i18n] Translation check failed. Add the missing keys to keep all selectable languages complete.");
  process.exitCode = 1;
} else {
  console.log("[i18n] Translation check OK");
}
