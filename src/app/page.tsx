'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Circle, Trophy, User, Menu, X, 
  ChevronRight, ChevronLeft, Star, Clock, TrendingUp, Target, 
  Plus, Check, Navigation, Wind, Thermometer, Sun,
  Bot, Ruler, Compass, Cloud, RefreshCw, Play, Pause,
  Save, Trash2, Edit2, AlertCircle, Heart, Settings, LogOut,
  Camera, Loader2, Upload, Users, ChevronDown,
  BarChart3, TrendingDown, Download, CloudRain, CloudSnow,
  CloudLightning, CloudDrizzle, CloudFog, CloudSun, Droplets,
  Moon, CloudMoon, Sunrise, Sunset, Bell, Mail, Calendar, BookOpen,
  Map as MapIcon, Flag, Medal
} from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { 
  formatTemperature, 
  convertWindSpeed, 
  getWindSpeedUnitLabel,
  convertUserUnitToKm,
  formatKmDistance,
  formatShortDistance,
  type DistanceUnit 
} from '@/lib/distance';
import CourseMap from '@/components/CourseMap';
import { BadgeCollection } from '@/components/badges/BadgeCollection';

// Types
interface CourseHole {
  id: string;
  holeNumber: number;
  par: number;
  handicap: number | null;
  greenLatitude?: number | null;
  greenLongitude?: number | null;
  teeDistances?: { distance: number; tee: { id: string; name: string; color: string | null } }[];
}

interface GolfCourse {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  totalHoles: number;
  description: string | null;
  imageUrl: string | null;
  designer: string | null;
  yearBuilt: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  isActive: boolean;
  distance?: number;
  holes: CourseHole[];
  tees: { id: string; name: string; color: string | null }[];
}

interface RoundScore {
  holeNumber: number;
  strokes: number;
  putts: number;
  fairwayHit: boolean | null;
  greenInReg: boolean;
  penalties: number;
  sandShots?: number;
  chipShots?: number;
  driveDistance?: number | null;
  playerIndex?: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  handicap: number | null;
  avatar: string | null;
  city: string | null;
  country: string | null;
  isAdmin?: boolean;
  nearbyDistance?: number;
  distanceUnit?: 'yards' | 'meters';
}

interface UserStats {
  totalRounds: number;
  averageScore: number;
  averagePutts: number;
  fairwayPercentage: number;
  averageGIR: number;
  bestScore: number | null;
}

interface SavedRound {
  id: string;
  date: string;
  totalStrokes: number;
  totalPutts: number;
  fairwaysHit: number;
  fairwaysTotal: number;
  greensInReg: number;
  penalties: number;
  completed: boolean;
  courseId?: string;
  teeId?: string;
  playerNames?: string;
  holesPlayed?: number; // 9 or 18
  holesType?: string | null; // "front" or "back" for 9-hole rounds
  course: {
    id?: string;
    name: string;
    city: string;
    totalHoles: number;
    tees?: { id: string; name: string; color?: string | null }[];
    holes?: { holeNumber: number; par: number; handicap?: number | null }[];
  };
  scores: RoundScore[];
}

interface Golfer {
  id: string;
  name: string | null;
  handicap: number | null;
  avatar: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  _count: {
    rounds: number;
  };
}

interface GolferGroup {
  id: string;
  name: string;
  description: string | null;
  _count: {
    members: number;
  };
}

// Multi-player types
interface AdditionalPlayer {
  id: string;
  name: string;
  avatar?: string | null;
  handicap?: number | null;
  userId?: string | null; // For registered golfers, store their user ID to fetch fresh data
}

interface PlayerScore {
  playerIndex: number;
  scores: RoundScore[];
}

interface ScoringStats {
  totalRounds: number;
  totalHoles: number;
  scoring: {
    eagles: number;
    birdies: number;
    pars: number;
    bogeys: number;
    doubleBogeys: number;
    tripleOrWorse: number;
  };
  averages: {
    strokes: number;
    putts: string;
    fairwayPercentage: number;
    girPercentage: number;
    penaltiesPerRound: string;
  };
  percentages: {
    eagles: number;
    birdies: number;
    pars: number;
    bogeys: number;
    doubleBogeys: number;
    tripleOrWorse: number;
  };
}

// Weather types
interface WeatherData {
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    weatherCode: number;
    weatherDescription: string;
    weatherIcon: string;
    windSpeed: number;
    windDirection: string;
    windGusts: number;
  };
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    timezone: string;
  };
  time: {
    local: string;
    localHour: number;
    date: string;
    isNight: boolean;
    sunrise: string | null;
    sunset: string | null;
  };
  hourly: Array<{
    time: string;
    hour: number;
    temperature: number;
    weatherCode: number;
    weatherDescription: string;
    weatherIcon: string;
    windSpeed: number;
    precipitationProbability: number;
    precipitation: number;
    isNight: boolean;
  }>;
  updatedAt: string;
}

// Message types
interface Message {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  isRead: boolean;
  readAt: string | null;
}

// Tournament types
interface TournamentParticipant {
  userId: string;
  grossScore: number | null;
  netScore: number | null;
  user: {
    id: string;
    name: string | null;
    handicap: number | null;
  };
}

interface Tournament {
  id: string;
  name: string;
  courseId: string;
  date: string;
  startTime: string;
  format: string;
  maxPlayers: number;
  notes: string | null;
  status: string;
  course: {
    id: string;
    name: string;
    city: string;
  };
  _count?: {
    participants: number;
  };
  participants?: TournamentParticipant[];
}

// Markdown Renderer for AI Caddie
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    let processedLine = line;
    
    // Handle headers
    if (line.startsWith('### ')) {
      return <h4 key={lineIndex} className="text-base font-bold text-jazel-800 mt-3 mb-1" style={{color: '#2a4a6a'}}>{line.slice(4)}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={lineIndex} className="text-lg font-bold text-jazel-800 mt-4 mb-2" style={{color: '#2a4a6a'}}>{line.slice(3)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={lineIndex} className="text-xl font-bold text-jazel-900 mt-4 mb-2" style={{color: '#1e3a5a'}}>{line.slice(2)}</h2>;
    }
    
    // Handle bold and italic
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    
    // Process bold text (**text**)
    while (remaining.includes('**')) {
      const startIdx = remaining.indexOf('**');
      if (startIdx === -1) break;
      
      const beforeBold = remaining.slice(0, startIdx);
      const afterStart = remaining.slice(startIdx + 2);
      const endIdx = afterStart.indexOf('**');
      
      if (endIdx === -1) break;
      
      const boldText = afterStart.slice(0, endIdx);
      const afterBold = afterStart.slice(endIdx + 2);
      
      if (beforeBold) {
        // Process italic in beforeBold
        parts.push(<span key={`${lineIndex}-${key++}`}>{renderItalic(beforeBold)}</span>);
      }
      parts.push(<strong key={`${lineIndex}-${key++}`} className="font-bold" style={{color: '#2a4a6a'}}>{renderItalic(boldText)}</strong>);
      remaining = afterBold;
    }
    
    if (remaining) {
      parts.push(<span key={`${lineIndex}-${key++}`}>{renderItalic(remaining)}</span>);
    }
    
    // Handle bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={lineIndex} className="ml-4 list-disc">{parts.length > 0 ? parts : line.slice(2)}</li>;
    }
    
    // Handle numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      return <li key={lineIndex} className="ml-4 list-decimal">{parts.length > 0 ? parts : line.slice(numberedMatch[0].length)}</li>;
    }
    
    return <p key={lineIndex} className="mb-1">{parts.length > 0 ? parts : line}</p>;
  });
}

function renderItalic(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.includes('*')) {
    const startIdx = remaining.indexOf('*');
    if (startIdx === -1) break;
    
    const beforeItalic = remaining.slice(0, startIdx);
    const afterStart = remaining.slice(startIdx + 1);
    const endIdx = afterStart.indexOf('*');
    
    if (endIdx === -1) break;
    
    const italicText = afterStart.slice(0, endIdx);
    const afterItalic = afterStart.slice(endIdx + 1);
    
    if (beforeItalic) parts.push(<span key={key++}>{beforeItalic}</span>);
    parts.push(<em key={key++} className="italic">{italicText}</em>);
    remaining = afterItalic;
  }
  
  if (remaining) parts.push(<span key={key++}>{remaining}</span>);
  
  return parts.length > 0 ? parts : text;
}

// AI Caddie Component
function AICaddieDialog({ 
  open,  onOpenChange, 
  holeInfo,
  distanceUnit,
  onGetRecommendation
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  holeInfo: { par: number; distance: number } | null;
  distanceUnit: 'yards' | 'meters';
  onGetRecommendation: (data: { distance: number; wind: number; windDir: string; lie: string }) => void;
}) {
  const [distance, setDistance] = useState(holeInfo?.distance || 150);
  const [wind, setWind] = useState(0);
  const [windDir, setWindDir] = useState('none');
  const [lie, setLie] = useState('fairway');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (holeInfo) {
      setDistance(holeInfo.distance);
    }
  }, [holeInfo]);

  const handleGetRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    
    try {
      // Validate input
      if (distance < 0 || distance > 600) {
        setError('Please enter a valid distance between 0 and 600 meters.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ai-caddie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shotDistance: distance,
          windSpeed: wind,
          windDirection: windDir,
          lie: lie,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle API error response
        const errorMessage = data.error || 'Failed to get recommendation. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        toast.success('Recommendation received!');
      } else {
        setError('No recommendation generated. Please try again.');
      }
    } catch (err: any) {
      console.error('AI Caddie error:', err);
      const errorMessage = err.message || 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" style={{color: '#39638b'}} />
            AI Caddie
          </DialogTitle>
          <DialogDescription>
            Get personalized club recommendations based on conditions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Distance ({distanceUnit === 'yards' ? 'yards' : 'meters'})</Label>
              <Input
                type="number"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Wind Speed ({distanceUnit === 'yards' ? 'mph' : 'km/h'})</Label>
              <Input
                type="number"
                value={wind}
                onChange={(e) => setWind(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Wind Direction</Label>
              <Select value={windDir} onValueChange={setWindDir}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select wind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Wind</SelectItem>
                  <SelectItem value="headwind">Headwind</SelectItem>
                  <SelectItem value="tailwind">Tailwind</SelectItem>
                  <SelectItem value="left">Left to Right</SelectItem>
                  <SelectItem value="right">Right to Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lie Position</Label>
              <Select value={lie} onValueChange={setLie}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select lie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tee">Tee Box</SelectItem>
                  <SelectItem value="fairway">Fairway</SelectItem>
                  <SelectItem value="rough">Rough</SelectItem>
                  <SelectItem value="sand">Sand Bunker</SelectItem>
                  <SelectItem value="hardpan">Hardpan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleGetRecommendation}
            disabled={loading}
            className="w-full text-white"
            style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bot className="w-4 h-4 mr-2" />
            )}
            Get Recommendation
          </Button>
          
          {error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {recommendation && (
            <div className="p-4 rounded-lg border" style={{backgroundColor: '#d6e4ef', borderColor: '#8ab0d1'}}>
              <div className="text-sm">{renderMarkdown(recommendation)}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// GPS Range Finder Component
function GPSRangeFinder({ 
  course,
  userLocation,
  onLocationUpdate,
  selectedHole,
  onHoleChange,
  distanceUnit,
  userClubs
}: { 
  course: GolfCourse | null;
  userLocation: { lat: number; lon: number } | null;
  onLocationUpdate: (loc: { lat: number; lon: number }) => void;
  selectedHole: number;
  onHoleChange: (hole: number) => void;
  distanceUnit: 'yards' | 'meters';
  userClubs: { id: string; clubName: string; estimatedDistance: number | null; sortOrder: number }[];
}) {
  const [greenPosition, setGreenPosition] = useState<'front' | 'center' | 'back'>('center');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Get hole green location (use actual coordinates if available, otherwise estimate)
  const getHoleGreenLocation = useCallback((holeNum: number, courseData: GolfCourse | null) => {
    if (!courseData) return null;
    
    // Find the hole data
    const holeData = courseData.holes.find(h => h.holeNumber === holeNum);
    
    // If the hole has actual green coordinates stored, use them
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
      lat: courseData.latitude + Math.cos(angle) * holeSpacing * ((holeNum - 1) % 9),
      lon: courseData.longitude + Math.sin(angle) * holeSpacing * ((holeNum - 1) % 9)
    };
  }, []);

  // Calculate distance to green
  const distanceToGreen = useMemo(() => {
    if (!userLocation || !course) return null;
    
    const greenLoc = getHoleGreenLocation(selectedHole, course);
    if (!greenLoc) return null;
    
    const R = 6371000;
    const φ1 = userLocation.lat * Math.PI / 180;
    const φ2 = greenLoc.lat * Math.PI / 180;
    const Δφ = (greenLoc.lat - userLocation.lat) * Math.PI / 180;
    const Δλ = (greenLoc.lon - userLocation.lon) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Adjust for green position
    const adjustment = greenPosition === 'front' ? -10 : greenPosition === 'back' ? 10 : 0;
    return Math.round(distance + adjustment);
  }, [userLocation, course, greenPosition, selectedHole, getHoleGreenLocation]);

  // Get recommended club based on distance
  const getRecommendedClub = (distanceMeters: number): string | null => {
    const targetDistance = distanceUnit === 'yards' 
      ? distanceMeters * 1.09361
      : distanceMeters;
    
    const clubsWithDistances = userClubs
      .filter(c => c.estimatedDistance && c.estimatedDistance > 0)
      .sort((a, b) => (b.estimatedDistance || 0) - (a.estimatedDistance || 0));
    
    if (clubsWithDistances.length === 0) return null;
    
    const clubsThatCanReach = clubsWithDistances
      .filter(c => (c.estimatedDistance || 0) >= targetDistance)
      .sort((a, b) => (a.estimatedDistance || 0) - (b.estimatedDistance || 0));
    
    if (clubsThatCanReach.length > 0) {
      return clubsThatCanReach[0].clubName;
    }
    
    return clubsWithDistances[0]?.clubName || null;
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLoc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        onLocationUpdate(newLoc);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to track location');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    setWatchId(id);
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur" style={{borderColor: '#8ab0d1'}}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Navigation className="w-5 h-5" style={{color: '#39638b'}} />
            GPS Range Finder
          </span>
          <Button
            size="sm"
            variant={isTracking ? 'destructive' : 'default'}
            onClick={isTracking ? stopTracking : startTracking}
            className={isTracking ? '' : 'text-white'}
            style={isTracking ? {} : {backgroundColor: '#39638b'}}
          >
            {isTracking ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Start
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userLocation ? (
          <div className="text-center py-6">
            <Navigation className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Click "Start" to enable GPS tracking
            </p>
          </div>
        ) : (
          <>
            {/* Hole Selector */}
            <div className="flex items-center justify-center gap-3">
              <Label className="text-sm">Hole:</Label>
              <Select value={selectedHole.toString()} onValueChange={(v) => onHoleChange(parseInt(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {course && Array.from({ length: course.totalHoles }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Hole {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Par {course?.holes.find(h => h.holeNumber === selectedHole)?.par || '-'}
              </span>
            </div>

            {/* Front/Center/Back Green Position */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                size="sm"
                variant={greenPosition === 'front' ? 'default' : 'outline'}
                onClick={() => setGreenPosition('front')}
                style={greenPosition === 'front' ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
              >
                Front
              </Button>
              <Button
                size="sm"
                variant={greenPosition === 'center' ? 'default' : 'outline'}
                onClick={() => setGreenPosition('center')}
                style={greenPosition === 'center' ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
              >
                Center
              </Button>
              <Button
                size="sm"
                variant={greenPosition === 'back' ? 'default' : 'outline'}
                onClick={() => setGreenPosition('back')}
                style={greenPosition === 'back' ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
              >
                Back
              </Button>
            </div>

            <div className="text-center p-6 rounded-xl" style={{background: 'linear-gradient(135deg, #d6e4ef 0%, #e0f4f5 100%)'}}>
              <p className="text-sm text-muted-foreground mb-2">Distance to Green</p>
              <p className="text-5xl font-bold" style={{color: '#39638b'}}>
                {distanceToGreen !== null 
                  ? Math.round(distanceUnit === 'yards' ? distanceToGreen * 1.09361 : distanceToGreen)
                  : '---'}
              </p>
              <p className="text-lg text-muted-foreground">{distanceUnit}</p>
              
              {/* Recommended Club */}
              {distanceToGreen !== null && (() => {
                const recommendedClub = getRecommendedClub(distanceToGreen);
                const clubData = userClubs.find(c => c.clubName === recommendedClub);
                return recommendedClub ? (
                  <div className="mt-3 pt-3 border-t border-slate-300">
                    <p className="text-xs text-muted-foreground mb-1">Suggested Club</p>
                    <p className="text-lg font-semibold" style={{color: '#39638b'}}>
                      {recommendedClub}
                      {clubData?.estimatedDistance && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({clubData.estimatedDistance} {distanceUnit})
                        </span>
                      )}
                    </p>
                  </div>
                ) : userClubs.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-slate-300">
                    <p className="text-xs text-muted-foreground mb-1">Suggested Club</p>
                    <p className="text-sm text-amber-600">Add distances to your clubs in My Bag</p>
                  </div>
                ) : null;
              })()}
              
              {/* Show indicator if coordinates are estimated */}
              {course && (() => {
                const holeData = course.holes.find(h => h.holeNumber === selectedHole);
                const hasActualCoords = holeData?.greenLatitude != null && holeData?.greenLongitude != null;
                return !hasActualCoords ? (
                  <p className="text-xs text-amber-600 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Estimated location (no GPS data)
                  </p>
                ) : null;
              })()}
            </div>

            {course && (
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                <span>Selected Course</span>
                <span>{course.name}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Main App Component
export default function JazelApp() {
  const [activeTab, setActiveTab] = useState('weather');
  const [user, setUser] = useState<User | null>(null);
  const [distanceUnit, setDistanceUnit] = useState<'yards' | 'meters'>('yards');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [selectedTee, setSelectedTee] = useState<string>('');
  const [scores, setScores] = useState<RoundScore[]>([]);
  const [roundHistory, setRoundHistory] = useState<SavedRound[]>([]);
  const [scoringStats, setScoringStats] = useState<ScoringStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [golferSearch, setGolferSearch] = useState('');
  const [groups, setGroups] = useState<GolferGroup[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [showAICaddie, setShowAICaddie] = useState(false);
  const [currentHoleInfo, setCurrentHoleInfo] = useState<{ par: number; distance: number } | null>(null);
  const [showMapScreen, setShowMapScreen] = useState(false);
  const [showGPSPanel, setShowGPSPanel] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(true);
  const [selectedGPSHole, setSelectedGPSHole] = useState(1);
  const [maxNearbyDistance, setMaxNearbyDistance] = useState(100);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', handicap: '', city: '', country: 'Morocco' });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: '' });
  const [profileEditForm, setProfileEditForm] = useState({ 
    name: '', 
    email: '', 
    handicap: '', 
    city: '',
    country: 'Morocco',
    nearbyDistance: 100,
    distanceUnit: 'yards' as 'yards' | 'meters',
    currentPassword: '', 
    newPassword: '' 
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  // Multi-player state
  const [additionalPlayers, setAdditionalPlayers] = useState<AdditionalPlayer[]>([]);
  const [playerScores, setPlayerScores] = useState<Map<number, RoundScore[]>>(new Map());
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playerToDelete, setPlayerToDelete] = useState<AdditionalPlayer | null>(null);
  
  // Scorecard scroll state
  const scorecardRef = useRef<HTMLDivElement>(null);
  const [canScrollLeftState, setCanScrollLeft] = useState(false);
  const [canScrollRightState, setCanScrollRight] = useState(false);

  // Round edit/delete state
  const [roundToDelete, setRoundToDelete] = useState<SavedRound | null>(null);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null); // Track if we're editing an existing round

  // Hole selection state
  const [showHoleSelectionDialog, setShowHoleSelectionDialog] = useState(false);
  const [pendingCourse, setPendingCourse] = useState<GolfCourse | null>(null);
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18);
  const [holesType, setHolesType] = useState<'front' | 'back'>('front');
  
  // Scorecard view toggle (for displaying 9 holes at a time)
  const [scorecardView, setScorecardView] = useState<'front' | 'back'>('front');
  
  // Unsaved work warning state
  const [showUnsavedWarningDialog, setShowUnsavedWarningDialog] = useState(false);
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);

  // Round summary scorecard state
  const [roundToView, setRoundToView] = useState<SavedRound | null>(null);

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Device orientation for compass
  const [deviceHeading, setDeviceHeading] = useState<number>(0); // 0 = facing North

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [showMessageDetailDialog, setShowMessageDetailDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // User clubs state
  const [showBagDialog, setShowBagDialog] = useState(false);
  const [userClubs, setUserClubs] = useState<{ id: string; clubName: string; estimatedDistance: number | null; sortOrder: number }[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [editingBag, setEditingBag] = useState(false);
  const [bagFormData, setBagFormData] = useState<{ clubName: string; estimatedDistance: number | null; sortOrder: number }[]>([]);

  // Tournaments state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [participantSort, setParticipantSort] = useState<'handicap' | 'gross' | 'net'>('gross');

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          // Set user's preferred nearby distance
          if (data.user.nearbyDistance) {
            setMaxNearbyDistance(data.user.nearbyDistance);
          }
          // Set user's preferred distance unit
          if ((data.user as any).distanceUnit) {
            setDistanceUnit((data.user as any).distanceUnit === 'meters' ? 'meters' : 'yards');
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    checkSession();
  }, []);

  // Fetch user clubs when user logs in
  useEffect(() => {
    if (user) {
      fetchUserClubs();
    }
  }, [user]);

  // Restore active round from localStorage on mount
  useEffect(() => {
    try {
      const savedRound = localStorage.getItem('jazel_active_round');
      if (savedRound) {
        const parsed = JSON.parse(savedRound);
        const savedAt = new Date(parsed.savedAt);
        const now = new Date();
        const hoursSinceSaved = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
        
        // Only restore if saved within last 24 hours
        if (hoursSinceSaved < 24 && parsed.selectedCourse && parsed.scores?.length > 0) {
          setSelectedCourse(parsed.selectedCourse);
          setSelectedTee(parsed.selectedTee || '');
          setScores(parsed.scores);
          setAdditionalPlayers(parsed.additionalPlayers || []);
          setHolesPlayed(parsed.holesPlayed || 18);
          setHolesType(parsed.holesType || 'front');
          setSelectedGPSHole(parsed.holesPlayed === 9 && parsed.holesType === 'back' ? 10 : 1);
          
          // Restore player scores
          if (parsed.playerScores) {
            const playerScoresMap = new Map<number, RoundScore[]>();
            Object.entries(parsed.playerScores).forEach(([key, value]) => {
              playerScoresMap.set(parseInt(key), value as RoundScore[]);
            });
            setPlayerScores(playerScoresMap);
          }
          
          setShowScorecard(true);
          setActiveTab('scorecard');
          setHasUnsavedWork(true);
          setEditingRoundId(parsed.editingRoundId || null);
          
          toast.info('Restored your unsaved round. Continue playing or save when ready.', {
            duration: 5000,
          });
        } else if (hoursSinceSaved >= 24) {
          // Clear old data
          localStorage.removeItem('jazel_active_round');
        }
      }
    } catch (error) {
      console.error('Failed to restore active round:', error);
    }
  }, []);

  // Save active round to localStorage when it changes
  useEffect(() => {
    if (showScorecard && selectedCourse && scores.length > 0) {
      try {
        const playerScoresObj: Record<string, RoundScore[]> = {};
        playerScores.forEach((value, key) => {
          playerScoresObj[key.toString()] = value;
        });
        
        localStorage.setItem('jazel_active_round', JSON.stringify({
          selectedCourse,
          selectedTee,
          scores,
          additionalPlayers,
          playerScores: playerScoresObj,
          holesPlayed,
          holesType,
          editingRoundId,
          savedAt: new Date().toISOString(),
        }));
        setHasUnsavedWork(true);
      } catch (error) {
        console.error('Failed to save active round:', error);
      }
    }
  }, [showScorecard, selectedCourse, selectedTee, scores, additionalPlayers, playerScores, holesPlayed, holesType, editingRoundId]);

  // Fetch settings and auto-get user location on load
  useEffect(() => {
    // Auto-get user location on load to show distances
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          // Silently fail - distance just won't be shown
          console.log('Geolocation not available');
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Fetch all courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      let coursesData = data.courses || [];
      
      // Add distance to each course if user location is available
      if (userLocation) {
        coursesData = coursesData.map((course: GolfCourse) => ({
          ...course,
          distance: calculateDistance(userLocation.lat, userLocation.lon, course.latitude, course.longitude)
        }));
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [userLocation, calculateDistance]);

  // Fetch user favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/favorites?userId=${user.id}`);
      const data = await response.json();
      const favoriteCourseIds = data.favorites?.map((c: GolfCourse) => c.id) || [];
      setFavoriteIds(favoriteCourseIds);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  }, [user]);

  // Fetch user rounds
  const fetchRounds = useCallback(async () => {
    if (!user) return;
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/rounds?userId=${user.id}&_t=${Date.now()}`);
      const data = await response.json();
      setRoundHistory(data.rounds || []);
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
    }
  }, [user]);

  // Fetch scoring statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/stats?userId=${user.id}`);
      const data = await response.json();
      setScoringStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  // Default location (center of Morocco) for immediate weather fetch
  const DEFAULT_LOCATION = { lat: 31.7917, lon: -7.0926 };

  // Fetch weather data - uses provided location or falls back to default
  // Set force=true to bypass cache (for manual refresh)
  const fetchWeather = useCallback(async (location?: { lat: number; lon: number }, force: boolean = false) => {
    // Use provided location, or userLocation, or default
    const loc = location || userLocation || DEFAULT_LOCATION;
    
    // Check if we have recent data (cache for 10 minutes)
    if (!force && weatherData?.updatedAt) {
      const lastUpdate = new Date(weatherData.updatedAt).getTime();
      const now = Date.now();
      const minutesSinceUpdate = (now - lastUpdate) / (1000 * 60);
      if (minutesSinceUpdate < 10 && !location) {
        // Data is fresh, skip fetch unless forced with explicit location
        return;
      }
    }
    
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const response = await fetch(`/api/weather?lat=${loc.lat}&lon=${loc.lon}`);
      const data = await response.json();
      if (data.weather) {
        setWeatherData(data.weather);
      } else {
        setWeatherError('Failed to load weather data');
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      setWeatherError('Failed to load weather data');
    } finally {
      setWeatherLoading(false);
    }
  }, [userLocation, weatherData?.updatedAt]);

  // Fetch golfers list
  const fetchGolfers = useCallback(async (groupId?: string) => {
    try {
      const url = groupId && groupId !== 'all'
        ? `/api/users?groupId=${groupId}`
        : '/api/users';
      const response = await fetch(url);
      const data = await response.json();
      setGolfers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch golfers:', error);
    }
  }, []);

  // Fetch groups list
  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/messages?userId=${user.id}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [user]);

  // Fetch tournaments
  const fetchTournaments = useCallback(async () => {
    setTournamentsLoading(true);
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  // Fetch tournament with participants
  const fetchTournamentWithParticipants = useCallback(async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments?id=${tournamentId}&includeParticipants=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.tournament) {
          setSelectedTournament(data.tournament);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tournament participants:', error);
    }
  }, []);

  // Mark message as read
  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, userId: user.id }),
      });
      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
      ));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  // Mark all messages as read
  const markAllMessagesAsRead = async () => {
    if (!user) return;
    try {
      await fetch('/api/messages/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      // Update local state
      setMessages(prev => prev.map(m => ({ ...m, isRead: true, readAt: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchGolfers();
    fetchGroups();
    fetchTournaments();
    // Fetch weather immediately with default location for fast initial load
    fetchWeather();
    if (user) {
      fetchFavorites();
      fetchRounds();
      fetchStats();
      fetchMessages();
    }
  }, [fetchCourses, fetchFavorites, fetchGolfers, fetchGroups, fetchRounds, fetchStats, fetchMessages, fetchTournaments, user]);

  // Update weather when user location is acquired (more accurate than default)
  useEffect(() => {
    if (userLocation) {
      fetchWeather(userLocation);
    }
  }, [userLocation]);

  // Refetch golfers when group filter changes
  useEffect(() => {
    fetchGolfers(selectedGroupFilter);
  }, [selectedGroupFilter, fetchGolfers]);

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

  // Toggle favorite
  const toggleFavorite = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    const isFavorited = favoriteIds.includes(courseId);
    
    try {
      if (isFavorited) {
        await fetch(`/api/favorites?userId=${user.id}&courseId=${courseId}`, { method: 'DELETE' });
        setFavoriteIds(prev => prev.filter(id => id !== courseId));
        toast.success('Removed from favorites');
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, courseId })
        });
        setFavoriteIds(prev => [...prev, courseId]);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  // Login
  const handleLogin = async () => {
    setAuthLoading(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        // Set user's preferred nearby distance
        if (data.user.nearbyDistance) {
          setMaxNearbyDistance(data.user.nearbyDistance);
        }
        // Set user's preferred distance unit
        if (data.user.distanceUnit) {
          setDistanceUnit(data.user.distanceUnit === 'meters' ? 'meters' : 'yards');
        }
        setShowLoginDialog(false);
        setLoginForm({ email: '', password: '' });
        toast.success('Welcome back!');
      } else {
        setLoginError(data.error || 'Login failed');
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('An error occurred. Please try again.');
      toast.error('Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Signup
  const handleSignup = async () => {
    setAuthLoading(true);
    setSignupError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });
      const data = await response.json();

      if (response.ok) {
        // Auto login after signup
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signupForm.email, password: signupForm.password }),
        });
        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          setUser(loginData.user);
          setShowSignupDialog(false);
          setSignupForm({ name: '', email: '', password: '', handicap: '', city: '', country: 'Morocco' });
          toast.success('Account created! Welcome to Jazel!');
        }
      } else {
        setSignupError(data.error || 'Signup failed');
        toast.error(data.error || 'Signup failed');
      }
    } catch (error) {
      setSignupError('An error occurred. Please try again.');
      toast.error('Signup failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
      setUser(null);
      setFavoriteIds([]);
      setActiveTab('weather');
      setShowScorecard(false);
      setSelectedCourse(null);
      setScores([]);
      setRoundHistory([]);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Forgot Password
  const handleForgotPassword = async () => {
    setAuthLoading(true);
    setForgotPasswordError(null); // Clear previous errors
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotPasswordForm),
      });
      const data = await response.json();
      
      if (response.ok) {
        setForgotPasswordSent(true);
        // Show success message from server if available
        if (data.message) {
          toast.success(data.message, { duration: 6000 });
        } else {
          toast.success('Password reset link sent! Check your email.');
        }
      } else {
        // Show error inline and via toast
        const errorMessage = data.error || 'Failed to send reset link';
        setForgotPasswordError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Failed to send reset link. Please try again.';
      setForgotPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  // Update Profile
  const handleUpdateProfile = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileEditForm),
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        // Update distance unit preference
        if (data.user.distanceUnit) {
          setDistanceUnit(data.user.distanceUnit === 'meters' ? 'meters' : 'yards');
        }
        setShowProfileEditDialog(false);
        // Show specific message if password was changed
        if (profileEditForm.newPassword) {
          toast.success('Profile and password updated successfully!');
        } else {
          toast.success('Profile updated successfully!');
        }
        // Clear password fields after successful update
        setProfileEditForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setAuthLoading(false);
    }
  };

  // Open profile edit dialog
  const openProfileEdit = () => {
    if (user) {
      setProfileEditForm({
        name: user.name || '',
        email: user.email,
        handicap: user.handicap?.toString() || '',
        city: user.city || '',
        country: user.country || 'Morocco',
        nearbyDistance: user.nearbyDistance || 100,
        distanceUnit: (user as any).distanceUnit || 'yards',
        currentPassword: '',
        newPassword: '',
      });
      setShowProfileEditDialog(true);
    }
  };

  // Fetch user clubs
  const fetchUserClubs = async () => {
    if (!user) return;
    setLoadingClubs(true);
    try {
      const response = await fetch(`/api/user/clubs?userId=${user.id}`);
      const data = await response.json();
      if (data.clubs) {
        setUserClubs(data.clubs);
        // Initialize form data for editing
        const formData = Array.from({ length: 14 }, (_, i) => {
          const club = data.clubs.find((c: any) => (c.sortOrder ?? 0) === i);
          return club ? { clubName: club.clubName, estimatedDistance: club.estimatedDistance, sortOrder: i } : { clubName: '', estimatedDistance: null, sortOrder: i };
        });
        setBagFormData(formData);
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoadingClubs(false);
    }
  };

  // Save all clubs from form data
  const handleSaveBag = async () => {
    if (!user) return;
    setAuthLoading(true);
    try {
      // First, remove all existing clubs
      for (const club of userClubs) {
        await fetch(`/api/user/clubs?userId=${user.id}&clubName=${encodeURIComponent(club.clubName)}`, {
          method: 'DELETE',
        });
      }
      
      // Then add all clubs from form data
      for (const club of bagFormData) {
        if (club.clubName && club.clubName !== '') {
          await fetch('/api/user/clubs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              clubName: club.clubName,
              estimatedDistance: club.estimatedDistance,
              sortOrder: club.sortOrder,
            }),
          });
        }
      }
      
      // Refresh the clubs list
      await fetchUserClubs();
      setEditingBag(false);
      toast.success('Bag saved successfully!');
    } catch (error) {
      toast.error('Failed to save bag');
    } finally {
      setAuthLoading(false);
    }
  };

  // Update form data for a slot
  const updateBagFormSlot = (slotIndex: number, field: 'clubName' | 'estimatedDistance', value: string | number | null) => {
    setBagFormData(prev => prev.map((item, idx) => 
      idx === slotIndex ? { ...item, [field]: value } : item
    ));
  };

  // Open bag dialog
  const openBagDialog = () => {
    setShowBagDialog(true);
    fetchUserClubs();
    setEditingBag(false);
  };

  // Compress image function
  const compressImage = (file: File, maxWidth: number = 200, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Ensure minimum size
        if (width < 50) width = 50;
        if (height < 50) height = 50;
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Please select a smaller image.');
      return;
    }
    
    setAvatarUploading(true);
    try {
      // Compress image
      const compressedAvatar = await compressImage(file, 200, 0.7);
      
      // Upload to server
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: compressedAvatar }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        toast.success('Photo updated successfully!');
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle camera capture (mobile)
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleAvatarUpload(file);
      }
    };
    input.click();
  };

  // Remove avatar
  const handleRemoveAvatar = async () => {
    try {
      const response = await fetch('/api/user/avatar', { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        toast.success('Photo removed');
      } else {
        toast.error('Failed to remove photo');
      }
    } catch (error) {
      toast.error('Failed to remove photo');
    }
  };

  // Search courses
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCourses();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/courses?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      let coursesData = data.courses || [];
      
      // Add distance to each course if user location is available
      if (userLocation) {
        coursesData = coursesData.map((course: GolfCourse) => ({
          ...course,
          distance: calculateDistance(userLocation.lat, userLocation.lon, course.latitude, course.longitude)
        }));
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Update nearby distance preference
  const updateNearbyDistance = async (distance: number) => {
    setMaxNearbyDistance(distance);
    
    // Format the distance for display based on user's unit preference
    const displayDistance = distanceUnit === 'yards' 
      ? `${Math.round(distance * 0.621371)} mi`
      : `${distance} km`;
    
    // Save to user profile if logged in
    if (user) {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nearbyDistance: distance }),
        });
        const data = await response.json();
        
        if (response.ok) {
          setUser(data.user);
          toast.success(`Nearby distance set to ${displayDistance}`);
        }
      } catch (error) {
        console.error('Failed to save distance preference:', error);
      }
    }
    
    // If in nearby mode, refresh the search with new distance
    if (isNearbyMode && userLocation) {
      try {
        const response = await fetch(
          `/api/courses/nearby?lat=${userLocation.lat}&lon=${userLocation.lon}&radius=${distance}`
        );
        const data = await response.json();
        setCourses(data.courses || []);
      } catch (error) {
        console.error('Failed to refresh nearby search:', error);
      }
    }
  };

  // Get user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setIsNearbyMode(true);
        setIsGettingLocation(false);
        
        try {
          const response = await fetch(
            `/api/courses/nearby?lat=${latitude}&lon=${longitude}&radius=${maxNearbyDistance}`
          );
          const data = await response.json();
          setCourses(data.courses || []);
          toast.success(`Found ${data.courses?.length || 0} courses nearby`);
        } catch (error) {
          console.error('Failed to find nearby courses:', error);
          toast.error('Failed to find nearby courses');
        }
      },
      () => {
        // Use Rabat as default location for demo
        setUserLocation({ lat: 33.9716, lon: -6.8498 });
        setIsNearbyMode(true);
        setIsGettingLocation(false);
        toast.info('Using Rabat as default location for demo');
      }
    );
  };

  // Start new round - show hole selection dialog first
  const startNewRound = (course: GolfCourse) => {
    // Require login to play
    if (!user) {
      setShowLoginDialog(true);
      toast.info('Please log in to start a round');
      return;
    }
    
    // Check if there's already an active scorecard with unsaved work
    if (showScorecard && hasUnsavedWork) {
      setPendingCourse(course);
      setShowUnsavedWarningDialog(true);
      return;
    }
    
    // Check if there's a saved round in localStorage
    try {
      const savedRound = localStorage.getItem('jazel_active_round');
      if (savedRound) {
        const parsed = JSON.parse(savedRound);
        const savedAt = new Date(parsed.savedAt);
        const now = new Date();
        const hoursSinceSaved = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
        
        // If there's unsaved work from less than 24 hours ago, show warning
        if (hoursSinceSaved < 24 && parsed.selectedCourse && parsed.scores?.length > 0) {
          setPendingCourse(course);
          setShowUnsavedWarningDialog(true);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to check saved round:', error);
    }
    
    // Set pending course and show hole selection dialog
    setPendingCourse(course);
    // Reset to defaults
    setHolesPlayed(18);
    setHolesType('front');
    setShowHoleSelectionDialog(true);
  };
  
  // Actually initialize the round after hole selection
  const initializeRound = (course: GolfCourse, numHoles: 9 | 18, holeType: 'front' | 'back') => {
    setSelectedCourse(course);
    setSelectedTee(course.tees[0]?.id || '');
    setSelectedGPSHole(holeType === 'back' ? 10 : 1);
    setHolesPlayed(numHoles);
    setHolesType(holeType);
    
    // Determine which holes to show
    const startHole = numHoles === 9 && holeType === 'back' ? 10 : 1;
    const endHole = numHoles === 9 ? (holeType === 'back' ? 18 : 9) : Math.min(course.totalHoles, 18);
    
    // Initialize scores for main player
    const initialScores: RoundScore[] = [];
    for (let i = startHole; i <= endHole; i++) {
      initialScores.push({
        holeNumber: i,
        strokes: 0,
        putts: 0,
        fairwayHit: null,
        greenInReg: false,
        penalties: 0,
      });
    }
    setScores(initialScores);
    
    // Reset additional players
    setAdditionalPlayers([]);
    setPlayerScores(new Map());
    
    // Close dialog and show scorecard
    setShowHoleSelectionDialog(false);
    setPendingCourse(null);
    setShowScorecard(true);
    setActiveTab('scorecard');
  };
  
  // Multi-player functions
  const addPlayer = (name: string, avatar?: string | null, handicap?: number | null, userId?: string | null) => {
    if (additionalPlayers.length >= 3) {
      toast.error('Maximum 3 additional players allowed');
      return;
    }
    if (!name.trim()) {
      toast.error('Please enter a player name');
      return;
    }
    
    const newPlayer: AdditionalPlayer = {
      id: `player-${Date.now()}`,
      name: name.trim(),
      avatar: avatar,
      handicap: handicap,
      userId: userId || null // Store user ID for registered golfers
    };
    
    setAdditionalPlayers(prev => [...prev, newPlayer]);
    
    // Initialize scores for the new player
    const playerInitialScores: RoundScore[] = [];
    if (selectedCourse) {
      for (let i = 1; i <= Math.min(selectedCourse.totalHoles, 18); i++) {
        playerInitialScores.push({
          holeNumber: i,
          strokes: 0,
          putts: 0,
          fairwayHit: null,
          greenInReg: false,
          penalties: 0,
        });
      }
    }
    
    setPlayerScores(prev => {
      const newMap = new Map(prev);
      newMap.set(additionalPlayers.length, playerInitialScores);
      return newMap;
    });
    
    setNewPlayerName('');
    toast.success(`${name} added to the round`);
  };
  
  const removePlayer = (playerId: string) => {
    const playerIndex = additionalPlayers.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    setAdditionalPlayers(prev => prev.filter(p => p.id !== playerId));
    
    // Remove player scores and reindex remaining players
    setPlayerScores(prev => {
      const newMap = new Map();
      const remainingPlayers = additionalPlayers.filter(p => p.id !== playerId);
      remainingPlayers.forEach((player, idx) => {
        const oldIndex = additionalPlayers.findIndex(p => p.id === player.id);
        const scores = prev.get(oldIndex) || [];
        newMap.set(idx, scores);
      });
      return newMap;
    });
    
    toast.success('Player removed');
  };
  
  const updatePlayerScore = (playerIndex: number, holeNumber: number, field: keyof RoundScore, value: any) => {
    setPlayerScores(prev => {
      const newMap = new Map(prev);
      const playerScores = newMap.get(playerIndex) || [];
      const updatedScores = playerScores.map(s => 
        s.holeNumber === holeNumber ? { ...s, [field]: value } : s
      );
      newMap.set(playerIndex, updatedScores);
      return newMap;
    });
  };
  
  // Scroll handlers for scorecard
  const checkScrollPosition = useCallback(() => {
    if (scorecardRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scorecardRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);
  
  const scrollScorecard = (direction: 'left' | 'right') => {
    if (scorecardRef.current) {
      const scrollAmount = 200;
      scorecardRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollPosition, 300);
    }
  };
  
  // Check scroll position when scorecard is shown or players change
  useEffect(() => {
    if (showScorecard && selectedCourse) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(checkScrollPosition, 100);
      return () => clearTimeout(timer);
    }
  }, [showScorecard, selectedCourse, additionalPlayers, checkScrollPosition]);

  // Keyboard shortcut for saving scorecard (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (showScorecard && selectedCourse && user) {
          e.preventDefault();
          const scoresWithStrokes = scores.filter(s => s.strokes > 0);
          if (scoresWithStrokes.length > 0) {
            saveRound();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showScorecard, selectedCourse, user, scores]);

  // Update score
  const updateScore = (holeNumber: number, field: keyof RoundScore, value: any) => {
    setScores(prev => prev.map(s => 
      s.holeNumber === holeNumber ? { ...s, [field]: value } : s
    ));
  };

  // Save round
  const saveRound = async () => {
    if (!user || !selectedCourse) return;

    // Get scores with entered strokes (at least one score must have strokes)
    const scoresWithStrokes = scores.filter(s => s.strokes > 0);
    if (scoresWithStrokes.length === 0) {
      toast.error('Please enter at least one score');
      return;
    }

    try {
      // Prepare player data for additional players (including userId, avatar and handicap)
      const playerData = additionalPlayers.length > 0 ? JSON.stringify(additionalPlayers.map(p => ({
        name: p.name,
        avatar: p.avatar || null,
        handicap: p.handicap || null,
        userId: p.userId || null // Store user ID for registered golfers to fetch fresh data
      }))) : null;

      // Prepare player scores array for saving
      const playerScoresArray: Array<{
        playerIndex: number;
        scores: RoundScore[];
      }> = [];
      
      playerScores.forEach((ps, idx) => {
        const scoresWithStrokesForPlayer = ps.filter(s => s.strokes > 0);
        if (scoresWithStrokesForPlayer.length > 0) {
          playerScoresArray.push({
            playerIndex: idx,
            scores: scoresWithStrokesForPlayer,
          });
        }
      });

      // Check if we're editing an existing round or creating new
      if (editingRoundId) {
        // Update existing round - send ALL holes with their current scores
        const response = await fetch('/api/rounds', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundId: editingRoundId,
            teeId: selectedTee,
            playerNames: playerData,
            scores: scores,
            playerScores: playerScoresArray,
            holesPlayed: holesPlayed,
            holesType: holesType,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          toast.success('Round updated successfully!');
          
          // Clear saved round from localStorage
          localStorage.removeItem('jazel_active_round');
          
          // Reset state
          setShowScorecard(false);
          setSelectedCourse(null);
          setScores([]);
          setAdditionalPlayers([]);
          setPlayerScores(new Map());
          setEditingRoundId(null);
          setSelectedTee('');
          
          // Fetch fresh rounds and stats from server
          await fetchRounds();
          await fetchStats();
          
          // Switch to history tab
          setActiveTab('history');
        } else {
          toast.error(data.error || 'Failed to update round');
        }
      } else {
        // Create new round - only send scores with strokes
        const response = await fetch('/api/rounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            courseId: selectedCourse.id,
            teeId: selectedTee,
            scores: scoresWithStrokes,
            playerNames: playerData,
            playerScores: playerScoresArray,
            holesPlayed: holesPlayed,
            holesType: holesPlayed === 9 ? holesType : null,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          toast.success('Round saved successfully!');
          
          // Clear saved round from localStorage
          localStorage.removeItem('jazel_active_round');
          
          // Reset state
          setShowScorecard(false);
          setSelectedCourse(null);
          setScores([]);
          setAdditionalPlayers([]);
          setPlayerScores(new Map());
          setEditingRoundId(null);
          setSelectedTee('');
          
          // Fetch fresh rounds and stats from server
          await fetchRounds();
          await fetchStats();
          
          // Switch to history tab
          setActiveTab('history');
        } else {
          toast.error(data.error || 'Failed to save round');
        }
      }
    } catch (error) {
      console.error('Failed to save round:', error);
      toast.error('Failed to save round');
    }
  };

  // Discard active round
  const discardRound = () => {
    localStorage.removeItem('jazel_active_round');
    setShowScorecard(false);
    setSelectedCourse(null);
    setScores([]);
    setAdditionalPlayers([]);
    setPlayerScores(new Map());
    setActiveTab('search');
    toast.info('Round discarded');
  };

  // Delete a round
  const deleteRound = async (roundId: string) => {
    try {
      const response = await fetch(`/api/rounds/${roundId}`, { method: 'DELETE' });
      
      if (response.ok) {
        setRoundHistory(prev => prev.filter(r => r.id !== roundId));
        await fetchStats(); // Refresh stats after deleting
        toast.success('Round deleted');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete round');
      }
    } catch (error) {
      console.error('Failed to delete round:', error);
      toast.error('Failed to delete round');
    }
  };

  // Download round as XLSX
  const downloadRoundAsXlsx = async (round: SavedRound) => {
    try {
      const response = await fetch(`/api/rounds/export?roundId=${round.id}`);
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to export round');
        return;
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${round.course?.name || 'round'}_${new Date(round.date).toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Round exported successfully');
    } catch (error) {
      console.error('Failed to export round:', error);
      toast.error('Failed to export round');
    }
  };

  // Load a round for editing - extracted to useCallback for better reactivity
  const loadRoundForEditing = useCallback(async (round: SavedRound) => {
    // Get the course ID - try both locations
    const courseId = round.course?.id || round.courseId;
    
    if (!courseId) {
      toast.error('Cannot edit round: course information missing');
      return;
    }
    
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        toast.error('Could not load course data');
        return;
      }
      
      const data = await response.json();
      const course = data.course;
      
      setSelectedCourse(course);
      
      // Set holes played and type from the round
      const roundHolesPlayed = round.holesPlayed || 18;
      const roundHolesType = round.holesType || 'front';
      setHolesPlayed(roundHolesPlayed as 9 | 18);
      setHolesType(roundHolesType as 'front' | 'back');
      
      // Validate and set tee - check if teeId exists in course tees
      const validTeeId = round.teeId && course.tees?.some((t: { id: string }) => t.id === round.teeId)
        ? round.teeId
        : (course.tees?.[0]?.id || '');
      setSelectedTee(validTeeId);
      
      // Set GPS hole to first hole of the round
      setSelectedGPSHole(roundHolesPlayed === 9 && roundHolesType === 'back' ? 10 : 1);
      
      // Initialize scores for the holes that were played, merging with existing scores
      const allHoles = course?.holes || [];
      const existingScores = round.scores && round.scores.length > 0 ? round.scores : [];
      
      // Determine which holes to show based on round settings
      const startHole = roundHolesPlayed === 9 && roundHolesType === 'back' ? 10 : 1;
      const endHole = roundHolesPlayed === 9 ? (roundHolesType === 'back' ? 18 : 9) : 18;
      
      // Filter holes to only show the ones that were played
      const holesToShow = allHoles.filter((h: { holeNumber: number }) => 
        h.holeNumber >= startHole && h.holeNumber <= endHole
      );
      
      // Separate scores by playerIndex
      const mainPlayerScores = existingScores.filter(s => s.playerIndex === 0);
      const additionalPlayerScores = existingScores.filter(s => s.playerIndex > 0);
      
      // Create a map of existing scores by hole number for main player
      const scoreMap = new Map(mainPlayerScores.map(s => [s.holeNumber, s]));
      
      // Create scores array with only the holes that were played
      const allScores: RoundScore[] = holesToShow.map((hole: { holeNumber: number; par: number }) => {
        const existingScore = scoreMap.get(hole.holeNumber);
        return existingScore ? {
          holeNumber: existingScore.holeNumber,
          strokes: existingScore.strokes,
          putts: existingScore.putts || 0,
          fairwayHit: existingScore.fairwayHit ?? null,
          greenInReg: existingScore.greenInReg || false,
          penalties: existingScore.penalties || 0,
          sandShots: existingScore.sandShots || 0,
          chipShots: existingScore.chipShots || 0,
          driveDistance: existingScore.driveDistance || null,
        } : {
          holeNumber: hole.holeNumber,
          strokes: 0,
          putts: 0,
          fairwayHit: null,
          greenInReg: false,
          penalties: 0,
          sandShots: 0,
          chipShots: 0,
          driveDistance: null,
        };
      });
      
      setScores(allScores);
      
      // Parse player data and restore additional players (including avatars)
      // Fetch fresh data for registered golfers via userId
      let players: AdditionalPlayer[] = [];
      if (round.playerNames) {
        try {
          const playerData = JSON.parse(round.playerNames);
          
          // Fetch fresh data for players with userIds
          const fetchPromises = playerData.map(async (item: string | { name: string; avatar?: string | null; handicap?: number | null; userId?: string | null }, idx: number) => {
            // Check if it's the new format with userId
            if (typeof item !== 'string' && item.userId) {
              // Fetch fresh user data from API
              try {
                const response = await fetch(`/api/users/${item.userId}`);
                if (response.ok) {
                  const data = await response.json();
                  return {
                    id: `player-${idx}`,
                    name: data.user?.name || item.name,
                    avatar: data.user?.avatar || item.avatar || null,
                    handicap: data.user?.handicap ?? item.handicap ?? null,
                    userId: item.userId,
                  };
                }
              } catch (e) {
                console.error('Failed to fetch user data:', e);
              }
            }
            
            // Fallback to stored data
            if (typeof item === 'string') {
              // Old format: just a name string
              return {
                id: `player-${idx}`,
                name: item,
                avatar: null,
                handicap: null,
              };
            } else {
              // New format: player object with name, avatar, handicap
              return {
                id: `player-${idx}`,
                name: item.name,
                avatar: item.avatar || null,
                handicap: item.handicap || null,
                userId: item.userId || null,
              };
            }
          });
          
          // Wait for all fetches to complete
          players = await Promise.all(fetchPromises);
        } catch (e) {
          console.error('Failed to parse player data:', e);
        }
      }
      setAdditionalPlayers(players);
      
      // Restore player scores for additional players
      const playerScoresMap = new Map<number, RoundScore[]>();
      
      // Group scores by playerIndex
      const scoresByPlayer = new Map<number, RoundScore[]>();
      additionalPlayerScores.forEach(s => {
        const idx = s.playerIndex;
        if (!scoresByPlayer.has(idx)) {
          scoresByPlayer.set(idx, []);
        }
        scoresByPlayer.get(idx)!.push(s);
      });
      
      // Create player scores for each additional player (playerIndex 1, 2, 3 maps to index 0, 1, 2)
      players.forEach((player, idx) => {
        const playerIndex = idx + 1; // playerIndex in database is 1, 2, 3 for additional players
        const existingPlayerScores = scoresByPlayer.get(playerIndex) || [];
        
        // Create a map for quick lookup
        const playerScoreMap = new Map(existingPlayerScores.map(s => [s.holeNumber, s]));
        
        // Create scores for all holes
        const fullScores: RoundScore[] = allHoles.map((hole: { holeNumber: number }) => {
          const existing = playerScoreMap.get(hole.holeNumber);
          return existing ? {
            holeNumber: existing.holeNumber,
            strokes: existing.strokes,
            putts: existing.putts || 0,
            fairwayHit: existing.fairwayHit ?? null,
            greenInReg: existing.greenInReg || false,
            penalties: existing.penalties || 0,
          } : {
            holeNumber: hole.holeNumber,
            strokes: 0,
            putts: 0,
            fairwayHit: null,
            greenInReg: false,
            penalties: 0,
          };
        });
        
        playerScoresMap.set(idx, fullScores);
      });
      
      setPlayerScores(playerScoresMap);
      setEditingRoundId(round.id);
      setShowScorecard(true);
      setActiveTab('scorecard');
      toast.info('Round loaded for editing. Make changes and save to update.');
    } catch (error) {
      console.error('Failed to load round for editing:', error);
      toast.error('Failed to load round');
    }
  }, []);

  // Calculate round totals
  const calculateTotals = () => {
    const playedScores = scores.filter(s => s.strokes > 0);
    const strokes = playedScores.reduce((sum, s) => sum + s.strokes, 0);
    const putts = playedScores.reduce((sum, s) => sum + s.putts, 0);
    const fairways = playedScores.filter(s => s.fairwayHit).length;
    const gir = playedScores.filter(s => s.greenInReg).length;
    const penalties = playedScores.reduce((sum, s) => sum + s.penalties, 0);
    
    // Calculate vs par (sum of individual hole differences)
    const vsPar = scores.reduce((total, s) => {
      const holePar = selectedCourse?.holes.find(h => h.holeNumber === s.holeNumber)?.par || 4;
      return total + (s.strokes > 0 ? s.strokes - holePar : 0);
    }, 0);
    
    return { strokes, putts, fairways, gir, penalties, vsPar };
  };

  // Get course total par
  const getCoursePar = () => {
    if (!selectedCourse) return holesPlayed === 9 ? 36 : 72;
    
    if (holesPlayed === 9) {
      // For 9-hole rounds, get par for front or back nine
      if (holesType === 'back') {
        // Back nine: holes 10-18 (indices 9-17)
        return selectedCourse.holes.slice(9, 18).reduce((sum, h) => sum + h.par, 0);
      } else {
        // Front nine: holes 1-9 (indices 0-8)
        return selectedCourse.holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0);
      }
    }
    
    // Full 18 holes
    return selectedCourse.holes.slice(0, 18).reduce((sum, h) => sum + h.par, 0);
  };

  // Get score color based on performance
  const getScoreColor = (strokes: number, par: number) => {
    if (strokes === 0) return 'bg-white';
    const diff = strokes - par;
    if (diff < 0) return 'bg-red-100 text-red-800 font-bold'; // Under par = red
    if (diff === 0) return 'bg-blue-100 text-blue-800'; // Par
    if (diff === 1) return 'bg-amber-100 text-amber-800'; // Bogey
    return 'bg-yellow-200 text-yellow-900 font-bold'; // Double bogey or worse
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b" style={{borderColor: '#8ab0d1'}}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/guide" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/golf-ball-logo.png" alt="Jazel" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #39638b, #4a7aa8)', WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>
                  Jazel
                </h1>
                <p className="text-xs text-muted-foreground">Golf Scorecard</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-3">
              {user?.isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    style={{color: '#39638b'}}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Setup</span>
                  </Button>
                </Link>
              )}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative gap-1"
                  style={{color: '#39638b'}}
                  onClick={() => setShowMessagesDialog(true)}
                >
                  <Bell className="w-4 h-4" />
                  {messages.filter(m => !m.isRead).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {messages.filter(m => !m.isRead).length}
                    </span>
                  )}
                </Button>
              )}
              {user ? (
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || 'User'} 
                      className="w-8 h-8 rounded-full object-cover border-2"
                      style={{borderColor: '#a3c4e0'}}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)'}}>
                      <span className="text-sm font-bold text-white">
                        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    {user.handicap && <p className="text-xs text-muted-foreground">Handicap: {user.handicap}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoginDialog(true)}
                    style={{color: '#39638b'}}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="text-white"
                    style={{backgroundColor: '#39638b'}}
                    onClick={() => setShowSignupDialog(true)}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-6 bg-white/80 backdrop-blur ${user ? 'grid-cols-7' : 'grid-cols-1'}`}>
            {user && (
              <TabsTrigger value="search" className="gap-2">
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="weather" className="gap-2">
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">Weather</span>
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="golfers" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Golfers</span>
                </TabsTrigger>
                <TabsTrigger value="tournaments" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">Tournaments</span>
                </TabsTrigger>
                <TabsTrigger value="scorecard" className="gap-2">
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Scorecard</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Course Search Tab */}
          <TabsContent value="search" className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search courses or cities (e.g., Marrakech, Rabat)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12 bg-white"
                  style={{borderColor: '#a3c4e0'}}
                  onFocus={(e) => e.target.style.borderColor = '#39638b'}
                  onBlur={(e) => e.target.style.borderColor = '#a3c4e0'}
                />
              </div>
              <Button
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly);
                  if (!showFavoritesOnly) {
                    setIsNearbyMode(false);
                  }
                }}
                variant={showFavoritesOnly ? 'default' : 'outline'}
                className={`h-12 px-4 ${showFavoritesOnly ? 'bg-red-500 hover:bg-red-600' : 'border-red-200 hover:bg-red-50'}`}
              >
                <Heart className={`w-5 h-5 mr-2 ${showFavoritesOnly ? 'fill-white' : ''}`} />
                Favorites
              </Button>
              <Button
                onClick={getUserLocation}
                variant="outline"
                disabled={isGettingLocation}
                className="h-12 px-4"
                style={{borderColor: '#a3c4e0'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d6e4ef'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Navigation className={`w-5 h-5 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
                {isGettingLocation ? 'Locating...' : 'Near Me'}
              </Button>
            </div>

            {/* Results Info */}
            {isNearbyMode && userLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg"
              style={{backgroundColor: '#d6e4ef'}}>
                <MapPin className="w-4 h-4" style={{color: '#39638b'}} />
                <span>Showing courses within</span>
                <Select 
                  value={(() => {
                    // Convert km to user's unit for display value
                    const userUnitValue = distanceUnit === 'yards' 
                      ? Math.round(maxNearbyDistance * 0.621371) 
                      : maxNearbyDistance;
                    return userUnitValue.toString();
                  })()} 
                  onValueChange={(v) => {
                    // Convert from user's unit back to km for storage
                    const value = parseInt(v);
                    const kmValue = distanceUnit === 'yards' 
                      ? Math.round(value / 0.621371) 
                      : value;
                    updateNearbyDistance(kmValue);
                  }}
                >
                  <SelectTrigger className="w-20 h-8" style={{borderColor: '#a3c4e0'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {distanceUnit === 'yards' ? (
                      <>
                        <SelectItem value="6">6 mi</SelectItem>
                        <SelectItem value="12">12 mi</SelectItem>
                        <SelectItem value="31">31 mi</SelectItem>
                        <SelectItem value="62">62 mi</SelectItem>
                        <SelectItem value="124">124 mi</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="20">20 km</SelectItem>
                        <SelectItem value="50">50 km</SelectItem>
                        <SelectItem value="100">100 km</SelectItem>
                        <SelectItem value="200">200 km</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <span>of your location</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsNearbyMode(false);
                    fetchCourses();
                  }}
                  className="ml-auto"
                  style={{color: '#39638b'}}
                >
                  Show All
                </Button>
              </div>
            )}

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse bg-white/50">
                    <CardHeader className="h-24" style={{backgroundColor: 'rgba(197, 230, 209, 0.5)'}} />
                    <CardContent className="h-32" />
                  </Card>
                ))
              ) : (
                (showFavoritesOnly ? courses.filter(c => favoriteIds.includes(c.id)) : [...courses].sort((a, b) => {
                  const aFav = favoriteIds.includes(a.id) ? 0 : 1;
                  const bFav = favoriteIds.includes(b.id) ? 0 : 1;
                  return aFav - bFav;
                })).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur cursor-pointer overflow-hidden"
                      style={{borderColor: '#8ab0d1'}}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5d8cb8'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#8ab0d1'}
                    >
                      <div className="h-28 relative overflow-hidden"
                        style={{background: 'linear-gradient(135deg, #5d8cb8 0%, #4a7aa8 100%)'}}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-white truncate">{course.name}</h3>
                            </div>
                            <p className="text-sm text-white/90 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {course.city}, {course.region}
                            </p>
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(course.id, e)}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                          >
                            <Heart 
                              className={`w-5 h-5 text-white transition-colors ${
                                favoriteIds.includes(course.id) ? 'fill-red-500 text-red-500' : ''
                              }`} 
                            />
                          </button>
                        </div>
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-white/20 text-white border-white/30">
                            {course.totalHoles} holes
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {course.distance !== undefined && (
                              <Badge variant="secondary" style={{backgroundColor: '#8ab0d1', color: '#2a4a6a'}}>
                                <Navigation className="w-3 h-3 mr-1" />
                                {distanceUnit === 'yards' 
                                  ? `${(course.distance * 0.621371).toFixed(1)} mi away`
                                  : `${course.distance.toFixed(1)} km away`}
                              </Badge>
                            )}
                          </div>
                          {course.designer && (
                            <span className="text-xs text-muted-foreground">
                              by {course.designer}
                            </span>
                          )}
                        </div>
                        
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {course.description}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          {course.isActive ? (
                            <Button
                              size="sm"
                              className="flex-1 text-white"
                              style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                              onClick={() => startNewRound(course)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Play
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white cursor-not-allowed"
                              disabled
                            >
                              Coming Soon
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" style={{borderColor: '#a3c4e0'}}>
                                Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>{course.name}</DialogTitle>
                                <DialogDescription>
                                  {course.city}, {course.region} • {course.totalHoles} holes
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {course.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {course.description}
                                  </p>
                                )}
                                
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  {course.designer && (
                                    <div>
                                      <span className="text-muted-foreground">Designer:</span>
                                      <span className="ml-2 font-medium">{course.designer}</span>
                                    </div>
                                  )}
                                  {course.yearBuilt && (
                                    <div>
                                      <span className="text-muted-foreground">Year:</span>
                                      <span className="ml-2 font-medium">{course.yearBuilt}</span>
                                    </div>
                                  )}
                                  {course.phone && (
                                    <div>
                                      <span className="text-muted-foreground">Phone:</span>
                                      <span className="ml-2 font-medium">{course.phone}</span>
                                    </div>
                                  )}
                                  {course.distance !== undefined && (
                                    <div>
                                      <span className="text-muted-foreground">Distance:</span>
                                      <span className="ml-2 font-medium" style={{color: '#39638b'}}>
                                        {distanceUnit === 'yards' 
                                          ? `${(course.distance * 0.621371).toFixed(1)} mi`
                                          : `${course.distance.toFixed(1)} km`}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {course.holes.length > 0 && (
                                  <div className="mt-4">
                                    <h4 className="font-medium mb-2">Hole Information</h4>
                                    <ScrollArea className="h-48 rounded border">
                                      <div className="p-2">
                                        <div className="grid grid-cols-9 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
                                          {Array.from({ length: Math.min(course.totalHoles, 18) }).map((_, i) => (
                                            <div key={i} className="p-1">{i + 1}</div>
                                          ))}
                                        </div>
                                        <div className="grid grid-cols-9 gap-1 text-center text-xs">
                                          {course.holes.slice(0, 18).map((hole) => (
                                            <div key={hole.id} className={`p-1 rounded ${
                                              hole.par === 3 ? 'bg-red-100 text-red-700' :
                                              hole.par === 4 ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-blue-100 text-blue-700'
                                            }`}>
                                              {hole.par}
                                            </div>
                                          ))}
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground text-center">
                                          Par: {course.holes.slice(0, 18).reduce((sum, h) => sum + h.par, 0)}
                                        </div>
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}

                                {course.isActive ? (
                                  <Button
                                    className="w-full text-white"
                                    style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                                    onClick={() => startNewRound(course)}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Start a Round
                                  </Button>
                                ) : (
                                  <Button
                                    className="w-full bg-red-500 hover:bg-red-600 text-white cursor-not-allowed"
                                    disabled
                                  >
                                    Coming Soon
                                  </Button>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {!loading && courses.length === 0 && (
              <div className="text-center py-12">
                <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No courses found. Try a different search.</p>
              </div>
            )}
          </TabsContent>

          {/* Scorecard Tab */}
          <TabsContent value="scorecard" className="space-y-4">
            {!showScorecard || !selectedCourse ? (
              <Card className="bg-white/80 backdrop-blur">
                <CardContent className="py-12 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4" style={{color: '#5d8cb8'}} />
                  <h3 className="text-xl font-semibold mb-2">No Active Round</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a course from the Courses tab to start a new round
                  </p>
                  <Button
                    onClick={() => setActiveTab('search')}
                    className="text-white"
                    style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                  >
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Course Info Header - Compact name and city */}
                <div className="px-3 py-2 rounded-t-lg text-white flex items-center justify-center"
                  style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{selectedCourse.name}</h2>
                    <span className="text-white/70">•</span>
                    <p className="text-white/80 text-sm">{selectedCourse.city}</p>
                  </div>
                </div>

                {/* Scorecard */}
                <Card className="bg-white/80 backdrop-blur overflow-hidden">
                  <CardContent className="p-0">
                    {/* Front 9 / Back 9 Toggle with Map/GPS buttons */}
                    {holesPlayed === 18 && (
                      <div className="flex items-center justify-between gap-2 px-2 py-2 border-b" style={{borderColor: '#8ab0d1'}}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={scorecardView === 'front' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setScorecardView('front')}
                            style={scorecardView === 'front' ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                            className="text-sm"
                          >
                            Front 9 (1-9)
                          </Button>
                          <Button
                            variant={scorecardView === 'back' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setScorecardView('back')}
                            style={scorecardView === 'back' ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                            className="text-sm"
                          >
                            Back 9 (10-18)
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMapScreen(true)}
                            className="h-8 text-sm gap-1"
                            style={{borderColor: '#8ab0d1'}}
                          >
                            <MapIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Map</span>
                          </Button>
                          <Button
                            variant={showGPSPanel ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowGPSPanel(!showGPSPanel)}
                            className="h-8 text-sm gap-1"
                            style={showGPSPanel ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                          >
                            <Navigation className="w-4 h-4" />
                            <span className="hidden sm:inline">GPS</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* 9-hole round indicator with Map/GPS buttons */}
                    {holesPlayed === 9 && (
                      <div className="flex items-center justify-between gap-2 px-2 py-2 border-b" style={{borderColor: '#8ab0d1'}}>
                        <span className="text-sm font-medium" style={{color: '#39638b'}}>
                          {holesType === 'front' ? 'Front 9 (Holes 1-9)' : 'Back 9 (Holes 10-18)'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMapScreen(true)}
                            className="h-8 text-sm gap-1"
                            style={{borderColor: '#8ab0d1'}}
                          >
                            <MapIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Map</span>
                          </Button>
                          <Button
                            variant={showGPSPanel ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowGPSPanel(!showGPSPanel)}
                            className="h-8 text-sm gap-1"
                            style={showGPSPanel ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                          >
                            <Navigation className="w-4 h-4" />
                            <span className="hidden sm:inline">GPS</span>
                          </Button>
                        </div>
                      </div>
                    )}
                    <div 
                      ref={scorecardRef}
                      className="overflow-x-auto"
                      onScroll={checkScrollPosition}
                    >
                      <div className="min-w-[500px]">
                        {/* Header Row - Sticky */}
                        <div className="sticky top-0 z-30 grid gap-1 p-2 text-white text-sm font-medium"
                        style={{backgroundColor: '#39638b', gridTemplateColumns: `32px 28px 28px repeat(${6 + additionalPlayers.length}, minmax(0, 1fr))`}}>
                          <div className="text-center sticky left-0 z-40 bg-[#39638b]">Hole</div>
                          <div className="text-center">Par</div>
                          <div className="text-center">HCP</div>
                          {/* Main player column with photo */}
                          <div className="text-center flex flex-col items-center gap-1">
                            {user?.avatar ? (
                              <img src={user.avatar} alt={user.name || 'You'} className="w-8 h-8 rounded-full object-cover border-2 border-white/50" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                {user?.name?.charAt(0).toUpperCase() || 'Y'}
                              </div>
                            )}
                            <span className="max-w-[60px]">{(() => { const n = user?.name?.split(' ')[0] || 'You'; return n.length > 6 ? n.slice(0, 3) + '..' : n; })()}</span>
                          </div>
                          {/* Additional players columns with photos and delete button */}
                          {additionalPlayers.map((player) => (
                            <div key={player.id} className="text-center flex flex-col items-center gap-1 relative group">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full"
                                onClick={() => setPlayerToDelete(player)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              {player.avatar ? (
                                <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover border-2 border-white/50" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                  {player.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                              <span className="max-w-[60px]">{(() => { const n = player.name.split(' ')[0]; return n.length > 6 ? n.slice(0, 3) + '..' : n; })()}</span>
                            </div>
                          ))}
                          <div className="text-center">Putts</div>
                          <div className="text-center">FWY</div>
                          <div className="text-center">GIR</div>
                          <div className="text-center">Pen</div>
                          <div className="text-center">+/-</div>
                        </div>

                        {/* Hole Rows */}
                        {scores.filter((score) => {
                          // For 9-hole rounds, show only the selected 9 holes
                          if (holesPlayed === 9) {
                            if (holesType === 'front') {
                              return score.holeNumber >= 1 && score.holeNumber <= 9;
                            } else {
                              return score.holeNumber >= 10 && score.holeNumber <= 18;
                            }
                          }
                          // For 18-hole rounds, show 9 holes at a time based on scorecardView
                          if (scorecardView === 'front') {
                            return score.holeNumber >= 1 && score.holeNumber <= 9;
                          } else {
                            return score.holeNumber >= 10 && score.holeNumber <= 18;
                          }
                        }).map((score, index) => {
                          const hole = selectedCourse.holes.find(h => h.holeNumber === score.holeNumber);
                          const holePar = hole?.par || 4;
                          const holeHcp = hole?.handicap || '-';
                          const scoreDiff = score.strokes > 0 ? score.strokes - holePar : 0;
                          
                          return (
                            <div
                              key={score.holeNumber}
                              className={`grid gap-1 p-1.5 text-sm ${index % 2 === 0 ? 'bg-white' : ''}`}
                              style={{
                                ...(index % 2 !== 0 ? {backgroundColor: 'rgba(232, 245, 237, 0.5)'} : {}),
                                gridTemplateColumns: `32px 28px 28px repeat(${6 + additionalPlayers.length}, minmax(0, 1fr))`
                              }}
                            >
                              {/* Hole number - sticky */}
                              <div className={`text-center font-medium flex items-center justify-center sticky left-0 z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-[rgba(232,245,237,0.9)]'}`}>
                                {score.holeNumber}
                              </div>
                              {/* Par */}
                              <div className="text-center flex items-center justify-center">
                                <Badge variant="outline" className={`${
                                  hole?.par === 3 ? 'border-red-300 text-red-600' :
                                  hole?.par === 4 ? 'border-yellow-400 text-yellow-700' :
                                  'border-blue-300 text-blue-600'
                                }`}>
                                  {hole?.par || '-'}
                                </Badge>
                              </div>
                              {/* HCP */}
                              <div className="text-center flex items-center justify-center">
                                <Badge variant="secondary" className="text-xs">
                                  {holeHcp}
                                </Badge>
                              </div>
                              {/* Main player score */}
                              <div className="flex items-center justify-center">
                                <Input
                                  type="number"
                                  min={1}
                                  max={15}
                                  value={score.strokes || ''}
                                  onChange={(e) => updateScore(score.holeNumber, 'strokes', parseInt(e.target.value) || 0)}
                                  className={`h-10 w-12 text-center text-base font-semibold border border-gray-400 ${getScoreColor(score.strokes, holePar)}`}
                                  style={{'--tw-ring-color': '#39638b'} as React.CSSProperties}
                                  onFocus={(e) => e.target.style.borderColor = '#39638b'}
                                  onBlur={(e) => e.target.style.borderColor = '#6b7280'}
                                />
                              </div>
                              {/* Additional players scores */}
                              {additionalPlayers.map((player, playerIdx) => {
                                const playerScore = playerScores.get(playerIdx)?.find(s => s.holeNumber === score.holeNumber);
                                return (
                                  <div key={player.id} className="flex items-center justify-center">
                                    <Input
                                      type="number"
                                      min={1}
                                      max={15}
                                      value={playerScore?.strokes || ''}
                                      onChange={(e) => updatePlayerScore(playerIdx, score.holeNumber, 'strokes', parseInt(e.target.value) || 0)}
                                      className={`h-10 w-12 text-center text-base font-semibold border border-gray-400 ${getScoreColor(playerScore?.strokes || 0, holePar)}`}
                                      style={{'--tw-ring-color': '#39638b'} as React.CSSProperties}
                                      onFocus={(e) => e.target.style.borderColor = '#39638b'}
                                      onBlur={(e) => e.target.style.borderColor = '#6b7280'}
                                    />
                                  </div>
                                );
                              })}
                              {/* Putts */}
                              <div className="flex items-center justify-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={10}
                                  value={score.putts || ''}
                                  onChange={(e) => updateScore(score.holeNumber, 'putts', parseInt(e.target.value) || 0)}
                                  className="h-10 w-12 text-center text-base font-semibold border border-gray-400"
                                  onFocus={(e) => e.target.style.borderColor = '#39638b'}
                                  onBlur={(e) => e.target.style.borderColor = '#9ca3af'}
                                />
                              </div>
                              {/* FWY */}
                              <div className="flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant={score.fairwayHit === true ? 'default' : score.fairwayHit === false ? 'destructive' : 'outline'}
                                  className={`h-8 w-8 p-0 ${score.fairwayHit === true ? '' : ''}`}
                                  style={score.fairwayHit === true ? {backgroundColor: '#39638b'} : {}}
                                  onClick={() => updateScore(score.holeNumber, 'fairwayHit', 
                                    score.fairwayHit === null ? true : score.fairwayHit === true ? false : null
                                  )}
                                >
                                  {score.fairwayHit === true ? <Check className="w-4 h-4" /> : score.fairwayHit === false ? <X className="w-4 h-4" /> : '-'}
                                </Button>
                              </div>
                              {/* GIR */}
                              <div className="flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant={score.greenInReg ? 'default' : 'outline'}
                                  className={`h-8 w-8 p-0`}
                                  style={score.greenInReg ? {backgroundColor: '#39638b'} : {}}
                                  onClick={() => updateScore(score.holeNumber, 'greenInReg', !score.greenInReg)}
                                >
                                  {score.greenInReg ? <Check className="w-4 h-4" /> : '-'}
                                </Button>
                              </div>
                              {/* Penalties */}
                              <div className="flex items-center justify-center">
                                <Input
                                  type="number"
                                  min={0}
                                  max={5}
                                  value={score.penalties || ''}
                                  onChange={(e) => updateScore(score.holeNumber, 'penalties', parseInt(e.target.value) || 0)}
                                  className="h-10 w-12 text-center text-base font-semibold border border-gray-400"
                                  onFocus={(e) => e.target.style.borderColor = '#39638b'}
                                  onBlur={(e) => e.target.style.borderColor = '#9ca3af'}
                                />
                              </div>
                              {/* +/- */}
                              <div className="flex items-center justify-center">
                                <span className={`font-medium text-sm ${
                                  scoreDiff < 0 ? 'text-red-600' : 
                                  scoreDiff > 0 ? 'text-amber-600' : 'text-gray-600'
                                }`}>
                                  {score.strokes > 0 ? (scoreDiff > 0 ? '+' : '') + scoreDiff : '-'}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Total Row - Sticky */}
                        <div className="sticky bottom-0 z-30 grid gap-1 p-2 text-white text-sm font-medium"
                          style={{backgroundColor: '#39638b', gridTemplateColumns: `32px 28px 28px repeat(${6 + additionalPlayers.length}, minmax(0, 1fr))`}}>
                          <div className="text-center sticky left-0 z-40 bg-[#39638b]">Total</div>
                          <div className="text-center">{
                            // Calculate par for played holes only
                            selectedCourse.holes
                              .filter(h => {
                                if (holesPlayed === 9) {
                                  return holesType === 'front' ? h.holeNumber <= 9 : h.holeNumber >= 10;
                                }
                                return true;
                              })
                              .reduce((sum, h) => sum + h.par, 0)
                          }</div>
                          <div className="text-center">-</div>
                          <div className="text-center">{
                            // Calculate strokes for played holes only
                            scores
                              .filter(s => {
                                if (holesPlayed === 9) {
                                  return holesType === 'front' ? s.holeNumber <= 9 : s.holeNumber >= 10;
                                }
                                return true;
                              })
                              .reduce((sum, s) => sum + (s.strokes || 0), 0) || '-'
                          }</div>
                          {additionalPlayers.map((player, playerIdx) => {
                            // Calculate player total for played holes only
                            const playerTotal = playerScores.get(playerIdx)
                              ?.filter(s => {
                                if (holesPlayed === 9) {
                                  return holesType === 'front' ? s.holeNumber <= 9 : s.holeNumber >= 10;
                                }
                                return true;
                              })
                              ?.reduce((sum, s) => sum + (s.strokes || 0), 0) || 0;
                            return <div key={player.id} className="text-center">{playerTotal || '-'}</div>;
                          })}
                          <div className="text-center">{
                            scores.filter(s => holesPlayed === 9 ? (holesType === 'front' ? s.holeNumber <= 9 : s.holeNumber >= 10) : true)
                              .reduce((sum, s) => sum + (s.putts || 0), 0) || '-'
                          }</div>
                          <div className="text-center">{
                            scores.filter(s => holesPlayed === 9 ? (holesType === 'front' ? s.holeNumber <= 9 : s.holeNumber >= 10) : true)
                              .filter(s => s.fairwayHit === true).length || '-'
                          }</div>
                          <div className="text-center">{
                            scores.filter(s => holesPlayed === 9 ? (holesType === 'front' ? s.holeNumber <= 9 : s.holeNumber >= 10) : true)
                              .filter(s => s.greenInReg).length || '-'
                          }</div>
                          <div className="text-center">{
                            scores.filter(s => holesPlayed === 9 ? (holesType === 'front' ? s.holeNumber <= 9 : s.holeNumber >= 10) : true)
                              .reduce((sum, s) => sum + (s.penalties || 0), 0) || '-'
                          }</div>
                          <div className="text-center">
                            {(() => {
                              let vsPar = 0;
                              const relevantScores = scores.filter(s => holesPlayed === 9 ? (holesType === 'front' ? s.holeNumber <= 9 : s.holeNumber >= 10) : true);
                              relevantScores.forEach(s => {
                                if (s.strokes > 0) {
                                  const hole = selectedCourse.holes.find(h => h.holeNumber === s.holeNumber);
                                  vsPar += s.strokes - (hole?.par || 4);
                                }
                              });
                              return (vsPar > 0 ? '+' : '') + vsPar;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t space-y-3" style={{borderColor: '#8ab0d1'}}>
                      {/* Tee Selector and Action Buttons Row - Centered */}
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        {selectedCourse.tees.length > 0 && (
                          <Select value={selectedTee} onValueChange={setSelectedTee}>
                            <SelectTrigger className="w-40 h-9 text-sm">
                              <SelectValue placeholder="Select Tee" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedCourse.tees.map((tee) => (
                                <SelectItem key={tee.id} value={tee.id}>
                                  {tee.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPlayerDialog(true)}
                          className="h-9 text-sm"
                          style={{borderColor: '#8ab0d1'}}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Add Players ({additionalPlayers.length}/3)
                        </Button>
                      </div>
                      
                      {/* GPS Range Finder Panel */}
                      {showGPSPanel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2">
                            <GPSRangeFinder 
                              course={selectedCourse} 
                              userLocation={userLocation}
                              onLocationUpdate={(loc) => setUserLocation(loc)}
                              selectedHole={selectedGPSHole}
                              onHoleChange={setSelectedGPSHole}
                              distanceUnit={distanceUnit}
                              userClubs={userClubs}
                            />
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Save and Discard Buttons */}
                      <div className="flex gap-3">
                        <Button
                          className="flex-1 text-white"
                          style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                          onClick={saveRound}
                          disabled={scores.filter(s => s.strokes > 0).length === 0}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Round
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to discard this round? All scores will be lost.')) {
                              discardRound();
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Discard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Score Summary - Below Scorecard */}
                <div className="grid grid-cols-5 gap-2">
                  <Card className="bg-white/80 text-center p-3">
                    <p className="text-xs text-muted-foreground">Strokes</p>
                    <p className="text-2xl font-bold text-center" style={{color: '#39638b'}}>{calculateTotals().strokes}</p>
                  </Card>
                  <Card className="bg-white/80 text-center p-3">
                    <p className="text-xs text-muted-foreground">Par</p>
                    <p className="text-2xl font-bold text-gray-600 text-center">{getCoursePar()}</p>
                  </Card>
                  <Card className="bg-white/80 text-center p-3">
                    <p className="text-xs text-muted-foreground">+/-</p>
                    <p className={`text-2xl font-bold text-center ${
                      calculateTotals().vsPar < 0 ? 'text-red-600' : 
                      calculateTotals().vsPar > 0 ? 'text-amber-600' : 'text-jazel'
                    }`}>
                      {calculateTotals().vsPar > 0 ? '+' : ''}{calculateTotals().vsPar || 0}
                    </p>
                  </Card>
                  <Card className="bg-white/80 text-center p-3">
                    <p className="text-xs text-muted-foreground">Putts</p>
                    <p className="text-2xl font-bold text-center" style={{color: '#39638b'}}>{calculateTotals().putts}</p>
                  </Card>
                  <Card className="bg-white/80 text-center p-3">
                    <p className="text-xs text-muted-foreground">GIR</p>
                    <p className="text-2xl font-bold text-center" style={{color: '#39638b'}}>{calculateTotals().gir}</p>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Round History</CardTitle>
                <CardDescription>Your past golf rounds and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {roundHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No rounds recorded yet</p>
                    <p className="text-sm text-muted-foreground">Complete a round to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {roundHistory.map((round, index) => {
                      // Parse player names if available - handle both old string format and new object format
                      let playerNames: (string | { name: string })[] = [];
                      if (round.playerNames) {
                        try {
                          playerNames = JSON.parse(round.playerNames);
                        } catch (e) {}
                      }
                      
                      // Calculate additional player totals from scores
                      const additionalPlayerTotals = new Map<number, number>();
                      round.scores?.forEach(s => {
                        if (s.playerIndex && s.playerIndex > 0) {
                          const current = additionalPlayerTotals.get(s.playerIndex) || 0;
                          additionalPlayerTotals.set(s.playerIndex, current + s.strokes);
                        }
                      });
                      
                      // Calculate course par from holes data - only for played holes
                      const holesPlayedCount = round.holesPlayed || 18;
                      const holesTypeValue = round.holesType || 'front';
                      const startHole = holesPlayedCount === 9 && holesTypeValue === 'back' ? 10 : 1;
                      const endHole = holesPlayedCount === 9 ? (holesTypeValue === 'back' ? 18 : 9) : 18;
                      
                      const relevantHoles = (round.course?.holes || []).filter((h: { holeNumber: number }) => 
                        h.holeNumber >= startHole && h.holeNumber <= endHole
                      );
                      const coursePar = relevantHoles.reduce((sum: number, h: { par: number }) => sum + h.par, 0) || (holesPlayedCount === 9 ? 36 : 72);
                      const mainPlayerScores = round.scores?.filter(s => s.playerIndex === 0) || [];
                      
                      // Calculate +/- from individual holes - only count filled holes (strokes > 0)
                      let vsPar = 0;
                      let totalStrokesFromScores = 0;
                      mainPlayerScores.forEach(score => {
                        if (score.strokes > 0) {
                          const hole = relevantHoles.find((h: { holeNumber: number }) => h.holeNumber === score.holeNumber);
                          const holePar = hole?.par || 4;
                          vsPar += score.strokes - holePar;
                          totalStrokesFromScores += score.strokes;
                        }
                      });
                      
                      // Use calculated totalStrokes if available, otherwise use stored value
                      const displayTotalStrokes = totalStrokesFromScores > 0 ? totalStrokesFromScores : (round.totalStrokes || 0);
                      
                      // Format holes played info
                      const holesInfo = holesPlayedCount === 18 
                        ? '18 holes' 
                        : holesTypeValue === 'back' 
                          ? 'Back 9 (10-18)' 
                          : 'Front 9 (1-9)';
                      
                      return (
                      <motion.div
                        key={round.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="transition-colors" style={{borderColor: '#8ab0d1'}}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5d8cb8'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#8ab0d1'}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{round.course?.name || 'Unknown Course'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(round.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  <span className="mx-2">•</span>
                                  <span className="text-xs" style={{color: '#39638b'}}>{holesInfo}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-2xl font-bold" style={{color: '#39638b'}}>{displayTotalStrokes}</p>
                                  <p className="text-xs text-muted-foreground">strokes</p>
                                </div>
                                <div className="text-center">
                                  <p className={`text-xl font-bold ${
                                    vsPar < 0 ? 'text-red-600' : vsPar > 0 ? 'text-amber-600' : 'text-green-600'
                                  }`}>
                                    {(vsPar > 0 ? '+' : '') + vsPar}
                                  </p>
                                  <p className="text-xs text-muted-foreground">+/-</p>
                                </div>
                              </div>
                            </div>
                            {/* Bottom row: Tee info */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{borderColor: '#d6e4ef'}}>
                              <div className="flex items-center gap-2">
                                {round.teeId && round.course?.tees && (
                                  <p className="text-xs text-muted-foreground">
                                    Tee: {round.course.tees.find(t => t.id === round.teeId)?.name || round.teeId}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* Action buttons row - separate line for better mobile display */}
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRoundToView(round)}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                                title="View scorecard summary"
                              >
                                <BookOpen className="w-3 h-3 mr-1" />
                                Scorecard
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadRoundAsXlsx(round)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                title="Download as Excel"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Excel
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadRoundForEditing(round)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                title="Edit round"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRoundToDelete(round)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                                title="Delete round"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                            {/* Show additional players if any */}
                            {playerNames.length > 0 && (
                              <div className="mt-3 pt-3 border-t" style={{borderColor: '#d6e4ef'}}>
                                <p className="text-xs text-muted-foreground mb-2">Other Players:</p>
                                <div className="flex flex-wrap gap-2">
                                  {playerNames.map((playerInfo, idx) => {
                                    const playerName = typeof playerInfo === 'string' ? playerInfo : playerInfo.name;
                                    const playerTotal = additionalPlayerTotals.get(idx + 1) || 0;
                                    // Calculate player's +/- vs par
                                    const playerVsPar = playerTotal - coursePar;
                                    const vsParDisplay = playerTotal > 0 ? ` (${playerVsPar > 0 ? '+' : ''}${playerVsPar})` : '';
                                    return (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {playerName}: {playerTotal}{vsParDisplay}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );})}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {weatherData?.time?.isNight ? (
                        <Moon className="w-5 h-5 text-blue-300" />
                      ) : (
                        <Sun className="w-5 h-5 text-yellow-500" />
                      )}
                      Weather
                    </CardTitle>
                    <CardDescription>
                      {weatherData?.location?.city ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {weatherData.location.city}{weatherData.location.country ? `, ${weatherData.location.country}` : ''}
                        </span>
                      ) : (
                        'Current weather conditions and forecast'
                      )}
                    </CardDescription>
                  </div>
                  {weatherData?.time && (
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{color: '#39638b'}}>{weatherData.time.local}</p>
                      <p className="text-xs text-muted-foreground">{weatherData.time.date}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!userLocation ? (
                  <div className="text-center py-12">
                    <Navigation className={`w-12 h-12 text-muted-foreground mx-auto mb-4 ${isGettingLocation ? 'animate-spin' : 'animate-pulse'}`} />
                    <p className="text-muted-foreground mb-4">Location not available</p>
                    <Button
                      onClick={getUserLocation}
                      disabled={isGettingLocation}
                      className="text-white"
                      style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                    >
                      <Navigation className={`w-4 h-4 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
                      {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
                    </Button>
                  </div>
                ) : weatherLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" style={{color: '#39638b'}} />
                  </div>
                ) : weatherError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">{weatherError}</p>
                    <Button
                      onClick={() => fetchWeather(undefined, true)}
                      variant="outline"
                      className="mt-4"
                      style={{borderColor: '#a3c4e0'}}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : weatherData ? (
                  <div className="space-y-6">
                    {/* Current Weather */}
                    <div className="p-6 rounded-xl" style={{background: weatherData.time.isNight ? 'linear-gradient(135deg, #1e3a5f 0%, #0f2439 100%)' : 'linear-gradient(135deg, #d6e4ef 0%, #d1e8e0 100%)'}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm mb-1" style={{color: weatherData.time.isNight ? '#94a3b8' : 'hsl(var(--muted-foreground))'}}>Current Weather</p>
                          <div className="flex items-center gap-4">
                            <div className="text-5xl font-bold" style={{color: weatherData.time.isNight ? '#e2e8f0' : '#39638b'}}>
                              {formatTemperature(weatherData.current.temperature, distanceUnit)}
                            </div>
                            <div>
                              <p className="text-lg font-medium" style={{color: weatherData.time.isNight ? '#f1f5f9' : 'inherit'}}>{weatherData.current.weatherDescription}</p>
                              <p className="text-sm" style={{color: weatherData.time.isNight ? '#94a3b8' : 'hsl(var(--muted-foreground))'}}>
                                Feels like {formatTemperature(weatherData.current.apparentTemperature, distanceUnit)}
                              </p>
                            </div>
                          </div>
                          {/* Sunrise/Sunset */}
                          {weatherData.time.sunrise && weatherData.time.sunset && (
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-sm" style={{color: weatherData.time.isNight ? '#94a3b8' : 'hsl(var(--muted-foreground))'}}>
                                <Sunrise className="w-4 h-4" />
                                {weatherData.time.sunrise}
                              </div>
                              <div className="flex items-center gap-1 text-sm" style={{color: weatherData.time.isNight ? '#94a3b8' : 'hsl(var(--muted-foreground))'}}>
                                <Sunset className="w-4 h-4" />
                                {weatherData.time.sunset}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-6xl">
                          {weatherData.current.weatherIcon === 'sun' && <Sun className="w-14 h-14 text-yellow-500" />}
                          {weatherData.current.weatherIcon === 'moon' && <Moon className="w-14 h-14 text-blue-200" />}
                          {weatherData.current.weatherIcon === 'cloud-sun' && <CloudSun className="w-14 h-14 text-yellow-400" />}
                          {weatherData.current.weatherIcon === 'cloud-moon' && <CloudMoon className="w-14 h-14 text-slate-300" />}
                          {weatherData.current.weatherIcon === 'cloud' && <Cloud className="w-14 h-14 text-gray-400" />}
                          {weatherData.current.weatherIcon === 'cloud-rain' && <CloudRain className="w-14 h-14 text-blue-400" />}
                          {weatherData.current.weatherIcon === 'cloud-drizzle' && <CloudDrizzle className="w-14 h-14 text-blue-300" />}
                          {weatherData.current.weatherIcon === 'cloud-snow' && <CloudSnow className="w-14 h-14 text-blue-200" />}
                          {weatherData.current.weatherIcon === 'cloud-fog' && <CloudFog className="w-14 h-14 text-gray-400" />}
                          {weatherData.current.weatherIcon === 'cloud-lightning' && <CloudLightning className="w-14 h-14 text-purple-500" />}
                        </div>
                      </div>
                    </div>

                    {/* Weather Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-white border" style={{borderColor: '#8ab0d1'}}>
                        <div className="flex items-center gap-2 mb-2">
                          <Wind className="w-5 h-5" style={{color: '#39638b'}} />
                          <span className="text-sm text-muted-foreground">Wind</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xl font-bold">
                              {Math.round(convertWindSpeed(weatherData.current.windSpeed, distanceUnit))} {getWindSpeedUnitLabel(distanceUnit)}
                            </p>
                            <p className="text-xs text-muted-foreground">{weatherData.current.windDirection}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-white border" style={{borderColor: '#8ab0d1'}}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5" style={{color: '#39638b'}} />
                          <span className="text-sm text-muted-foreground">Gusts</span>
                        </div>
                        <p className="text-xl font-bold">
                          {Math.round(convertWindSpeed(weatherData.current.windGusts, distanceUnit))} {getWindSpeedUnitLabel(distanceUnit)}
                        </p>
                        <p className="text-xs text-muted-foreground">Max gusts</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white border" style={{borderColor: '#8ab0d1'}}>
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="w-5 h-5" style={{color: '#39638b'}} />
                          <span className="text-sm text-muted-foreground">Humidity</span>
                        </div>
                        <p className="text-xl font-bold">{weatherData.current.humidity}%</p>
                        <p className="text-xs text-muted-foreground">Relative humidity</p>
                      </div>
                      <div className="p-4 rounded-lg bg-white border" style={{borderColor: '#8ab0d1'}}>
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="w-5 h-5" style={{color: '#39638b'}} />
                          <span className="text-sm text-muted-foreground">Feels Like</span>
                        </div>
                        <p className="text-xl font-bold">{formatTemperature(weatherData.current.apparentTemperature, distanceUnit)}</p>
                        <p className="text-xs text-muted-foreground">Apparent temp</p>
                      </div>
                    </div>

                    {/* Hourly Forecast */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" style={{color: '#39638b'}} />
                        Hourly Forecast
                      </h3>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {weatherData.hourly.map((hour, idx) => (
                          <div
                            key={idx}
                            className={`flex-shrink-0 p-3 rounded-lg text-center min-w-[80px] border ${hour.isNight ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'}`}
                            style={{borderColor: hour.isNight ? undefined : '#8ab0d1'}}
                          >
                            <p className={`text-xs mb-1 ${hour.isNight ? 'text-slate-400' : 'text-muted-foreground'}`}>{hour.time}</p>
                            <div className="my-2">
                              {hour.weatherIcon === 'sun' && <Sun className="w-8 h-8 mx-auto text-yellow-500" />}
                              {hour.weatherIcon === 'moon' && <Moon className="w-8 h-8 mx-auto text-blue-200" />}
                              {hour.weatherIcon === 'cloud-sun' && <CloudSun className="w-8 h-8 mx-auto text-yellow-400" />}
                              {hour.weatherIcon === 'cloud-moon' && <CloudMoon className="w-8 h-8 mx-auto text-slate-300" />}
                              {hour.weatherIcon === 'cloud' && <Cloud className={`w-8 h-8 mx-auto ${hour.isNight ? 'text-slate-500' : 'text-gray-400'}`} />}
                              {hour.weatherIcon === 'cloud-rain' && <CloudRain className="w-8 h-8 mx-auto text-blue-400" />}
                              {hour.weatherIcon === 'cloud-drizzle' && <CloudDrizzle className="w-8 h-8 mx-auto text-blue-300" />}
                              {hour.weatherIcon === 'cloud-snow' && <CloudSnow className="w-8 h-8 mx-auto text-blue-200" />}
                              {hour.weatherIcon === 'cloud-fog' && <CloudFog className="w-8 h-8 mx-auto text-gray-400" />}
                              {hour.weatherIcon === 'cloud-lightning' && <CloudLightning className="w-8 h-8 mx-auto text-purple-500" />}
                            </div>
                            <p className={`text-lg font-bold ${hour.isNight ? 'text-slate-200' : ''}`}>{formatTemperature(hour.temperature, distanceUnit)}</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Wind className={`w-3 h-3 ${hour.isNight ? 'text-slate-500' : 'text-muted-foreground'}`} />
                              <span className={`text-xs ${hour.isNight ? 'text-slate-500' : 'text-muted-foreground'}`}>{Math.round(convertWindSpeed(hour.windSpeed, distanceUnit))}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Golf Playing Conditions */}
                    <div className="p-4 rounded-lg border" style={{borderColor: '#8ab0d1', backgroundColor: '#f0fdf4'}}>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Target className="w-5 h-5" style={{color: '#39638b'}} />
                        Golf Conditions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {weatherData.current.windSpeed > 20 ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                            <Wind className="w-3 h-3 mr-1" /> Windy conditions
                          </Badge>
                        ) : weatherData.current.windSpeed > 10 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Wind className="w-3 h-3 mr-1" /> Light breeze
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Wind className="w-3 h-3 mr-1" /> Calm wind
                          </Badge>
                        )}
                        {weatherData.current.weatherCode >= 61 && weatherData.current.weatherCode <= 67 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <CloudRain className="w-3 h-3 mr-1" /> Rain expected
                          </Badge>
                        )}
                        {weatherData.current.weatherCode >= 95 && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            <CloudLightning className="w-3 h-3 mr-1" /> Thunderstorm
                          </Badge>
                        )}
                        {weatherData.current.temperature > 30 && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <Thermometer className="w-3 h-3 mr-1" /> Hot weather
                          </Badge>
                        )}
                        {weatherData.current.temperature < 10 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Thermometer className="w-3 h-3 mr-1" /> Cold weather
                          </Badge>
                        )}
                        {weatherData.current.weatherCode >= 0 && weatherData.current.weatherCode <= 3 && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Sun className="w-3 h-3 mr-1" /> Good visibility
                          </Badge>
                        )}
                        {weatherData.time.isNight && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                            <Moon className="w-3 h-3 mr-1" /> Night time
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Refresh Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={() => fetchWeather(undefined, true)}
                        variant="outline"
                        size="sm"
                        style={{borderColor: '#a3c4e0'}}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Weather
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Golfers Tab */}
          <TabsContent value="golfers" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{color: '#39638b'}} />
                  Golfers
                </CardTitle>
                <CardDescription>
                  Connect with other golfers in the community ({golfers.length} registered)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filter and Search Row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  {/* Group Filter */}
                  <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                    <SelectTrigger className="w-full sm:w-64 h-12 bg-white" style={{borderColor: '#a3c4e0'}}>
                      <SelectValue placeholder="Filter by group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Golfers</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group._count.members})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search golfers by name, city or country..."
                      value={golferSearch}
                      onChange={(e) => setGolferSearch(e.target.value)}
                      className="pl-10 h-12 bg-white"
                      style={{borderColor: '#a3c4e0'}}
                      onFocus={(e) => e.target.style.borderColor = '#39638b'}
                      onBlur={(e) => e.target.style.borderColor = '#a3c4e0'}
                    />
                  </div>
                </div>

                {golfers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {selectedGroupFilter !== 'all'
                        ? 'No golfers in this group'
                        : 'No golfers registered yet'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {golfers
                      .filter((golfer) => 
                        golferSearch === '' || 
                        golfer.name?.toLowerCase().includes(golferSearch.toLowerCase()) ||
                        golfer.city?.toLowerCase().includes(golferSearch.toLowerCase()) ||
                        golfer.country?.toLowerCase().includes(golferSearch.toLowerCase())
                      )
                      .map((golfer, index) => (
                      <motion.div
                        key={golfer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="transition-colors overflow-hidden"
                          style={{borderColor: '#8ab0d1'}}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5d8cb8'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#8ab0d1'}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                                style={{background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)'}}>
                                {golfer.avatar ? (
                                  <img 
                                    src={golfer.avatar} 
                                    alt={golfer.name || 'Golfer'} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl font-bold text-white">
                                    {golfer.name?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{golfer.name || 'Anonymous Golfer'}</h4>
                                <p className="text-sm text-muted-foreground truncate">
                                  {golfer.city && golfer.country 
                                    ? `${golfer.city}, ${golfer.country}` 
                                    : golfer.country || golfer.city || 'Location not set'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3" style={{borderTop: '1px solid #d6e4ef'}}>
                              <div className="flex items-center gap-1">
                                <Trophy className="w-4 h-4" style={{color: '#39638b'}} />
                                <span className="text-sm font-medium">
                                  Handicap: {golfer.handicap !== null ? golfer.handicap : '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4" style={{color: '#4a7aa8'}} />
                                <span className="text-sm text-muted-foreground">
                                  {golfer._count.rounds} rounds
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-4">
            {selectedTournament ? (
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTournament(null)}
                      style={{color: '#39638b'}}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back to Tournaments
                    </Button>
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" style={{color: '#39638b'}} />
                    {selectedTournament.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedTournament.course.name} - {selectedTournament.course.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tournament Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(selectedTournament.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedTournament.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedTournament.format}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={
                          selectedTournament.status === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          selectedTournament.status === 'in_progress' ? 'bg-green-50 text-green-700 border-green-200' :
                          selectedTournament.status === 'completed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {selectedTournament.status === 'in_progress' ? 'In Progress' : 
                         selectedTournament.status.charAt(0).toUpperCase() + selectedTournament.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Participants Leaderboard */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        Leaderboard ({selectedTournament.participants?.length || 0}/{selectedTournament.maxPlayers} players)
                      </h3>
                    </div>

                    {selectedTournament.participants && selectedTournament.participants.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm items-center">
                          <div className="col-span-1">#</div>
                          <div className="col-span-4">Player</div>
                          <div 
                            className={`col-span-2 text-center cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 ${participantSort === 'handicap' ? 'bg-primary/10 text-primary' : ''}`}
                            onClick={() => setParticipantSort('handicap')}
                          >
                            Hcp {participantSort === 'handicap' && '↓'}
                          </div>
                          <div 
                            className={`col-span-2 text-center cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 ${participantSort === 'gross' ? 'bg-primary/10 text-primary' : ''}`}
                            onClick={() => setParticipantSort('gross')}
                          >
                            Brut {participantSort === 'gross' && '↓'}
                          </div>
                          <div 
                            className={`col-span-2 text-center cursor-pointer hover:bg-muted/80 rounded px-1 py-0.5 ${participantSort === 'net' ? 'bg-primary/10 text-primary' : ''}`}
                            onClick={() => setParticipantSort('net')}
                          >
                            Net {participantSort === 'net' && '↓'}
                          </div>
                          <div className="col-span-1"></div>
                        </div>
                        {/* Sorted participants */}
                        {(() => {
                          const sorted = [...selectedTournament.participants].sort((a, b) => {
                            if (participantSort === 'gross') {
                              if (a.grossScore === null && b.grossScore === null) return (a.user.handicap || 0) - (b.user.handicap || 0);
                              if (a.grossScore === null) return 1;
                              if (b.grossScore === null) return -1;
                              return a.grossScore - b.grossScore;
                            }
                            if (participantSort === 'net') {
                              if (a.netScore === null && b.netScore === null) return (a.user.handicap || 0) - (b.user.handicap || 0);
                              if (a.netScore === null) return 1;
                              if (b.netScore === null) return -1;
                              return a.netScore - b.netScore;
                            }
                            return (a.user.handicap || 0) - (b.user.handicap || 0);
                          });
                          return sorted.map((participant, index) => (
                            <div key={participant.userId} className="grid grid-cols-12 gap-2 p-3 items-center border-t">
                              <div className="col-span-1 text-muted-foreground font-medium">{index + 1}</div>
                              <div className="col-span-4 font-medium">{participant.user.name || 'Unnamed'}</div>
                              <div className="col-span-2 text-center">
                                <Badge variant="outline" className="font-mono">
                                  {participant.user.handicap?.toFixed(1) || '-'}
                                </Badge>
                              </div>
                              <div className="col-span-2 text-center font-mono">
                                {participant.grossScore ?? '-'}
                              </div>
                              <div className="col-span-2 text-center font-mono">
                                {participant.netScore ?? '-'}
                              </div>
                              <div className="col-span-1"></div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No participants yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" style={{color: '#39638b'}} />
                    Tournaments
                  </CardTitle>
                  <CardDescription>
                    View upcoming and past golf tournaments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tournamentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin" style={{color: '#39638b'}} />
                    </div>
                  ) : tournaments.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tournaments available</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {tournaments.map((tournament) => (
                        <Card
                          key={tournament.id}
                          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedTournament(tournament);
                            fetchTournamentWithParticipants(tournament.id);
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{tournament.name}</CardTitle>
                                <CardDescription>{tournament.course.name}</CardDescription>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={
                                  tournament.status === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  tournament.status === 'in_progress' ? 'bg-green-50 text-green-700 border-green-200' :
                                  tournament.status === 'completed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }
                              >
                                {tournament.status === 'in_progress' ? 'In Progress' : 
                                 tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(tournament.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{tournament.startTime}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary">{tournament.format}</Badge>
                              <Badge variant="outline">{tournament._count?.participants || 0}/{tournament.maxPlayers} players</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{tournament.course.city}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {user ? (
              <>
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" style={{color: '#39638b'}} />
                      My Profile
                    </CardTitle>
                    <CardDescription>
                      Manage your account settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                        style={{background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)'}}>
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl font-bold text-white">
                              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {avatarUploading && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-xl font-bold">{user.name || 'Golfer'}</h3>
                        <p className="text-muted-foreground">{user.email}</p>
                        {user.handicap !== null && (
                          <Badge variant="secondary" className="mt-1">Handicap: {user.handicap}</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Photo Upload Section */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={avatarUploading}
                      />
                      <label htmlFor="avatar-upload">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="cursor-pointer"
                          style={{borderColor: '#a3c4e0'}}
                          disabled={avatarUploading}
                          asChild
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </span>
                        </Button>
                      </label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        style={{borderColor: '#a3c4e0'}}
                        onClick={handleCameraCapture}
                        disabled={avatarUploading}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      {user.avatar && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-200 text-red-600"
                          onClick={handleRemoveAvatar}
                          disabled={avatarUploading}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card style={{borderColor: '#8ab0d1'}}>
                        <CardContent className="p-4 text-center">
                          <Trophy className="w-8 h-8 mx-auto mb-2" style={{color: '#39638b'}} />
                          <h4 className="font-medium">{roundHistory.length}</h4>
                          <p className="text-sm text-muted-foreground">Rounds Played</p>
                        </CardContent>
                      </Card>
                      <Card style={{borderColor: '#8ab0d1'}}>
                        <CardContent className="p-4 text-center">
                          <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <h4 className="font-medium">{favoriteIds.length}</h4>
                          <p className="text-sm text-muted-foreground">Favorite Courses</p>
                        </CardContent>
                      </Card>
                      <Card style={{borderColor: '#8ab0d1'}}>
                        <CardContent className="p-4 text-center">
                          <Target className="w-8 h-8 mx-auto mb-2" style={{color: '#39638b'}} />
                          <h4 className="font-medium">{user.handicap || '-'}</h4>
                          <p className="text-sm text-muted-foreground">Handicap</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        style={{borderColor: '#a3c4e0'}}
                        onClick={openProfileEdit}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        style={{borderColor: '#a3c4e0'}}
                        onClick={() => setShowBadgesDialog(true)}
                      >
                        <Medal className="w-4 h-4 mr-2" />
                        My Badges
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        style={{borderColor: '#a3c4e0'}}
                        onClick={openBagDialog}
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {/* Golf bag body */}
                          <path d="M6 8h12l-1 13H7L6 8z" />
                          {/* Bag top rim */}
                          <path d="M5 8h14" />
                          {/* Club heads sticking out */}
                          <path d="M8 8V4l-1-2" />
                          <path d="M12 8V3" />
                          <path d="M16 8V4l1-2" />
                          {/* Pocket */}
                          <path d="M8 12h8v4H8z" />
                          {/* Base */}
                          <path d="M7 21h10" />
                        </svg>
                        My Bag
                      </Button>
                      <Link href="/guide" className="w-full">
                        <Button
                          variant="outline"
                          className="w-full"
                          style={{borderColor: '#a3c4e0'}}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Help
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" style={{color: '#39638b'}} />
                      Scoring Statistics
                    </CardTitle>
                    <CardDescription>
                      Your performance breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin" style={{color: '#39638b'}} />
                      </div>
                    ) : scoringStats && scoringStats.totalHoles > 0 ? (
                      <div className="space-y-4">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Eagles', value: scoringStats.scoring.eagles, color: '#ea580c' },
                                  { name: 'Birdies', value: scoringStats.scoring.birdies, color: '#22c55e' },
                                  { name: 'Pars', value: scoringStats.scoring.pars, color: '#3b82f6' },
                                  { name: 'Bogeys', value: scoringStats.scoring.bogeys, color: '#f97316' },
                                  { name: 'D. Bogey', value: scoringStats.scoring.doubleBogeys, color: '#ef4444' },
                                  { name: 'Triple+', value: scoringStats.scoring.tripleOrWorse, color: '#7c3aed' },
                                ].filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {[
                                  { color: '#ffd700' },
                                  { color: '#22c55e' },
                                  { color: '#3b82f6' },
                                  { color: '#f97316' },
                                  { color: '#ef4444' },
                                  { color: '#7c3aed' },
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div className="p-2 rounded-lg" style={{backgroundColor: '#fffbeb'}}>
                            <div className="font-bold text-amber-600">{scoringStats.scoring.eagles}</div>
                            <div className="text-xs text-muted-foreground">Eagles</div>
                          </div>
                          <div className="p-2 rounded-lg" style={{backgroundColor: '#f0fdf4'}}>
                            <div className="font-bold text-green-600">{scoringStats.scoring.birdies}</div>
                            <div className="text-xs text-muted-foreground">Birdies</div>
                          </div>
                          <div className="p-2 rounded-lg" style={{backgroundColor: '#eff6ff'}}>
                            <div className="font-bold text-blue-600">{scoringStats.scoring.pars}</div>
                            <div className="text-xs text-muted-foreground">Pars</div>
                          </div>
                          <div className="p-2 rounded-lg" style={{backgroundColor: '#fff7ed'}}>
                            <div className="font-bold text-orange-600">{scoringStats.scoring.bogeys}</div>
                            <div className="text-xs text-muted-foreground">Bogeys</div>
                          </div>
                          <div className="p-2 rounded-lg" style={{backgroundColor: '#fef2f2'}}>
                            <div className="font-bold text-red-600">{scoringStats.scoring.doubleBogeys}</div>
                            <div className="text-xs text-muted-foreground">Doubles</div>
                          </div>
                          <div className="p-2 rounded-lg" style={{backgroundColor: '#f5f3ff'}}>
                            <div className="font-bold text-purple-600">{scoringStats.scoring.tripleOrWorse}</div>
                            <div className="text-xs text-muted-foreground">Triple+</div>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t" style={{borderColor: '#8ab0d1'}}>
                          <p className="text-sm text-muted-foreground text-center">
                            Based on {scoringStats.totalHoles} holes played across {scoringStats.totalRounds} rounds
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No scoring data yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Play some rounds to see your statistics!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 text-white"
                        style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                        onClick={() => setActiveTab('search')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Start a Round
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        style={{borderColor: '#a3c4e0'}}
                        onClick={() => setActiveTab('history')}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        View History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" style={{color: '#39638b'}} />
                    Welcome to Jazel
                  </CardTitle>
                  <CardDescription>
                    Your Morocco golf companion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)'}}>
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Start Your Golf Journey</h3>
                    <p className="text-muted-foreground mb-6">
                      Track your rounds, find courses, and improve your game with Jazel
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card style={{borderColor: '#8ab0d1'}}>
                      <CardContent className="p-4 text-center">
                        <Search className="w-8 h-8 mx-auto mb-2" style={{color: '#39638b'}} />
                        <h4 className="font-medium">Find Courses</h4>
                        <p className="text-sm text-muted-foreground">24 Morocco golf courses</p>
                      </CardContent>
                    </Card>
                    <Card style={{borderColor: '#8ab0d1'}}>
                      <CardContent className="p-4 text-center">
                        <Target className="w-8 h-8 mx-auto mb-2" style={{color: '#39638b'}} />
                        <h4 className="font-medium">Track Scores</h4>
                        <p className="text-sm text-muted-foreground">Detailed scorecards</p>
                      </CardContent>
                    </Card>
                    <Card style={{borderColor: '#8ab0d1'}}>
                      <CardContent className="p-4 text-center">
                        <Bot className="w-8 h-8 mx-auto mb-2" style={{color: '#39638b'}} />
                        <h4 className="font-medium">AI Caddie</h4>
                        <p className="text-sm text-muted-foreground">Smart recommendations</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 text-white"
                        style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                        onClick={() => setShowSignupDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Account
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        style={{borderColor: '#a3c4e0'}}
                        onClick={() => setShowLoginDialog(true)}
                      >
                        Sign In
                      </Button>
                    </div>
                    <Link href="/guide" className="block">
                      <Button
                        variant="outline"
                        className="w-full"
                        style={{borderColor: '#a3c4e0'}}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Help
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* AI Caddie Dialog */}
      <AICaddieDialog 
        open={showAICaddie} 
        onOpenChange={setShowAICaddie}
        holeInfo={currentHoleInfo}
        distanceUnit={distanceUnit}
        onGetRecommendation={(data) => {
          console.log('Getting recommendation for:', data);
        }}
      />

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={(open) => {
        setShowLoginDialog(open);
        if (open) setLoginError(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome Back</DialogTitle>
            <DialogDescription>Sign in to your Jazel account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginForm.email}
                onChange={(e) => {
                  setLoginForm({ ...loginForm, email: e.target.value });
                  if (loginError) setLoginError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && loginForm.email && loginForm.password && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => {
                  setLoginForm({ ...loginForm, password: e.target.value });
                  if (loginError) setLoginError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && loginForm.email && loginForm.password && handleLogin()}
              />
            </div>
            <Button
              className="w-full text-white"
              style={{backgroundColor: '#39638b'}}
              onClick={handleLogin}
              disabled={authLoading || !loginForm.email || !loginForm.password}
            >
              {authLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => {
                  setShowLoginDialog(false);
                  setShowForgotPasswordDialog(true);
                  setForgotPasswordSent(false);
                  setForgotPasswordError(null);
                  // Preserve email from login form if user already typed it
                  if (loginForm.email) {
                    setForgotPasswordForm({ email: loginForm.email });
                  }
                }}
              >
                Forgot your password?
              </Button>
            </div>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button
                variant="link"
                className="p-0"
                style={{color: '#39638b'}}
                onClick={() => {
                  setShowLoginDialog(false);
                  setShowSignupDialog(true);
                }}
              >
                Sign up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={(open) => {
        setShowForgotPasswordDialog(open);
        if (open) {
          setForgotPasswordError(null); // Clear error when dialog opens
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {forgotPasswordSent 
                ? 'Check your email for the reset link'
                : 'Enter your email to receive a password reset link'
              }
            </DialogDescription>
          </DialogHeader>
          {!forgotPasswordSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your@email.com"
                  value={forgotPasswordForm.email}
                  onChange={(e) => {
                    setForgotPasswordForm({ email: e.target.value });
                    setForgotPasswordError(null); // Clear error when user types
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && forgotPasswordForm.email && handleForgotPassword()}
                  className={forgotPasswordError ? 'border-red-500 focus:border-red-500' : ''}
                />
              </div>
              
              {/* Inline error message */}
              {forgotPasswordError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{forgotPasswordError}</p>
                  </div>
                </div>
              )}
              
              <Button
                className="w-full text-white"
              style={{backgroundColor: '#39638b'}}
                onClick={handleForgotPassword}
                disabled={authLoading || !forgotPasswordForm.email}
              >
                {authLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowForgotPasswordDialog(false);
                  setShowLoginDialog(true);
                  setForgotPasswordError(null);
                }}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{backgroundColor: '#d6e4ef'}}>
                <p className="text-sm" style={{color: '#2a4a6a'}}>
                  We've sent a password reset link to <strong>{forgotPasswordForm.email}</strong>. 
                  Please check your inbox and follow the instructions.
                </p>
              </div>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowForgotPasswordDialog(false);
                  setShowLoginDialog(true);
                  setForgotPasswordSent(false);
                  setForgotPasswordError(null);
                }}
              >
                Back to Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={(open) => {
        setShowSignupDialog(open);
        if (open) {
          setSignupForm({ name: '', email: '', password: '', handicap: '', city: '', country: 'Morocco' });
          setSignupError(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Join Jazel and start tracking your golf rounds</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {signupError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{signupError}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your name"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && signupForm.email && signupForm.password && handleSignup()}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && signupForm.email && signupForm.password && handleSignup()}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Min. 6 characters"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && signupForm.email && signupForm.password && handleSignup()}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-handicap">Handicap (optional)</Label>
              <Input
                id="signup-handicap"
                type="number"
                step="0.1"
                placeholder="e.g., 18.5"
                value={signupForm.handicap}
                onChange={(e) => setSignupForm({ ...signupForm, handicap: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && signupForm.email && signupForm.password && handleSignup()}
                autoComplete="off"
              />
            </div>
            <Button
              className="w-full text-white"
              style={{backgroundColor: '#39638b'}}
              onClick={handleSignup}
              disabled={authLoading || !signupForm.email || !signupForm.password}
            >
              {authLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Button
                variant="link"
                className="p-0"
                style={{color: '#39638b'}}
                onClick={() => {
                  setShowSignupDialog(false);
                  setShowLoginDialog(true);
                }}
              >
                Sign in
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Edit Dialog */}
      <Dialog open={showProfileEditDialog} onOpenChange={setShowProfileEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="Your name"
                value={profileEditForm.name}
                onChange={(e) => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="your@email.com"
                value={profileEditForm.email}
                onChange={(e) => setProfileEditForm({ ...profileEditForm, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-handicap">Handicap</Label>
              <Input
                id="edit-handicap"
                type="number"
                step="0.1"
                placeholder="e.g., 18.5"
                value={profileEditForm.handicap}
                onChange={(e) => setProfileEditForm({ ...profileEditForm, handicap: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  type="text"
                  placeholder="e.g., Casablanca"
                  value={profileEditForm.city}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, city: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input
                  id="edit-country"
                  type="text"
                  placeholder="e.g., Morocco"
                  value={profileEditForm.country}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, country: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nearby-distance">Nearby Distance</Label>
                <Select 
                  value={profileEditForm.nearbyDistance?.toString() || '100'} 
                  onValueChange={(v) => setProfileEditForm({ ...profileEditForm, nearbyDistance: parseInt(v) })}
                >
                  <SelectTrigger id="edit-nearby-distance">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {distanceUnit === 'yards' ? (
                      <>
                        <SelectItem value="10">6 mi</SelectItem>
                        <SelectItem value="20">12 mi</SelectItem>
                        <SelectItem value="50">31 mi</SelectItem>
                        <SelectItem value="100">62 mi</SelectItem>
                        <SelectItem value="200">124 mi</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="20">20 km</SelectItem>
                        <SelectItem value="50">50 km</SelectItem>
                        <SelectItem value="100">100 km</SelectItem>
                        <SelectItem value="200">200 km</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-distance-unit">Distance Unit</Label>
                <Select 
                  value={profileEditForm.distanceUnit || 'yards'} 
                  onValueChange={(v) => setProfileEditForm({ ...profileEditForm, distanceUnit: v as 'yards' | 'meters' })}
                >
                  <SelectTrigger id="edit-distance-unit">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yards">Yards / Miles</SelectItem>
                    <SelectItem value="meters">Meters / Km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-sm font-medium">Change Password</p>
            <p className="text-xs text-muted-foreground">Leave blank to keep your current password</p>
            <div className="space-y-2">
              <Label htmlFor="edit-current-password">Current Password</Label>
              <Input
                id="edit-current-password"
                type="password"
                placeholder="Enter current password to change"
                value={profileEditForm.currentPassword}
                onChange={(e) => setProfileEditForm({ ...profileEditForm, currentPassword: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-new-password">New Password</Label>
              <Input
                id="edit-new-password"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={profileEditForm.newPassword}
                onChange={(e) => setProfileEditForm({ ...profileEditForm, newPassword: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateProfile()}
              />
              {profileEditForm.newPassword && !profileEditForm.currentPassword && (
                <p className="text-xs text-amber-600">⚠️ Enter your current password to change password</p>
              )}
            </div>
            <Button
              className="w-full text-white"
              style={{backgroundColor: '#39638b'}}
              onClick={handleUpdateProfile}
              disabled={authLoading}
            >
              {authLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-1rem)] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle>Add Players</DialogTitle>
            <DialogDescription>
              Select golfers from the database (max 4 players total including you)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Select from registered golfers */}
            <div className="space-y-2">
              <Label>Select from Registered Golfers</Label>
              <Select onValueChange={(value) => {
                const selectedGolfer = golfers.find(g => g.id === value);
                if (selectedGolfer && additionalPlayers.length < 3) {
                  addPlayer(selectedGolfer.name || 'Unknown', selectedGolfer.avatar, selectedGolfer.handicap, selectedGolfer.id);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a golfer..." />
                </SelectTrigger>
                <SelectContent>
                  {golfers
                    .filter(g => g.id !== user?.id && !additionalPlayers.some(p => p.userId === g.id || p.name === g.name))
                    .map((golfer) => (
                      <SelectItem key={golfer.id} value={golfer.id}>
                        <div className="flex items-center gap-2">
                          {golfer.avatar ? (
                            <img src={golfer.avatar} alt={golfer.name || ''} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                              {golfer.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <span>{golfer.name || 'Anonymous'}</span>
                          {golfer.handicap !== null && (
                            <span className="text-xs text-muted-foreground">(HCP: {golfer.handicap})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or enter manually</span>
              <Separator className="flex-1" />
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Guest player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addPlayer(newPlayerName);
                  }
                }}
                disabled={additionalPlayers.length >= 3}
              />
              <Button 
                onClick={() => addPlayer(newPlayerName)}
                disabled={additionalPlayers.length >= 3 || !newPlayerName.trim()}
                className="text-white"
                style={{backgroundColor: '#39638b'}}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {additionalPlayers.length > 0 && (
              <div className="space-y-2">
                <Label>Added Players ({additionalPlayers.length}/3)</Label>
                {additionalPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: '#d6e4ef'}}>
                    <div className="flex items-center gap-2">
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{background: 'linear-gradient(135deg, #39638b 0%, #4a7aa8 100%)'}}>
                          {player.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{player.name}</span>
                        {player.handicap !== null && player.handicap !== undefined && (
                          <span className="text-xs text-muted-foreground ml-2">HCP: {player.handicap}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {additionalPlayers.length >= 3 && (
              <p className="text-sm text-amber-600">Maximum number of additional players reached</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlayerDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Player Confirmation Dialog */}
      <AlertDialog open={playerToDelete !== null} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Remove Player
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{playerToDelete?.name}</strong> from this round?
              <br /><br />
              <span className="text-amber-600">⚠️ This will delete all scores entered for this player. This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPlayerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (playerToDelete) {
                  removePlayer(playerToDelete.id);
                  setPlayerToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Round Confirmation Dialog */}
      <AlertDialog open={roundToDelete !== null} onOpenChange={(open) => !open && setRoundToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete Round
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this round from{' '}
              <strong>{roundToDelete?.course?.name || 'Unknown Course'}</strong>?
              <br /><br />
              <span className="text-amber-600">⚠️ This will permanently delete all scores for this round. This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoundToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={async (e) => {
                e.preventDefault();
                if (roundToDelete) {
                  await deleteRound(roundToDelete.id);
                  setRoundToDelete(null);
                }
              }}
            >
              Delete Round
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Messages Dialog */}
      <Dialog open={showMessagesDialog} onOpenChange={setShowMessagesDialog}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-6px)] sm:w-full mx-auto max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" style={{color: '#39638b'}} />
              Messages
            </DialogTitle>
            <DialogDescription>
              {messages.filter(m => !m.isRead).length > 0 
                ? `You have ${messages.filter(m => !m.isRead).length} unread message${messages.filter(m => !m.isRead).length > 1 ? 's' : ''}`
                : 'All messages read'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        message.isRead 
                          ? 'bg-gray-50 hover:bg-gray-100' 
                          : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                      }`}
                      onClick={() => {
                        setSelectedMessage(message);
                        setShowMessagesDialog(false);
                        setShowMessageDetailDialog(true);
                        if (!message.isRead) {
                          markMessageAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className={`font-medium ${!message.isRead ? 'text-blue-800' : ''}`}>
                            {message.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {message.content}
                          </p>
                        </div>
                        {!message.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span>{message.author.name || 'Admin'}</span>
                        <span>•</span>
                        <span>{new Date(message.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          {messages.filter(m => !m.isRead).length > 0 && (
            <DialogFooter>
              <Button variant="outline" onClick={markAllMessagesAsRead}>
                Mark all as read
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Detail Dialog */}
      <Dialog open={showMessageDetailDialog} onOpenChange={(open) => {
        setShowMessageDetailDialog(open);
        if (!open) {
          setSelectedMessage(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-6px)] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" style={{color: '#39638b'}} />
              {selectedMessage?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <div className="flex items-center gap-2 text-sm">
                  <span>From: {selectedMessage.author.name || 'Admin'}</span>
                  <span>•</span>
                  <span>{new Date(selectedMessage.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 rounded-lg max-h-[60vh] overflow-y-auto" style={{backgroundColor: '#d6e4ef'}}>
            <p className="whitespace-pre-wrap">{selectedMessage?.content}</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowMessageDetailDialog(false);
              setSelectedMessage(null);
              setShowMessagesDialog(true);
            }}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hole Selection Dialog */}
      <Dialog open={showHoleSelectionDialog} onOpenChange={setShowHoleSelectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" style={{color: '#39638b'}} />
              Select Holes to Play
            </DialogTitle>
            <DialogDescription>
              {pendingCourse?.name} - Choose how many holes you'll play
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Number of holes selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Number of Holes</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={holesPlayed === 9 ? 'default' : 'outline'}
                  className={`h-16 flex-col ${holesPlayed === 9 ? 'text-white' : ''}`}
                  style={holesPlayed === 9 ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                  onClick={() => setHolesPlayed(9)}
                >
                  <span className="text-2xl font-bold">9</span>
                  <span className="text-xs">Holes</span>
                </Button>
                <Button
                  variant={holesPlayed === 18 ? 'default' : 'outline'}
                  className={`h-16 flex-col ${holesPlayed === 18 ? 'text-white' : ''}`}
                  style={holesPlayed === 18 ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                  onClick={() => setHolesPlayed(18)}
                >
                  <span className="text-2xl font-bold">18</span>
                  <span className="text-xs">Holes</span>
                </Button>
              </div>
            </div>
            
            {/* Front/Back nine selection - only show if 9 holes selected */}
            {holesPlayed === 9 && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Which Nine?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={holesType === 'front' ? 'default' : 'outline'}
                    className={`h-14 flex-col ${holesType === 'front' ? 'text-white' : ''}`}
                    style={holesType === 'front' ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                    onClick={() => setHolesType('front')}
                  >
                    <span className="font-bold">Front 9</span>
                    <span className="text-xs">Holes 1-9</span>
                  </Button>
                  <Button
                    variant={holesType === 'back' ? 'default' : 'outline'}
                    className={`h-14 flex-col ${holesType === 'back' ? 'text-white' : ''}`}
                    style={holesType === 'back' ? {backgroundColor: '#39638b'} : {borderColor: '#8ab0d1'}}
                    onClick={() => setHolesType('back')}
                  >
                    <span className="font-bold">Back 9</span>
                    <span className="text-xs">Holes 10-18</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="p-3 rounded-lg" style={{backgroundColor: '#d6e4ef'}}>
              <p className="text-sm text-center" style={{color: '#39638b'}}>
                {holesPlayed === 18 
                  ? 'Playing all 18 holes'
                  : `Playing ${holesType === 'front' ? 'Front 9 (Holes 1-9)' : 'Back 9 (Holes 10-18)'}`
                }
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowHoleSelectionDialog(false);
              setPendingCourse(null);
            }}>
              Cancel
            </Button>
            <Button 
              className="text-white"
              style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
              onClick={() => {
                if (pendingCourse) {
                  initializeRound(pendingCourse, holesPlayed, holesType);
                }
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Work Warning Dialog */}
      <AlertDialog open={showUnsavedWarningDialog} onOpenChange={setShowUnsavedWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Unsaved Round in Progress
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have an active round with unsaved scores. Starting a new round will discard all unsaved progress.
              <br /><br />
              <span className="text-amber-600">⚠️ This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedWarningDialog(false);
              setPendingCourse(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600"
              onClick={async (e) => {
                e.preventDefault();
                // Clear the unsaved work
                localStorage.removeItem('jazel_active_round');
                setShowScorecard(false);
                setScores([]);
                setAdditionalPlayers([]);
                setPlayerScores(new Map());
                setHasUnsavedWork(false);
                setEditingRoundId(null);
                setShowUnsavedWarningDialog(false);
                
                // Now show the hole selection dialog for the new round
                if (pendingCourse) {
                  setHolesPlayed(18);
                  setHolesType('front');
                  setShowHoleSelectionDialog(true);
                }
              }}
            >
              Discard & Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Round Summary Scorecard Dialog */}
      <Dialog open={!!roundToView} onOpenChange={(open) => !open && setRoundToView(null)}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-4 h-4" style={{color: '#39638b'}} />
              Round Summary
            </DialogTitle>
            <DialogDescription className="text-xs">
              {roundToView && (
                <span>
                  {roundToView.course?.name || 'Unknown Course'} • {' '}
                  {new Date(roundToView.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {roundToView && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                {/* Total Score Header */}
                <div className="flex items-center justify-center gap-6 py-3 rounded-lg" style={{backgroundColor: '#d6e4ef'}}>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{color: '#39638b'}}>{roundToView.totalStrokes || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="w-px h-8 bg-gray-300" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {(() => {
                        const holesPlayedCount = roundToView.holesPlayed || 18;
                        const holesTypeValue = roundToView.holesType || 'front';
                        const startHole = holesPlayedCount === 9 && holesTypeValue === 'back' ? 10 : 1;
                        const endHole = holesPlayedCount === 9 ? (holesTypeValue === 'back' ? 18 : 9) : 18;
                        return (roundToView.course?.holes || [])
                          .filter((h: { holeNumber: number }) => h.holeNumber >= startHole && h.holeNumber <= endHole)
                          .reduce((sum: number, h: { par: number }) => sum + h.par, 0);
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground">Par</p>
                  </div>
                  <div className="w-px h-8 bg-gray-300" />
                  <div className="text-center">
                    {(() => {
                      const holesPlayedCount = roundToView.holesPlayed || 18;
                      const holesTypeValue = roundToView.holesType || 'front';
                      const startHole = holesPlayedCount === 9 && holesTypeValue === 'back' ? 10 : 1;
                      const endHole = holesPlayedCount === 9 ? (holesTypeValue === 'back' ? 18 : 9) : 18;
                      const relevantHoles = (roundToView.course?.holes || []).filter((h: { holeNumber: number }) => 
                        h.holeNumber >= startHole && h.holeNumber <= endHole
                      );
                      const mainScores = roundToView.scores?.filter(s => s.playerIndex === 0 || !s.playerIndex) || [];
                      let vsPar = 0;
                      mainScores.forEach(s => {
                        if (s.strokes > 0) {
                          const hole = relevantHoles.find((h: { holeNumber: number }) => h.holeNumber === s.holeNumber);
                          vsPar += s.strokes - (hole?.par || 4);
                        }
                      });
                      return (
                        <p className={`text-2xl font-bold ${vsPar < 0 ? 'text-red-600' : vsPar > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {(vsPar > 0 ? '+' : '') + vsPar}
                        </p>
                      );
                    })()}
                    <p className="text-xs text-muted-foreground">+/-</p>
                  </div>
                </div>
                
                {/* Vertical Scorecard List */}
                <div className="space-y-1">
                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground px-2 py-1" style={{color: '#39638b'}}>
                    <span>Hole</span>
                    <span className="text-center">Par</span>
                    <span className="text-center">Score</span>
                    <span className="text-center">+/-</span>
                  </div>
                  
                  {(() => {
                    const holesPlayedCount = roundToView.holesPlayed || 18;
                    const holesTypeValue = roundToView.holesType || 'front';
                    const startHole = holesPlayedCount === 9 && holesTypeValue === 'back' ? 10 : 1;
                    const endHole = holesPlayedCount === 9 ? (holesTypeValue === 'back' ? 18 : 9) : 18;
                    const relevantHoles = (roundToView.course?.holes || []).filter((h: { holeNumber: number }) => 
                      h.holeNumber >= startHole && h.holeNumber <= endHole
                    );
                    const mainScores = roundToView.scores?.filter(s => s.playerIndex === 0 || !s.playerIndex) || [];
                    
                    return relevantHoles.map((h: { holeNumber: number; par: number }) => {
                      const score = mainScores.find(s => s.holeNumber === h.holeNumber);
                      const strokes = score?.strokes || 0;
                      const diff = strokes > 0 ? strokes - h.par : 0;
                      const bgColor = strokes === 0 ? 'bg-gray-50' :
                        diff <= -2 ? 'bg-yellow-100' :
                        diff === -1 ? 'bg-green-100' :
                        diff === 0 ? 'bg-white' :
                        diff === 1 ? 'bg-blue-100' :
                        'bg-red-100';
                      
                      return (
                        <div key={h.holeNumber} className={`grid grid-cols-4 gap-2 text-sm px-2 py-2 rounded-lg ${bgColor}`}>
                          <span className="font-medium">{h.holeNumber}</span>
                          <span className="text-center text-muted-foreground">{h.par}</span>
                          <span className="text-center font-semibold">{strokes || '-'}</span>
                          <span className={`text-center font-semibold ${
                            diff < 0 ? 'text-red-600' : diff > 0 ? 'text-amber-600' : strokes > 0 ? 'text-green-600' : 'text-muted-foreground'
                          }`}>
                            {strokes > 0 ? (diff > 0 ? '+' : '') + diff : '-'}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
                
                {/* Statistics */}
                <div className="pt-2 border-t" style={{borderColor: '#d6e4ef'}}>
                  <h4 className="text-xs font-semibold mb-2" style={{color: '#39638b'}}>Round Stats</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="text-lg font-bold" style={{color: '#39638b'}}>{roundToView.totalPutts || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Putts</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="text-lg font-bold text-green-600">{roundToView.fairwaysHit || 0}/{roundToView.fairwaysTotal || '-'}</p>
                      <p className="text-[10px] text-muted-foreground">Fairways</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="text-lg font-bold text-blue-600">{roundToView.greensInReg || 0}</p>
                      <p className="text-[10px] text-muted-foreground">GIR</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50">
                      <p className="text-lg font-bold text-red-600">{roundToView.penalties || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Penalties</p>
                    </div>
                  </div>
                </div>
                
                {/* Scoring Distribution Graph */}
                <div className="pt-2 border-t" style={{borderColor: '#d6e4ef'}}>
                  <h4 className="text-xs font-semibold mb-2" style={{color: '#39638b'}}>Scoring Distribution</h4>
                  {(() => {
                    const holesPlayedCount = roundToView.holesPlayed || 18;
                    const holesTypeValue = roundToView.holesType || 'front';
                    const startHole = holesPlayedCount === 9 && holesTypeValue === 'back' ? 10 : 1;
                    const endHole = holesPlayedCount === 9 ? (holesTypeValue === 'back' ? 18 : 9) : 18;
                    const relevantHoles = (roundToView.course?.holes || []).filter((h: { holeNumber: number }) => 
                      h.holeNumber >= startHole && h.holeNumber <= endHole
                    );
                    const mainScores = roundToView.scores?.filter(s => s.playerIndex === 0 || !s.playerIndex) || [];
                    
                    let eagles = 0, birdies = 0, pars = 0, bogeys = 0, doubleBogeys = 0, tripleOrWorse = 0;
                    mainScores.forEach(score => {
                      if (score.strokes > 0) {
                        const hole = relevantHoles.find((h: { holeNumber: number }) => h.holeNumber === score.holeNumber);
                        const par = hole?.par || 4;
                        const diff = score.strokes - par;
                        if (diff <= -2) eagles++;
                        else if (diff === -1) birdies++;
                        else if (diff === 0) pars++;
                        else if (diff === 1) bogeys++;
                        else if (diff === 2) doubleBogeys++;
                        else tripleOrWorse++;
                      }
                    });
                    
                    const chartData = [
                      { name: 'Eagle', value: eagles, color: '#ffd700' },
                      { name: 'Birdie', value: birdies, color: '#22c55e' },
                      { name: 'Par', value: pars, color: '#3b82f6' },
                      { name: 'Bogey', value: bogeys, color: '#f97316' },
                      { name: 'Double', value: doubleBogeys, color: '#ef4444' },
                      { name: 'Triple+', value: tripleOrWorse, color: '#7c3aed' },
                    ].filter(d => d.value > 0);
                    
                    return chartData.length > 0 ? (
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={45}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [value, 'holes']} />
                            <Legend wrapperStyle={{ fontSize: '9px' }} iconSize={8} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground text-xs py-4">No scores recorded</p>
                    );
                  })()}
                </div>
              </div>
              
              {/* Fixed Close Button */}
              <div className="p-4 pt-2 flex-shrink-0 border-t bg-white" style={{borderColor: '#d6e4ef'}}>
                <Button
                  onClick={() => setRoundToView(null)}
                  className="w-full text-white"
                  style={{background: 'linear-gradient(to right, #39638b, #4a7aa8)'}}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* My Bag Dialog */}
      <Dialog open={showBagDialog} onOpenChange={setShowBagDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" style={{color: '#39638b'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8h12l-1 13H7L6 8z" />
                <path d="M5 8h14" />
                <path d="M8 8V4l-1-2" />
                <path d="M12 8V3" />
                <path d="M16 8V4l1-2" />
                <path d="M8 12h8v4H8z" />
                <path d="M7 21h10" />
              </svg>
              What's in My Bag
            </DialogTitle>
            <DialogDescription>
              {editingBag 
                ? 'Select clubs and enter your estimated distances' 
                : `${userClubs.length} clubs in your bag`
              }
            </DialogDescription>
          </DialogHeader>

          {loadingClubs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" style={{color: '#39638b'}} />
            </div>
          ) : editingBag ? (
            <div className="space-y-2">
              {/* Edit Mode - 14 Fields */}
              {Array.from({ length: 14 }, (_, i) => {
                const slotIndex = i;
                const slotData = bagFormData[slotIndex];
                const GOLF_CLUBS = ['Driver', '3-Wood', '5-Wood', '7-Wood', '2-Hybrid', '3-Hybrid', '4-Hybrid', '5-Hybrid', '2-Iron', '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron', 'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge', 'Putter'];
                const usedClubs = bagFormData.filter((item, idx) => idx !== slotIndex && item.clubName).map(item => item.clubName);
                
                return (
                  <div key={slotIndex} className="flex items-center gap-2">
                    <span className="w-6 text-sm text-muted-foreground text-right">{slotIndex + 1}.</span>
                    <Select
                      value={slotData?.clubName || ''}
                      onValueChange={(value) => updateBagFormSlot(slotIndex, 'clubName', value)}
                    >
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GOLF_CLUBS
                          .filter(club => !usedClubs.includes(club))
                          .map(club => (
                            <SelectItem key={club} value={club}>{club}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      max={400}
                      placeholder="0"
                      className="w-24 h-9 text-sm text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={slotData?.estimatedDistance ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          updateBagFormSlot(slotIndex, 'estimatedDistance', null);
                        } else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0 && num <= 400) {
                            updateBagFormSlot(slotIndex, 'estimatedDistance', num);
                          }
                        }
                      }}
                      disabled={!slotData?.clubName}
                    />
                  </div>
                );
              })}
              
              {/* Action buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingBag(false)}
                  disabled={authLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  style={{background: '#39638b'}}
                  onClick={handleSaveBag}
                  disabled={authLoading}
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* View Mode - List of clubs */}
              {userClubs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No clubs added yet</p>
              ) : (
                userClubs.map((club) => (
                  <div key={club.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="font-medium text-sm">{club.clubName}</span>
                    <span className="text-sm text-muted-foreground">
                      {club.estimatedDistance ? `${club.estimatedDistance} ${distanceUnit === 'meters' ? 'm' : 'yd'}` : '-'}
                    </span>
                  </div>
                ))
              )}
              
              {/* Edit button */}
              <Button
                className="w-full mt-4"
                style={{background: '#39638b'}}
                onClick={() => setEditingBag(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Bag
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t mt-auto" style={{borderColor: '#8ab0d1'}}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4" style={{color: '#39638b'}} />
              <span className="font-medium">Jazel Golf</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">v1.2.48</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{courses.length} courses available</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Course Map Screen */}
      {showMapScreen && showScorecard && selectedCourse && (
        <CourseMap
          course={selectedCourse}
          currentHole={selectedGPSHole}
          onHoleChange={setSelectedGPSHole}
          distanceUnit={distanceUnit}
          onClose={() => setShowMapScreen(false)}
          userClubs={userClubs}
          weatherData={weatherData}
          onRefreshWeather={() => fetchWeather(undefined, true)}
        />
      )}

      {/* Badges Dialog */}
      <Dialog open={showBadgesDialog} onOpenChange={setShowBadgesDialog}>
        <DialogContent className="w-[calc(100%-6px)] max-w-lg sm:max-w-xl md:max-w-2xl p-0 gap-0 mx-auto rounded-xl">
          {user && (
            <BadgeCollection userId={user.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
