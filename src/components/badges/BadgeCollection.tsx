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
  Loader2,
  Info
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
  rounds: <Target className="w-3 h-3" />,
  scoring: <Medal className="w-3 h-3" />,
  courses: <MapPin className="w-3 h-3" />,
  tournaments: <Trophy className="w-3 h-3" />,
  handicap: <Star className="w-3 h-3" />,
  social: <Users className="w-3 h-3" />,
  special: <Sparkles className="w-3 h-3" />,
};

const categoryLabels: Record<string, string> = {
  rounds: 'Rounds',
  scoring: 'Scoring',
  courses: 'Courses',
  tournaments: 'Tourn.',
  handicap: 'Handicap',
  social: 'Social',
  special: 'Special',
};

// Level definitions - more challenging thresholds
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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  const categories = ['rounds', 'scoring', 'courses', 'tournaments', 'handicap', 'social', 'special'];

  const filteredAchievements = selectedCategory === 'all' 
    ? data.achievements 
    : data.achievements.filter(a => a.category === selectedCategory);

  // Calculate level progress with new thresholds
  const currentLevelIndex = LEVELS.findIndex((l, i) => {
    const next = LEVELS[i + 1];
    return next ? data.totalPoints >= l.minPoints && data.totalPoints < next.minPoints : true;
  });
  const nextLevelData = LEVELS[currentLevelIndex + 1];
  const currentLevelData = LEVELS[currentLevelIndex];
  const pointsInCurrentLevel = data.totalPoints - (currentLevelData?.minPoints || 0);
  const pointsNeededForNext = nextLevelData ? nextLevelData.minPoints - currentLevelData.minPoints : 0;
  const levelProgress = pointsNeededForNext > 0 ? (pointsInCurrentLevel / pointsNeededForNext) * 100 : 100;
  const pointsToNext = nextLevelData ? nextLevelData.minPoints - data.totalPoints : 0;

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">My Badges</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {data.earnedCount}/{data.totalCount}
          </Badge>
        </div>
        
        {/* Level Progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-500" />
              {currentLevelData?.level}
            </span>
            <span className="font-mono text-muted-foreground">{data.totalPoints} pts</span>
          </div>
          <Progress value={Math.min(100, levelProgress)} className="h-1.5" />
          {nextLevelData && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Need {pointsToNext} more pts for {nextLevelData.level}
            </p>
          )}
        </div>
        
        {/* Level thresholds - compact */}
        <div className="mt-2 flex items-center gap-0.5 overflow-x-auto text-[8px] text-muted-foreground">
          {LEVELS.map((l, i) => (
            <span 
              key={l.level} 
              className={`px-1 py-0.5 rounded whitespace-nowrap ${
                i === currentLevelIndex ? 'bg-primary/10 text-primary font-medium' : ''
              }`}
            >
              {l.minPoints}
            </span>
          ))}
        </div>
      </div>

      {/* Category Tabs - scrollable */}
      <div className="flex-shrink-0 border-b">
        <div 
          className="flex gap-1 p-2 overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
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
                className={`px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {categoryIcons[cat]}
                <span>{categoryLabels[cat]}</span>
                <span>{earned}/{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements List */}
      <div className="flex-1 overflow-y-auto p-2" style={{ maxHeight: '300px' }}>
        <div className="flex flex-col gap-1.5">
          {filteredAchievements.map(achievement => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
        
        {filteredAchievements.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            No achievements
          </div>
        )}
      </div>
    </div>
  );
}

// Achievement Badge
function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const isEarned = achievement.earned;
  
  return (
    <div
      className={`rounded p-2 border cursor-pointer ${
        isEarned ? 'bg-card border-primary/20' : 'bg-muted/30 border-border'
      }`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-center gap-2">
        {/* Icon */}
        <div className={`w-8 h-8 rounded flex items-center justify-center text-lg flex-shrink-0 ${
          isEarned ? 'bg-primary/10' : 'bg-muted grayscale opacity-50'
        }`}>
          {isEarned ? achievement.icon : <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium truncate ${!isEarned && 'text-muted-foreground'}`}>
              {achievement.name}
            </span>
            <Badge variant={isEarned ? "default" : "secondary"} className="text-[8px] px-1 py-0 h-3">
              {achievement.points}pts
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{achievement.description}</p>
          {!isEarned && (
            <p className="text-[9px] text-primary mt-0.5">{achievement.progressText}</p>
          )}
        </div>
        
        <ChevronRight className={`w-3 h-3 text-muted-foreground flex-shrink-0 ${showDetails ? 'rotate-90' : ''}`} />
      </div>
      
      {/* Details */}
      {showDetails && (
        <div className="mt-2 pt-2 border-t text-[10px] text-muted-foreground">
          <p>{achievement.description}</p>
          <p className="mt-1 text-primary font-medium">
            {isEarned ? `Earned ${achievement.points} pts!` : `Earn ${achievement.points} pts when completed`}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for profile
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
          <div key={a.id} className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-sm" title={a.name}>
            {a.icon}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {data.totalPoints} pts • {data.level}
      </div>
    </div>
  );
}
