import React, { useState, useCallback, useEffect, useMemo, createContext, useContext } from 'react';
import {
  GoogleMap as GoogleMapComponent,
  useJsApiLoader,
  MarkerF,
  PolylineF,
  InfoWindowF,
} from '@react-google-maps/api';

const libraries = ['places'];

// Context for child components like MapClickHandler
const MapClickContext = createContext(null);

export function MapClickHandler({ onMapClick }) {
  const registerClickHandler = useContext(MapClickContext);
  useEffect(() => {
    if (registerClickHandler && onMapClick) {
      registerClickHandler(onMapClick);
    }
  }, [registerClickHandler, onMapClick]);
  return null;
}

const defaultMapContainerStyle = {
  width: '100%',
  borderRadius: '6px',
};

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

function GoogleMap({
  center,
  zoom = 12,
  height = '400px',
  polyline = [],
  polylineColor = '#4285F4',
  markers = [],
  mapKey,
  onMapClick,
  children,
}) {
  const apiKey =
    process.env.REACT_APP_GOOGLE_MAPS_KEY ||
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
    '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [map, setMap] = useState(null);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(null);
  const [childClickHandler, setChildClickHandler] = useState(null);

  // Normalize center prop (supports [lat, lng] or {lat, lng})
  const mapCenter = useMemo(() => {
    if (!center) return { lat: -6.2088, lng: 106.8456 };
    if (Array.isArray(center)) {
      return { lat: Number(center[0]), lng: Number(center[1]) };
    }
    if (typeof center === 'object') {
      return {
        lat: Number(center.lat ?? center.latitude ?? -6.2088),
        lng: Number(center.lng ?? center.longitude ?? 106.8456),
      };
    }
    return { lat: -6.2088, lng: 106.8456 };
  }, [center]);

  // Normalize polyline prop (supports [[lat, lng], ...] or [{lat, lng}, ...])
  const polylinePath = useMemo(() => {
    if (!polyline || !Array.isArray(polyline)) return [];
    return polyline
      .map((pt) => {
        if (Array.isArray(pt) && pt.length >= 2) {
          return { lat: Number(pt[0]), lng: Number(pt[1]) };
        }
        if (pt && typeof pt === 'object') {
          return {
            lat: Number(pt.lat ?? pt.latitude),
            lng: Number(pt.lng ?? pt.longitude),
          };
        }
        return null;
      })
      .filter((pt) => pt && !isNaN(pt.lat) && !isNaN(pt.lng));
  }, [polyline]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (map && mapCenter) {
      map.panTo(mapCenter);
    }
  }, [map, mapCenter]);

  // Update zoom when prop changes
  useEffect(() => {
    if (map && zoom != null) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  const handleMapClickInternal = useCallback(
    (e) => {
      setSelectedMarkerIndex(null);
      if (e && e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (onMapClick) {
          onMapClick(lat, lng);
        }
        if (childClickHandler) {
          childClickHandler(lat, lng);
        }
      }
    },
    [onMapClick, childClickHandler]
  );

  const containerStyle = useMemo(
    () => ({
      ...defaultMapContainerStyle,
      height,
    }),
    [height]
  );

  if (loadError) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-red-50 text-red-600 rounded-lg p-4 border border-red-200 text-sm"
      >
        Gagal memuat Google Maps. Periksa API key atau koneksi internet.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg p-4 text-sm animate-pulse"
      >
        Memuat Google Maps...
      </div>
    );
  }

  return (
    <MapClickContext.Provider value={setChildClickHandler}>
      <GoogleMapComponent
        key={mapKey}
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClickInternal}
        options={defaultOptions}
      >
        {/* Polyline rute */}
        {polylinePath.length > 0 && (
          <PolylineF
            path={polylinePath}
            options={{
              strokeColor: polylineColor,
              strokeOpacity: 0.9,
              strokeWeight: 4,
            }}
          />
        )}

        {/* Markers */}
        {markers.map((marker, idx) => {
          const lat = Number(marker.lat ?? marker.latitude);
          const lng = Number(marker.lng ?? marker.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          const position = { lat, lng };

          let icon = undefined;
          let label = undefined;

          if (marker.color === 'green') {
            icon = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
          } else if (marker.label != null) {
            if (window.google?.maps?.SymbolPath) {
              icon = {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#2563eb',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 13,
              };
              label = {
                text: String(marker.label),
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
              };
            }
          }

          return (
            <React.Fragment key={idx}>
              <MarkerF
                position={position}
                icon={icon}
                label={label}
                onClick={() => setSelectedMarkerIndex(idx)}
              />
              {selectedMarkerIndex === idx && marker.popup && (
                <InfoWindowF
                  position={position}
                  onCloseClick={() => setSelectedMarkerIndex(null)}
                >
                  <div className="p-1 text-sm text-gray-800">
                    {marker.popup}
                  </div>
                </InfoWindowF>
              )}
            </React.Fragment>
          );
        })}

        {/* Slot untuk elemen tambahan / context */}
        {children}
      </GoogleMapComponent>
    </MapClickContext.Provider>
  );
}

export default GoogleMap;
