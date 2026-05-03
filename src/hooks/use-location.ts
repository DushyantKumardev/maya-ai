"use client";
import { useState, useEffect } from "react";

export interface UserLocation {
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  provider: "ip" | "browser";
}

const STORAGE_KEY = "@maya/user-location";

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse stored location:", e);
          return null;
        }
      }
    }
    return null;
  });
  const [error, setError] = useState<string | null>(() => {
    if (typeof navigator !== "undefined" && !navigator.geolocation) {
      return "Geolocation is not supported by your browser";
    }
    return null;
  });

  useEffect(() => {
    // If we already have a location from storage, don't fetch again
    if (location) return;

    // 1. Check if geolocation is supported
    if (!navigator.geolocation) {
      return;
    }

    const fetchReverseGeocode = async (lat: number, lon: number) => {
      try {
        // Using BigDataCloud's free reverse geocoding API
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        
        if (res.ok) {
          const data = await res.json();
          const locationData: UserLocation = {
            city: data.city || data.locality || data.principalSubdivision,
            region: data.principalSubdivision,
            country: data.countryName,
            countryCode: data.countryCode,
            latitude: lat,
            longitude: lon,
            provider: "browser",
          };
          
          setLocation(locationData);
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(locationData));
        }
      } catch (err) {
        console.error("Failed to reverse geocode:", err);
      }
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      fetchReverseGeocode(latitude, longitude);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Geolocation denied or failed:", error.message);
      setError(error.message);
    };

    // Trigger the permission prompt
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, [location]);

  return { location, error };
}
