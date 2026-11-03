import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Complaint, LocationCoords, Language } from '../types';
import { ExternalLink, MapPin } from 'lucide-react';

interface Props {
  complaints?: Complaint[];
  selectedLocation?: LocationCoords | null;
  onSelectLocation?: (coords: LocationCoords) => void;
  interactiveSelectMode?: boolean;
  height?: string;
  zoom?: number;
  center?: [number, number];
  language?: Language;
}

// Bengaluru Center Coordinates: Majestic / Vidhana Soudha area
const DEFAULT_BLR_CENTER: [number, number] = [12.9716, 77.5946];

export default function BengaluruMap({
  complaints = [],
  selectedLocation,
  onSelectLocation,
  interactiveSelectMode = false,
  height = '400px',
  zoom = 12,
  center = DEFAULT_BLR_CENTER,
  language = 'en',
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Dark Matter or OpenStreetMap tile layer (fits sleek dark UI)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      markerGroupRef.current = markerGroup;
      mapInstanceRef.current = map;

      // Handle map clicks for manual GPS pin positioning
      if (interactiveSelectMode) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          // Approximate ward based on coordinates
          let ward = 'Ward 112 - Domlur / Indiranagar';
          let zone = 'East Zone';
          if (lat < 12.94) {
            ward = 'Ward 151 - Koramangala / Jayanagar';
            zone = 'South Zone';
          } else if (lat > 12.99) {
            ward = 'Ward 45 - Malleshwaram / Yeshwantpur';
            zone = 'North Zone';
          } else if (lng < 77.58) {
            ward = 'Ward 94 - Gandhi Nagar / Majestic';
            zone = 'West Zone';
          }

          if (onSelectLocation) {
            onSelectLocation({
              lat: Number(lat.toFixed(5)),
              lng: Number(lng.toFixed(5)),
              address: `GPS Pin: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E, Bengaluru`,
              ward,
              zone,
            });
          }
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when complaints or selectedLocation change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    markerGroup.clearLayers();

    // 1. Plot complaints list
    complaints.forEach((c) => {
      const isCleaned = c.status === 'completed' || c.status === 'reward_paid' || c.status === 'reward_approved';
      const isProgress = c.status === 'cleaning_in_progress' || c.status === 'assigned';
      
      const pinColor = isCleaned ? '#10b981' : isProgress ? '#f59e0b' : '#ef4444';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${pinColor}; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
            ${isCleaned ? '✓' : '!'}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([c.location.lat, c.location.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; min-width: 180px;">
          <div style="font-weight: 800; color: #1e293b; margin-bottom: 2px;">${c.id}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${c.location.ward}</div>
          <div style="font-weight: 600; font-size: 11px; margin-bottom: 6px;">${c.category.replace('_', ' ').toUpperCase()}</div>
          <div style="display: inline-block; padding: 2px 6px; border-radius: 6px; background-color: ${pinColor}20; color: ${pinColor}; font-weight: bold; font-size: 10px; margin-bottom: 8px;">
            ${c.status.replace(/_/g, ' ').toUpperCase()}
          </div>
          <br/>
          <a href="https://www.google.com/maps/search/?api=1&query=${c.location.lat},${c.location.lng}" target="_blank" rel="noreferrer" style="font-size: 11px; color: #2563eb; text-decoration: underline; font-weight: 600;">
            Open in Google Maps ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markerGroup.addLayer(marker);
    });

    // 2. Selected/Active Pin (e.g. In New Report form)
    if (selectedLocation) {
      const activeIcon = L.divIcon({
        className: 'custom-active-pin',
        html: `
          <div style="background-color: #f59e0b; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #dc2626; box-shadow: 0 0 15px #f59e0b; display: flex; align-items: center; justify-content: center; color: #1e293b; font-size: 15px; font-weight: 900; animation: bounce 1s infinite alternate;">
            📍
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const selMarker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: activeIcon,
        draggable: interactiveSelectMode,
      });

      if (interactiveSelectMode) {
        selMarker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          if (onSelectLocation) {
            onSelectLocation({
              ...selectedLocation,
              lat: Number(latlng.lat.toFixed(5)),
              lng: Number(latlng.lng.toFixed(5)),
              address: `GPS Pin: ${latlng.lat.toFixed(4)}° N, ${latlng.lng.toFixed(4)}° E, Bengaluru`,
            });
          }
        });
      }

      markerGroup.addLayer(selMarker);
      selectedMarkerRef.current = selMarker;

      map.panTo([selectedLocation.lat, selectedLocation.lng]);
    }
  }, [complaints, selectedLocation, interactiveSelectMode]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[400] flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200 shadow-md">
        <MapPin className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold">
          {language === 'kn' ? 'ಬೆಂಗಳೂರು ಸ್ಮಾರ್ಟ್ ಸಿಟಿ ನಕ್ಷೆ' : 'Bengaluru Smart City Map'}
        </span>
      </div>

      {interactiveSelectMode && (
        <div className="absolute top-3 right-3 z-[400] bg-amber-500/90 text-slate-950 px-3 py-1 rounded-lg text-[11px] font-extrabold shadow-lg">
          {language === 'kn' ? 'ಸ್ಥಳ ಗುರುತಿಸಲು ನಕ್ಷೆಯಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click / Drag pin on map to set GPS'}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Google Maps External Quick Link */}
      {selectedLocation && (
        <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-amber-400 font-mono font-bold">
              {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lng.toFixed(4)}° E
            </span>
            <span className="text-slate-400 truncate">({selectedLocation.ward})</span>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.lat},${selectedLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 font-semibold transition flex-shrink-0"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
