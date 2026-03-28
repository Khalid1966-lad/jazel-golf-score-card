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

const categoryIcons: Record<string, React.ReactNode> = {
  rounds: <Target className="w-4 h-4" />,
  scoring: <Medal className="w-4 h-4" />,
  courses: <MapPin className="w-4 h-4" />,
  tournaments: <Trophy className="w-4 h-4" />,
  handicap: <Star className="w-4 h-4" />,
  social: <Users className="w-4 h-4" />,
  special: <Sparkles className="w-4 h-4" />,
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
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
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
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
      {/* Header with Level Progress */}
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            Badge Collection
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {data.earnedCount}/{data.totalCount}
            </Badge>
          </div>
        </div>
        
        {/* Level Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              {data.level}
            </span>
            <span className="text-muted-foreground">
              {data.totalPoints} pts
            </span>
          </div>
          <div className="relative">
            <Progress value={Math.min(100, levelProgress)} className="h-2" />
            {data.pointsToNext > 0 && (
              <span className="absolute right-0 -top-6 text-xs text-muted-foreground">
                {data.pointsToNext} pts to {data.nextLevel}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Category Tabs */}
        <div className="border-b overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              All ({data.achievements.length})
            </button>
            {categories.map(cat => {
              const count = data.achievements.filter(a => a.category === cat).length;
              const earned = data.achievements.filter(a => a.category === cat && a.earned).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {categoryIcons[cat]}
                  {categoryLabels[cat]}
                  <span className="text-xs opacity-70">({earned}/{count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAchievements.map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
          
          {filteredAchievements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No achievements in this category
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Individual Achievement Badge Component
function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const isEarned = achievement.earned;
  const progressPercent = Math.min(100, achievement.progress);
  
  return (
    <div
      className={`
        relative rounded-xl p-3 transition-all duration-300 cursor-pointer
        ${isEarned 
          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:shadow-md hover:border-primary/40' 
          : 'bg-muted/50 border border-border/50 hover:bg-muted/80'
        }
      `}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          ${isEarned 
            ? 'bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm' 
            : 'bg-muted grayscale opacity-50'
          }
        `}>
          {isEarned ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold text-sm truncate ${!isEarned && 'text-muted-foreground'}`}>
              {achievement.name}
            </h4>
            {isEarned && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 border-primary/20">
                +{achievement.points}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {achievement.description}
          </p>
          
          {/* Progress bar for locked achievements */}
          {!isEarned && progressPercent > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>{achievement.progressText}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1" />
            </div>
          )}
          
          {/* Earned date */}
          {isEarned && achievement.earnedAt && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showDetails ? 'rotate-90' : ''}`} />
      </div>
      
      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <p>{achievement.description}</p>
          {!isEarned && (
            <p className="mt-1 font-medium text-primary">
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Badges</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {data.earnedCount}/{data.totalCount}
        </Badge>
      </div>
      
      {/* Badge icons */}
      <div className="flex flex-wrap gap-1.5">
        {recentAchievements.map(a => (
          <div
            key={a.id}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg"
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
        <Star className="w-3 h-3 inline mr-1 text-yellow-500" />
        {data.totalPoints} points • {data.level}
      </div>
    </div>
  );
}
