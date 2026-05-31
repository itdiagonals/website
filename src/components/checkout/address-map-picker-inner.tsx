"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { AddressMapValue } from "./address-map-picker";

const defaultIcon = L.icon({
  iconRetinaUrl: typeof markerIcon2x === "string" ? markerIcon2x : markerIcon2x.src,
  iconUrl: typeof markerIcon === "string" ? markerIcon : markerIcon.src,
  shadowUrl: typeof markerShadow === "string" ? markerShadow : markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

type AddressMapPickerInnerProps = {
  value: AddressMapValue;
  onChange: (next: Partial<AddressMapValue>) => void;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  osm_type: string;
  osm_id: string | number;
  address?: Record<string, string>;
};

const DEFAULT_CENTER: [number, number] = [-2.548926, 118.0148634];

function buildAddressPayload(result: NominatimResult): Partial<AddressMapValue> {
  const address = result.address ?? {};

  return {
    latitude: result.lat,
    longitude: result.lon,
    fullAddress: result.display_name,
    postalCode: address.postcode ?? "",
    province: address.state ?? address.region ?? address.state_district ?? "",
    city:
      address.city ??
      address.town ??
      address.municipality ??
      address.county ??
      "",
    district:
      address.city_district ??
      address.county ??
      address.suburb ??
      address.neighbourhood ??
      "",
    village:
      address.village ??
      address.hamlet ??
      address.suburb ??
      address.neighbourhood ??
      "",
    placeId: `${result.osm_type}:${result.osm_id}`,
    mapProvider: "openstreetmap",
    destinationAreaId: "",
    destinationAreaLabel: result.display_name,
  };
}

function MapViewportSync({ latitude, longitude }: { latitude: string; longitude: string }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const invalidate = () => {
      map.invalidateSize({ pan: false });
    };

    const timers = [0, 100, 300].map((delay) =>
      window.setTimeout(invalidate, delay)
    );
    const observer = new ResizeObserver(() => {
      invalidate();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [map]);

  useEffect(() => {
    if (latitude === "" || longitude === "") {
      return;
    }

    const timer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
      map.setView([Number(latitude), Number(longitude)], 16);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [latitude, longitude, map]);

  return null;
}

function MapInstanceBridge({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
}

function ClickToPin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function AddressMapPickerInner({
  value,
  onChange,
}: AddressMapPickerInnerProps) {
  const [searchQuery, setSearchQuery] = useState(value.fullAddress);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const markerRef = useRef<LeafletMarker | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (value.latitude !== "" && value.longitude !== "") {
      return [Number(value.latitude), Number(value.longitude)];
    }

    return DEFAULT_CENTER;
  }, [value.latitude, value.longitude]);

  useEffect(() => {
    setSearchQuery(value.fullAddress);
  }, [value.fullAddress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const timers = [0, 120, 300, 600].map((delay) =>
      window.setTimeout(() => {
        map.invalidateSize({ pan: false });
      }, delay)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [showResults, value.latitude, value.longitude, value.placeId]);

  useEffect(() => {
    const normalized = searchQuery.trim();

    if (normalized.length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(normalized)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to search location");
        }

        const data = (await response.json()) as NominatimResult[];
        setResults(data);
        setShowResults(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const applyReverseLookup = async (latitude: number, longitude: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to reverse geocode location");
    }

    const data = (await response.json()) as NominatimResult;
    onChange(buildAddressPayload(data));
    setSearchQuery(data.display_name);
  };

  const handlePickResult = (result: NominatimResult) => {
    onChange(buildAddressPayload(result));
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = Number(position.coords.latitude.toFixed(7));
      const longitude = Number(position.coords.longitude.toFixed(7));

      await applyReverseLookup(latitude, longitude);
    });
  };

  const handleMapPick = async (latitude: number, longitude: number) => {
    await applyReverseLookup(latitude, longitude);
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={searchContainerRef} className="relative flex flex-col gap-2">
        <label className="text-b2 text-black">Cari Lokasi</label>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => setShowResults(true)}
          className="h-11 rounded-[8px] border border-primary-100 px-3 outline-none"
          placeholder="Search address or place"
        />
        {showResults && (isSearching || results.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-[1001] mt-1 max-h-[220px] overflow-y-auto rounded-[8px] border border-primary-100 bg-white shadow-lg">
            {isSearching && (
              <div className="px-3 py-2 text-b2 text-neutral-700">Searching...</div>
            )}
            {!isSearching &&
              results.map((result) => (
                <button
                  key={`${result.osm_type}:${result.osm_id}`}
                  type="button"
                  onClick={() => handlePickResult(result)}
                  className="block w-full border-b border-primary-100 px-3 py-2 text-left text-b2 text-black last:border-b-0 hover:bg-neutral-100"
                >
                  {result.display_name}
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="h-[320px] overflow-hidden rounded-[10px] border border-primary-100 bg-neutral-100">
        <MapContainer
          key={`${value.placeId || "default"}-${value.latitude}-${value.longitude}`}
          center={center}
          zoom={value.latitude && value.longitude ? 16 : 5}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInstanceBridge onReady={(map) => {
            mapRef.current = map;
            const timers = [0, 100, 250, 500].map((delay) =>
              window.setTimeout(() => map.invalidateSize({ pan: false }), delay)
            );
            window.setTimeout(() => {
              timers.forEach((timer) => window.clearTimeout(timer));
            }, 800);
          }} />
          <MapViewportSync latitude={value.latitude} longitude={value.longitude} />
          <ClickToPin onPick={handleMapPick} />
          {value.latitude !== "" && value.longitude !== "" && (
            <Marker
              draggable
              icon={defaultIcon}
              position={[Number(value.latitude), Number(value.longitude)]}
              ref={markerRef}
              eventHandlers={{
                dragend: async () => {
                  const marker = markerRef.current;

                  if (!marker) {
                    return;
                  }

                  const nextPosition = marker.getLatLng();
                  await applyReverseLookup(nextPosition.lat, nextPosition.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="h-10 rounded-[8px] border border-primary-100 px-4 text-b2 text-black"
        >
          Use current location
        </button>
      </div>
    </div>
  );
}
