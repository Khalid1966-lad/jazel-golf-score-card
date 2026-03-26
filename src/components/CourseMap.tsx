'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X, Navigation, Loader2, ZoomIn, ZoomOut, Locate, Map, Satellite, ArrowUp, RotateCcw, Compass, RefreshCw, Pencil } from 'lucide-react';
import { toast } from 'sonner';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Types
interface CourseHole {
  id: string;
  holeNumber: number;
  par: number;
  handicap: number | null;
  teeLatitude?: number | null;
  teeLongitude?: number | null;
  greenLatitude?: number | null;
  greenLongitude?: number | null;
}

interface GolfCourse {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  totalHoles: number;
  holes: CourseHole[];
}

interface UserClub {
  id: string;
  clubName: string;
  estimatedDistance: number | null;
  sortOrder: number;
}

interface WeatherData {
  current: {
    windDirection: string;
    windSpeed: number;
  };
}

interface CourseMapProps {
  course: GolfCourse;
  currentHole: number;
  onHoleChange: (hole: number) => void;
  distanceUnit: 'yards' | 'meters';
  onClose: () => void;
  userClubs?: UserClub[];
  weatherData?: WeatherData | null;
  onRefreshWeather?: () => void;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

// Calculate bearing from point 1 to point 2 (in degrees)
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

// Get hole green location
function getHoleGreenLocation(holeNum: number, course: GolfCourse): { lat: number; lon: number } | null {
  const holeData = course.holes.find(h => h.holeNumber === holeNum);
  
  // If the hole has actual green coordinates, use them
  if (holeData?.greenLatitude != null && holeData?.greenLongitude != null) {
    return {
      lat: holeData.greenLatitude,
      lon: holeData.greenLongitude
    };
  }
  
  // Otherwise, estimate green location based on hole number and course center
  const holeSpacing = 0.003; // Roughly 300m between holes
  const angle = ((holeNum - 1) * 20) * Math.PI / 180;
  
  return {
    lat: course.latitude + Math.cos(angle) * holeSpacing * ((holeNum - 1) % 9),
    lon: course.longitude + Math.sin(angle) * holeSpacing * ((holeNum - 1) % 9)
  };
}

// Get hole tee location
function getHoleTeeLocation(holeNum: number, course: GolfCourse): { lat: number; lon: number } | null {
  const holeData = course.holes.find(h => h.holeNumber === holeNum);
  
  // If the hole has actual tee coordinates, use them
  if (holeData?.teeLatitude != null && holeData?.teeLongitude != null) {
    return {
      lat: holeData.teeLatitude,
      lon: holeData.teeLongitude
    };
  }
  
  return null;
}

export default function CourseMap({ 
  course, 
  currentHole, 
  onHoleChange, 
  distanceUnit,
  onClose,
  userClubs = [],
  weatherData,
  onRefreshWeather
}: CourseMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('satellite');
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [mapRotation, setMapRotation] = useState(0);
  const [showCompass, setShowCompass] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const greenMarkerRef = useRef<L.Marker | null>(null);
  const teeMarkerRef = useRef<L.Marker | null>(null);
  const courseMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clickedMarkerRef = useRef<L.Marker | null>(null);
  const distanceLineRef = useRef<L.Polyline | null>(null);
  const teeToGreenLineRef = useRef<L.Polyline | null>(null);
  const initializedRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const userZoomRef = useRef<number | null>(null); // Track user's manual zoom level
  const isFirstHoleLoadRef = useRef(true); // Track if this is the first hole load

  // Memoize green location to prevent recalculation
  const greenLocation = useMemo(() => getHoleGreenLocation(currentHole, course), [currentHole, course]);
  
  // Memoize tee location
  const teeLocation = useMemo(() => getHoleTeeLocation(currentHole, course), [currentHole, course]);
  
  // Calculate bearing from tee to green (for direction indicator)
  const teeToGreenBearing = useMemo(() => {
    if (teeLocation && greenLocation) {
      return calculateBearing(teeLocation.lat, teeLocation.lon, greenLocation.lat, greenLocation.lon);
    }
    return null;
  }, [teeLocation, greenLocation]);

  // Calculate bearing from user to green (flag) for compass
  const userToFlagBearing = useMemo(() => {
    if (userLocation && greenLocation) {
      return calculateBearing(userLocation.lat, userLocation.lon, greenLocation.lat, greenLocation.lon);
    }
    return null;
  }, [userLocation, greenLocation]);

  // Calculate distance to green
  const distanceToGreen = useMemo(() => {
    if (userLocation && greenLocation) {
      return Math.round(calculateDistance(
        userLocation.lat, 
        userLocation.lon, 
        greenLocation.lat, 
        greenLocation.lon
      ));
    }
    return null;
  }, [userLocation, greenLocation]);

  // Calculate distance to clicked point
  const distanceToClickedPoint = useMemo(() => {
    if (userLocation && clickedPoint) {
      return Math.round(calculateDistance(
        userLocation.lat, 
        userLocation.lon, 
        clickedPoint.lat, 
        clickedPoint.lon
      ));
    }
    return null;
  }, [userLocation, clickedPoint]);

  // Get distance in the user's preferred unit
  const getDistanceInUnit = useCallback((meters: number): number => {
    if (distanceUnit === 'yards') {
      return Math.round(meters * 1.09361);
    }
    return Math.round(meters);
  }, [distanceUnit]);

  // Find the best club for a given distance (in meters)
  const findBestClub = useCallback((distanceInMeters: number): UserClub | null => {
    if (!userClubs || userClubs.length === 0) return null;
    
    // Filter clubs that have estimated distance
    const clubsWithDistance = userClubs.filter(c => c.estimatedDistance != null && c.estimatedDistance > 0);
    if (clubsWithDistance.length === 0) return null;
    
    // Convert distance to the unit the user uses for their clubs
    const targetDistance = getDistanceInUnit(distanceInMeters);
    
    // Find the club with the closest distance
    let bestClub: UserClub | null = null;
    let smallestDiff = Infinity;
    
    for (const club of clubsWithDistance) {
      const diff = Math.abs((club.estimatedDistance || 0) - targetDistance);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestClub = club;
      }
    }
    
    return bestClub;
  }, [userClubs, getDistanceInUnit]);

  // Best club for target point
  const bestClubForTarget = useMemo(() => {
    if (distanceToClickedPoint) {
      return findBestClub(distanceToClickedPoint);
    }
    return null;
  }, [distanceToClickedPoint, findBestClub]);

  // Tile layer URLs
  const streetLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteLayer = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  // Initialize map once
  useEffect(() => {
    if (typeof window === 'undefined' || initializedRef.current || !mapRef.current) return;

    // Dynamic import of Leaflet and leaflet-rotate
    // leaflet-rotate must be imported after leaflet so it can patch it
    import('leaflet').then((L) => {
      const LDefault = L.default;
      
      // Set default icon path
      delete (LDefault.Icon.prototype as any)._getIconUrl;
      LDefault.Icon.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Import leaflet-rotate to add rotation support
      return import('leaflet-rotate').then(() => {
        // Create map with rotation enabled
        const map = LDefault.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: true,
          rotate: true,
          touchRotate: true,
          rotateControl: false
        }).setView([course.latitude, course.longitude], 15);

        return { map, LDefault };
      }).catch(() => {
        // Fallback without rotation if leaflet-rotate fails
        console.log('leaflet-rotate not available, rotation disabled');
        const map = LDefault.map(mapRef.current!, {
          zoomControl: false,
          attributionControl: true
        }).setView([course.latitude, course.longitude], 15);
        
        return { map, LDefault };
      });
    }).then((result) => {
      if (!result) return;
      
      const { map, LDefault } = result;

      // Add initial tile layer (satellite by default for golf courses)
      tileLayerRef.current = LDefault.tileLayer(satelliteLayer, {
        attribution: 'Tiles © Esri',
        maxZoom: 19
      }).addTo(map);

      // Add course marker
      const courseIcon = LDefault.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #39638b; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">⛳</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      courseMarkerRef.current = LDefault.marker([course.latitude, course.longitude], { icon: courseIcon })
        .addTo(map)
        .bindPopup(`<b>${course.name}</b><br>${course.city}`);

      // Add click handler for distance measurement
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setClickedPoint({ lat, lon: lng });
      });

      // Listen for rotation changes (only if supported)
      if (typeof map.getBearing === 'function') {
        map.on('rotate', () => {
          try {
            const bearing = map.getBearing();
            setMapRotation(bearing);
          } catch (e) {
            // Ignore rotation errors
          }
        });
      }

      // Listen for zoom changes to track user's manual zoom
      map.on('zoomend', () => {
        try {
          const currentZoom = map.getZoom();
          userZoomRef.current = currentZoom;
        } catch (e) {
          // Ignore zoom errors
        }
      });

      mapInstanceRef.current = map;
      initializedRef.current = true;
      setMapReady(true);

      // Store L reference globally for other effects
      (window as any).__L__ = LDefault;
    }).catch((error) => {
      console.error('Failed to initialize map:', error);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        initializedRef.current = false;
        setMapReady(false);
      }
    };
  }, []); // Only run once on mount

  // Toggle map style
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current || !(window as any).__L__) return;
    
    const L = (window as any).__L__;
    
    // Remove current tile layer
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    
    // Add new tile layer
    const newLayer = mapStyle === 'satellite' ? satelliteLayer : streetLayer;
    const attribution = mapStyle === 'satellite' 
      ? 'Tiles © Esri' 
      : '© OpenStreetMap contributors';
    
    tileLayerRef.current = L.tileLayer(newLayer, {
      attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    
  }, [mapStyle]);

  // Start watching location
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    setIsLocating(true);
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy < 50) {
          setUserLocation({ lat: latitude, lon: longitude });
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Device orientation for compass - track which way device is facing
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const webkitEvent = event as any;
      
      // iOS: webkitCompassHeading gives true north directly
      if (webkitEvent.webkitCompassHeading !== undefined) {
        setDeviceHeading(webkitEvent.webkitCompassHeading);
      } 
      // Android: use alpha (compass direction)
      else if (event.alpha !== null) {
        // On Android, alpha is the compass heading in degrees (0-360)
        // It's measured counter-clockwise from North, so we need to convert
        let heading = 360 - event.alpha;
        
        // Adjust for screen orientation (portrait/landscape)
        if (typeof screen !== 'undefined' && screen.orientation) {
          const screenAngle = screen.orientation.angle || 0;
          heading = (heading + screenAngle) % 360;
        }
        
        setDeviceHeading(heading);
      }
    };

    // Check if DeviceOrientationEvent is available
    if (typeof DeviceOrientationEvent !== 'undefined') {
      // iOS 13+ requires permission
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const requestPermission = async () => {
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          } catch (e) {
            console.log('Compass permission denied');
          }
        };
        const clickHandler = () => {
          requestPermission();
          document.removeEventListener('click', clickHandler);
        };
        document.addEventListener('click', clickHandler);
      } else {
        // Android: Try deviceorientationabsolute first (more reliable for compass)
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', handleOrientation as any);
        } else {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any);
    };
  }, []);

  // Update user marker (separate from map init)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !(window as any).__L__) return;
    
    const L = (window as any).__L__;
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
    } else {
      const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { 
        icon: userIcon,
        zIndexOffset: 1000 
      })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>Your Location</b>');
    }

    // Update distance line if clicked point exists
    if (clickedPoint && distanceLineRef.current) {
      distanceLineRef.current.setLatLngs([
        [userLocation.lat, userLocation.lon],
        [clickedPoint.lat, clickedPoint.lon]
      ]);
    }
  }, [userLocation, clickedPoint]);

  // Update green marker and tee marker when hole changes (or on initial load)
  useEffect(() => {
    if (!mapInstanceRef.current || !greenLocation || !(window as any).__L__ || !mapReady) return;
    
    const L = (window as any).__L__;
    
    // Update Green marker
    if (greenMarkerRef.current) {
      greenMarkerRef.current.setLatLng([greenLocation.lat, greenLocation.lon]);
      greenMarkerRef.current.setPopupContent(`<b>Hole ${currentHole} Green</b>`);
    } else {
      const greenIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #22c55e; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">G</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      greenMarkerRef.current = L.marker([greenLocation.lat, greenLocation.lon], { icon: greenIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>Hole ${currentHole} Green</b>`);
    }
    
    // Update Tee marker
    if (teeLocation) {
      if (teeMarkerRef.current) {
        teeMarkerRef.current.setLatLng([teeLocation.lat, teeLocation.lon]);
        teeMarkerRef.current.setPopupContent(`<b>Hole ${currentHole} Tee</b>`);
      } else {
        const teeIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #f59e0b; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L12 22"/>
              <path d="M5 12L12 5L19 12"/>
            </svg>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        teeMarkerRef.current = L.marker([teeLocation.lat, teeLocation.lon], { icon: teeIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>Hole ${currentHole} Tee</b>`);
      }
      
      // Draw line from tee to green (green dashed line)
      if (teeToGreenLineRef.current) {
        teeToGreenLineRef.current.setLatLngs([
          [teeLocation.lat, teeLocation.lon],
          [greenLocation.lat, greenLocation.lon]
        ]);
      } else {
        teeToGreenLineRef.current = L.polyline(
          [
            [teeLocation.lat, teeLocation.lon],
            [greenLocation.lat, greenLocation.lon]
          ],
          {
            color: '#22c55e',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10'
          }
        ).addTo(mapInstanceRef.current);
      }

      // Center between tee and green
      const centerLat = (teeLocation.lat + greenLocation.lat) / 2;
      const centerLon = (teeLocation.lon + greenLocation.lon) / 2;

      // Automatically rotate map so green is at top and tee at bottom
      if (typeof mapInstanceRef.current.setBearing === 'function' && teeToGreenBearing !== null) {
        // Rotate so green appears at top (north = bearing to green)
        mapInstanceRef.current.setBearing(-teeToGreenBearing);
        setMapRotation(-teeToGreenBearing);
      }

      // Determine zoom level
      if (isFirstHoleLoadRef.current) {
        // On first load, use fitBounds to show tee at bottom and green at top with minimal padding
        const bounds = L.latLngBounds([
          [teeLocation.lat, teeLocation.lon],
          [greenLocation.lat, greenLocation.lon]
        ]);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [20, 40], // Minimal padding: left/right 20px, top/bottom 40px
          animate: true
        });
      } else if (userZoomRef.current !== null) {
        // User manually zoomed - preserve their zoom level
        mapInstanceRef.current.setView([centerLat, centerLon], userZoomRef.current, { animate: true });
      } else {
        // No manual zoom - use fitBounds
        const bounds = L.latLngBounds([
          [teeLocation.lat, teeLocation.lon],
          [greenLocation.lat, greenLocation.lon]
        ]);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [20, 40],
          animate: true
        });
      }
      isFirstHoleLoadRef.current = false;
    } else {
      // No tee location - just pan to green (preserves zoom and rotation)
      mapInstanceRef.current.panTo([greenLocation.lat, greenLocation.lon], { 
        animate: true,
        duration: 0.5
      });
      
      // Reset rotation if it was set
      if (typeof mapInstanceRef.current.setBearing === 'function') {
        mapInstanceRef.current.setBearing(0);
        setMapRotation(0);
      }
      
      // Remove tee marker and line if they exist
      if (teeMarkerRef.current) {
        mapInstanceRef.current.removeLayer(teeMarkerRef.current);
        teeMarkerRef.current = null;
      }
      if (teeToGreenLineRef.current) {
        mapInstanceRef.current.removeLayer(teeToGreenLineRef.current);
        teeToGreenLineRef.current = null;
      }
    }
  }, [greenLocation, teeLocation, currentHole, teeToGreenBearing, mapReady]);

  // Update clicked point marker and line
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).__L__) return;
    
    const L = (window as any).__L__;
    
    if (clickedPoint) {
      // Create or update clicked marker
      const clickedIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #f59e0b; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Build popup content with club suggestion
      let popupContent = '<b>Target Point</b>';
      if (bestClubForTarget) {
        const clubDistance = bestClubForTarget.estimatedDistance;
        const unitLabel = distanceUnit === 'yards' ? 'yds' : 'm';
        popupContent = `<b>Target Point</b><br><span style="color: #059669; font-weight: 600;">🏌️ ${bestClubForTarget.clubName}</span><br><span style="font-size: 11px; color: #666;">${clubDistance} ${unitLabel}</span>`;
      }

      if (clickedMarkerRef.current) {
        clickedMarkerRef.current.setLatLng([clickedPoint.lat, clickedPoint.lon]);
        clickedMarkerRef.current.setPopupContent(popupContent);
      } else {
        clickedMarkerRef.current = L.marker([clickedPoint.lat, clickedPoint.lon], { 
          icon: clickedIcon,
          zIndexOffset: 500 
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(popupContent);
      }

      // Create or update distance line
      if (userLocation) {
        if (distanceLineRef.current) {
          distanceLineRef.current.setLatLngs([
            [userLocation.lat, userLocation.lon],
            [clickedPoint.lat, clickedPoint.lon]
          ]);
        } else {
          distanceLineRef.current = L.polyline(
            [
              [userLocation.lat, userLocation.lon],
              [clickedPoint.lat, clickedPoint.lon]
            ],
            {
              color: '#f59e0b',
              weight: 3,
              opacity: 0.8,
              dashArray: '10, 10'
            }
          ).addTo(mapInstanceRef.current);
        }
      }
    } else {
      // Remove clicked marker and line
      if (clickedMarkerRef.current) {
        mapInstanceRef.current.removeLayer(clickedMarkerRef.current);
        clickedMarkerRef.current = null;
      }
      if (distanceLineRef.current) {
        mapInstanceRef.current.removeLayer(distanceLineRef.current);
        distanceLineRef.current = null;
      }
    }
  }, [clickedPoint, userLocation, bestClubForTarget, distanceUnit]);

  // Map controls
  const centerOnUser = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 17, { animate: true });
    }
  }, [userLocation]);

  const centerOnCourse = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([course.latitude, course.longitude], 15, { animate: true });
    }
  }, [course]);

  const zoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const zoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  const toggleMapStyle = useCallback(() => {
    setMapStyle(prev => prev === 'satellite' ? 'street' : 'satellite');
  }, []);

  const clearClickedPoint = useCallback(() => {
    setClickedPoint(null);
  }, []);

  // Reset map rotation to north
  const resetRotation = useCallback(() => {
    if (mapInstanceRef.current && typeof mapInstanceRef.current.setBearing === 'function') {
      mapInstanceRef.current.setBearing(0);
      setMapRotation(0);
    }
  }, []);

  // Rotate map to align with tee-to-green direction (green at top)
  const rotateToHoleDirection = useCallback(() => {
    if (mapInstanceRef.current && typeof mapInstanceRef.current.setBearing === 'function' && teeToGreenBearing !== null) {
      mapInstanceRef.current.setBearing(-teeToGreenBearing);
      setMapRotation(-teeToGreenBearing);
    }
  }, [teeToGreenBearing]);

  // Format distance
  const formatDistance = (meters: number): string => {
    if (distanceUnit === 'yards') {
      return `${Math.round(meters * 1.09361)} yds`;
    }
    return `${Math.round(meters)} m`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
      {/* Distance Display */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 border-b shrink-0 flex-wrap">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Hole {currentHole}</p>
          <p className="text-xs text-muted-foreground">Par {course.holes.find(h => h.holeNumber === currentHole)?.par || '-'}</p>
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div className="text-center min-w-[100px]">
          <p className="text-xs text-muted-foreground mb-1">To Green</p>
          {isLocating ? (
            <div className="flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            </div>
          ) : distanceToGreen ? (
            <p className="text-xl font-bold" style={{ color: '#22c55e' }}>{formatDistance(distanceToGreen)}</p>
          ) : (
            <span className="text-sm text-muted-foreground">--</span>
          )}
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div className="text-center min-w-[100px]">
          <p className="text-xs text-muted-foreground mb-1">To Target</p>
          {distanceToClickedPoint ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-xl font-bold text-amber-600">{formatDistance(distanceToClickedPoint)}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearClickedPoint}
                  className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              {bestClubForTarget && (
                <p className="text-xs font-semibold text-emerald-600 mt-0.5">🏌️ {bestClubForTarget.clubName}</p>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Tap map</span>
          )}
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onHoleChange(Math.max(1, currentHole - 1))}
            disabled={currentHole <= 1}
            className="h-8 w-8 p-0"
          >
            -
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onHoleChange(Math.min(course.totalHoles, currentHole + 1))}
            disabled={currentHole >= course.totalHoles}
            className="h-8 w-8 p-0"
          >
            +
          </Button>
        </div>
      </div>

      {/* Map Container - fixed size, no re-renders */}
      <div className="flex-1 relative min-h-0">
        <div 
          ref={mapRef} 
          className="absolute inset-0"
          style={{ 
            width: '100%', 
            height: '100%'
          }}
        />
        
        {/* Club Suggestion Panel - Top Left */}
        {mapReady && distanceToClickedPoint && bestClubForTarget && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-2 min-w-[120px]">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏌️</span>
              <div>
                <p className="font-bold text-sm text-emerald-600">{bestClubForTarget.clubName}</p>
                <p className="text-xs text-muted-foreground">
                  {bestClubForTarget.estimatedDistance} {distanceUnit === 'yards' ? 'yds' : 'm'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Zoom Controls */}
        {mapReady && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
              title="Return to scorecard"
            >
              <Pencil className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={zoomIn}
              className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={zoomOut}
              className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        {/* Location & Style Controls */}
        {mapReady && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCompass(true)}
              className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
              title="Show compass"
            >
              <Compass className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={toggleMapStyle}
              className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
              title={mapStyle === 'satellite' ? 'Switch to street view' : 'Switch to satellite view'}
            >
              {mapStyle === 'satellite' ? <Map className="w-5 h-5" /> : <Satellite className="w-5 h-5" />}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={centerOnUser}
              disabled={!userLocation}
              className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
              title="Center on my location"
            >
              <Locate className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={centerOnCourse}
              className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
              title="Center on course"
            >
              <Navigation className="w-5 h-5" />
            </Button>
            {/* Rotation Controls */}
            {Math.abs(mapRotation) > 1 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={resetRotation}
                className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
                title="Reset rotation (North up)"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            )}
            {teeToGreenBearing !== null && (
              <Button
                size="sm"
                variant="secondary"
                onClick={rotateToHoleDirection}
                className="h-10 w-10 p-0 bg-white/70 backdrop-blur-sm shadow-lg"
                title="Rotate to show green at top"
              >
                <ArrowUp className="w-5 h-5" style={{ transform: `rotate(${teeToGreenBearing}deg)` }} />
              </Button>
            )}
          </div>
        )}

      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 border-t shrink-0 text-xs sm:text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />
          <span className="text-muted-foreground">You</span>
        </div>
        {teeLocation && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L12 22"/>
                <path d="M5 12L12 5L19 12"/>
              </svg>
            </div>
            <span className="text-muted-foreground">Tee</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center text-white text-[8px] font-bold">G</div>
          <span className="text-muted-foreground">Green</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow" />
          <span className="text-muted-foreground">Target</span>
        </div>
      </div>

      {/* Fullscreen Compass Overlay */}
      {showCompass && (
        <div 
          className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg"
          onClick={() => setShowCompass(false)}
        >
          <div 
            className="bg-white/50 rounded-2xl shadow-2xl p-8 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Large Compass SVG - same style as weather tab */}
            <svg viewBox="0 0 100 100" className="w-64 h-64">
              {/* Background circle */}
              <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#d6e4ef" strokeWidth="2" />
              
              {/* North flag (red) - stays fixed at top of screen */}
              <line x1="50" y1="18" x2="50" y2="6" stroke="#dc2626" strokeWidth="2" />
              <polygon points="50,4 50,14 60,9" fill="#dc2626" />
              
              {/* Flag direction arrow (red) - points to the green/flag */}
              {userToFlagBearing !== null && (() => {
                // Arrow rotation = bearing to flag minus device heading
                const arrowRotation = userToFlagBearing - deviceHeading;

                return (
                  <g transform={`rotate(${arrowRotation} 50 50)`}>
                    <line x1="50" y1="50" x2="50" y2="22" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
                    <polygon points="50,12 40,32 60,32" fill="#dc2626" />
                  </g>
                );
              })()}
              
              {/* Center dot */}
              <circle cx="50" cy="50" r="6" fill="#1e3a5f" />
            </svg>

            {/* Legend for compass arrow */}
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                <span className="text-sm font-medium text-red-600">Flag</span>
              </div>
            </div>
            
            {/* Wind info */}
            {weatherData?.current && (
              <div className="mt-2 text-center">
                <p className="text-lg font-bold" style={{ color: '#39638b' }}>
                  {weatherData.current.windDirection} • {Math.round(weatherData.current.windSpeed)} km/h
                </p>
                <p className="text-sm text-muted-foreground">
                  Wind Direction
                </p>
              </div>
            )}

            {/* Last update time and refresh button */}
            <div className="mt-3 flex items-center justify-center gap-3">
              {weatherData?.updatedAt && (
                <p className="text-sm font-bold text-black">
                  Updated: {new Date(weatherData.updatedAt).toLocaleTimeString()}
                </p>
              )}
              {onRefreshWeather && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRefreshWeather}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Tap anywhere to close
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
