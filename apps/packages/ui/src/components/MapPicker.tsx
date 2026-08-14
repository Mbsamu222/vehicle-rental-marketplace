"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { LocateFixed, MapPin } from "lucide-react";
import { cn } from "../utils/cn";

export interface MapPickerValue {
  lat: number;
  lng: number;
  address?: string;
}

export interface MapPickerProps {
  label?: string;
  error?: string;
  hint?: string;
  value: MapPickerValue | null;
  onChange: (value: MapPickerValue | null) => void;
  /** Center to show before a value is picked — e.g. the selected city's coordinates. */
  defaultCenter?: { lat: number; lng: number };
  className?: string;
}

// India centroid — a reasonable default map center when neither a value nor a
// defaultCenter (e.g. a city's coordinates) is available yet.
const FALLBACK_CENTER = { lat: 20.5937, lng: 78.9629 };

function useAddressAutocomplete(
  inputRef: RefObject<HTMLInputElement | null>,
  onPlaceSelected: (value: MapPickerValue) => void,
) {
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;
    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      fields: ["geometry.location", "formatted_address"],
    });
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      if (!location) return;
      onPlaceSelected({ lat: location.lat(), lng: location.lng(), address: place.formatted_address });
    });
    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placesLib]);
}

function useReverseGeocode() {
  const geocodingLib = useMapsLibrary("geocoding");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (geocodingLib) geocoderRef.current = new geocodingLib.Geocoder();
  }, [geocodingLib]);

  return useCallback((lat: number, lng: number, onResolved: (address: string | undefined) => void) => {
    geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) onResolved(results[0].formatted_address);
      else onResolved(undefined);
    });
  }, []);
}

function MapPickerInner({ value, onChange, defaultCenter }: Omit<MapPickerProps, "label" | "error" | "hint" | "className">) {
  const map = useMap();
  const inputRef = useRef<HTMLInputElement>(null);
  const reverseGeocode = useReverseGeocode();
  const center = value ?? defaultCenter ?? FALLBACK_CENTER;

  const placePin = useCallback(
    (lat: number, lng: number) => {
      onChange({ lat, lng });
      reverseGeocode(lat, lng, (address) => onChange({ lat, lng, address }));
    },
    [onChange, reverseGeocode],
  );

  useAddressAutocomplete(inputRef, (picked) => {
    onChange(picked);
    map?.panTo({ lat: picked.lat, lng: picked.lng });
    map?.setZoom(15);
  });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      map?.panTo({ lat: latitude, lng: longitude });
      map?.setZoom(15);
      placePin(latitude, longitude);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for an address"
          defaultValue={value?.address}
          className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-10 text-sm text-primary placeholder:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary dark:bg-dark-surface dark:border-dark-border dark:text-white dark:placeholder:text-primary-400"
        />
        <button
          type="button"
          onClick={useCurrentLocation}
          title="Use my current location"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 transition-colors hover:text-secondary"
        >
          <LocateFixed size={16} />
        </button>
      </div>
      <div className="h-64 w-full overflow-hidden rounded-xl border border-border dark:border-dark-border">
        <Map
          defaultCenter={center}
          defaultZoom={value ? 15 : 5}
          center={value ? undefined : center}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          onClick={(e) => {
            if (e.detail.latLng) placePin(e.detail.latLng.lat, e.detail.latLng.lng);
          }}
        >
          {value && (
            <Marker
              position={{ lat: value.lat, lng: value.lng }}
              draggable
              onDragEnd={(e) => {
                const pos = e.latLng;
                if (pos) placePin(pos.lat(), pos.lng());
              }}
            />
          )}
        </Map>
      </div>
    </div>
  );
}

/**
 * Controlled map location picker: search box + click/drag-to-place marker +
 * "use my current location". Renders Google's own "for development purposes
 * only" placeholder tiles until NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set to a
 * real key — it does not crash on an empty key.
 */
export function MapPicker({ label, error, hint, value, onChange, defaultCenter, className }: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-sm font-medium text-primary dark:text-white">{label}</label>}
      <APIProvider apiKey={apiKey}>
        <MapPickerInner value={value} onChange={onChange} defaultCenter={defaultCenter} />
      </APIProvider>
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-primary-400">{hint}</p> : null}
    </div>
  );
}
