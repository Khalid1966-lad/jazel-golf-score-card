import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '@/lib/db';

const execAsync = promisify(exec);

// Weather code to description and icon mapping (WMO codes)
const weatherCodeMap: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: 'sun' },
  1: { description: 'Mainly clear', icon: 'sun' },
  2: { description: 'Partly cloudy', icon: 'cloud-sun' },
  3: { description: 'Overcast', icon: 'cloud' },
  45: { description: 'Foggy', icon: 'cloud-fog' },
  48: { description: 'Depositing rime fog', icon: 'cloud-fog' },
  51: { description: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { description: 'Moderate drizzle', icon: 'cloud-drizzle' },
  55: { description: 'Dense drizzle', icon: 'cloud-drizzle' },
  56: { description: 'Freezing drizzle', icon: 'cloud-drizzle' },
  57: { description: 'Dense freezing drizzle', icon: 'cloud-drizzle' },
  61: { description: 'Slight rain', icon: 'cloud-rain' },
  63: { description: 'Moderate rain', icon: 'cloud-rain' },
  65: { description: 'Heavy rain', icon: 'cloud-rain' },
  66: { description: 'Freezing rain', icon: 'cloud-rain' },
  67: { description: 'Heavy freezing rain', icon: 'cloud-rain' },
  71: { description: 'Slight snow', icon: 'cloud-snow' },
  73: { description: 'Moderate snow', icon: 'cloud-snow' },
  75: { description: 'Heavy snow', icon: 'cloud-snow' },
  77: { description: 'Snow grains', icon: 'cloud-snow' },
  80: { description: 'Slight rain showers', icon: 'cloud-rain' },
  81: { description: 'Moderate rain showers', icon: 'cloud-rain' },
  82: { description: 'Violent rain showers', icon: 'cloud-rain' },
  85: { description: 'Slight snow showers', icon: 'cloud-snow' },
  86: { description: 'Heavy snow showers', icon: 'cloud-snow' },
  95: { description: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { description: 'Thunderstorm with hail', icon: 'cloud-lightning' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' },
};

// Night weather codes (same as day but with moon)
const weatherCodeMapNight: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: 'moon' },
  1: { description: 'Mainly clear', icon: 'moon' },
  2: { description: 'Partly cloudy', icon: 'cloud-moon' },
  3: { description: 'Overcast', icon: 'cloud' },
  45: { description: 'Foggy', icon: 'cloud-fog' },
  48: { description: 'Depositing rime fog', icon: 'cloud-fog' },
  51: { description: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { description: 'Moderate drizzle', icon: 'cloud-drizzle' },
  55: { description: 'Dense drizzle', icon: 'cloud-drizzle' },
  56: { description: 'Freezing drizzle', icon: 'cloud-drizzle' },
  57: { description: 'Dense freezing drizzle', icon: 'cloud-drizzle' },
  61: { description: 'Slight rain', icon: 'cloud-rain' },
  63: { description: 'Moderate rain', icon: 'cloud-rain' },
  65: { description: 'Heavy rain', icon: 'cloud-rain' },
  66: { description: 'Freezing rain', icon: 'cloud-rain' },
  67: { description: 'Heavy freezing rain', icon: 'cloud-rain' },
  71: { description: 'Slight snow', icon: 'cloud-snow' },
  73: { description: 'Moderate snow', icon: 'cloud-snow' },
  75: { description: 'Heavy snow', icon: 'cloud-snow' },
  77: { description: 'Snow grains', icon: 'cloud-snow' },
  80: { description: 'Slight rain showers', icon: 'cloud-rain' },
  81: { description: 'Moderate rain showers', icon: 'cloud-rain' },
  82: { description: 'Violent rain showers', icon: 'cloud-rain' },
  85: { description: 'Slight snow showers', icon: 'cloud-snow' },
  86: { description: 'Heavy snow showers', icon: 'cloud-snow' },
  95: { description: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { description: 'Thunderstorm with hail', icon: 'cloud-lightning' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'cloud-lightning' },
};

// Wind direction from degrees
const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

// Check if it's night time (before 6am or after 7pm)
const isNightTime = (hour: number): boolean => {
  return hour < 6 || hour >= 19;
};

// Fetch URL using curl (workaround for sandbox network restrictions)
const fetchWithCurl = async (url: string): Promise<string> => {
  try {
    const { stdout } = await execAsync(`curl -s --max-time 10 "${url}"`);
    return stdout;
  } catch (error) {
    throw new Error('Failed to fetch data');
  }
};

// GET /api/weather - Get weather data for location
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Fetch weather data from Open-Meteo using curl
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation_probability,precipitation&daily=sunrise,sunset&timezone=auto&forecast_hours=24`;
    
    const weatherDataRaw = await fetchWithCurl(weatherUrl);
    const data = JSON.parse(weatherDataRaw);

    // Get location name from reverse geocoding using curl
    let cityName = 'Unknown';
    let countryName = '';
    
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
      const geoDataRaw = await fetchWithCurl(geoUrl);
      const geoData = JSON.parse(geoDataRaw);
      const address = geoData.address || {};
      
      // Try multiple city fields in order of preference
      cityName = address.city || 
                 address.town || 
                 address.village ||
                 address.municipality ||
                 address.county ||
                 address.state_district ||
                 address.region ||
                 address.state ||
                 geoData.display_name?.split(',')[0] ||
                 'Unknown';
      
      countryName = address.country || '';
    } catch (geoError) {
      console.error('Geocoding error:', geoError);
      // Try to find nearby golf course in database as fallback
      try {
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        const nearbyCourse = await db.golfCourse.findFirst({
          where: {
            latitude: { gte: latNum - 0.5, lte: latNum + 0.5 },
            longitude: { gte: lonNum - 0.5, lte: lonNum + 0.5 },
          },
        });
        if (nearbyCourse) {
          cityName = nearbyCourse.city;
          countryName = nearbyCourse.country;
        }
      } catch {
        // Ignore database errors
      }
    }

    // Process current weather
    const current = data.current;
    
    // Get local time from timezone
    const timezone = data.timezone;
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const localHour = localTime.getHours();
    const isNight = isNightTime(localHour);
    
    // Use night icons if it's night time
    const weatherMap = isNight ? weatherCodeMapNight : weatherCodeMap;
    const weatherInfo = weatherMap[current.weather_code] || { description: 'Unknown', icon: 'cloud' };

    // Process hourly forecast
    const hourlyForecast = [];
    
    for (let i = 0; i < data.hourly.time.length; i++) {
      const hourTime = new Date(data.hourly.time[i]);
      
      // Only show next 12 hours
      if (hourTime > now && hourlyForecast.length < 12) {
        const hourNum = hourTime.getHours();
        const hourIsNight = isNightTime(hourNum);
        const hourWeatherMap = hourIsNight ? weatherCodeMapNight : weatherCodeMap;
        const hourWeather = hourWeatherMap[data.hourly.weather_code[i]] || { description: 'Unknown', icon: 'cloud' };
        
        hourlyForecast.push({
          time: hourTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
          hour: hourNum,
          temperature: Math.round(data.hourly.temperature_2m[i]),
          weatherCode: data.hourly.weather_code[i],
          weatherDescription: hourWeather.description,
          weatherIcon: hourWeather.icon,
          windSpeed: Math.round(data.hourly.wind_speed_10m[i]),
          precipitationProbability: data.hourly.precipitation_probability[i] || 0,
          precipitation: data.hourly.precipitation[i] || 0,
          isNight: hourIsNight,
        });
      }
    }

    // Get sunrise/sunset times
    let sunrise: string | null = null;
    let sunset: string | null = null;
    if (data.daily?.sunrise?.[0] && data.daily?.sunset?.[0]) {
      sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      sunset = new Date(data.daily.sunset[0]).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }

    const weatherData = {
      current: {
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        weatherCode: current.weather_code,
        weatherDescription: weatherInfo.description,
        weatherIcon: weatherInfo.icon,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: getWindDirection(current.wind_direction_10m),
        windGusts: Math.round(current.wind_gusts_10m),
      },
      location: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        city: cityName,
        country: countryName,
        timezone: timezone,
      },
      time: {
        local: localTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        localHour: localHour,
        date: localTime.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        isNight: isNight,
        sunrise: sunrise,
        sunset: sunset,
      },
      hourly: hourlyForecast,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ weather: weatherData });
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data. Please check your internet connection.' },
      { status: 500 }
    );
  }
}
