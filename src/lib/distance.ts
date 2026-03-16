/**
 * Distance utility functions for golf scorecard app
 * Supports both imperial (yards/miles) and metric (meters/kilometers) units
 */

export type DistanceUnit = 'yards' | 'meters';

// Conversion constants
const METERS_PER_YARD = 0.9144;
const YARDS_PER_METER = 1.09361;
const METERS_PER_KM = 1000;
const YARDS_PER_MILE = 1760;

/**
 * Convert meters to yards
 */
export function metersToYards(meters: number): number {
  return meters * YARDS_PER_METER;
}

/**
 * Convert yards to meters
 */
export function yardsToMeters(yards: number): number {
  return yards * METERS_PER_YARD;
}

/**
 * Convert a distance value to the user's preferred unit
 * @param distanceInMeters - The distance in meters (internal storage format)
 * @param unit - The user's preferred unit ('yards' or 'meters')
 * @returns The distance in the user's preferred unit
 */
export function convertDistance(distanceInMeters: number, unit: DistanceUnit): number {
  if (unit === 'yards') {
    return metersToYards(distanceInMeters);
  }
  return distanceInMeters;
}

/**
 * Convert a distance from the user's preferred unit back to meters (for storage)
 * @param distance - The distance in the user's preferred unit
 * @param unit - The user's preferred unit ('yards' or 'meters')
 * @returns The distance in meters
 */
export function convertToMeters(distance: number, unit: DistanceUnit): number {
  if (unit === 'yards') {
    return yardsToMeters(distance);
  }
  return distance;
}

/**
 * Format a distance for display with the appropriate unit
 * @param distanceInMeters - The distance in meters
 * @param unit - The user's preferred unit
 * @param decimals - Number of decimal places (default: 0 for short distances, 1 for long)
 * @returns Formatted string with distance and unit
 */
export function formatDistance(
  distanceInMeters: number,
  unit: DistanceUnit,
  decimals?: number
): string {
  const converted = convertDistance(distanceInMeters, unit);
  const actualDecimals = decimals ?? (converted >= 100 ? 0 : 0);
  const rounded = Math.round(converted * Math.pow(10, actualDecimals)) / Math.pow(10, actualDecimals);
  const unitLabel = unit === 'yards' ? 'yd' : 'm';
  return `${rounded.toLocaleString()} ${unitLabel}`;
}

/**
 * Format a long distance (for GPS distances like to green, to hazards, etc.)
 * @param distanceInMeters - The distance in meters
 * @param unit - The user's preferred unit
 * @returns Formatted string with distance and unit
 */
export function formatLongDistance(distanceInMeters: number, unit: DistanceUnit): string {
  const converted = convertDistance(distanceInMeters, unit);
  
  // For very long distances, show in km or miles
  if (unit === 'yards' && converted >= YARDS_PER_MILE / 2) {
    const miles = converted / YARDS_PER_MILE;
    return `${miles.toFixed(1)} mi`;
  }
  
  if (unit === 'meters' && distanceInMeters >= METERS_PER_KM / 2) {
    const km = distanceInMeters / METERS_PER_KM;
    return `${km.toFixed(1)} km`;
  }
  
  return formatDistance(distanceInMeters, unit);
}

/**
 * Format distance for GPS display (front/middle/back of green)
 * @param distanceInMeters - The distance in meters
 * @param unit - The user's preferred unit
 * @returns Formatted string for GPS display
 */
export function formatGPSDistance(distanceInMeters: number, unit: DistanceUnit): string {
  const converted = convertDistance(distanceInMeters, unit);
  const rounded = Math.round(converted);
  const unitLabel = unit === 'yards' ? 'yd' : 'm';
  return `${rounded} ${unitLabel}`;
}

/**
 * Get the unit label for display
 * @param unit - The distance unit
 * @param plural - Whether to use plural form
 * @returns The unit label
 */
export function getUnitLabel(unit: DistanceUnit, plural: boolean = false): string {
  if (unit === 'yards') {
    return plural ? 'yards' : 'yard';
  }
  return plural ? 'meters' : 'meter';
}

/**
 * Get the short unit label for display
 * @param unit - The distance unit
 * @returns The short unit label (yd or m)
 */
export function getShortUnitLabel(unit: DistanceUnit): string {
  return unit === 'yards' ? 'yd' : 'm';
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Calculate and format distance between two GPS coordinates
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @param unit - The user's preferred unit
 * @returns Formatted distance string
 */
export function calculateAndFormatDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: DistanceUnit
): string {
  const distanceInMeters = calculateDistance(lat1, lon1, lat2, lon2);
  return formatGPSDistance(distanceInMeters, unit);
}
