'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Loader2,
  X
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

const categoryIcons: Record<string, React.ReactNode> = {
  rounds: <Target className="w-3.5 h-3.5" />,
  scoring: <Medal className="w-3.5 h-3.5" />,
  courses: <MapPin className="w-3.5 h-3.5" />,
  tournaments: <Trophy className="w-3.5 h-3.5" />,
  handicap: <Star className="w-3.5 h-3.5" />,
  social: <Users className="w-3.5 h-3.5" />,
  special: <Sparkles className="w-3.5 h-3.5" />,
};

const categoryLabels: Record<string, string> = {
  rounds: 'Rounds',
  scoring: 'Scoring',
  courses: 'Courses',
  tournaments: 'Tournaments',
  handicap: 'Handicap',
  social: 'Social',
  special: 'Special',
};

// Category colors
const categoryColors: Record<string, string> = {
  rounds: 'bg-emerald-500',
  scoring: 'bg-amber-500',
  courses: 'bg-sky-500',
  tournaments: 'bg-purple-500',
  handicap: 'bg-rose-500',
  social: 'bg-teal-500',
  special: 'bg-gradient-to-r from-pink-500 to-violet-500',
};

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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load achievements
      </div>
    );
  }

  // Group achievements by category
  const categories = ['rounds', 'scoring', 'courses', 'tournaments', 'handicap', 'social', 'special'];

  // Filter by selected category
  const filteredAchievements = selectedCategory === 'all' 
    ? data.achievements 
    : data.achievements.filter(a => a.category === selectedCategory);

  // Calculate level progress
  const levelThresholds = [
    { level: 'Beginner', points: 0 },
    { level: 'Amateur', points: 20 },
    { level: 'Intermediate', points: 50 },
    { level: 'Advanced', points: 100 },
    { level: 'Expert', points: 200 },
    { level: 'Master', points: 500 },
  ];
  
  const currentLevelIndex = levelThresholds.findIndex(l => l.level === data.level);
  const nextThreshold = levelThresholds[currentLevelIndex + 1]?.points || 500;
  const prevThreshold = levelThresholds[currentLevelIndex]?.points || 0;
  const levelProgress = ((data.totalPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Level Progress - Fixed */}
      <div className="flex-shrink-0 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <h2 className="font-bold text-base sm:text-lg truncate">My Badges</h2>
          </div>
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex-shrink-0">
            {data.earnedCount}/{data.totalCount}
          </Badge>
        </div>
        
        {/* Level Progress */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="truncate">{data.level}</span>
            </span>
            <span className="text-muted-foreground text-xs">
              {data.totalPoints} pts
            </span>
          </div>
          <Progress value={Math.min(100, levelProgress)} className="h-2 bg-amber-100 dark:bg-amber-900/30" />
          {data.pointsToNext > 0 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
              {data.pointsToNext} pts to <span className="font-medium">{data.nextLevel}</span>
            </p>
          )}
        </div>
      </div>

      {/* Category Tabs - Scrollable */}
      <div className="flex-shrink-0 border-b bg-muted/30 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-background hover:bg-muted text-muted-foreground border'
            }`}
          >
            All ({data.achievements.length})
          </button>
          {categories.map(cat => {
            const count = data.achievements.filter(a => a.category === cat).length;
            const earned = data.achievements.filter(a => a.category === cat && a.earned).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground border'
                }`}
              >
                <span className={isActive ? 'text-white' : categoryColors[cat].replace('bg-', 'text-')}>
                  {categoryIcons[cat]}
                </span>
                <span className="hidden sm:inline">{categoryLabels[cat]}</span>
                <span className="text-[10px] opacity-80">({earned}/{count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {filteredAchievements.map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
        
        {filteredAchievements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No achievements in this category
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Achievement Badge Component
function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const isEarned = achievement.earned;
  const progressPercent = Math.min(100, achievement.progress);
  
  // Category colors for badge borders
  const categoryBorderColors: Record<string, string> = {
    rounds: 'border-l-emerald-500',
    scoring: 'border-l-amber-500',
    courses: 'border-l-sky-500',
    tournaments: 'border-l-purple-500',
    handicap: 'border-l-rose-500',
    social: 'border-l-teal-500',
    special: 'border-l-pink-500',
  };
  
  return (
    <div
      className={`
        relative rounded-lg p-2.5 sm:p-3 transition-all duration-300 cursor-pointer border-l-4
        ${isEarned 
          ? `bg-gradient-to-br from-white to-amber-50 dark:from-card dark:to-amber-950/20 shadow-sm hover:shadow-md ${categoryBorderColors[achievement.category]}` 
          : `bg-muted/30 hover:bg-muted/50 border-l-gray-300 dark:border-l-gray-600`
        }
      `}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl
          ${isEarned 
            ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-sm' 
            : 'bg-muted grayscale opacity-50'
          }
        `}>
          {isEarned ? achievement.icon : <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className={`font-semibold text-xs sm:text-sm truncate ${!isEarned && 'text-muted-foreground'}`}>
              {achievement.name}
            </h4>
            {isEarned && (
              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500 text-white border-0">
                +{achievement.points}
              </Badge>
            )}
          </div>
          
          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {achievement.description}
          </p>
          
          {/* Progress for locked achievements */}
          {!isEarned && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">
                <span>{achievement.progressText}</span>
                {progressPercent > 0 && <span>{Math.round(progressPercent)}%</span>}
              </div>
              {progressPercent > 0 && (
                <Progress value={progressPercent} className="h-1" />
              )}
            </div>
          )}
          
          {/* Earned date */}
          {isEarned && achievement.earnedAt && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${showDetails ? 'rotate-90' : ''}`} />
      </div>
      
      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-border/50 text-[10px] sm:text-xs text-muted-foreground">
          <p>{achievement.description}</p>
          {!isEarned && (
            <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
              {achievement.progressText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for profile sidebar
export function BadgeSummary({ userId }: BadgeCollectionProps) {
  const [data, setData] = useState<AchievementProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/achievements?userId=${userId}&_t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          setData(await response.json());
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading || !data) return null;

  const recentAchievements = data.achievements
    .filter(a => a.earned)
    .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-sm">Badges</span>
        </div>
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
          {data.earnedCount}/{data.totalCount}
        </Badge>
      </div>
      
      {/* Badge icons */}
      <div className="flex flex-wrap gap-1.5">
        {recentAchievements.map(a => (
          <div
            key={a.id}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-lg"
            title={a.name}
          >
            {a.icon}
          </div>
        ))}
        {data.earnedCount > 5 && (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
            +{data.earnedCount - 5}
          </div>
        )}
      </div>
      
      {/* Points */}
      <div className="text-xs text-muted-foreground">
        <Star className="w-3 h-3 inline mr-1 fill-amber-400 text-amber-500" />
        {data.totalPoints} points • {data.level}
      </div>
    </div>
  );
}
