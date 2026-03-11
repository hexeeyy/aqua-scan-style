import { supabase } from "@/integrations/supabase/client";
import type { ScanRecord } from "@/components/ScanHistory";
import type { MarketDuration, ConsumerRecommendation } from "@/components/MarketDurationCard";

export interface ScanRecordWithUser extends ScanRecord {
  scanUserId?: string;
  userName?: string;
  userEmail?: string;
}

export const saveScanToDb = async (
  record: ScanRecord,
  userId: string,
  marketDuration?: MarketDuration,
  consumerRecommendation?: ConsumerRecommendation,
  locationData?: { latitude?: number; longitude?: number; locationName?: string }
): Promise<string | null> => {
  const { data, error } = await supabase.from("scan_history").insert({
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
    market_duration: marketDuration ? (marketDuration as any) : null,
    consumer_recommendation: consumerRecommendation ? (consumerRecommendation as any) : null,
    ...(locationData?.locationName ? {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      location_name: locationData.locationName,
    } : {}),
  } as any).select("share_token").single();

  if (error) {
    console.error("Failed to save scan to DB:", error);
    return null;
  }
  return data?.share_token ?? null;
};

const mapRowToScanRecord = (row: any): ScanRecordWithUser => ({
  id: row.id,
  scanUserId: row.user_id,
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
  userName: row.profiles?.display_name ?? undefined,
  userEmail: row.profiles?.email ?? undefined,
});

export const getScansFromDb = async (): Promise<ScanRecord[]> => {
  const { data, error } = await supabase
    .from("scan_history")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Failed to fetch scans:", error);
    return [];
  }

  return (data ?? []).map(mapRowToScanRecord);
};

export const getAllScansForAdmin = async (): Promise<ScanRecordWithUser[]> => {
  // Fetch scans and profiles separately, then merge
  const [scansRes, profilesRes] = await Promise.all([
    supabase.from("scan_history").select("*").order("timestamp", { ascending: false }).limit(200),
    supabase.from("profiles").select("user_id, display_name, email"),
  ]);

  if (scansRes.error) {
    console.error("Failed to fetch admin scans:", scansRes.error);
    return [];
  }

  const profileMap = new Map<string, { display_name: string; email: string }>();
  (profilesRes.data ?? []).forEach((p: any) => profileMap.set(p.user_id, p));

  return (scansRes.data ?? []).map((row: any) => {
    const record = mapRowToScanRecord(row);
    const profile = profileMap.get(row.user_id);
    record.userName = profile?.display_name ?? undefined;
    record.userEmail = profile?.email ?? undefined;
    return record;
  });
};

export const deleteScanFromDb = async (id: string) => {
  const { error } = await supabase.from("scan_history").delete().eq("id", id);
  if (error) console.error("Failed to delete scan:", error);
};
