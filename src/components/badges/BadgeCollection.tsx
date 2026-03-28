'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  MapPin, 
  Medal, 
  Users, 
  Star, 
  Lock,
  Sparkles,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned: boolean;
  earnedAt: string | null;
  progress: number;
  progressText: string;
}

interface AchievementProgress {
  achievements: Achievement[];
  totalPoints: number;
  earnedCount: number;
  totalCount: number;
  level: string;
  nextLevel: string;
  pointsToNext: number;
}

const categoryData = [
  { id: 'rounds', label: 'Rounds', icon: Target },
  { id: 'scoring', label: 'Score', icon: Medal },
  { id: 'courses', label: 'Courses', icon: MapPin },
  { id: 'tournaments', label: 'Tourn', icon: Trophy },
  { id: 'handicap', label: 'Hcp', icon: Star },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'special', label: 'Special', icon: Sparkles },
];

const LEVELS = [
  { level: 'Beginner', minPoints: 0 },
  { level: 'Amateur', minPoints: 100 },
  { level: 'Intermediate', minPoints: 250 },
  { level: 'Advanced', minPoints: 450 },
  { level: 'Expert', minPoints: 700 },
  { level: 'Master', minPoints: 1000 },
  { level: 'Legend', minPoints: 1500 },
  { level: 'Immortal', minPoints: 2000 },
];

interface BadgeCollectionProps {
  userId: string;
}

export function BadgeCollection({ userId }: BadgeCollectionProps) {
  const [data, setData] = useState<AchievementProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/achievements?userId=${userId}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Unable to load achievements
      </div>
    );
  }

  const filteredAchievements = selectedCategory === 'all' 
    ? data.achievements 
    : data.achievements.filter(a => a.category === selectedCategory);

  // Calculate level
  const currentLevelIndex = LEVELS.findIndex((l, i) => {
    const next = LEVELS[i + 1];
    return next ? data.totalPoints >= l.minPoints && data.totalPoints < next.minPoints : true;
  });
  const nextLevelData = LEVELS[currentLevelIndex + 1];
  const currentLevelData = LEVELS[currentLevelIndex];
  const pointsNeededForNext = nextLevelData ? nextLevelData.minPoints - currentLevelData.minPoints : 0;
  const pointsInLevel = data.totalPoints - (currentLevelData?.minPoints || 0);
  const levelProgress = pointsNeededForNext > 0 ? (pointsInLevel / pointsNeededForNext) * 100 : 100;

  return (
    <div className="flex flex-col h-[85vh] max-h-[700px] w-full overflow-hidden">
      {/* HEADER - Fixed height, contained */}
      <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        {/* Title row with badge count */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <span className="font-bold text-base">My Badges</span>
          </div>
          <Badge className="text-xs flex-shrink-0 bg-blue-500 hover:bg-blue-600">
            {data.earnedCount}/{data.totalCount}
          </Badge>
        </div>
        
        {/* Level row */}
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-400 flex-shrink-0" />
            <span className="font-semibold truncate">{currentLevelData?.level}</span>
          </div>
          <span className="text-muted-foreground flex-shrink-0 font-medium">{data.totalPoints} pts</span>
        </div>
        
        {/* Progress bar */}
        <Progress value={Math.min(100, levelProgress)} className="h-2 w-full" />
        
        {/* Next level info */}
        {nextLevelData && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Need <span className="font-semibold text-blue-600">{data.pointsToNext} pts</span> for {nextLevelData.level}
          </p>
        )}
      </div>

      {/* TABS - Fixed height, scrollable horizontally, CONTAINED */}
      <div className="flex-shrink-0 border-b overflow-hidden bg-muted/50">
        <div className="flex gap-1.5 p-2 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-white shadow'
                : 'bg-white dark:bg-card text-muted-foreground border'
            }`}
          >
            All ({data.achievements.length})
          </button>
          {categoryData.map((cat, idx) => {
            const count = data.achievements.filter(a => a.category === cat.id).length;
            const earned = data.achievements.filter(a => a.category === cat.id && a.earned).length;
            const Icon = cat.icon;
            const colors = [
              'bg-emerald-500 text-white',
              'bg-amber-500 text-white',
              'bg-sky-500 text-white',
              'bg-purple-500 text-white',
              'bg-rose-500 text-white',
              'bg-teal-500 text-white',
              'bg-pink-500 text-white',
            ];
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? colors[idx] + ' shadow'
                    : 'bg-white dark:bg-card text-muted-foreground border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                <span className="opacity-80">{earned}/{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BADGES LIST - Scrollable vertically, CONTAINED */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <div className="flex flex-col gap-2">
          {filteredAchievements.map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
        
        {filteredAchievements.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No achievements in this category
          </div>
        )}
      </div>
    </div>
  );
}

// Category colors for badges
const categoryColors: Record<string, string> = {
  rounds: 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
  scoring: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
  courses: 'border-l-sky-500 bg-sky-50/50 dark:bg-sky-950/20',
  tournaments: 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
  handicap: 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20',
  social: 'border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/20',
  special: 'border-l-pink-500 bg-pink-50/50 dark:bg-pink-950/20',
};

// Achievement Badge - Compact
function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [open, setOpen] = useState(false);
  const isEarned = achievement.earned;
  const colorClass = categoryColors[achievement.category] || '';
  
  return (
    <div
      className={`p-3 rounded border border-l-4 cursor-pointer transition-all ${
        isEarned 
          ? colorClass + ' shadow-sm' 
          : 'bg-muted/30 border-border border-l-gray-300'
      }`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
          isEarned ? 'bg-white/50 dark:bg-black/20' : 'bg-muted grayscale opacity-50'
        }`}>
          {isEarned ? achievement.icon : <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold truncate ${!isEarned && 'text-muted-foreground'}`}>
              {achievement.name}
            </span>
            <Badge 
              variant={isEarned ? "default" : "secondary"} 
              className={`text-xs px-2 h-5 flex-shrink-0 ${isEarned ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {achievement.points} pts
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{achievement.description}</p>
        </div>
        
        <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </div>
      
      {open && (
        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
          <p className="mb-2">{achievement.description}</p>
          <p className="text-primary font-semibold">
            {isEarned ? `✓ Earned ${achievement.points} points!` : `→ Earn ${achievement.points} pts: ${achievement.progressText}`}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact summary
export function BadgeSummary({ userId }: BadgeCollectionProps) {
  const [data, setData] = useState<AchievementProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/achievements?userId=${userId}&_t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || !data) return null;

  const recent = data.achievements.filter(a => a.earned).slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium">Badges</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">{data.earnedCount}/{data.totalCount}</Badge>
      </div>
      <div className="flex gap-1">
        {recent.map(a => (
          <div key={a.id} className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-sm">
            {a.icon}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground">{data.totalPoints} pts • {data.level}</div>
    </div>
  );
}
