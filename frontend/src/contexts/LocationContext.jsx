import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [wardStationMap, setWardStationMap] = useState({});
  const [wardsWithCenters, setWardsWithCenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchLocations = async () => {
      try {
        const { data, error } = await api.getWardsAndStations();
        if (error) throw error;
        
        if (data && mounted) {
          setWardStationMap(data);
          
          // Transform map into the expected array format for compatibility
          const formattedWards = Object.entries(data).map(([wardName, stations]) => ({
            id: wardName.toLowerCase().replace(/\s+/g, '_'),
            name: wardName,
            label: `${wardName} Ward`,
            centers: stations
          }));
          
          setWardsWithCenters(formattedWards);
        }
      } catch (err) {
        console.error("Failed to fetch location data:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchLocations();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <LocationContext.Provider value={{ wardStationMap, wardsWithCenters, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationData() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationData must be used within a LocationProvider');
  }
  return context;
}
