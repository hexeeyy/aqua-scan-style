/**
 * Normalizes fish species names to avoid duplicates from AI output variations.
 * e.g., "Milkfish (Bangus)" and "Milkfish" → "Milkfish"
 *       "Snakehead (Dalag)" and "Snakehead" → "Snakehead"
 *       "Mudfish / Snakehead" → "Snakehead"
 */

// Map of known aliases → canonical name
const ALIASES: Record<string, string> = {
  "bangus": "Milkfish",
  "milkfish (bangus)": "Milkfish",
  "mudfish": "Snakehead",
  "mudfish / snakehead": "Snakehead",
  "snakehead (dalag)": "Snakehead",
  "dalag": "Snakehead",
  "striped snakehead": "Striped Snakehead",
  "giant snakehead": "Giant Snakehead",
  "tilapia (st. peter's fish)": "Tilapia",
  "nile tilapia": "Tilapia",
  "bighead carp": "Bighead Carp",
};

export const normalizeSpeciesName = (name: string): string => {
  if (!name) return "Unknown";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // Direct alias match
  if (ALIASES[lower]) return ALIASES[lower];

  // Check if the name has a parenthetical suffix like "Milkfish (Bangus)"
  const withoutParens = lower.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (withoutParens !== lower && ALIASES[withoutParens]) return ALIASES[withoutParens];

  // Check if the name has a slash like "Mudfish / Snakehead"  
  if (lower.includes("/")) {
    const parts = lower.split("/").map(p => p.trim());
    for (const part of parts) {
      if (ALIASES[part]) return ALIASES[part];
    }
  }

  // Strip parenthetical for display but keep capitalization
  const cleaned = trimmed.replace(/\s*\(.*?\)\s*/g, "").trim();
  return cleaned || trimmed;
};

/**
 * Aggregates counts by normalized species name.
 */
export const aggregateBySpecies = <T>(
  items: T[],
  getName: (item: T) => string
): Map<string, number> => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const name = normalizeSpeciesName(getName(item));
    map.set(name, (map.get(name) ?? 0) + 1);
  });
  return map;
};

/**
 * Count unique species from a list.
 */
export const countUniqueSpecies = <T>(
  items: T[],
  getName: (item: T) => string
): number => {
  const set = new Set(items.map((item) => normalizeSpeciesName(getName(item))));
  set.delete("Unknown");
  return set.size;
};

/**
 * Normalizes location names to merge duplicates.
 * e.g., "Tanay, Rizal" and "Tanay" → "Tanay"
 * Strips province/region suffixes and normalizes casing.
 */
export const normalizeLocationName = (name: string): string => {
  if (!name) return "Unknown";
  // Take only the city/municipality part (before the first comma)
  const city = name.split(",")[0].trim();
  // Title-case it
  return city.charAt(0).toUpperCase() + city.slice(1);
};
