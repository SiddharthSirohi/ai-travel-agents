"use client";

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTripStore } from '@/lib/store';
import { ItineraryItem } from '@/lib/types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getCustomIcon = (type: string) => {
  const colors = {
    flight: '#3b82f6',
    hotel: '#10b981',
    meal: '#f59e0b',
    activity: '#8b5cf6',
  };
  
  return L.divIcon({
    html: `<div style="background-color: ${colors[type as keyof typeof colors] || '#6b7280'}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">
      ${type === 'flight' ? '✈️' : type === 'hotel' ? '🏨' : type === 'meal' ? '🍽️' : '🎯'}
    </div>`,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function MapUpdater({ items }: { items: ItineraryItem[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (items.length > 0) {
      const validItems = items.filter(item => item.coordinates);
      if (validItems.length > 0) {
        const bounds = L.latLngBounds(validItems.map(item => item.coordinates!));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [items, map]);
  
  return null;
}

export function MapCanvas() {
  const { itinerary, destination } = useTripStore();
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const itemsWithCoordinates = itinerary.filter(item => item.coordinates);
  
  // Default center - either destination or first item with coordinates
  const defaultCenter = destination?.coordinates || 
    itemsWithCoordinates[0]?.coordinates || 
    [40.7128, -74.0060]; // Default to NYC

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

  if (itemsWithCoordinates.length === 0) {
    return (
      <div className="h-full p-4">
        <div className="h-full flex items-center justify-center rounded-lg border">
          <div className="text-center space-y-4">
            <div className="text-6xl opacity-50">🗺️</div>
            <div>
              <h3 className="text-lg font-medium">No locations to display</h3>
              <p className="text-muted-foreground">
                Add some itinerary items to see them on the map
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <div className="h-full relative">
        <MapContainer
        center={defaultCenter as [number, number]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater items={itemsWithCoordinates} />
        
        {itemsWithCoordinates.map((item) => (
          <Marker
            key={item.id}
            position={item.coordinates!}
            icon={getCustomIcon(item.type)}
            eventHandlers={{
              click: () => setSelectedItem(item),
            }}
          >
            <Popup>
              <div className="space-y-2 min-w-[200px]">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {item.type === 'flight' ? '✈️' : 
                     item.type === 'hotel' ? '🏨' : 
                     item.type === 'meal' ? '🍽️' : '🎯'}
                  </span>
                  <h3 className="font-medium">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>{item.date} at {item.time}</span>
                  <Badge variant={item.status === 'confirmed' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium">
                  {item.currency} {item.price}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute top-4 right-4 z-[1000]">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { type: 'flight', label: 'Flights', color: '#3b82f6', emoji: '✈️' },
              { type: 'hotel', label: 'Hotels', color: '#10b981', emoji: '🏨' },
              { type: 'meal', label: 'Dining', color: '#f59e0b', emoji: '🍽️' },
              { type: 'activity', label: 'Activities', color: '#8b5cf6', emoji: '🎯' },
            ].map(({ type, label, color, emoji }) => (
              <div key={type} className="flex items-center space-x-2 text-xs">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs"
                  style={{ backgroundColor: color }}
                >
                  {emoji}
                </div>
                <span>{label}</span>
                <span className="text-muted-foreground">
                  ({itinerary.filter(item => item.type === type).length})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Selected item details */}
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-4 right-4 z-[1000]"
        >
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>
                  {selectedItem.type === 'flight' ? '✈️' : 
                   selectedItem.type === 'hotel' ? '🏨' : 
                   selectedItem.type === 'meal' ? '🍽️' : '🎯'}
                </span>
                <span>{selectedItem.title}</span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedItem.description}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span> {selectedItem.date}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {selectedItem.time}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {selectedItem.location}
                </div>
                <div>
                  <span className="font-medium">Price:</span> {selectedItem.currency} {selectedItem.price}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </div>
    </div>
  );
} 