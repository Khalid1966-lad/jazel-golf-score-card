'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Circle, Trophy, User, Menu, X, 
  ChevronRight, Star, Clock, TrendingUp, Target, 
  Plus, Check, Navigation, Wind, Thermometer, Sun,
  Bot, Ruler, Compass, Cloud, RefreshCw, Play, Pause,
  Save, Trash2, Edit2, AlertCircle, Heart, Settings, LogOut,
  Camera, Loader2, Upload, Users, ChevronLeft, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
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
  driveDistance?: number;
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
  course: {
    id?: string;
    name: string;
    city: string;
    totalHoles: number;
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

// Multi-player types
interface AdditionalPlayer {
  id: string;
  name: string;
  avatar?: string | null;
  handicap?: number | null;
}

interface PlayerScore {
  playerIndex: number;
  scores: RoundScore[];
}

// Markdown Renderer for AI Caddie
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    let processedLine = line;
    
    // Handle headers
    if (line.startsWith('### ')) {
      return <h4 key={lineIndex} className="text-base font-bold text-jazel-800 mt-3 mb-1" style={{color: '#032719'}}>{line.slice(4)}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={lineIndex} className="text-lg font-bold text-jazel-800 mt-4 mb-2" style={{color: '#032719'}}>{line.slice(3)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={lineIndex} className="text-xl font-bold text-jazel-900 mt-4 mb-2" style={{color: '#021a11'}}>{line.slice(2)}</h2>;
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
      parts.push(<strong key={`${lineIndex}-${key++}`} className="font-bold" style={{color: '#032719'}}>{renderItalic(boldText)}</strong>);
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
  open, 
  onOpenChange, 
  holeInfo, 
  onGetRecommendation 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  holeInfo: { par: number; distance: number } | null;
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
            <Bot className="w-5 h-5" style={{color: '#06402B'}} />
            AI Caddie
          </DialogTitle>
          <DialogDescription>
            Get personalized club recommendations based on conditions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Distance (meters)</Label>
              <Input
                type="number"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Wind Speed (km/h)</Label>
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
            style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
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
            <div className="p-4 rounded-lg border" style={{backgroundColor: '#e8f5ed', borderColor: '#c5e6d1'}}>
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
  onHoleChange
}: { 
  course: GolfCourse | null;
  userLocation: { lat: number; lon: number } | null;
  onLocationUpdate: (loc: { lat: number; lon: number }) => void;
  selectedHole: number;
  onHoleChange: (hole: number) => void;
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
    // This is a fallback when actual coordinates aren't stored
    const holeSpacing = 0.003; // Roughly 300m between holes
    const angle = ((holeNum - 1) * 20) * Math.PI / 180; // Vary direction slightly
    
    return {
      lat: courseData.latitude + Math.cos(angle) * holeSpacing * ((holeNum - 1) % 9),
      lon: courseData.longitude + Math.sin(angle) * holeSpacing * ((holeNum - 1) % 9)
    };
  }, []);

  // Auto-detect current hole based on position
  const autoDetectHole = useCallback((userLat: number, userLon: number, courseData: GolfCourse | null) => {
    if (!courseData) return 1;
    
    let closestHole = 1;
    let minDistance = Infinity;
    
    for (let i = 1; i <= courseData.totalHoles; i++) {
      const greenLoc = getHoleGreenLocation(i, courseData);
      if (!greenLoc) continue;
      
      const R = 6371000;
      const φ1 = userLat * Math.PI / 180;
      const φ2 = greenLoc.lat * Math.PI / 180;
      const Δφ = (greenLoc.lat - userLat) * Math.PI / 180;
      const Δλ = (greenLoc.lon - userLon) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance < minDistance) {
        minDistance = distance;
        closestHole = i;
      }
    }
    
    return closestHole;
  }, [getHoleGreenLocation]);

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
        
        // Auto-detect hole
        if (course) {
          const detectedHole = autoDetectHole(newLoc.lat, newLoc.lon, course);
          // Only update if significantly different
          if (Math.abs(detectedHole - selectedHole) > 0) {
            // Don't auto-change, but could show suggestion
          }
        }
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
    <Card className="bg-white/80 backdrop-blur" style={{borderColor: '#c5e6d1'}}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Navigation className="w-5 h-5" style={{color: '#06402B'}} />
            GPS Range Finder
          </span>
          <Button
            size="sm"
            variant={isTracking ? 'destructive' : 'default'}
            onClick={isTracking ? stopTracking : startTracking}
            className={isTracking ? '' : 'text-white'}
            style={isTracking ? {} : {backgroundColor: '#06402B'}}
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

            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                size="sm"
                variant={greenPosition === 'front' ? 'default' : 'outline'}
                onClick={() => setGreenPosition('front')}
                style={greenPosition === 'front' ? {backgroundColor: '#06402B'} : {borderColor: '#c5e6d1'}}
              >
                Front
              </Button>
              <Button
                size="sm"
                variant={greenPosition === 'center' ? 'default' : 'outline'}
                onClick={() => setGreenPosition('center')}
                style={greenPosition === 'center' ? {backgroundColor: '#06402B'} : {borderColor: '#c5e6d1'}}
              >
                Center
              </Button>
              <Button
                size="sm"
                variant={greenPosition === 'back' ? 'default' : 'outline'}
                onClick={() => setGreenPosition('back')}
                style={greenPosition === 'back' ? {backgroundColor: '#06402B'} : {borderColor: '#c5e6d1'}}
              >
                Back
              </Button>
            </div>

            <div className="text-center p-6 rounded-xl" style={{background: 'linear-gradient(135deg, #e8f5ed 0%, #e0f4f5 100%)'}}>
              <p className="text-sm text-muted-foreground mb-2">Distance to Green</p>
              <p className="text-5xl font-bold" style={{color: '#06402B'}}>
                {distanceToGreen !== null ? distanceToGreen : '---'}
              </p>
              <p className="text-lg text-muted-foreground">meters</p>
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
  const [activeTab, setActiveTab] = useState('search');
  const [user, setUser] = useState<User | null>(null);
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
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [golferSearch, setGolferSearch] = useState('');
  const [showAICaddie, setShowAICaddie] = useState(false);
  const [currentHoleInfo, setCurrentHoleInfo] = useState<{ par: number; distance: number } | null>(null);
  const [showGPSPanel, setShowGPSPanel] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedGPSHole, setSelectedGPSHole] = useState(1);
  const [maxNearbyDistance, setMaxNearbyDistance] = useState(100);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', handicap: '', city: '', country: 'Morocco' });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: '' });
  const [profileEditForm, setProfileEditForm] = useState({ 
    name: '', 
    email: '', 
    handicap: '', 
    city: '',
    country: 'Morocco',
    nearbyDistance: 100,
    currentPassword: '', 
    newPassword: '' 
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
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
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };
    checkSession();
  }, []);

  // Restore active round from localStorage on mount
  useEffect(() => {
    try {
      const savedRound = localStorage.getItem('jazel_active_round');
      if (savedRound) {
        const roundData = JSON.parse(savedRound);
        // Only restore if less than 24 hours old
        const savedTime = new Date(roundData.savedAt).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24 && roundData.selectedCourse) {
          setSelectedCourse(roundData.selectedCourse);
          setSelectedTee(roundData.selectedTee || '');
          setScores(roundData.scores || []);
          setAdditionalPlayers(roundData.additionalPlayers || []);
          // Restore player scores map
          if (roundData.playerScores) {
            const playerScoresMap = new Map<number, RoundScore[]>();
            Object.entries(roundData.playerScores).forEach(([key, value]) => {
              playerScoresMap.set(parseInt(key), value as RoundScore[]);
            });
            setPlayerScores(playerScoresMap);
          }
          setShowScorecard(true);
          setActiveTab('scorecard');
          toast.info('Restored your active round');
        } else {
          // Clear old data
          localStorage.removeItem('jazel_active_round');
        }
      }
    } catch (error) {
      console.error('Failed to restore active round:', error);
      localStorage.removeItem('jazel_active_round');
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
          savedAt: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Failed to save active round:', error);
      }
    }
  }, [showScorecard, selectedCourse, selectedTee, scores, additionalPlayers, playerScores]);

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
      const response = await fetch(`/api/rounds?userId=${user.id}`);
      const data = await response.json();
      setRoundHistory(data.rounds || []);
    } catch (error) {
      console.error('Failed to fetch rounds:', error);
    }
  }, [user]);

  // Fetch golfers list
  const fetchGolfers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setGolfers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch golfers:', error);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchGolfers();
    if (user) {
      fetchFavorites();
      fetchRounds();
    }
  }, [fetchCourses, fetchFavorites, fetchGolfers, fetchRounds, user]);

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
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setShowLoginDialog(false);
        setLoginForm({ email: '', password: '' });
        toast.success('Welcome back!');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Signup
  const handleSignup = async () => {
    setAuthLoading(true);
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
          setSignupForm({ name: '', email: '', password: '', handicap: '' });
          toast.success('Account created! Welcome to Jazel!');
        }
      } else {
        toast.error(data.error || 'Signup failed');
      }
    } catch (error) {
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
      setActiveTab('search');
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
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotPasswordForm),
      });
      const data = await response.json();
      
      if (response.ok) {
        setForgotPasswordSent(true);
        toast.success('Password reset link sent! Check your email.');
      } else {
        toast.error(data.error || 'Failed to send reset link');
      }
    } catch (error) {
      toast.error('Failed to send reset link');
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
        setShowProfileEditDialog(false);
        toast.success('Profile updated successfully!');
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
        currentPassword: '',
        newPassword: '',
      });
      setShowProfileEditDialog(true);
    }
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
          toast.success(`Nearby distance set to ${distance}km`);
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
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setIsNearbyMode(true);
        
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
        toast.info('Using Rabat as default location for demo');
      }
    );
  };

  // Start new round
  const startNewRound = (course: GolfCourse) => {
    // Require login to play
    if (!user) {
      setShowLoginDialog(true);
      toast.info('Please log in to start a round');
      return;
    }
    
    setSelectedCourse(course);
    setSelectedTee(course.tees[0]?.id || '');
    setSelectedGPSHole(1);
    
    // Initialize scores for main player
    const initialScores: RoundScore[] = [];
    for (let i = 1; i <= Math.min(course.totalHoles, 18); i++) {
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
    
    setShowScorecard(true);
    setActiveTab('scorecard');
  };
  
  // Multi-player functions
  const addPlayer = (name: string, avatar?: string | null, handicap?: number | null) => {
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
      handicap: handicap
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

  // Update score
  const updateScore = (holeNumber: number, field: keyof RoundScore, value: any) => {
    setScores(prev => prev.map(s => 
      s.holeNumber === holeNumber ? { ...s, [field]: value } : s
    ));
  };

  // Save round
  const saveRound = async () => {
    if (!user || !selectedCourse) return;

    try {
      // Prepare player names for additional players
      const playerNames = additionalPlayers.length > 0 ? JSON.stringify(additionalPlayers.map(p => p.name)) : null;

      // Check if we're editing an existing round or creating new
      if (editingRoundId) {
        // Update existing round
        const response = await fetch('/api/rounds', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundId: editingRoundId,
            scores: scores.filter(s => s.strokes > 0),
          }),
        });
        
        if (response.ok) {
          toast.success('Round updated successfully!');
          
          // Update the round in the history
          const totals = calculateTotals();
          setRoundHistory(prev => prev.map(r => {
            if (r.id === editingRoundId) {
              return {
                ...r,
                totalStrokes: totals.strokes,
                totalPutts: totals.putts,
                greensInReg: totals.gir,
                penalties: totals.penalties,
                scores: scores,
              };
            }
            return r;
          }));
          
          // Clear saved round from localStorage
          localStorage.removeItem('jazel_active_round');
          setEditingRoundId(null); // Clear editing state
          
          setShowScorecard(false);
          setSelectedCourse(null);
          setScores([]);
          setAdditionalPlayers([]);
          setPlayerScores(new Map());
          setActiveTab('history');
        } else {
          const data = await response.json();
          toast.error(data.error || 'Failed to update round');
        }
      } else {
        // Create new round
        const response = await fetch('/api/rounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            courseId: selectedCourse.id,
            teeId: selectedTee,
            scores: scores.filter(s => s.strokes > 0),
            playerNames: playerNames,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          toast.success('Round saved successfully!');
          
          const totals = calculateTotals();
          const newRound: SavedRound = {
            id: data.round.id,
            date: new Date().toISOString(),
            totalStrokes: totals.strokes,
            totalPutts: totals.putts,
            fairwaysHit: totals.fairways,
            fairwaysTotal: scores.filter(s => s.fairwayHit !== null).length,
            greensInReg: totals.gir,
            penalties: totals.penalties,
            completed: true,
            course: {
              name: selectedCourse.name,
              city: selectedCourse.city,
              totalHoles: selectedCourse.totalHoles,
            },
            scores: scores,
          };
          setRoundHistory(prev => [newRound, ...prev]);
          
          // Clear saved round from localStorage
          localStorage.removeItem('jazel_active_round');
          
          setShowScorecard(false);
          setSelectedCourse(null);
          setScores([]);
          setAdditionalPlayers([]);
          setPlayerScores(new Map());
          setActiveTab('history');
        } else {
          toast.error('Failed to save round');
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
      const response = await fetch(`/api/rounds?roundId=${roundId}`, { method: 'DELETE' });
      
      if (response.ok) {
        setRoundHistory(prev => prev.filter(r => r.id !== roundId));
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
    if (!selectedCourse) return 72;
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
    <div className="min-h-screen bg-gradient-to-br from-jazel-50 via-white to-jazel-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b" style={{borderColor: '#c5e6d1'}}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #06402B 0%, #0d7377 100%)'}}>
                <Circle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #06402B, #0d7377)', WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>
                  Jazel
                </h1>
                <p className="text-xs text-muted-foreground">Golf Scorecard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {showScorecard && selectedCourse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGPSPanel(!showGPSPanel)}
                  className="gap-1"
                  style={{color: '#06402B'}}
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              )}
              {user?.isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    style={{color: '#06402B'}}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Setup</span>
                  </Button>
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || 'User'} 
                      className="w-8 h-8 rounded-full object-cover border-2"
                      style={{borderColor: '#9dd6b3'}}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #06402B 0%, #0d7377 100%)'}}>
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
                    style={{color: '#06402B'}}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="text-white"
                    style={{backgroundColor: '#06402B'}}
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

      {/* GPS Panel (Slide-down) */}
      <AnimatePresence>
        {showGPSPanel && showScorecard && selectedCourse && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border-b"
            style={{borderColor: '#c5e6d1'}}
          >
            <div className="max-w-7xl mx-auto p-4">
              <GPSRangeFinder 
                course={selectedCourse} 
                userLocation={userLocation}
                onLocationUpdate={(loc) => setUserLocation(loc)}
                selectedHole={selectedGPSHole}
                onHoleChange={setSelectedGPSHole}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-6 bg-white/80 backdrop-blur ${user ? 'grid-cols-5' : 'grid-cols-1'}`}>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="golfers" className="gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Golfers</span>
                </TabsTrigger>
                <TabsTrigger value="scorecard" className="gap-2">
                  <Target className="w-4 h-4" />
                  <span className="hidden sm:inline">Scorecard</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Trophy className="w-4 h-4" />
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
                  style={{borderColor: '#9dd6b3'}}
                  onFocus={(e) => e.target.style.borderColor = '#06402B'}
                  onBlur={(e) => e.target.style.borderColor = '#9dd6b3'}
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
                className="h-12 px-4"
                style={{borderColor: '#9dd6b3'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8f5ed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Navigation className="w-5 h-5 mr-2" />
                Near Me
              </Button>
            </div>

            {/* Results Info */}
            {isNearbyMode && userLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg"
              style={{backgroundColor: '#e8f5ed'}}>
                <MapPin className="w-4 h-4" style={{color: '#06402B'}} />
                <span>Showing courses within</span>
                <Select value={maxNearbyDistance.toString()} onValueChange={(v) => updateNearbyDistance(parseInt(v))}>
                  <SelectTrigger className="w-20 h-8" style={{borderColor: '#9dd6b3'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10km</SelectItem>
                    <SelectItem value="20">20km</SelectItem>
                    <SelectItem value="50">50km</SelectItem>
                    <SelectItem value="100">100km</SelectItem>
                    <SelectItem value="200">200km</SelectItem>
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
                  style={{color: '#06402B'}}
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
                (showFavoritesOnly ? courses.filter(c => favoriteIds.includes(c.id)) : courses).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      className="group hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur cursor-pointer overflow-hidden"
                      style={{borderColor: '#c5e6d1'}}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#14b869'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#c5e6d1'}
                    >
                      <div className="h-28 relative overflow-hidden"
                        style={{background: 'linear-gradient(135deg, #14b869 0%, #0d7377 100%)'}}>
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
                              <Badge variant="secondary" style={{backgroundColor: '#c5e6d1', color: '#032719'}}>
                                <Navigation className="w-3 h-3 mr-1" />
                                {course.distance.toFixed(1)} km away
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
                          <Button
                            size="sm"
                            className="flex-1 text-white"
                            style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
                            onClick={() => startNewRound(course)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Play
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" style={{borderColor: '#9dd6b3'}}>
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
                                      <span className="ml-2 font-medium" style={{color: '#06402B'}}>{course.distance.toFixed(1)} km</span>
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

                                <Button
                                  className="w-full text-white"
                                  style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
                                  onClick={() => startNewRound(course)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Start a Round
                                </Button>
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
                  <Target className="w-16 h-16 mx-auto mb-4" style={{color: '#14b869'}} />
                  <h3 className="text-xl font-semibold mb-2">No Active Round</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a course from the Courses tab to start a new round
                  </p>
                  <Button
                    onClick={() => setActiveTab('search')}
                    className="text-white"
                    style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
                  >
                    Browse Courses
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Course Info Header */}
                <Card className="text-white"
                  style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-xl font-bold">{selectedCourse.name}</h2>
                        <p className="text-white/90 text-sm">{selectedCourse.city}, {selectedCourse.region}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {selectedCourse.tees.length > 0 && (
                          <Select value={selectedTee} onValueChange={setSelectedTee}>
                            <SelectTrigger className="w-36 bg-white/20 border-white/30 text-white">
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
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowPlayerDialog(true)}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Add Players ({additionalPlayers.length}/3)
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowAICaddie(true)}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          <Bot className="w-4 h-4 mr-1" />
                          AI Caddie
                        </Button>
                      </div>
                    </div>
                    {/* Players List */}
                    {additionalPlayers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/20">
                        <span className="text-sm text-white/80">Players:</span>
                        {additionalPlayers.map((player, idx) => (
                          <Badge key={player.id} className="bg-white/30 text-white border-white/30">
                            {player.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 hover:bg-white/20"
                              onClick={() => removePlayer(player.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Score Summary */}
                <div className="grid grid-cols-5 gap-2">
                  <Card className="bg-white/80 text-center p-3">
                    <p className="text-xs text-muted-foreground">Strokes</p>
                    <p className="text-2xl font-bold text-center" style={{color: '#06402B'}}>{calculateTotals().strokes}</p>
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
                    <p className="text-2xl font-bold text-center" style={{color: '#06402B'}}>{calculateTotals().putts}</p>
                  </Card>
                  <Card className="bg-white/80 text-center p-3">
                    <p className="text-xs text-muted-foreground">GIR</p>
                    <p className="text-2xl font-bold text-center" style={{color: '#06402B'}}>{calculateTotals().gir}</p>
                  </Card>
                </div>

                {/* Scorecard */}
                <Card className="bg-white/80 backdrop-blur overflow-hidden">
                  <CardContent className="p-0">
                    {/* Scroll Controls */}
                    <div className="flex items-center justify-between px-2 py-1 border-b" style={{borderColor: '#c5e6d1'}}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollScorecard('left')}
                        disabled={!canScrollLeftState}
                        className="h-8 w-8 p-0"
                        style={{color: canScrollLeftState ? '#06402B' : '#9ca3af'}}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <span className="text-xs text-muted-foreground">← Scroll to see more columns →</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => scrollScorecard('right')}
                        disabled={!canScrollRightState}
                        className="h-8 w-8 p-0"
                        style={{color: canScrollRightState ? '#06402B' : '#9ca3af'}}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                    <div 
                      ref={scorecardRef}
                      className="overflow-x-auto h-[calc(100vh-490px)] min-h-[380px]"
                      onScroll={checkScrollPosition}
                    >
                      <div className="min-w-[700px]">
                        {/* Header Row - Sticky */}
                        <div className="sticky top-0 z-30 grid gap-1 p-2 text-white text-xs font-medium"
                        style={{backgroundColor: '#06402B', gridTemplateColumns: `repeat(${9 + additionalPlayers.length}, minmax(0, 1fr))`}}>
                          <div className="text-center">Hole</div>
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
                            <span className="truncate max-w-[60px]">{user?.name?.split(' ')[0] || 'You'}</span>
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
                              <span className="truncate max-w-[60px]">{player.name.split(' ')[0]}</span>
                            </div>
                          ))}
                          <div className="text-center">Putts</div>
                          <div className="text-center">FWY</div>
                          <div className="text-center">GIR</div>
                          <div className="text-center">Pen</div>
                          <div className="text-center">+/-</div>
                        </div>

                        {/* Hole Rows */}
                        {scores.map((score, index) => {
                          const hole = selectedCourse.holes.find(h => h.holeNumber === score.holeNumber);
                          const holePar = hole?.par || 4;
                          const holeHcp = hole?.handicap || '-';
                          const scoreDiff = score.strokes > 0 ? score.strokes - holePar : 0;
                          
                          return (
                            <div
                              key={score.holeNumber}
                              className={`grid gap-1 p-2 text-sm ${index % 2 === 0 ? 'bg-white' : ''}`}
                              style={{
                                ...(index % 2 !== 0 ? {backgroundColor: 'rgba(232, 245, 237, 0.5)'} : {}),
                                gridTemplateColumns: `repeat(${9 + additionalPlayers.length}, minmax(0, 1fr))`
                              }}
                            >
                              {/* Hole number */}
                              <div className="text-center font-medium flex items-center justify-center">
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
                                  className={`h-9 w-14 text-center text-sm font-medium border-2 border-gray-500 ${getScoreColor(score.strokes, holePar)}`}
                                  style={{'--tw-ring-color': '#06402B'} as React.CSSProperties}
                                  onFocus={(e) => e.target.style.borderColor = '#06402B'}
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
                                      className={`h-9 w-14 text-center text-sm font-medium border-2 border-gray-500 ${getScoreColor(playerScore?.strokes || 0, holePar)}`}
                                      style={{'--tw-ring-color': '#06402B'} as React.CSSProperties}
                                      onFocus={(e) => e.target.style.borderColor = '#06402B'}
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
                                  className="h-9 w-14 text-center border-2 border-gray-500"
                                  onFocus={(e) => e.target.style.borderColor = '#06402B'}
                                  onBlur={(e) => e.target.style.borderColor = '#6b7280'}
                                />
                              </div>
                              {/* FWY */}
                              <div className="flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant={score.fairwayHit === true ? 'default' : score.fairwayHit === false ? 'destructive' : 'outline'}
                                  className={`h-7 w-7 p-0 ${score.fairwayHit === true ? '' : ''}`}
                                  style={score.fairwayHit === true ? {backgroundColor: '#06402B'} : {}}
                                  onClick={() => updateScore(score.holeNumber, 'fairwayHit', 
                                    score.fairwayHit === null ? true : score.fairwayHit === true ? false : null
                                  )}
                                >
                                  {score.fairwayHit === true ? <Check className="w-3 h-3" /> : score.fairwayHit === false ? <X className="w-3 h-3" /> : '-'}
                                </Button>
                              </div>
                              {/* GIR */}
                              <div className="flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant={score.greenInReg ? 'default' : 'outline'}
                                  className={`h-7 w-7 p-0`}
                                  style={score.greenInReg ? {backgroundColor: '#06402B'} : {}}
                                  onClick={() => updateScore(score.holeNumber, 'greenInReg', !score.greenInReg)}
                                >
                                  {score.greenInReg ? <Check className="w-3 h-3" /> : '-'}
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
                                  className="h-9 w-14 text-center border-2 border-gray-500"
                                  onFocus={(e) => e.target.style.borderColor = '#06402B'}
                                  onBlur={(e) => e.target.style.borderColor = '#6b7280'}
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
                          style={{backgroundColor: '#06402B', gridTemplateColumns: `repeat(${9 + additionalPlayers.length}, minmax(0, 1fr))`}}>
                          <div className="text-center">Tot</div>
                          <div className="text-center">{getCoursePar()}</div>
                          <div className="text-center">-</div>
                          <div className="text-center">{calculateTotals().strokes || '-'}</div>
                          {additionalPlayers.map((player, playerIdx) => {
                            const playerTotal = playerScores.get(playerIdx)?.reduce((sum, s) => sum + (s.strokes || 0), 0) || 0;
                            return <div key={player.id} className="text-center">{playerTotal || '-'}</div>;
                          })}
                          <div className="text-center">{calculateTotals().putts || '-'}</div>
                          <div className="text-center">{calculateTotals().fairways || '-'}</div>
                          <div className="text-center">{calculateTotals().gir || '-'}</div>
                          <div className="text-center">{calculateTotals().penalties || '-'}</div>
                          <div className="text-center">
                            {(calculateTotals().vsPar > 0 ? '+' : '') + (calculateTotals().vsPar || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t flex gap-3" style={{borderColor: '#c5e6d1'}}>
                      <Button
                        className="flex-1 text-white"
                        style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
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
                  </CardContent>
                </Card>
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
                    {roundHistory.map((round, index) => (
                      <motion.div
                        key={round.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="transition-colors" style={{borderColor: '#c5e6d1'}}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#14b869'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#c5e6d1'}>
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
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-6">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold" style={{color: '#06402B'}}>{round.totalStrokes}</p>
                                    <p className="text-xs text-muted-foreground">strokes</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-lg font-semibold">{round.totalPutts}</p>
                                    <p className="text-xs text-muted-foreground">putts</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-lg font-semibold">{round.greensInReg}</p>
                                    <p className="text-xs text-muted-foreground">GIR</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      // Load the round into the scorecard for editing
                                      // Need to fetch the full course data first
                                      try {
                                        const response = await fetch(`/api/courses/${round.course?.id || round.courseId}`);
                                        if (response.ok) {
                                          const data = await response.json();
                                          setSelectedCourse(data.course);
                                          setSelectedTee('');
                                          setScores(round.scores && round.scores.length > 0 ? round.scores : []);
                                          setAdditionalPlayers([]);
                                          setPlayerScores(new Map());
                                          setEditingRoundId(round.id); // Track that we're editing this round
                                          setShowScorecard(true);
                                          setActiveTab('scorecard');
                                          toast.info('Round loaded for editing. Make changes and save to update.');
                                        } else {
                                          toast.error('Could not load course data');
                                        }
                                      } catch (error) {
                                        console.error('Failed to load round for editing:', error);
                                        toast.error('Failed to load round');
                                      }
                                    }}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    title="Edit round"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRoundToDelete(round)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    title="Delete round"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
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

          {/* Golfers Tab */}
          <TabsContent value="golfers" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{color: '#06402B'}} />
                  Golfers
                </CardTitle>
                <CardDescription>
                  Connect with other golfers in the community ({golfers.length} registered)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search golfers by name, city or country..."
                    value={golferSearch}
                    onChange={(e) => setGolferSearch(e.target.value)}
                    className="pl-10 h-12 bg-white"
                    style={{borderColor: '#9dd6b3'}}
                    onFocus={(e) => e.target.style.borderColor = '#06402B'}
                    onBlur={(e) => e.target.style.borderColor = '#9dd6b3'}
                  />
                </div>
                
                {golfers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No golfers registered yet</p>
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
                          style={{borderColor: '#c5e6d1'}}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#14b869'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#c5e6d1'}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                                style={{background: 'linear-gradient(135deg, #06402B 0%, #0d7377 100%)'}}>
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
                            <div className="flex items-center justify-between mt-3 pt-3" style={{borderTop: '1px solid #e8f5ed'}}>
                              <div className="flex items-center gap-1">
                                <Trophy className="w-4 h-4" style={{color: '#06402B'}} />
                                <span className="text-sm font-medium">
                                  Handicap: {golfer.handicap !== null ? golfer.handicap : '-'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4" style={{color: '#0d7377'}} />
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

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {user ? (
              <>
                <Card className="bg-white/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" style={{color: '#06402B'}} />
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
                        style={{background: 'linear-gradient(135deg, #06402B 0%, #0d7377 100%)'}}>
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
                          style={{borderColor: '#9dd6b3'}}
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
                        style={{borderColor: '#9dd6b3'}}
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
                      <Card style={{borderColor: '#c5e6d1'}}>
                        <CardContent className="p-4 text-center">
                          <Trophy className="w-8 h-8 mx-auto mb-2" style={{color: '#06402B'}} />
                          <h4 className="font-medium">{roundHistory.length}</h4>
                          <p className="text-sm text-muted-foreground">Rounds Played</p>
                        </CardContent>
                      </Card>
                      <Card style={{borderColor: '#c5e6d1'}}>
                        <CardContent className="p-4 text-center">
                          <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <h4 className="font-medium">{favoriteIds.length}</h4>
                          <p className="text-sm text-muted-foreground">Favorite Courses</p>
                        </CardContent>
                      </Card>
                      <Card style={{borderColor: '#c5e6d1'}}>
                        <CardContent className="p-4 text-center">
                          <Target className="w-8 h-8 mx-auto mb-2" style={{color: '#06402B'}} />
                          <h4 className="font-medium">{user.handicap || '-'}</h4>
                          <p className="text-sm text-muted-foreground">Handicap</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        style={{borderColor: '#9dd6b3'}}
                        onClick={openProfileEdit}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
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
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 text-white"
                        style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
                        onClick={() => setActiveTab('search')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Start a Round
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        style={{borderColor: '#9dd6b3'}}
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
                    <User className="w-5 h-5" style={{color: '#06402B'}} />
                    Welcome to Jazel
                  </CardTitle>
                  <CardDescription>
                    Your Morocco golf companion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{background: 'linear-gradient(135deg, #06402B 0%, #0d7377 100%)'}}>
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Start Your Golf Journey</h3>
                    <p className="text-muted-foreground mb-6">
                      Track your rounds, find courses, and improve your game with Jazel
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card style={{borderColor: '#c5e6d1'}}>
                      <CardContent className="p-4 text-center">
                        <Search className="w-8 h-8 mx-auto mb-2" style={{color: '#06402B'}} />
                        <h4 className="font-medium">Find Courses</h4>
                        <p className="text-sm text-muted-foreground">24 Morocco golf courses</p>
                      </CardContent>
                    </Card>
                    <Card style={{borderColor: '#c5e6d1'}}>
                      <CardContent className="p-4 text-center">
                        <Target className="w-8 h-8 mx-auto mb-2" style={{color: '#06402B'}} />
                        <h4 className="font-medium">Track Scores</h4>
                        <p className="text-sm text-muted-foreground">Detailed scorecards</p>
                      </CardContent>
                    </Card>
                    <Card style={{borderColor: '#c5e6d1'}}>
                      <CardContent className="p-4 text-center">
                        <Bot className="w-8 h-8 mx-auto mb-2" style={{color: '#06402B'}} />
                        <h4 className="font-medium">AI Caddie</h4>
                        <p className="text-sm text-muted-foreground">Smart recommendations</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 text-white"
                      style={{background: 'linear-gradient(to right, #06402B, #0d7377)'}}
                      onClick={() => setShowSignupDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Account
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      style={{borderColor: '#9dd6b3'}}
                      onClick={() => setShowLoginDialog(true)}
                    >
                      Sign In
                    </Button>
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
        onGetRecommendation={(data) => {
          console.log('Getting recommendation for:', data);
        }}
      />

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome Back</DialogTitle>
            <DialogDescription>Sign in to your Jazel account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <Button
              className="w-full text-white"
              style={{backgroundColor: '#06402B'}}
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
                style={{color: '#06402B'}}
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
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
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
                  onChange={(e) => setForgotPasswordForm({ email: e.target.value })}
                />
              </div>
              <Button
                className="w-full text-white"
              style={{backgroundColor: '#06402B'}}
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
                }}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{backgroundColor: '#e8f5ed'}}>
                <p className="text-sm" style={{color: '#032719'}}>
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
                }}
              >
                Back to Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Join Jazel and start tracking your golf rounds</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Your name"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
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
              />
            </div>
            <Button
              className="w-full text-white"
              style={{backgroundColor: '#06402B'}}
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
                style={{color: '#06402B'}}
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nearby-distance">Default Nearby Search Distance (km)</Label>
              <Select 
                value={profileEditForm.nearbyDistance?.toString() || '100'} 
                onValueChange={(v) => setProfileEditForm({ ...profileEditForm, nearbyDistance: parseInt(v) })}
              >
                <SelectTrigger id="edit-nearby-distance">
                  <SelectValue placeholder="Select distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                  <SelectItem value="200">200 km</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Used when searching for nearby golf courses</p>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">Change Password (leave blank to keep current)</p>
            <div className="space-y-2">
              <Label htmlFor="edit-current-password">Current Password</Label>
              <Input
                id="edit-current-password"
                type="password"
                placeholder="••••••••"
                value={profileEditForm.currentPassword}
                onChange={(e) => setProfileEditForm({ ...profileEditForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-new-password">New Password</Label>
              <Input
                id="edit-new-password"
                type="password"
                placeholder="••••••••"
                value={profileEditForm.newPassword}
                onChange={(e) => setProfileEditForm({ ...profileEditForm, newPassword: e.target.value })}
              />
            </div>
            <Button
              className="w-full text-white"
              style={{backgroundColor: '#06402B'}}
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
        <DialogContent className="max-w-md">
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
                  addPlayer(selectedGolfer.name || 'Unknown', selectedGolfer.avatar, selectedGolfer.handicap);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a golfer..." />
                </SelectTrigger>
                <SelectContent>
                  {golfers
                    .filter(g => g.id !== user?.id && !additionalPlayers.some(p => p.id === g.id || p.name === g.name))
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
                style={{backgroundColor: '#06402B'}}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {additionalPlayers.length > 0 && (
              <div className="space-y-2">
                <Label>Added Players ({additionalPlayers.length}/3)</Label>
                {additionalPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg" style={{backgroundColor: '#e8f5ed'}}>
                    <div className="flex items-center gap-2">
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{background: 'linear-gradient(135deg, #06402B 0%, #0d7377 100%)'}}>
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


      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t mt-auto" style={{borderColor: '#c5e6d1'}}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4" style={{color: '#06402B'}} />
              <span>Jazel - Golf Scorecard</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{courses.length} courses available</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
