import type { ScanRecord } from "@/components/ScanHistory";

export const MOCK_SCAN_HISTORY: ScanRecord[] = [
  {
    id: "mock-1",
    timestamp: Date.now() - 3600_000,
    thumbnail: "",
    species: {
      name: "Bangus (Milkfish)",
      scientificName: "Chanos chanos",
      confidence: 94,
    },
    freshness: {
      level: "fresh",
      score: 88,
      reasoning: "Clear bright eyes, firm texture, reddish gills — signs of recently caught fish.",
    },
    pricePerKilo: { min: 180, max: 220, currency: "₱" },
    nutritionalInfo: { protein: 20.5, omega3: "1.2g", calories: 148 },
    stats: { eyeClarity: "Clear", gillColor: "Bright Red", texture: "Firm" },
    spoilagePrediction: {
      hoursAtRoomTemp: 6,
      storage: [
        { method: "Ice", shelfLife: "2-3 days", tempRange: "0-4°C" },
        { method: "Freezer", shelfLife: "3 months", tempRange: "-18°C" },
      ],
      riskLevel: "low",
      recommendation: "Best consumed within 24 hours if refrigerated.",
    },
  },
  {
    id: "mock-2",
    timestamp: Date.now() - 86400_000,
    thumbnail: "",
    species: {
      name: "Tilapia",
      scientificName: "Oreochromis niloticus",
      confidence: 91,
    },
    freshness: {
      level: "moderate",
      score: 62,
      reasoning: "Slightly cloudy eyes, mild odor — moderate freshness, consume soon.",
    },
    pricePerKilo: { min: 120, max: 160, currency: "₱" },
    nutritionalInfo: { protein: 26, omega3: "0.8g", calories: 128 },
    stats: { eyeClarity: "Slightly Cloudy", gillColor: "Pinkish", texture: "Slightly Soft" },
    spoilagePrediction: {
      hoursAtRoomTemp: 3,
      storage: [
        { method: "Ice", shelfLife: "1-2 days", tempRange: "0-4°C" },
        { method: "Freezer", shelfLife: "2 months", tempRange: "-18°C" },
      ],
      riskLevel: "moderate",
      recommendation: "Cook within the day or freeze immediately.",
    },
  },
  {
    id: "mock-3",
    timestamp: Date.now() - 172800_000,
    thumbnail: "",
    species: {
      name: "Galunggong (Round Scad)",
      scientificName: "Decapterus macrosoma",
      confidence: 87,
    },
    freshness: {
      level: "fresh",
      score: 92,
      reasoning: "Shiny scales, firm body, bright red gills — very fresh catch.",
    },
    pricePerKilo: { min: 140, max: 180, currency: "₱" },
    nutritionalInfo: { protein: 19, omega3: "1.5g", calories: 110 },
    stats: { eyeClarity: "Very Clear", gillColor: "Dark Red", texture: "Very Firm" },
    spoilagePrediction: {
      hoursAtRoomTemp: 5,
      storage: [
        { method: "Ice", shelfLife: "2 days", tempRange: "0-4°C" },
        { method: "Freezer", shelfLife: "3 months", tempRange: "-18°C" },
      ],
      riskLevel: "low",
      recommendation: "Great for sinigang or grilling. Best within 48 hours.",
    },
  },
];

export const MOCK_MARKET_DURATION = {
  estimatedHours: 4,
  displayCondition: "Open-air market stall, ambient temperature ~30°C",
  visualCues: ["Slight dullness on scales", "Minimal ice remaining", "Eyes beginning to flatten"],
  confidence: "moderate" as const,
};

export const MOCK_CONSUMER_RECOMMENDATION = {
  verdict: "buy_with_caution" as const,
  verdictReason: "Fish shows moderate freshness. Safe to consume if cooked today, but avoid raw preparations.",
  priceFairness: {
    isFair: true,
    reason: "Price is within the typical market range for this species and freshness level.",
    adjustedPriceMin: 110,
    adjustedPriceMax: 150,
  },
  cookingMethods: ["Sinigang", "Grilled", "Fried", "Paksiw"],
  handlingTips: [
    "Keep on ice until ready to cook",
    "Wash thoroughly before preparation",
    "Cook to an internal temperature of 63°C",
  ],
  safetyWarnings: [
    "Do not consume raw due to moderate freshness level",
    "Discard if ammonia odor develops",
  ],
};
