import { useState, useEffect, useCallback } from "react";

export interface UserLocation {
  latitude: number;
  longitude: number;
  locationName: string;
}

const STORAGE_KEY = "sari-user-location";

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`
    );
    const data = await res.json();
    // Try city, town, municipality, or county
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.municipality ||
      data.address?.county ||
      data.address?.state ||
      "Unknown Area"
    );
  } catch {
    return "Unknown Area";
  }
};

export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const saveLocation = useCallback((loc: UserLocation) => {
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }, []);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    return new Promise<UserLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const name = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          const loc: UserLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            locationName: name,
          };
          saveLocation(loc);
          setLoading(false);
          resolve(loc);
        },
        () => {
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [saveLocation]);

  const setManualLocation = useCallback(
    (name: string, lat?: number, lng?: number) => {
      saveLocation({
        latitude: lat ?? 0,
        longitude: lng ?? 0,
        locationName: name,
      });
    },
    [saveLocation]
  );

  return { location, loading, detectLocation, setManualLocation };
};
