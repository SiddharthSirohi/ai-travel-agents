"use client";
/* global google */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/lib/store';
import { ItineraryItem } from '@/lib/types';

const typeMeta = {
  flight: { color: '#3b82f6', label: 'Flights' },
  hotel: { color: '#047857', label: 'Accommodation' },
  meal: { color: '#d97706', label: 'Meals' },
  activity: { color: '#9333ea', label: 'Activities' },
} as const;

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

export function MapCanvas() {
  const { itinerary, destination } = useTripStore();
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const itemsWithCoordinates = itinerary.filter((item) => item.coordinates);
  const coordinatesForBounds: [number, number][] = [
    ...(destination?.coordinates ? [destination.coordinates] : []),
    ...itemsWithCoordinates.map((i) => i.coordinates!)
  ];

  const defaultCenterArr =
    destination?.coordinates || itemsWithCoordinates[0]?.coordinates || [40.7128, -74.0060];
  const defaultCenter = { lat: defaultCenterArr[0], lng: defaultCenterArr[1] };

  useEffect(() => {
    if (!mapRef.current || coordinatesForBounds.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    coordinatesForBounds.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    mapRef.current.fitBounds(bounds, 20);
  }, [coordinatesForBounds.length]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  if (!isClient) {
    return (
      <div className="h-full p-4">
        <div className="h-full flex items-center justify-center rounded-lg border">
          <div className="text-center space-y-4">
            <div className="text-4xl">🗺️</div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show "no locations" only if there's no destination AND no itinerary items
  if (itemsWithCoordinates.length === 0 && !destination) {
    return (
      <div className="h-full p-4">
        <div className="h-full flex items-center justify-center rounded-lg border">
          <div className="text-center space-y-4">
            <div className="text-6xl opacity-50">🗺️</div>
            <div>
              <h3 className="text-lg font-medium">No locations to display</h3>
              <p className="text-muted-foreground">Add some itinerary items to see them on the map</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full p-4">
        <div className="h-full flex items-center justify-center rounded-lg border">
          <div className="text-center space-y-4">
            <div className="text-4xl">🗺️</div>
            <p className="text-muted-foreground">Loading Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="h-full p-4">
        <div className="h-full flex items-center justify-center rounded-lg border text-center">
          <p className="text-sm text-muted-foreground">
            Google Maps API key is missing. Please set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <div className="h-full relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={10}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            scrollwheel: false,
            gestureHandling: 'cooperative',
          }}
        >
          {itemsWithCoordinates.map((item) => {
            const [lat, lng] = item.coordinates!;
            return (
              <Marker
                key={item.id}
                position={{ lat, lng }}
                onClick={() => setSelectedItem(item)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: typeMeta[item.type].color,
                  fillOpacity: 1,
                  strokeColor: '#374151',
                  strokeWeight: 3,
                }}
              />
            );
          })}

          {/* Show destination marker if destination exists */}
          {destination && (
            <Marker
              key="destination"
              position={{ lat: destination.coordinates[0], lng: destination.coordinates[1] }}
              label={{ text: '📍', fontSize: '18px' }}
              title={destination.name}
            />
          )}

          {selectedItem && (
            <InfoWindow
              position={{ lat: selectedItem.coordinates![0], lng: selectedItem.coordinates![1] }}
              onCloseClick={() => setSelectedItem(null)}
              options={{
                disableAutoPan: true,
                maxWidth: 300,
              }}
            >
              <div className="space-y-2 min-w-[200px]">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-gray-700"
                    style={{ backgroundColor: typeMeta[selectedItem.type].color }}
                  />
                  <h3 className="font-medium">{selectedItem.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{selectedItem.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {selectedItem.date} at {selectedItem.time}
                  </span>
                  <Badge variant={selectedItem.status === 'confirmed' ? 'default' : 'secondary'}>
                    {selectedItem.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium">
                  {selectedItem.currency} {selectedItem.price}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        <div className="absolute top-4 right-4 z-[1000]">
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0">
              {Object.entries(typeMeta)
                .filter(([type]) => ['hotel', 'meal', 'activity'].includes(type))
                .map(([type, meta]) => (
                <div key={type} className="flex items-center space-x-2.5 text-xs">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-gray-700"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{meta.label}</span>
                  <span className="text-muted-foreground">
                    ({itinerary.filter((item) => item.type === type).length})
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 