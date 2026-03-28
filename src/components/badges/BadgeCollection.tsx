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
  { level: 'Amateur', minPoints: 50 },
  { level: 'Intermediate', minPoints: 150 },
  { level: 'Advanced', minPoints: 300 },
  { level: 'Expert', minPoints: 500 },
  { level: 'Master', minPoints: 800 },
  { level: 'Legend', minPoints: 1200 },
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
    <div className="flex flex-col h-[70vh] max-h-[500px] w-full overflow-hidden">
      {/* HEADER - Fixed height, contained */}
      <div className="flex-shrink-0 p-3 border-b">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-sm">My Badges</span>
          </div>
          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
            {data.earnedCount}/{data.totalCount}
          </Badge>
        </div>
        
        {/* Level row */}
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-1 min-w-0">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-400 flex-shrink-0" />
            <span className="font-medium truncate">{currentLevelData?.level}</span>
          </div>
          <span className="text-muted-foreground flex-shrink-0 text-[10px]">{data.totalPoints} pts</span>
        </div>
        
        {/* Progress bar */}
        <Progress value={Math.min(100, levelProgress)} className="h-1.5 w-full" />
        
        {/* Next level info */}
        {nextLevelData && (
          <p className="text-[10px] text-muted-foreground mt-1 truncate">
            {data.pointsToNext} pts to {nextLevelData.level}
          </p>
        )}
      </div>

      {/* TABS - Fixed height, scrollable horizontally, CONTAINED */}
      <div className="flex-shrink-0 border-b overflow-hidden">
        <div className="flex gap-1 p-2 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            All ({data.achievements.length})
          </button>
          {categoryData.map(cat => {
            const count = data.achievements.filter(a => a.category === cat.id).length;
            const earned = data.achievements.filter(a => a.category === cat.id && a.earned).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
                <span className="opacity-70">{earned}/{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BADGES LIST - Scrollable vertically, CONTAINED */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <div className="flex flex-col gap-1.5">
          {filteredAchievements.map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
        
        {filteredAchievements.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs">
            No achievements in this category
          </div>
        )}
      </div>
    </div>
  );
}

// Achievement Badge - Compact
function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [open, setOpen] = useState(false);
  const isEarned = achievement.earned;
  
  return (
    <div
      className={`p-2 rounded border cursor-pointer ${
        isEarned ? 'bg-card border-primary/20' : 'bg-muted/30 border-border'
      }`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded flex items-center justify-center text-base flex-shrink-0 ${
          isEarned ? 'bg-primary/10' : 'bg-muted grayscale opacity-50'
        }`}>
          {isEarned ? achievement.icon : <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium truncate ${!isEarned && 'text-muted-foreground'}`}>
              {achievement.name}
            </span>
            <Badge variant={isEarned ? "default" : "secondary"} className="text-[8px] px-1 h-3 flex-shrink-0">
              {achievement.points}pts
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{achievement.description}</p>
        </div>
        
        <ChevronRight className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </div>
      
      {open && (
        <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground">
          <p className="mb-1">{achievement.description}</p>
          <p className="text-primary font-medium">
            {isEarned ? `Earned ${achievement.points} pts!` : `Earn ${achievement.points} pts - ${achievement.progressText}`}
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
