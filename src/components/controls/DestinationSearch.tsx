"use client";

import { useState, useEffect, useMemo } from 'react';
import { Combobox } from '@/components/ui/combobox';
import { searchDestinations, mockDestinations } from '@/lib/mock-api';
import { TripDestination } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DestinationSearchProps {
  value?: TripDestination | null;
  onSelect: (destination: TripDestination | null) => void;
  className?: string;
}

export function DestinationSearch({ value, onSelect, className }: DestinationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TripDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Provide alphabetical list when the search query is empty or too short.
  // For longer queries (>1 char) we debounce and run the fuzzy search.
  useEffect(() => {
    // When query is empty (or < 2 chars) show alphabetical list
    if (!searchQuery || searchQuery.length < 2) {
      const sortedAll = [...mockDestinations].sort((a, b) => a.name.localeCompare(b.name));
      setSearchResults(sortedAll);
      return;
    }

    // Debounce API-like search for longer queries
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      try {
        const results = searchDestinations(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300 ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Transform destinations to combobox options
  const options = useMemo(() => {
    const searchOptions = searchResults.map(destination => ({
      value: destination.id,
      label: destination.name,
      subtitle: destination.country,
    }));

    // If we have a selected value but it's not in search results, add it
    if (value && !searchOptions.some(opt => opt.value === value.id)) {
      searchOptions.unshift({
        value: value.id,
        label: value.name,
        subtitle: value.country,
      });
    }

    return searchOptions;
  }, [searchResults, value]);

  const handleValueChange = (selectedId: string) => {
    if (!selectedId) {
      onSelect(null);
      return;
    }

    // First try to find in search results
    let selectedDestination = searchResults.find(dest => dest.id === selectedId);
    
    // If not found in search results but we have a current value with this ID, use it
    if (!selectedDestination && value && value.id === selectedId) {
      selectedDestination = value;
    }

    if (selectedDestination) {
      onSelect(selectedDestination);
      setSearchQuery(''); // Clear search after selection
      setSearchResults([]); // Clear results after selection
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <Combobox
      options={options}
      value={value?.id || ''}
      onValueChange={handleValueChange}
      onSearch={handleSearch}
      placeholder="Search destinations..."
      searchPlaceholder="Type to search cities..."
      emptyText={isLoading ? "Searching..." : "No destinations found"}
      className={cn("w-full", className)}
    />
  );
} 