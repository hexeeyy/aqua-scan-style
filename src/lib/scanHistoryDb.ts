import { supabase } from "@/integrations/supabase/client";
import type { ScanRecord } from "@/components/ScanHistory";

export const saveScanToDb = async (record: ScanRecord, userId: string) => {
  const { error } = await supabase.from("scan_history").insert({
    id: record.id,
    user_id: userId,
    timestamp: record.timestamp,
    thumbnail: record.thumbnail,
    species_name: record.species.name,
    scientific_name: record.species.scientificName,
    confidence: record.species.confidence,
    freshness_level: record.freshness.level,
    freshness_score: record.freshness.score,
    freshness_reasoning: record.freshness.reasoning,
    price_min: record.pricePerKilo?.min ?? null,
    price_max: record.pricePerKilo?.max ?? null,
    price_currency: record.pricePerKilo?.currency ?? "₱",
    nutritional_protein: record.nutritionalInfo?.protein ?? null,
    nutritional_omega3: record.nutritionalInfo?.omega3 ?? null,
    nutritional_calories: record.nutritionalInfo?.calories ?? null,
    eye_clarity: record.stats?.eyeClarity ?? null,
    gill_color: record.stats?.gillColor ?? null,
    texture: record.stats?.texture ?? null,
    spoilage_hours_room_temp: record.spoilagePrediction?.hoursAtRoomTemp ?? null,
    spoilage_risk_level: record.spoilagePrediction?.riskLevel ?? null,
    spoilage_recommendation: record.spoilagePrediction?.recommendation ?? null,
    spoilage_storage: record.spoilagePrediction?.storage ?? null,
  });
  if (error) console.error("Failed to save scan to DB:", error);
};

export const getScansFromDb = async (): Promise<ScanRecord[]> => {
  const { data, error } = await supabase
    .from("scan_history")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch scans:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    timestamp: Number(row.timestamp),
    thumbnail: row.thumbnail ?? "",
    species: {
      name: row.species_name ?? "",
      scientificName: row.scientific_name ?? "",
      confidence: Number(row.confidence ?? 0),
    },
    freshness: {
      level: (row.freshness_level ?? "moderate") as "fresh" | "moderate" | "poor",
      score: Number(row.freshness_score ?? 0),
      reasoning: row.freshness_reasoning ?? "",
    },
    pricePerKilo: row.price_min != null ? {
      min: Number(row.price_min),
      max: Number(row.price_max),
      currency: row.price_currency ?? "₱",
    } : undefined,
    nutritionalInfo: row.nutritional_protein != null ? {
      protein: Number(row.nutritional_protein),
      omega3: row.nutritional_omega3 ?? "",
      calories: Number(row.nutritional_calories ?? 0),
    } : undefined,
    stats: row.eye_clarity ? {
      eyeClarity: row.eye_clarity,
      gillColor: row.gill_color ?? "",
      texture: row.texture ?? "",
    } : undefined,
    spoilagePrediction: row.spoilage_hours_room_temp != null ? {
      hoursAtRoomTemp: Number(row.spoilage_hours_room_temp),
      storage: (row.spoilage_storage as any[]) ?? [],
      riskLevel: row.spoilage_risk_level ?? "",
      recommendation: row.spoilage_recommendation ?? "",
    } : undefined,
  }));
};

export const deleteScanFromDb = async (id: string) => {
  const { error } = await supabase.from("scan_history").delete().eq("id", id);
  if (error) console.error("Failed to delete scan:", error);
};
