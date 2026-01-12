"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { CreateAddressPayload } from "@/lib/types/address/address.payload";

export function useLocationPicker(initialPosition: { lat: number; lng: number }) {
  const [position, setPosition] = useState(initialPosition);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const lastFetchedPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  const fetchAddress = useCallback(
    (lat: number, lng: number, updateForm: (addr: Partial<CreateAddressPayload>) => void, immediate = false) => {
      if (lastFetchedPosRef.current) {
        const distance = Math.hypot(lastFetchedPosRef.current.lat - lat, lastFetchedPosRef.current.lng - lng);
        if (distance < 0.0001) return;
      }
      lastFetchedPosRef.current = { lat, lng };

      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

      const doGeocode = () => {
        setIsFetchingAddress(true);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            setIsFetchingAddress(false);
            const addr = results[0];
            const get = (type: string) =>
              addr.address_components?.find((c) => c.types.includes(type))?.long_name ?? "";

            updateForm({
              googleLocation: addr.formatted_address ?? "",
              city:
                get("locality") ||
                get("sublocability_level_1") ||
                get("administrative_area_level_2") ||
                "",
              state: get("administrative_area_level_1") ?? "",
              pincode: get("postal_code") ?? "",
              country: get("country") ?? "India",
              location: { type: "Point", coordinates: [lng, lat] },
            });
          } else {
            setTimeout(() => {
              const geocoder2 = new window.google.maps.Geocoder();
              geocoder2.geocode({ location: { lat, lng } }, (results2, status2) => {
                setIsFetchingAddress(false);
                if (status2 === "OK" && results2?.[0]) {
                  const addr = results2[0];
                  const get = (type: string) =>
                    addr.address_components?.find((c) => c.types.includes(type))?.long_name ?? "";

                  updateForm({
                    googleLocation: addr.formatted_address ?? "",
                    city:
                      get("locality") ||
                      get("sublocability_level_1") ||
                      get("administrative_area_level_2") ||
                      "",
                    state: get("administrative_area_level_1") ?? "",
                    pincode: get("postal_code") ?? "",
                    country: get("country") ?? "India",
                    location: { type: "Point", coordinates: [lng, lat] },
                  });
                } else {
                  toast.error("Could not fetch address. Try moving the map.");
                }
              });
            }, 500);
          }
        });
      };

      if (immediate) doGeocode();
      else geocodeTimeoutRef.current = setTimeout(doGeocode, 400);
    },
    []
  );

  const detectCurrentLocation = useCallback(
    (updateForm: (addr: Partial<CreateAddressPayload>) => void): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          toast.error("Geolocation not supported.");
          reject(new Error("Not supported"));
          return;
        }

        setIsDetecting(true);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPosition(loc);

            if (mapRef.current) {
              mapRef.current.setCenter(loc);
              mapRef.current.setZoom(17);
            }

            fetchAddress(loc.lat, loc.lng, updateForm, true);
            setIsDetecting(false);
            resolve();
          },
          (err) => {
            setIsDetecting(false);
            toast.error("Failed to get location. Enable location services.");
            console.error(err);
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      });
    },
    [fetchAddress]
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map, updateForm: (addr: Partial<CreateAddressPayload>) => void) => {
      mapRef.current = map;

      map.addListener("dragstart", () => {
        isDraggingRef.current = true;
      });
      map.addListener("dragend", () => {
        isDraggingRef.current = false;
        const center = map.getCenter();
        if (center) {
          const newPos = { lat: center.lat(), lng: center.lng() };
          setPosition(newPos);
          fetchAddress(newPos.lat, newPos.lng, updateForm, true);
        }
      });
      map.addListener("zoom_changed", () => {
        if (!isDraggingRef.current) {
          const center = map.getCenter();
          if (center) setPosition({ lat: center.lat(), lng: center.lng() });
        }
      });
    },
    [fetchAddress]
  );

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  return {
    position,
    isDetecting,
    isFetchingAddress,
    detectCurrentLocation,
    fetchAddress,
    onMapLoad,
    onMapUnmount,
    mapRef, // ← MUST RETURN
    setPosition,
  };
}