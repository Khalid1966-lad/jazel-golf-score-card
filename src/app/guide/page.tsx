'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  BookOpen, 
  User, 
  MapPin, 
  Circle, 
  Trophy, 
  BarChart3, 
  Users, 
  Cloud, 
  Settings,
  ChevronRight,
  Check,
  Star,
  Navigation,
  Clock,
  Calendar,
  Download,
  Mail,
  Lock,
  Target,
  TrendingUp,
  Smartphone,
  Map,
  Briefcase
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('welcome');

  const sections: GuideSection[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      icon: <BookOpen className="w-4 h-4" />,
      content: <WelcomeSection />
    },
    {
      id: 'account',
      title: 'Account & Login',
      icon: <User className="w-4 h-4" />,
      content: <AccountSection />
    },
    {
      id: 'courses',
      title: 'Golf Courses',
      icon: <MapPin className="w-4 h-4" />,
      content: <CoursesSection />
    },
    {
      id: 'rounds',
      title: 'Recording Rounds',
      icon: <Circle className="w-4 h-4" />,
      content: <RoundsSection />
    },
    {
      id: 'maps',
      title: 'Course Maps',
      icon: <Map className="w-4 h-4" />,
      content: <MapsSection />
    },
    {
      id: 'my-bag',
      title: 'My Bag',
      icon: <Briefcase className="w-4 h-4" />,
      content: <BagSection />
    },
    {
      id: 'statistics',
      title: 'Statistics',
      icon: <BarChart3 className="w-4 h-4" />,
      content: <StatisticsSection />
    },
    {
      id: 'golfers',
      title: 'Golfers Community',
      icon: <Users className="w-4 h-4" />,
      content: <GolfersSection />
    },
    {
      id: 'tournaments',
      title: 'Tournaments',
      icon: <Trophy className="w-4 h-4" />,
      content: <TournamentsSection />
    },
    {
      id: 'weather',
      title: 'Weather',
      icon: <Cloud className="w-4 h-4" />,
      content: <WeatherSection />
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      icon: <Settings className="w-4 h-4" />,
      content: <AdminSection />
    },
    {
      id: 'install',
      title: 'Install App',
      icon: <Smartphone className="w-4 h-4" />,
      content: <InstallSection />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-jazel-50 via-white to-jazel-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" style={{ color: '#39638b' }} />
              User Guide
            </h1>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Contents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1 px-3 pb-3">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                          activeSection === section.id
                            ? 'bg-jazel-100 text-jazel-700 font-medium'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {section.icon}
                        {section.title}
                        {activeSection === section.id && (
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
            <Card className="shadow-lg">
              <div className="flex gap-1 p-2 overflow-x-auto" style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
              }}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
                      activeSection === section.id
                        ? 'bg-jazel-100 text-jazel-700 font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {section.icon}
                    {section.title}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 pb-24 md:pb-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {sections.find(s => s.id === activeSection)?.content}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Welcome Section
function WelcomeSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <span className="p-2 rounded-lg" style={{ backgroundColor: '#39638b20' }}>
              <Circle className="w-6 h-6" style={{ color: '#39638b' }} />
            </span>
            Welcome to Jazel
          </CardTitle>
          <CardDescription className="text-base">
            Your complete golf companion for Morocco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel is a comprehensive golf scorecard application designed specifically for golfers in Morocco. 
            Track your rounds, analyze your performance, discover golf courses, and connect with fellow golfers.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" style={{ color: '#39638b' }} />
                Track Your Game
              </h3>
              <p className="text-sm text-muted-foreground">
                Record detailed scores including strokes, putts, fairways hit, and greens in regulation.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: '#39638b' }} />
                Analyze Performance
              </h3>
              <p className="text-sm text-muted-foreground">
                View detailed statistics and charts to understand your game better.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" style={{ color: '#39638b' }} />
                Discover Courses
              </h3>
              <p className="text-sm text-muted-foreground">
                Browse all golf courses in Morocco with detailed hole information.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4" style={{ color: '#39638b' }} />
                Compete in Tournaments
              </h3>
              <p className="text-sm text-muted-foreground">
                Participate in tournaments and track your standings on leaderboards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, text: 'Create an account or log in' },
              { step: 2, text: 'Browse and select a golf course' },
              { step: 3, text: 'Start a new round and record your scores' },
              { step: 4, text: 'View your statistics and track progress' }
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: '#39638b' }}>
                  {item.step}
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Account Section
function AccountSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <User className="w-5 h-5" style={{ color: '#39638b' }} />
            Creating an Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To use Jazel, you need to create an account. This allows you to save your rounds, 
            track statistics, and connect with other golfers.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Steps to Sign Up</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-medium text-foreground">1.</span>
                  Click the "Sign In" button in the top navigation
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-foreground">2.</span>
                  Click "Sign up" at the bottom of the login dialog
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-foreground">3.</span>
                  Enter your name, email, and create a password
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-foreground">4.</span>
                  Optionally add your handicap
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium text-foreground">5.</span>
                  Click "Create Account"
                </li>
              </ol>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4" />
                Password Requirements
              </h4>
              <p className="text-sm text-amber-700">
                Your password must be at least 6 characters long. Use a strong, unique password 
                to protect your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Logging In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            If you already have an account, simply click "Sign In" and enter your credentials.
          </p>

          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-medium">Troubleshooting Login Issues</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Make sure you're using the correct email address</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Check if Caps Lock is enabled</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <span>Use the "Forgot Password" link to reset your password</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Update your profile by clicking on your name in the top navigation. You can:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Change your name
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Update your handicap
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Set your location (city/country)
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Change your password
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Courses Section
function CoursesSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <MapPin className="w-5 h-5" style={{ color: '#39638b' }} />
            Browsing Golf Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel includes a comprehensive database of golf courses across Morocco. 
            Browse courses to find details about each one.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: '#39638b' }} />
                Near Me
              </h4>
              <p className="text-sm text-muted-foreground">
                Enable location services to see courses sorted by distance from your current location.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" style={{ color: '#39638b' }} />
                Favorites
              </h4>
              <p className="text-sm text-muted-foreground">
                Star your favorite courses for quick access. They'll appear at the top of your list.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click on any course to view detailed information:
          </p>
          
          <div className="space-y-3">
            {[
              { label: 'Course Information', desc: 'Name, location, total holes, designer' },
              { label: 'Hole Details', desc: 'Par and handicap for each hole' },
              { label: 'Tee Options', desc: 'Different tee positions with colors' },
              { label: 'GPS Coordinates', desc: 'Green locations for navigation' },
              { label: 'Contact Info', desc: 'Phone number and website (if available)' }
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <span className="font-medium">{item.label}</span>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Starting a Round from Course Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            From any course detail page, you can quickly start a new round by clicking the 
            "Play Round" button. This automatically selects the course for your round.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Rounds Section
function RoundsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Circle className="w-5 h-5" style={{ color: '#39638b' }} />
            Recording a Round
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Recording your rounds is the core feature of Jazel. Track every stroke to 
            build your statistics and improve your game.
          </p>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Starting a New Round</h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-medium">1.</span>
                Click the "+" button or "New Round" from the home screen
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">2.</span>
                Select a golf course from the list
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">3.</span>
                Choose which tee you're playing from
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">4.</span>
                Select to play 9 or 18 holes
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">5.</span>
                Start entering your scores!
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Score Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            For each hole, you can record:
          </p>
          
          <div className="grid gap-3">
            {[
              { name: 'Strokes', desc: 'Total number of shots taken on the hole', icon: <Circle className="w-4 h-4" /> },
              { name: 'Putts', desc: 'Number of putts taken on the green', icon: <Target className="w-4 h-4" /> },
              { name: 'Fairway Hit', desc: 'Did your tee shot land in the fairway?', icon: <Navigation className="w-4 h-4" /> },
              { name: 'Green in Regulation', desc: 'Did you reach the green in regulation strokes?', icon: <Check className="w-4 h-4" /> },
              { name: 'Penalties', desc: 'Number of penalty strokes', icon: <span className="w-4 h-4 text-center text-sm">P</span> }
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#39638b20' }}>
                  {item.icon}
                </div>
                <div>
                  <span className="font-medium">{item.name}</span>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Multi-Player Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can track scores for multiple players in a single round:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Add players by name or select from registered golfers</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Switch between players while entering scores</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Each player's scores are saved separately</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Saving & Completing Rounds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Auto-Save</h4>
            <p className="text-sm text-green-700">
              Your round is automatically saved as you enter scores. If you close the app, 
              you can continue where you left off.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Completing a Round</h4>
            <p className="text-sm text-muted-foreground">
              After entering all scores, click "Finish Round" to mark it as complete. 
              Completed rounds contribute to your statistics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Maps Section
function MapsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Map className="w-5 h-5" style={{ color: '#39638b' }} />
            Course Maps & GPS
          </CardTitle>
          <CardDescription>
            Real-time GPS tracking during your round
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel includes an interactive map feature that shows your real-time position on the golf course, 
            distance to the green, and allows you to measure distances to any point on the map.
          </p>
          
          {/* Map Screenshot */}
          <div className="rounded-lg overflow-hidden border shadow-md">
            <img 
              src="/map.jpeg" 
              alt="Course Map Interface" 
              className="w-full h-auto object-cover"
            />
            <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
              Course map showing GPS tracking and distance measurement
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4" />
              GPS Required
            </h4>
            <p className="text-sm text-green-700">
              The map feature uses your device's GPS. Make sure location services are enabled for the best experience.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Opening the Map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            While recording a round, tap the <strong>Map</strong> button in the scorecard header to open the course map. 
            The map shows:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />
              <span><strong>Your position</strong> - Real-time GPS tracking (blue marker)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">G</div>
              <span><strong>Green location</strong> - Current hole's green (green marker)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow" />
              <span><strong>Target point</strong> - Any point you tap (amber marker)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs bg-[#39638b] text-white">⛳</div>
              <span><strong>Course marker</strong> - Main course location</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Distance to Green</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The map automatically calculates and displays your distance to the current hole's green:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2" style={{ color: '#22c55e' }}>
                <Target className="w-4 h-4" />
                To Green
              </h4>
              <p className="text-sm text-muted-foreground">
                Shows your distance to the center of the green for the current hole.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-600">
                <Target className="w-4 h-4" />
                To Target
              </h4>
              <p className="text-sm text-muted-foreground">
                Tap anywhere on the map to measure distance to that point (hazards, layup spots, etc.)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Map Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Use these controls to navigate the map:</p>
          <div className="grid gap-3">
            {[
              { icon: '🔍', title: 'Zoom In/Out', desc: 'Use the + and - buttons or pinch to zoom' },
              { icon: '📍', title: 'Center on Me', desc: 'Tap to center the map on your current location' },
              { icon: '⛳', title: 'Center on Course', desc: 'Tap to center on the course location' },
              { icon: '🛰️', title: 'Satellite View', desc: 'Toggle between satellite imagery and street map' },
              { icon: '🗺️', title: 'Street View', desc: 'Shows roads and landmarks for navigation' }
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-3 border rounded-lg">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <span className="font-medium">{item.title}</span>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Hole Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            While viewing the map, you can navigate between holes:
          </p>
          <div className="p-4 border rounded-lg">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Use the <strong>- / +</strong> buttons to switch between holes
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                The green marker automatically moves to the selected hole
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Distance to green updates based on current hole
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Measuring Distances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can measure distance to any point on the course:
          </p>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Tap anywhere on the map to set a target point</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>An amber marker appears with a dashed line to your position</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>The "To Target" distance displays in the header</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>4</div>
              <span>Tap the X to clear the target point</span>
            </li>
          </ol>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Use this to measure distance to hazards, bunkers, or layup spots before choosing your club.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Distance Units</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Distances can be displayed in either <strong>yards</strong> or <strong>meters</strong>. 
            This setting is controlled by your profile preferences. Change it in the Settings tab to match 
            what you're comfortable with.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// My Bag Section
function BagSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Briefcase className="w-5 h-5" style={{ color: '#39638b' }} />
            What&apos;s in My Bag
          </CardTitle>
          <CardDescription>
            Customize your golf club inventory for personalized club recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The <strong>My Bag</strong> feature allows you to set up your personal golf club inventory. 
            Add each club in your bag along with the maximum distance you hit with it. This information 
            helps Jazel provide intelligent club recommendations during your rounds.
          </p>
          
          {/* Bag Screenshot */}
          <div className="rounded-lg overflow-hidden border shadow-md">
            <img 
              src="/my-bag.jpeg" 
              alt="My Bag Interface" 
              className="w-full h-auto object-cover"
            />
            <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
              My Bag screen showing club inventory with distances
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Setting Up Your Clubs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Add all the clubs you carry in your bag:
          </p>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Go to your Profile and select <strong>My Bag</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Tap <strong>Add Club</strong> to add a new club</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Select the club type (Driver, Iron, Wedge, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>4</div>
              <span>Enter your <strong>maximum distance</strong> for that club</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>5</div>
              <span>Repeat for all clubs in your bag</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Club Types Available</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can add any of these club types to your bag:
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { icon: '🏌️', name: 'Driver', range: '200-300+ yards' },
              { icon: '🏏', name: 'Fairway Woods', range: '170-250 yards' },
              { icon: '⚔️', name: 'Hybrids', range: '150-220 yards' },
              { icon: '🔩', name: 'Irons (3-9)', range: '100-200 yards' },
              { icon: '🎯', name: 'Pitching Wedge', range: '80-130 yards' },
              { icon: '📍', name: 'Gap/Sand Wedge', range: '60-110 yards' },
              { icon: '⛳', name: 'Lob Wedge', range: '40-80 yards' },
              { icon: '🥁', name: 'Putter', range: 'Green only' }
            ].map((club) => (
              <div key={club.name} className="flex items-center gap-3 p-3 border rounded-lg">
                <span className="text-xl">{club.icon}</span>
                <div>
                  <span className="font-medium">{club.name}</span>
                  <p className="text-sm text-muted-foreground">Typical: {club.range}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: '#39638b' }} />
            Range Finder Club Suggestions
          </CardTitle>
          <CardDescription>
            Get personalized club recommendations based on your bag
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            When you use the <strong>Range Finder</strong> feature during a round, Jazel can suggest 
            which club to use based on the distance to the target and the clubs you&apos;ve set up in your bag.
          </p>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
              <Check className="w-4 h-4" />
              How It Works
            </h4>
            <ul className="text-sm text-green-700 space-y-2">
              <li>• Measure the distance to your target using the map</li>
              <li>• Jazel compares this distance to your club distances</li>
              <li>• The app suggests the best club for that distance</li>
              <li>• You&apos;ll see recommendations like &quot;Suggested: 7 Iron (150 yards)&quot;</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span>
              Example Scenario
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <strong>Distance to pin:</strong> 145 yards
              </p>
              <p className="text-muted-foreground">
                <strong>Your clubs:</strong>
              </p>
              <ul className="ml-4 space-y-1 text-muted-foreground">
                <li>• 8 Iron - max 140 yards</li>
                <li>• 7 Iron - max 155 yards</li>
                <li>• 6 Iron - max 170 yards</li>
              </ul>
              <p className="pt-2 text-green-700 font-medium">
                ✅ Suggested: 7 Iron (will reach the green with good contact)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tips for Accurate Distances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            For the best club recommendations, set accurate maximum distances:
          </p>
          <div className="grid gap-3">
            {[
              { icon: '📏', tip: 'Use a driving range with yardage markers to measure your actual distances' },
              { icon: '🎯', tip: 'Enter your consistent maximum distance, not your all-time best shot' },
              { icon: '🔄', tip: 'Update distances seasonally as your swing improves or changes' },
              { icon: '🌡️', tip: 'Consider adjusting for conditions (wind, temperature affects distance)' },
              { icon: '📝', tip: 'Track your actual shots during rounds to refine your numbers' }
            ].map((item) => (
              <div key={item.tip} className="flex items-center gap-4 p-3 border rounded-lg">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-muted-foreground">{item.tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Editing Your Bag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You can update your bag at any time:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span><strong>Edit</strong> any club&apos;s distance by tapping on it</span>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span><strong>Delete</strong> clubs you no longer carry</span>
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span><strong>Add</strong> new clubs when you upgrade your equipment</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Statistics Section
function StatisticsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <BarChart3 className="w-5 h-5" style={{ color: '#39638b' }} />
            Your Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel automatically calculates statistics from your completed rounds, 
            helping you identify strengths and areas for improvement.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Average Score', desc: 'Your average strokes per round' },
              { name: 'Average Putts', desc: 'Average number of putts per round' },
              { name: 'Fairway %', desc: 'Percentage of fairways hit' },
              { name: 'GIR %', desc: 'Greens in Regulation percentage' },
              { name: 'Best Score', desc: 'Your lowest round ever' },
              { name: 'Total Rounds', desc: 'Number of completed rounds' }
            ].map((stat) => (
              <div key={stat.name} className="p-4 border rounded-lg">
                <h4 className="font-medium" style={{ color: '#39638b' }}>{stat.name}</h4>
                <p className="text-sm text-muted-foreground">{stat.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Scoring Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            View detailed charts showing your scoring distribution:
          </p>
          <div className="grid gap-3">
            {[
              { label: 'Eagles', color: 'bg-yellow-500' },
              { label: 'Birdies', color: 'bg-blue-500' },
              { label: 'Pars', color: 'bg-green-500' },
              { label: 'Bogeys', color: 'bg-orange-500' },
              { label: 'Double Bogeys', color: 'bg-red-500' }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Round History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            View all your past rounds with details including the course, date, total score, 
            and individual hole-by-hole scores. Click on any round to see the full details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Golfers Section
function GolfersSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: '#39638b' }} />
            Golfers Community
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Connect with other golfers using Jazel. View their profiles, handicaps, and 
            see how your game compares.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Viewing Golfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Navigate to the "Golfers" tab to see all registered users. Each profile shows:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Name and avatar
            </li>
            <li className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              Handicap
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Location (city/country)
            </li>
            <li className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-muted-foreground" />
              Number of rounds played
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Tournaments Section
function TournamentsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Trophy className="w-5 h-5" style={{ color: '#39638b' }} />
            Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Participate in golf tournaments organized by your club or course administrators. 
            Track your standings and compare scores with other participants.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tournament Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#39638b' }} />
                Date & Time
              </h4>
              <p className="text-sm text-muted-foreground">
                When the tournament takes place and the start time.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: '#39638b' }} />
                Course
              </h4>
              <p className="text-sm text-muted-foreground">
                The golf course where the tournament is held.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: '#39638b' }} />
                Format
              </h4>
              <p className="text-sm text-muted-foreground">
                Stroke Play, Match Play, Stableford, etc.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Badge variant="outline" className="w-4 h-4 p-0 flex items-center justify-center text-xs">N</Badge>
                Max Players
              </h4>
              <p className="text-sm text-muted-foreground">
                Maximum number of participants allowed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Leaderboards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tournament leaderboards show:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Player names and handicaps
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Brut score (gross score - actual strokes)
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Net score (brut score minus handicap)
            </li>
          </ul>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
            <p className="text-sm text-blue-700">
              <strong>Sorting:</strong> Sort participants by handicap, brut score, or net score 
              by clicking on the column headers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Weather Section
function WeatherSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Cloud className="w-5 h-5" style={{ color: '#39638b' }} />
            Weather Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel provides real-time weather information to help you plan your round. 
            Weather data is shown on the home screen when location services are enabled.
          </p>
          
          {/* Weather Screenshot */}
          <div className="rounded-lg overflow-hidden border shadow-md">
            <img 
              src="/weather.jpeg" 
              alt="Weather Display" 
              className="w-full h-auto object-cover"
            />
            <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
              Real-time weather conditions on the home screen
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Weather Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {[
              { icon: <span className="text-2xl">🌡️</span>, name: 'Temperature', desc: 'Current temperature and feels-like temperature' },
              { icon: <span className="text-2xl">💨</span>, name: 'Wind', desc: 'Wind speed and direction' },
              { icon: <span className="text-2xl">💧</span>, name: 'Humidity', desc: 'Relative humidity percentage' },
              { icon: <span className="text-2xl">🌤️</span>, name: 'Conditions', desc: 'Sunny, cloudy, rain, etc.' }
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-4 p-3 border rounded-lg">
                {item.icon}
                <div>
                  <span className="font-medium">{item.name}</span>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="text-2xl">🧭</span>
            Built-in Compass for Wind Direction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel includes a <strong>built-in compass</strong> that shows real-time wind direction 
            relative to your position. This helps you understand exactly which way the wind is blowing 
            before making your shot.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Navigation className="w-4 h-4" style={{ color: '#39638b' }} />
                How It Works
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• The compass uses your device's magnetometer</li>
                <li>• Wind direction is shown in degrees (0-360°)</li>
                <li>• Cardinal directions (N, NE, E, SE, S, SW, W, NW) are displayed</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: '#39638b' }} />
                Why It Matters
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Adjust your aim based on wind direction</li>
                <li>• Choose the right club for crosswinds</li>
                <li>• Plan your shot trajectory</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
              <span>💡</span>
              Pro Tip
            </h4>
            <p className="text-sm text-blue-700">
              Hold your phone flat and away from metal objects for the most accurate compass reading. 
              The compass works best when calibrated - wave your phone in a figure-8 motion if readings seem off.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Enabling Location</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Weather information requires location access. When prompted, allow Jazel to 
            access your location to get accurate weather data for your area. The compass feature 
            also requires permission to access your device's sensors.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Section
function AdminSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Settings className="w-5 h-5" style={{ color: '#39638b' }} />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Available to administrators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The Admin Panel (accessible from /admin) provides tools for managing the Jazel platform.
          </p>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> Admin access is restricted. You must be logged in as an 
              admin user to access this panel.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Managing Golf Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Administrators can:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Add new golf courses
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Edit course details (name, location, contact info)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Configure hole information (par, handicap)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Set GPS coordinates for green locations
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Delete courses
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Managing Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Administrators can:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              View all registered users
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Edit user details (name, handicap, role)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Block/unblock users
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Hide users from the Golfers list
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Delete user accounts
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Managing Tournaments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Administrators can:</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Create new tournaments
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Add/remove participants
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Enter brut and net scores for participants
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Update tournament status (upcoming, in progress, completed)
            </li>
            <li className="flex items-center gap-2">
              <Download className="w-4 h-4" style={{ color: '#39638b' }} />
              Export tournament data to Excel
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Excel Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Export tournament data to Excel format for offline use. The Excel file includes:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Tournament information (name, date, course, format)
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Complete participants list with handicaps
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Brut and Net scores
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Leaderboards sorted by Brut and Net scores
            </li>
          </ul>
          <div className="p-4 bg-muted rounded-lg mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>To export:</strong> Open a tournament from the admin panel and click 
              the "Download Excel" button at the top of the participants list.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Send announcements to all users through the Messages tab:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Create messages with title and content
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Messages are shown to users in the app
            </li>
            <li className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-muted-foreground" />
              Edit or delete previously sent messages
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Edit2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

// Install Section
function InstallSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Smartphone className="w-5 h-5" style={{ color: '#39638b' }} />
            Install Jazel as an App
          </CardTitle>
          <CardDescription>
            Get the full app experience on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel is a Progressive Web App (PWA), which means you can install it on your device 
            just like a regular app from the app store. Once installed, it works offline and 
            provides a native app-like experience.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                <Check className="w-4 h-4" />
                Works Offline
              </h4>
              <p className="text-sm text-green-700">
                Access your scorecard even without internet connection. Your data syncs when you're back online.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                <Check className="w-4 h-4" />
                No App Store Needed
              </h4>
              <p className="text-sm text-green-700">
                Install directly from your browser - no need to visit the App Store or Play Store.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Installing on Android</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Follow these steps to install Jazel on your Android device:</p>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Open Jazel in Chrome browser</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Wait for the "Install" banner to appear, or tap the menu (three dots) in the top right</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Tap "Add to Home Screen" or "Install App"</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>4</div>
              <span>Confirm by tapping "Install"</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Installing on iOS (iPhone/iPad)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Follow these steps to install Jazel on your iOS device:</p>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Open Jazel in Safari browser</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Tap the Share button (square with arrow pointing up) at the bottom of the screen</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Scroll down and tap "Add to Home Screen"</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>4</div>
              <span>Tap "Add" in the top right corner</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Installing on Desktop (Chrome/Edge)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">You can also install Jazel on your desktop computer:</p>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Visit Jazel in Chrome or Edge browser</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Look for the install icon in the address bar (a monitor with a down arrow)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Click "Install" or use the browser menu → "Install Jazel"</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Benefits of Installing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {[
              { icon: <span className="text-xl">📱</span>, title: 'Home Screen Icon', desc: 'Quick access from your home screen like any other app' },
              { icon: <span className="text-xl">📴</span>, title: 'Offline Access', desc: 'View courses and enter scores even without internet' },
              { icon: <span className="text-xl">⚡</span>, title: 'Faster Loading', desc: 'App loads instantly with cached resources' },
              { icon: <span className="text-xl">🔒</span>, title: 'Full Screen', desc: 'Use without browser UI for an immersive experience' },
              { icon: <span className="text-xl">🔔</span>, title: 'Notifications', desc: 'Receive updates about tournaments and messages (coming soon)' }
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-3 border rounded-lg">
                {item.icon}
                <div>
                  <span className="font-medium">{item.title}</span>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
