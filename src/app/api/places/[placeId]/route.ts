import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  const { placeId } = params;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  if (!placeId) {
    return NextResponse.json(
      { error: 'Place ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching place details for placeId: ${placeId}`);
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        key: apiKey,
        fields: ['geometry'],
      },
    });

    console.log(`Google Places API response status: ${response.data.status}`);
    if (response.data.status !== 'OK') {
      console.error(`Google Places API error for placeId ${placeId}:`, response.data);
      return NextResponse.json(
        { error: `Google Places API error: ${response.data.status}` },
        { status: 400 }
      );
    }

    const location = response.data.result?.geometry?.location;
    console.log(`Location for placeId ${placeId}:`, location);
    if (!location) {
      return NextResponse.json(
        { error: 'No location found for this place ID' },
        { status: 404 }
      );
    }

    console.log(`Returning coordinates for placeId ${placeId}:`, { lat: location.lat, lng: location.lng });
    return NextResponse.json({
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
    });
  } catch (error) {
    console.error('Error fetching place details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    );
  }
} 