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
  Briefcase,
  Compass,
  Camera,
  Upload,
  Heart,
  RefreshCw,
  Save,
  Info,
  Globe,
  MailOpen,
  Shield,
  Clipboard,
  Snowflake,
  AlertTriangle
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('about');

  const sections: GuideSection[] = [
    {
      id: 'about',
      title: 'About',
      icon: <Info className="w-4 h-4" />,
      content: <AboutSection />
    },
    {
      id: 'welcome',
      title: 'Welcome',
      icon: <BookOpen className="w-4 h-4" />,
      content: <WelcomeSection />
    },
    {
      id: 'account',
      title: 'Account & Profile',
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
      title: 'Course Maps & GPS',
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
      id: 'achievements',
      title: 'Achievements',
      icon: <Star className="w-4 h-4" />,
      content: <AchievementsSection />
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
            </button>
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

// About Section
function AboutSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <span className="p-2 rounded-lg" style={{ backgroundColor: '#39638b20' }}>
              <Info className="w-6 h-6" style={{ color: '#39638b' }} />
            </span>
            About Jazel Golf
          </CardTitle>
          <CardDescription className="text-base">
            Your smart golf companion for Morocco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Developer Info */}
          <div className="flex flex-col items-center text-center py-6">
            <img
              src="/logo-jazel.png"
              alt="Jazel Web Agency"
              className="w-24 h-24 object-contain mb-4"
            />
            <h3 className="text-xl font-bold mb-1">Developed by</h3>
            <p className="text-2xl font-semibold" style={{ color: '#39638b' }}>Jazel Web Agency</p>
          </div>

          {/* Contact Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="mailto:contact@jazelwebagency.com"
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3"
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#39638b20' }}>
                <MailOpen className="w-5 h-5" style={{ color: '#39638b' }} />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">contact@jazelwebagency.com</p>
              </div>
            </a>
            <a
              href="https://www.jazelwebagency.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3"
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#39638b20' }}>
                <Globe className="w-5 h-5" style={{ color: '#39638b' }} />
              </div>
              <div>
                <p className="font-medium">Website</p>
                <p className="text-sm text-muted-foreground">jazelwebagency.com</p>
              </div>
            </a>
          </div>

          <Separator />

          {/* App Description */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">About the App</h4>
            <p className="text-muted-foreground">
              Jazel Golf is a complete golf scorecard application designed for golfers in Morocco.
              Track your rounds, get smart club recommendations, discover courses,
              and connect with fellow golfers.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="font-medium">📍 GPS Range Finder</span>
                <p className="text-sm text-muted-foreground">Real-time distances to greens</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="font-medium">🏆 Tournaments</span>
                <p className="text-sm text-muted-foreground">Organize and compete</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="font-medium">📊 Statistics</span>
                <p className="text-sm text-muted-foreground">Track your progress</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sponsors Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Our Sponsors</h4>
            <div className="p-4 border rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <div className="flex flex-col items-center text-center">
                <img
                  src="/logo-bzegolf.jpg"
                  alt="Broken Zebra Golf"
                  className="w-20 h-20 object-contain mb-3"
                />
                <h5 className="text-lg font-bold mb-1">Broken Zebra Golf</h5>
              </div>
              <div className="grid gap-3 mt-4 md:grid-cols-2">
                <a
                  href="https://www.bzegolf.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" style={{ color: '#39638b' }} />
                  <span className="text-sm">bzegolf.com</span>
                </a>
                <a
                  href="mailto:contact@bzegolf.com"
                  className="p-3 border rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors flex items-center gap-2"
                >
                  <MailOpen className="w-4 h-4" style={{ color: '#39638b' }} />
                  <span className="text-sm">contact@bzegolf.com</span>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
            Welcome to Jazel Golf
          </CardTitle>
          <CardDescription className="text-base">
            Your smart golf companion for Morocco
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel Golf is a complete golf scorecard app designed for golfers in Morocco. 
            Track your scores, get smart club recommendations, discover courses, and connect with fellow golfers.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Target className="w-4 h-4" style={{ color: '#39638b' }} />
                Track Every Shot
              </h3>
              <p className="text-sm text-muted-foreground">
                Record strokes, putts, fairways, and greens. Play 9 or 18 holes with friends.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Navigation className="w-4 h-4" style={{ color: '#39638b' }} />
                GPS Range Finder
              </h3>
              <p className="text-sm text-muted-foreground">
                See your distance to the green and get club suggestions in real-time.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4" style={{ color: '#39638b' }} />
                Achievements & Badges
              </h3>
              <p className="text-sm text-muted-foreground">
                Earn badges and level up as you complete rounds and hit milestones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Getting Started is Easy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: 1, text: 'Create your free account' },
              { step: 2, text: 'Set up your bag with your clubs and distances' },
              { step: 3, text: 'Choose a course and start your round' },
              { step: 4, text: 'Use GPS for smart distance measurements' },
              { step: 5, text: 'Track your stats and improve your game!' }
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
            Creating Your Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Creating an account takes just a few seconds. Your account lets you save rounds, 
            track your stats, and connect with other golfers.
          </p>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Quick Sign Up</h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">1.</span>
                Tap "Sign In" in the top right corner
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">2.</span>
                Click "Sign up" at the bottom of the login screen
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">3.</span>
                Enter your name, email, and create a password
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">4.</span>
                Add your handicap (optional but recommended)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">5.</span>
                Tap "Create Account" - you're ready to play!
              </li>
            </ol>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              Password Tips
            </h4>
            <p className="text-sm text-amber-700">
              Your password needs at least 6 characters. Use something memorable but secure. 
              Forgot your password? Use the "Forgot Password" link to reset it.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Camera className="w-5 h-5" style={{ color: '#39638b' }} />
            Your Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Add a photo to personalize your profile. Friends will see your photo when playing together.
          </p>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <Upload className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-sm">Upload from Gallery</span>
                <p className="text-xs text-muted-foreground">Choose an existing photo from your device</p>
              </div>
            </div>
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <Camera className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-sm">Take a Photo</span>
                <p className="text-xs text-muted-foreground">Snap a new selfie right from the app</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Editing Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Go to the <strong>Profile</strong> tab to update your info anytime:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Change your name and email
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
              Choose yards or meters for distances
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Set how far to search for nearby courses
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
            Finding Golf Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel Golf includes all golf courses across Morocco. Browse, search, and find the perfect course for your next round.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Navigation className="w-4 h-4" style={{ color: '#39638b' }} />
                Near Me
              </h4>
              <p className="text-sm text-muted-foreground">
                Enable location to see courses sorted by distance from where you are right now.
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
            Tap any course to see everything you need to know:
          </p>
          
          <div className="space-y-3">
            {[
              { label: 'Course Info', desc: 'Name, city, total holes, designer, year built' },
              { label: 'Hole Details', desc: 'Par and handicap for each hole' },
              { label: 'Tee Options', desc: 'Different tee positions (Blue, White, Red, etc.)' },
              { label: 'GPS Data', desc: 'Green locations for accurate distance calculations' },
              { label: 'Contact', desc: 'Phone number and website when available' }
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
          <CardTitle className="text-xl">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            From any course page, tap <strong>"Play Round"</strong> to start scoring immediately. 
            The course is automatically selected for your new round.
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
            Starting a Round
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Recording your rounds is what Jazel is all about. Every shot you track helps build your stats and improve your game.
          </p>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Starting New</h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-medium">1.</span>
                Tap the "+" button or "New Round" on the home screen
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">2.</span>
                Pick a course from the list
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">3.</span>
                Choose your tee box (Blue, White, Red, etc.)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">4.</span>
                Select 9 or 18 holes
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">5.</span>
                For 9 holes, choose Front 9 or Back 9
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">6.</span>
                Start entering your scores!
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">What to Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            For each hole, you can track:
          </p>
          
          <div className="grid gap-3">
            {[
              { name: 'Strokes', desc: 'Total shots on the hole', icon: <Circle className="w-4 h-4" /> },
              { name: 'Putts', desc: 'How many putts on the green', icon: <Target className="w-4 h-4" /> },
              { name: 'Fairway Hit', desc: 'Did your tee shot find the fairway?', icon: <Navigation className="w-4 h-4" /> },
              { name: 'Green in Reg', desc: 'Did you reach the green in regulation?', icon: <Check className="w-4 h-4" /> },
              { name: 'Penalties', desc: 'Any penalty strokes?', icon: <span className="w-4 h-4 text-center text-sm">P</span> }
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
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: '#39638b' }} />
            Stableford Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel automatically calculates Stableford points for you based on your handicap. This gives you a fair scoring system no matter your skill level.
          </p>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="font-medium text-emerald-800 mb-2">How It Works</h4>
            <p className="text-sm text-emerald-700">
              Stableford awards points based on your <strong>net score</strong> (your strokes minus the strokes you receive based on your handicap). 
              The harder the hole (lower Stroke Index), the more strokes you receive. Your handicap is <strong>locked at the time you play</strong> — 
              so even if your handicap changes later, your Stableford scores stay exactly as earned.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Points System</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: 'Albatross or better', pts: '5 pts', color: 'text-green-600' },
                { label: 'Eagle', pts: '4 pts', color: 'text-green-600' },
                { label: 'Birdie', pts: '3 pts', color: 'text-blue-600' },
                { label: 'Par', pts: '2 pts', color: 'text-gray-800' },
                { label: 'Bogey', pts: '1 pt', color: 'text-amber-600' },
                { label: 'Double Bogey+', pts: '0 pts', color: 'text-gray-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span>{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.pts}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Stroke Allocation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Your handicap is distributed across holes based on their <strong>Stroke Index (HCP column)</strong>:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Holes with the lowest Stroke Index (hardest holes) receive strokes first</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Always distributed across all 18 holes (even for 9-hole rounds)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Example: HCP 10 → 1 stroke received on holes with SI 1-10</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Example: HCP 22 → 2 strokes on holes SI 1-4, 1 stroke on holes SI 5-18</span>
              </li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">On the Scorecard</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-medium">Strk Rcv</span>
                <span>— Shows strokes received for each hole (displays "-" when 0)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Stbfd</span>
                <span>— Shows the Stableford points earned per hole</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Score badge</span>
                <span>— A small number inside each score cell showing points earned</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">Total</span>
                <span>— Summary at bottom shows total Stableford points as "X points"</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
              <Star className="w-4 h-4" />
              For All Players
            </h4>
            <p className="text-sm text-amber-700">
              Stableford points are shown for <strong>all players</strong> — you and up to 3 additional players. 
              Each player's points are calculated using their own individual handicap. Add a player's handicap when 
              adding them to the round to see their Stableford points.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" />
              Handicap Lock
            </h4>
            <p className="text-sm text-blue-700">
              When you save a round, your handicap is <strong>permanently recorded</strong> with that round. 
              If you later change your handicap, all previously saved rounds will still show the original Stableford points 
              calculated with the handicap you had at the time of play. Your history is always accurate.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Playing with Friends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Track scores for up to 4 players in a single round:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Add friends by name or find registered golfers</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Switch between players while entering scores</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Everyone's scores are saved separately</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: '#39638b' }} />
            Match Play
          </CardTitle>
          <CardDescription>
            Head-to-head competition for 2 players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Match Play is a different way to compete — instead of counting total strokes, 
            you compete <strong>hole by hole</strong>. Each hole is won, lost, or halved (tied).
          </p>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Availability</h4>
            <p className="text-sm text-blue-700">
              Match Play is available for <strong>9-hole or 18-hole rounds with exactly 2 players</strong>. 
              The toggle appears above the scorecard once you add a second player.
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Getting Started</h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-medium">1.</span>
                Start a 9-hole or 18-hole round and add 1 additional player (2 total)
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">2.</span>
                Toggle <strong>"Match Play"</strong> on — it appears above the scorecard
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">3.</span>
                Play normally — the app tracks who wins each hole automatically
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">4.</span>
                Save the round — the result (e.g. "Khalid 3&2") is stored in your history
              </li>
            </ol>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Understanding the Score</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: 'AS', desc: 'All Square — tied', color: 'bg-gray-100 text-gray-700' },
                { label: '1UP', desc: '1 hole ahead', color: 'bg-green-100 text-green-800' },
                { label: '2UP', desc: '2 holes ahead', color: 'bg-green-100 text-green-800' },
                { label: '3UP', desc: '3 holes ahead', color: 'bg-green-100 text-green-800' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span>{item.label}</span>
                  <span className={`font-bold ${item.color} px-2 py-0.5 rounded-full text-xs`}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Scorecard Colors</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{backgroundColor: 'rgba(34, 197, 94, 0.85)', color: 'white'}}>W</div>
                <span><strong>Green</strong> — You won the hole</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{backgroundColor: 'rgba(239, 68, 68, 0.85)', color: 'white'}}>L</div>
                <span><strong>Red</strong> — Opponent won the hole</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{backgroundColor: 'rgba(251, 191, 36, 0.75)', color: 'white'}}>T</div>
                <span><strong>Amber</strong> — Hole was halved (tied)</span>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Early Match End</h4>
            <p className="text-sm text-muted-foreground mb-2">
              The match ends early when one player leads by more holes than remain:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>3&2</strong> — Won 3 holes up with 2 holes remaining (ended on hole 16)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>2&1</strong> — Won 2 up with 1 to play (ended on hole 17)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>1UP</strong> — Won by 1 after all 18 holes</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Handicap Strokes
            </h4>
            <p className="text-sm text-amber-700">
              When players have different handicaps, the higher-handicap player receives strokes 
              on the hardest holes (by Stroke Index). These strokes are applied <strong>per hole</strong> — 
              so a player who gets a stroke has their score reduced by 1 for that hole's comparison only. 
              If both players have the same handicap, it's a straight match with no strokes given.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="font-medium text-emerald-800 mb-2">History Banner</h4>
            <p className="text-sm text-emerald-700">
              Completed match play rounds show a special banner in your round history: 
              <strong> "⚔️ Match Play — Khalid 3&2"</strong>. This makes it easy to find your head-to-head results.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Save className="w-5 h-5" style={{ color: '#39638b' }} />
            Auto-Save Protection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Never Lose Your Round</h4>
            <p className="text-sm text-green-700">
              Your round is automatically saved as you play. If you close the app or lose connection, 
              your scores are safe. Come back within 24 hours to continue where you left off.
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            When you finish all holes, tap <strong>"Finish Round"</strong> to save it to your history. 
            Completed rounds count toward your statistics.
          </p>
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
            GPS Course Maps
          </CardTitle>
          <CardDescription>
            Real-time GPS tracking during your round
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The course map shows your position in real-time, distance to the green, and lets you measure to any point on the course.
          </p>
          
          {/* Map Screenshot */}
          <div className="rounded-lg overflow-hidden border shadow-md">
            <img 
              src="/map.jpeg" 
              alt="Course Map Interface" 
              className="w-full h-auto object-cover"
            />
            <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
              GPS map showing your position and distances
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4" />
              GPS Required
            </h4>
            <p className="text-sm text-green-700">
              Enable location services for accurate distance measurements. The map uses your phone's GPS to track your position.
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
            While in a round, tap the <strong>Map</strong> button to open the course map. You'll see:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />
              <span><strong>You</strong> - Your real-time position (blue dot)</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">T</div>
              <span><strong>Tee Box</strong> - Where the hole starts</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">G</div>
              <span><strong>Green</strong> - Current hole's green location</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow" />
              <span><strong>Target</strong> - Any point you tap to measure</span>
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
            The map automatically shows your distance to the current hole's green:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2" style={{ color: '#22c55e' }}>
                <Target className="w-4 h-4" />
                To Green
              </h4>
              <p className="text-sm text-muted-foreground">
                Your distance to the center of the green. Use this to pick your club.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-600">
                <Target className="w-4 h-4" />
                To Target
              </h4>
              <p className="text-sm text-muted-foreground">
                Tap anywhere to measure distance to hazards, layup spots, or doglegs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Club Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            When you set up your bag with club distances, the map suggests the right club for each shot:
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Example:</strong> You're 145 yards from the green. The map shows "7 Iron" 
              based on your bag setup. Just tap the target point and see the recommendation instantly.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Map Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {[
              { icon: '🔍', title: 'Zoom', desc: 'Use + and - buttons or pinch to zoom in/out' },
              { icon: '📍', title: 'Find Me', desc: 'Center the map on your position' },
              { icon: '🛰️', title: 'Satellite View', desc: 'Switch between satellite and map view' },
              { icon: '🔄', title: 'Rotate', desc: 'Map rotates to show tee-to-green direction' }
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
            What's in My Bag?
          </CardTitle>
          <CardDescription>
            Set up your clubs for personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            <strong>My Bag</strong> lets you store every club in your bag with the distance you hit it.
            This powers the GPS club recommendations.
          </p>
          
          {/* Bag Screenshot */}
          <div className="rounded-lg overflow-hidden border shadow-md">
            <img 
              src="/my-bag.jpeg" 
              alt="My Bag Interface" 
              className="w-full h-auto object-cover"
            />
            <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
              My Bag screen showing clubs with distances
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Adding Your Clubs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Go to <strong>Profile → My Bag</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Tap <strong>Add Club</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Select club type (Driver, 7 Iron, Sand Wedge, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>4</div>
              <span>Enter your <strong>max distance</strong> for that club</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>5</div>
              <span>Repeat for all your clubs</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Club Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <CardTitle className="text-xl">Tips for Accurate Distances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {[
              { icon: '📏', tip: 'Use a driving range with yardage markers to measure your real distances' },
              { icon: '🎯', tip: 'Enter your consistent max distance, not your best shot ever' },
              { icon: '🔄', tip: 'Update distances as your swing improves over time' },
              { icon: '🌡️', tip: 'Remember: wind and temperature affect how far the ball flies' }
            ].map((item) => (
              <div key={item.tip} className="flex items-center gap-4 p-3 border rounded-lg">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-muted-foreground">{item.tip}</p>
              </div>
            ))}
          </div>
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
            Jazel automatically calculates stats from your completed rounds. 
            See your strengths and discover where you can improve.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Key Stats Tracked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Average Score', desc: 'Your typical round score' },
              { name: 'Average Putts', desc: 'Putts per round' },
              { name: 'Fairway %', desc: 'How often you hit the fairway' },
              { name: 'GIR %', desc: 'Greens in Regulation rate' },
              { name: 'Best Score', desc: 'Your lowest round ever' },
              { name: 'Total Rounds', desc: 'Rounds completed' }
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
            See a pie chart of your scoring distribution:
          </p>
          <div className="grid gap-3">
            {[
              { label: 'Eagles (2 under)', color: 'bg-orange-500' },
              { label: 'Birdies (1 under)', color: 'bg-green-500' },
              { label: 'Pars (even)', color: 'bg-blue-500' },
              { label: 'Bogeys (1 over)', color: 'bg-amber-500' },
              { label: 'Double Bogeys+', color: 'bg-red-500' }
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
            View all your past rounds with the course name, date, total score, 
            and hole-by-hole breakdown. Tap any round to see the full details.
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
            See other golfers using Jazel. View their profiles, handicaps, and compare your game.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Viewing Golfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Go to the <strong>Golfers</strong> tab to see all registered players. Each profile shows:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Name and profile photo
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

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Adding Golfers to Your Round</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            When you start a round, you can add other golfers to track scores together:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Search for registered golfers by name
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Add guests by name (no account needed)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Track up to 4 players per round
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
          <CardDescription>
            Compete in organized golf events with live scoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Join golf tournaments organized by your club or golf association. Track standings,
            compare scores with other players, and compete for the top spot! Tournaments support
            live scoring so everyone can follow the action in real-time.
          </p>
        </CardContent>
      </Card>

      {/* Tournament Management Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Shield className="w-5 h-5" style={{ color: '#39638b' }} />
            Tournament Management Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tournaments are managed by an <strong>Admin</strong> (the tournament organizer) and
            <strong> Scorers</strong> (players assigned to record scores for their group).
            Here's how it works:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-700" />
                <h4 className="font-semibold text-emerald-800">Admin (Tournament Organizer)</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Creates the tournament, assigns players to groups, sets tee times, designates scorers,
                enables live scoring, validates group scores, and can freeze the final scorecard.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Clipboard className="w-5 h-5 text-amber-700" />
                <h4 className="font-semibold text-amber-800">Scorer (Group Score Keeper)</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                A player in each group assigned to record scores for all group members during the round.
                Uses the live scoring feature to enter hole-by-hole scores in real-time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Shield className="w-5 h-5" style={{ color: '#39638b' }} />
            Admin Guide — Creating & Managing Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            As a tournament admin, you have full control over the event:
          </p>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">1</span>
                Create Tournament
              </h4>
              <p className="text-sm text-muted-foreground">
                Go to the <strong>Admin Panel → Tournaments</strong> tab. Fill in the tournament name,
                select the course, set the date, start time, tee time interval (e.g., 10 minutes between groups),
                format (Stroke Play, Stableford, etc.), and max players. Optionally add your phone number
                as tournament contact.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">2</span>
                Manage Participants
              </h4>
              <p className="text-sm text-muted-foreground">
                Add registered players to the tournament. Search by name and add them one by one.
                Each player becomes a tournament participant.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">3</span>
                Assign Groups & Tee Times
              </h4>
              <p className="text-sm text-muted-foreground">
                Drag players into groups (A, B, C, etc.) or use auto-generate. Each group gets an
                automatically calculated tee time based on the tournament start time and the interval you set.
                Groups are renumbered automatically if needed.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">4</span>
                Designate Scorers
              </h4>
              <p className="text-sm text-muted-foreground">
                In each group, assign one player as the <strong>Scorer</strong> (marked with 📋).
                The scorer is responsible for recording scores for all group members during the round.
                This can also be done from the player side by any logged-in user in the group.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">5</span>
                Enable Live Scoring
              </h4>
              <p className="text-sm text-muted-foreground">
                Toggle <strong>Live Scoring</strong> ON in the admin panel. This activates real-time
                score updates via WebSocket. All viewers see a pulsing <span className="text-red-600 font-semibold">● LIVE</span> indicator
                and scores update automatically as scorers enter them.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">6</span>
                Validate Group Scores (Lock/Unlock)
              </h4>
              <p className="text-sm text-muted-foreground">
                After a group finishes, the admin (or scorer) can <strong>Lock</strong> the group's scores
                to mark them as validated. A <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">✓ Validated</Badge> badge appears on the group.
                Scores can be unlocked if corrections are needed. Locking all groups automatically creates an immutable snapshot.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">7</span>
                Freeze Scorecard (Final Results)
              </h4>
              <p className="text-sm text-muted-foreground">
                When the tournament is complete, <strong>Freeze</strong> the scorecard to lock all results permanently.
                A frozen scorecard creates an immutable snapshot — even if scores are modified or deleted later,
                the frozen version remains unchanged. The only way to remove a frozen scorecard is by deleting
                the entire tournament. Freezing happens automatically when all groups are locked.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">8</span>
                Recalculate Leaderboard
              </h4>
              <p className="text-sm text-muted-foreground">
                Use the <strong>Refresh</strong> button to recalculate all gross and net scores from the actual
                hole-by-hole round data. This fetches the latest handicap values for all players. Useful if
                handicaps were updated after scores were initially calculated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scorer Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Clipboard className="w-5 h-5" style={{ color: '#39638b' }} />
            Scorer Guide — Live Scoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            If you've been assigned as the scorer for your group, here's what you need to know:
          </p>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Starting Live Scoring</h4>
              <p className="text-sm text-muted-foreground">
                When the tournament is in progress and live scoring is enabled, you'll see a green banner
                at the top of the tournament details with a <strong>"Start Scoring"</strong> button.
                Tap it to begin recording scores for your group.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Recording Scores</h4>
              <p className="text-sm text-muted-foreground">
                Enter strokes for each hole for every player in your group. Move through holes sequentially.
                Scores are saved automatically as you enter them. Other players and viewers see updates
                in real-time on the leaderboard.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Resuming After Interruption</h4>
              <p className="text-sm text-muted-foreground">
                If you close the app or lose connection, tap <strong>"Continue Scoring"</strong> when you return.
                Your previously entered scores are preserved and you can pick up where you left off.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Viewing the Scorecard</h4>
              <p className="text-sm text-muted-foreground">
                The <strong>"View Scorecard"</strong> button shows the full tournament scorecard with all
                players, per-hole scores, par, handicap index, gross, and net totals. The scorecard can be
                shared via the Share button (generates a complete text summary) or printed.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-1">Important Notes</h4>
              <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  Once a group's scores are <strong>locked/validated</strong>, scores cannot be modified by the scorer
                </li>
                <li className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  The admin can unlock scores if corrections are needed
                </li>
                <li className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  Net scores are calculated as: <strong>Brut (vs par) - Player Handicap</strong>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Status Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tournament Status Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tournament cards are color-coded by status:
          </p>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Badge className="bg-blue-500">Upcoming</Badge>
              <span className="text-sm">Tournament has not started yet</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/30">
              <Badge className="bg-green-500">In Progress</Badge>
              <span className="text-sm">Tournament is currently being played</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
              <Badge className="bg-emerald-500">Completed</Badge>
              <span className="text-sm">Tournament has finished - see final results</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-red-50 dark:bg-red-950/30 opacity-75">
              <Badge className="bg-red-500">Cancelled</Badge>
              <span className="text-sm">Tournament was cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tournament Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#39638b' }} />
                Date & Time
              </h4>
              <p className="text-sm text-muted-foreground">
                When the tournament takes place. Arrive early for your tee time!
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: '#39638b' }} />
                Course
              </h4>
              <p className="text-sm text-muted-foreground">
                Which golf course hosts the event. Tap to see course details.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: '#39638b' }} />
                Format
              </h4>
              <p className="text-sm text-muted-foreground">
                Stroke Play, Match Play, Stableford, Scramble, etc.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Badge variant="outline" className="w-4 h-4 p-0 flex items-center justify-center text-xs">N</Badge>
                Players
              </h4>
              <p className="text-sm text-muted-foreground">
                Current registration vs maximum capacity.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tournament Groups & Tee Times</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Players are organized into groups (A, B, C, etc.) with assigned tee times:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Each group has a different tee time based on the start time and interval
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Groups are displayed in different colors for easy viewing
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              See who you're playing with before the round
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Each group's <strong>Scorer</strong> (📋) and <strong>validation status</strong> (🔒) are shown
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-red-600 font-semibold">● LIVE SCORING</span> indicator appears when live scoring is active
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Leaderboards & Scoring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Leaderboard & Scorecard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tournament leaderboards show all player rankings with detailed scoring:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Player rank, name, and handicap
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              Group assignment
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <strong>Gross (Brut)</strong> — Total strokes relative to par (e.g., +5 means 5 over par)
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <strong>Net</strong> — Gross minus handicap (e.g., +1.5 means 1.5 over par after handicap)
            </li>
          </ul>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
            <p className="text-sm text-blue-700">
              <strong>Sorting:</strong> Tap column headers to sort by handicap, gross score, or net score.
            </p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg mt-2">
            <p className="text-sm text-emerald-700">
              <strong>Scorecard:</strong> Tap the "View Scorecard" button to see the full scorecard grid
              with per-hole scores for all players, par row, handicap index row, and totals.
              Use the Share button to copy a complete scorecard summary, or Print for a paper copy.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scorecard Freeze */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Snowflake className="w-5 h-5" style={{ color: '#39638b' }} />
            Scorecard Freeze System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The freeze system ensures tournament results are permanently preserved:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <strong>Auto-freeze:</strong> When the admin locks all groups, the scorecard is automatically frozen
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <strong>Auto-unfreeze:</strong> Unlocking any group unfreezes the scorecard
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <strong>Manual freeze:</strong> Admin can freeze/unfreeze at any time via the scorecard modal
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <strong>Immutable:</strong> Frozen scorecards cannot be modified, even if scores are changed or deleted
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <strong>Permanent:</strong> Only deleting the entire tournament removes a frozen scorecard
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Tournament Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tournament Badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Participating in tournaments can earn you special achievement badges:
          </p>
          <div className="grid gap-2">
            <div className="flex items-center gap-3 p-2 border rounded-lg">
              <span className="text-xl">🏟️</span>
              <span className="text-sm">Tournament Rookie - Enter your first tournament</span>
            </div>
            <div className="flex items-center gap-3 p-2 border rounded-lg">
              <span className="text-xl">🥉</span>
              <span className="text-sm">Podium Finish - Finish in top 3</span>
            </div>
            <div className="flex items-center gap-3 p-2 border rounded-lg">
              <span className="text-xl">🏆</span>
              <span className="text-sm">Champion - Win a tournament!</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Achievements Section
function AchievementsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-3">
            <Star className="w-5 h-5" style={{ color: '#39638b' }} />
            Achievements & Badges
          </CardTitle>
          <CardDescription>
            Earn badges and level up as you play
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel Golf rewards your progress with achievements and badges. Complete challenges to earn points,
            unlock new badges, and climb the levels from Beginner to Immortal!
          </p>

          {/* Badges Screenshot */}
          <div className="rounded-lg overflow-hidden border shadow-md">
            <img
              src="/badges.jpeg"
              alt="Achievements and badges collection"
              className="w-full h-auto object-cover"
            />
            <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
              Your badge collection showing earned and locked achievements
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROUNDS BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🏌️</span> Rounds Badges
          </CardTitle>
          <CardDescription>Complete rounds to earn these badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🏌️', name: 'First Swing', desc: 'Complete your first round', pts: '10 pts' },
              { icon: '📅', name: 'Getting Started', desc: 'Complete 5 rounds', pts: '20 pts' },
              { icon: '🥈', name: 'Regular Golfer', desc: 'Complete 10 rounds', pts: '30 pts' },
              { icon: '🥇', name: 'Dedicated Player', desc: 'Complete 25 rounds', pts: '50 pts' },
              { icon: '🏆', name: 'Golf Addict', desc: 'Complete 50 rounds', pts: '100 pts' },
              { icon: '👑', name: 'Golf Legend', desc: 'Complete 100 rounds', pts: '200 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SCORING BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🎯</span> Scoring Badges
          </CardTitle>
          <CardDescription>Achieve great scores to unlock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">18-Hole Scoring</p>
            <div className="grid gap-2">
              {[
                { icon: '💯', name: 'Century Breaker', desc: 'Score under 100', pts: '15 pts' },
                { icon: '🎯', name: 'Breaking 90', desc: 'Score under 90', pts: '30 pts' },
                { icon: '💎', name: 'Elite Golfer', desc: 'Score under 80', pts: '60 pts' },
                { icon: '⭐', name: 'Par Master', desc: 'Shoot par or better', pts: '100 pts' },
              ].map((badge) => (
                <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                  <span className="text-xl">{badge.icon}</span>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{badge.name}</span>
                    <p className="text-xs text-muted-foreground">{badge.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase pt-2">9-Hole Scoring</p>
            <div className="grid gap-2">
              {[
                { icon: '🔥', name: 'Half Century', desc: 'Score under 50', pts: '15 pts' },
                { icon: '🎯', name: 'Sharp Shooter', desc: 'Score under 45', pts: '30 pts' },
                { icon: '💎', name: 'Nine Hole Master', desc: 'Score under 40', pts: '60 pts' },
              ].map((badge) => (
                <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                  <span className="text-xl">{badge.icon}</span>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{badge.name}</span>
                    <p className="text-xs text-muted-foreground">{badge.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BIRDIE BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🐦</span> Birdie Badges
          </CardTitle>
          <CardDescription>Score birdies (1 under par) to earn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🐦', name: 'First Birdie', desc: 'Score your first birdie', pts: '15 pts' },
              { icon: '🦅', name: 'Birdie Hunter', desc: 'Score 5 birdies total', pts: '25 pts' },
              { icon: '🦃', name: 'Birdie Bonanza', desc: 'Score 10 birdies total', pts: '30 pts' },
              { icon: '🦚', name: 'Birdie Master', desc: 'Score 25 birdies total', pts: '50 pts' },
              { icon: '👑', name: 'Birdie King', desc: 'Score 50 birdies total', pts: '80 pts' },
              { icon: '🔥', name: 'Birdie Streak', desc: '2 birdies in a row', pts: '25 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PAR BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">⛳</span> Par Badges
          </CardTitle>
          <CardDescription>Score pars and show consistency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '⛳', name: 'First Par', desc: 'Score your first par', pts: '10 pts' },
              { icon: '📋', name: 'Par Collector', desc: 'Score 10 pars total', pts: '15 pts' },
              { icon: '⚙️', name: 'Par Machine', desc: 'Score 25 pars total', pts: '25 pts' },
              { icon: '⚖️', name: 'Steady Eddy', desc: 'Complete a round at exactly par', pts: '40 pts' },
              { icon: '🔗', name: 'Par Streak', desc: '3 pars in a row', pts: '25 pts' },
              { icon: '✨', name: 'Par Perfect', desc: '5 pars in a row', pts: '50 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* COURSES BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🗺️</span> Courses Badges
          </CardTitle>
          <CardDescription>Explore different golf courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🗺️', name: 'Explorer', desc: 'Play at 3 different courses', pts: '20 pts' },
              { icon: '✈️', name: 'Traveler', desc: 'Play at 5 different courses', pts: '40 pts' },
              { icon: '🇲🇦', name: 'Moroccan Tour', desc: 'Play at 10 different courses', pts: '80 pts' },
              { icon: '🏠', name: 'Home Course Hero', desc: 'Play 5 rounds at same course', pts: '25 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TOURNAMENT BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🏆</span> Tournament Badges
          </CardTitle>
          <CardDescription>Compete and win in tournaments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🏟️', name: 'Tournament Rookie', desc: 'Enter your first tournament', pts: '15 pts' },
              { icon: '🎖️', name: 'Tournament Regular', desc: 'Enter 3 tournaments', pts: '30 pts' },
              { icon: '🏅', name: 'Competition Lover', desc: 'Enter 5 tournaments', pts: '50 pts' },
              { icon: '🥉', name: 'Podium Finish', desc: 'Finish in top 3', pts: '60 pts' },
              { icon: '🏆', name: 'Champion', desc: 'Win a tournament', pts: '100 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HANDICAP BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📈</span> Handicap Badges
          </CardTitle>
          <CardDescription>Improve your game</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '📈', name: 'On the Rise', desc: 'Lower handicap by 3 strokes', pts: '30 pts' },
              { icon: '🎯', name: 'Major Improvement', desc: 'Lower handicap by 5 strokes', pts: '50 pts' },
              { icon: '🌟', name: 'Single Digit', desc: 'Reach single-digit handicap', pts: '80 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PROFILE BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">👤</span> Profile Badges
          </CardTitle>
          <CardDescription>Set up your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '📝', name: 'Profile Complete', desc: 'Add name, city, and country', pts: '10 pts' },
              { icon: '📷', name: 'Photo Added', desc: 'Upload a profile photo', pts: '15 pts' },
              { icon: '🎯', name: 'Handicap Set', desc: 'Set your handicap', pts: '15 pts' },
              { icon: '🏌️', name: 'First Club', desc: 'Add first club to My Bag', pts: '10 pts' },
              { icon: '🎒', name: 'Bag Ready', desc: 'Add 5+ clubs to My Bag', pts: '10 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ON-COURSE BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">⛳</span> On-Course Badges
          </CardTitle>
          <CardDescription>Track your accuracy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🏌️', name: 'Fairway Finder', desc: 'Hit 10 fairways total', pts: '15 pts' },
              { icon: '🏌️', name: 'Green Machine', desc: 'Hit 10 greens in regulation', pts: '15 pts' },
              { icon: '🛡️', name: 'Bogey Free 9', desc: '9 holes without a bogey', pts: '25 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAIRWAY BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🎯</span> Fairway Badges
          </CardTitle>
          <CardDescription>Fairways hit per round</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🎯', name: 'Fairway Sharp', desc: 'Hit 5 fairways in a single round', pts: '10 pts' },
              { icon: '🏆', name: 'Fairway Master', desc: 'Hit 10 fairways in a single round', pts: '25 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* GIR BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🟢</span> GIR Badges
          </CardTitle>
          <CardDescription>Greens in Regulation per round</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🟢', name: 'GIR Ace', desc: 'Hit 5 GIR in a single round', pts: '10 pts' },
              { icon: '💎', name: 'GIR Pro', desc: 'Hit 10 GIR in a single round', pts: '25 pts' },
              { icon: '🌟', name: 'GIR Perfect', desc: 'Hit all 18 GIR in a single round', pts: '50 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CONSISTENCY BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📅</span> Consistency Badges
          </CardTitle>
          <CardDescription>Play regularly to earn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '📅', name: 'Week Warrior', desc: 'Play 3 rounds in one week', pts: '20 pts' },
              { icon: '📆', name: 'Monthly Regular', desc: 'Play 5 rounds in one month', pts: '25 pts' },
              { icon: '🔥', name: 'Streak Starter', desc: 'Play 3 weeks in a row', pts: '25 pts' },
              { icon: '🌅', name: 'Weekend Golfer', desc: 'Play 5 rounds on weekends', pts: '25 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* APP BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📱</span> App Feature Badges
          </CardTitle>
          <CardDescription>Explore app features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🗺️', name: 'GPS User', desc: 'Use the course map', pts: '15 pts' },
              { icon: '📊', name: 'Stat Tracker', desc: 'View your statistics', pts: '10 pts' },
              { icon: '📖', name: 'Guide Reader', desc: 'Visit the User Guide', pts: '10 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SOCIAL BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">👥</span> Social Badges
          </CardTitle>
          <CardDescription>Connect with other golfers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '👥', name: 'Team Player', desc: 'Join a golfer group', pts: '10 pts' },
              { icon: '👨‍✈️', name: 'Group Captain', desc: 'Create a golfer group', pts: '30 pts' },
              { icon: '🤝', name: 'Friendly Golfer', desc: 'Play with 3 partners', pts: '15 pts' },
              { icon: '👥', name: 'Group Player', desc: '3 rounds with group members', pts: '20 pts' },
              { icon: '🎉', name: 'Welcoming', desc: 'Play with a first-time user', pts: '20 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SPECIAL BADGES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">✨</span> Special Badges
          </CardTitle>
          <CardDescription>Unique achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { icon: '🌅', name: 'Early Bird', desc: 'Complete a round before 11 AM', pts: '20 pts' },
              { icon: '🌇', name: 'Sunset Golfer', desc: 'Complete a round after 6 PM', pts: '20 pts' },
            ].map((badge) => (
              <div key={badge.name} className="flex items-center gap-3 p-2 border rounded-lg">
                <span className="text-xl">{badge.icon}</span>
                <div className="flex-1">
                  <span className="font-medium text-sm">{badge.name}</span>
                  <p className="text-xs text-muted-foreground">{badge.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{badge.pts}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LEVEL SYSTEM */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Level System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            As you earn badges, you accumulate points and advance through levels:
          </p>
          <div className="grid gap-2">
            {[
              { level: 'Beginner', points: '0 pts', color: 'bg-gray-100 text-gray-700' },
              { level: 'Amateur', points: '100 pts', color: 'bg-green-100 text-green-700' },
              { level: 'Intermediate', points: '250 pts', color: 'bg-blue-100 text-blue-700' },
              { level: 'Advanced', points: '450 pts', color: 'bg-amber-100 text-amber-700' },
              { level: 'Expert', points: '700 pts', color: 'bg-purple-100 text-purple-700' },
              { level: 'Master', points: '1000 pts', color: 'bg-pink-100 text-pink-700' },
              { level: 'Legend', points: '1500 pts', color: 'bg-amber-50 text-amber-800 border border-amber-300' },
              { level: 'Immortal', points: '2000 pts', color: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' }
            ].map((item) => (
              <div key={item.level} className="flex items-center justify-between p-2 border rounded-lg">
                <span className="font-medium">{item.level}</span>
                <Badge variant="outline" className={item.color}>{item.points}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <RefreshCw className="w-5 h-5" style={{ color: '#39638b' }} />
            Checking Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Achievements are automatically checked when you complete a round. You can also tap the refresh
            button in the badges section to re-check for any newly earned achievements.
          </p>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Tip:</strong> Badges are permanent once earned! Even if your stats change later,
              you keep all your hard-earned achievements.
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
            Live Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel shows real-time weather for your location. Plan your round based on current conditions.
          </p>
          
          {/* Weather Screenshot */}
          <div className="rounded-lg overflow-hidden border shadow-md">
            <img 
              src="/weather.jpeg" 
              alt="Weather Display" 
              className="w-full h-auto object-cover"
            />
            <div className="p-3 bg-muted/50 text-center text-sm text-muted-foreground">
              Live weather conditions on the home screen
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
              { icon: <span className="text-2xl">🌡️</span>, name: 'Temperature', desc: 'Current and feels-like temperature' },
              { icon: <span className="text-2xl">💨</span>, name: 'Wind', desc: 'Speed and direction' },
              { icon: <span className="text-2xl">💧</span>, name: 'Humidity', desc: 'Moisture in the air' },
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
            <RefreshCw className="w-5 h-5" style={{ color: '#39638b' }} />
            Auto Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Weather updates automatically every 10 minutes. Tap the refresh button anytime to get the latest conditions.
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Tip:</strong> Check weather conditions before your round to plan your strategy.
            </p>
          </div>
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
            For administrators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The Admin Panel (at /admin) provides tools for managing Jazel Golf.
          </p>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> Admin access is restricted. You must be logged in as an admin to access these features.
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
              Edit course details (name, location, contact)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Set hole info (par, handicap, GPS coordinates)
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
              Block/unblock or hide users
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Delete accounts
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
              Create and manage tournaments
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Add/remove participants
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Enter brut and net scores
            </li>
            <li className="flex items-center gap-2">
              <Download className="w-4 h-4" style={{ color: '#39638b' }} />
              Export to Excel
            </li>
          </ul>
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
              Messages appear in the app for all users
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
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
            Install as an App
          </CardTitle>
          <CardDescription>
            Get the full app experience on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Jazel is a Progressive Web App (PWA). Install it directly from your browser - 
            no app store needed! Works offline and feels like a native app.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                <Check className="w-4 h-4" />
                Works Offline
              </h4>
              <p className="text-sm text-green-700">
                View courses and enter scores even without internet. Data syncs when you're back online.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                <Check className="w-4 h-4" />
                No App Store
              </h4>
              <p className="text-sm text-green-700">
                Install directly from your browser in seconds.
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
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Open Jazel in Chrome</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Wait for the "Install" banner, or tap menu (⋮) → "Install app"</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Tap "Install"</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Installing on iPhone/iPad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Open Jazel in Safari</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Tap the Share button (square with arrow ↑)</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Scroll down and tap "Add to Home Screen"</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>4</div>
              <span>Tap "Add" in the top right</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Installing on Desktop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>1</div>
              <span>Visit Jazel in Chrome or Edge</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>2</div>
              <span>Look for the install icon in the address bar</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#16a34a' }}>3</div>
              <span>Click "Install"</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {[
              { icon: <span className="text-xl">📱</span>, title: 'Home Screen Icon', desc: 'Launch like any other app' },
              { icon: <span className="text-xl">📴</span>, title: 'Offline Access', desc: 'Works without internet' },
              { icon: <span className="text-xl">⚡</span>, title: 'Instant Loading', desc: 'Opens immediately' },
              { icon: <span className="text-xl">🔒</span>, title: 'Full Screen', desc: 'No browser UI clutter' }
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
