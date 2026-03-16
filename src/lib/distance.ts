/**
 * Distance utility functions for golf scorecard app
 * Supports both imperial (yards/miles) and metric (meters/kilometers) units
 */

export type DistanceUnit = 'yards' | 'meters';

// Conversion constants
const METERS_PER_YARD = 0.9144;
const YARDS_PER_METER = 1.09361;
const KM_PER_MILE = 1.60934;
const MILES_PER_KM = 0.621371;

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
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * MILES_PER_KM;
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE;
}

/**
 * Format a distance in km to the user's preferred unit (km or miles)
 * @param distanceInKm - The distance in kilometers
 * @param unit - The user's preferred unit ('yards' or 'meters')
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with distance and unit
 */
export function formatKmDistance(
  distanceInKm: number,
  unit: DistanceUnit,
  decimals: number = 1
): string {
  if (unit === 'yards') {
    // Convert to miles for imperial
    const miles = kmToMiles(distanceInKm);
    return `${miles.toFixed(decimals)} mi`;
  }
  // Keep in km for metric
  return `${distanceInKm.toFixed(decimals)} km`;
}

/**
 * Format a distance in meters for short distances (GPS, shots, etc.)
 * @param distanceInMeters - The distance in meters
 * @param unit - The user's preferred unit
 * @returns Formatted string with distance and unit
 */
export function formatShortDistance(distanceInMeters: number, unit: DistanceUnit): string {
  if (unit === 'yards') {
    const yards = metersToYards(distanceInMeters);
    return `${Math.round(yards)} yd`;
  }
  return `${Math.round(distanceInMeters)} m`;
}

/**
 * Get the unit label for long distances (km or mi)
 * @param unit - The distance unit
 * @returns The unit label (km or mi)
 */
export function getLongDistanceUnitLabel(unit: DistanceUnit): string {
  return unit === 'yards' ? 'mi' : 'km';
}

/**
 * Get the unit label for short distances (yd or m)
 * @param unit - The distance unit
 * @returns The unit label (yd or m)
 */
export function getShortDistanceUnitLabel(unit: DistanceUnit): string {
  return unit === 'yards' ? 'yd' : 'm';
}

/**
 * Get the full unit label for display
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
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
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
  const distanceInKm = calculateDistanceKm(lat1, lon1, lat2, lon2);
  return formatKmDistance(distanceInKm, unit);
}

/**
 * Convert a nearby distance preference from km to user's preferred unit for display
 * @param distanceInKm - The distance in km
 * @param unit - The user's preferred unit
 * @returns The distance in the user's preferred unit
 */
export function convertKmToUserUnit(distanceInKm: number, unit: DistanceUnit): number {
  if (unit === 'yards') {
    return kmToMiles(distanceInKm);
  }
  return distanceInKm;
}

/**
 * Convert a distance from user's preferred unit back to km for storage/API
 * @param distance - The distance in user's preferred unit
 * @param unit - The user's preferred unit
 * @returns The distance in km
 */
export function convertUserUnitToKm(distance: number, unit: DistanceUnit): number {
  if (unit === 'yards') {
    return milesToKm(distance);
  }
  return distance;
}
