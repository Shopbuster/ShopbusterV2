import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RewardMilestone, type Reward } from './RewardMilestone';
import { MapPin } from 'lucide-react';

interface RewardRoadProps {
  rewards: Reward[];
  userPoints: number;
  onClaimReward: (id: number) => void;
}

export function RewardRoad({ rewards, userPoints, onClaimReward }: RewardRoadProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Find current active milestone (next unclaimed reward)
  const activeRewardId = rewards.find((r) => !r.claimed && r.points <= userPoints)?.id || null;

  // Calculate points to next reward
  const nextReward = rewards.find((r) => !r.claimed);
  const pointsToNext = nextReward ? Math.max(0, nextReward.points - userPoints) : 0;

  // Auto-scroll to active milestone on mount or when active changes
  useEffect(() => {
    if (scrollContainerRef.current && activeRewardId) {
      const activeIndex = rewards.findIndex((r) => r.id === activeRewardId);
      if (activeIndex !== -1) {
        const scrollPosition = activeIndex * 480 - 300; // Adjusted for bigger milestones
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth',
        });
      }
    }
  }, [activeRewardId, rewards]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      {/* Progress indicator */}
      {nextReward && pointsToNext > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-6 text-white"
        >
          <MapPin className="w-5 h-5" />
          <p className="text-lg font-semibold">
            <span className="font-bold text-yellow-300">{pointsToNext} points</span> to next reward
          </p>
        </motion.div>
      )}

      {nextReward && pointsToNext === 0 && activeRewardId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-6 text-white"
        >
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <p className="text-lg font-semibold text-yellow-300">
            Reward unlocked! Claim it below
          </p>
        </motion.div>
      )}

      {/* Scrollable road container */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`
          overflow-x-auto overflow-y-hidden px-8 py-12
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          scrollbar-hide
        `}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Abstract road path */}
        <div className="relative min-w-max">
          {/* Road background */}
          <div className="absolute top-10 left-0 right-0 h-2 bg-white/30 rounded-full" />
          <div className="absolute top-10 left-0 h-2 bg-gradient-to-r from-yellow-300 to-green-400 rounded-full"
            style={{
              width: `${(rewards.filter(r => r.claimed).length / rewards.length) * 100}%`,
            }}
          />

          {/* Milestones */}
          <div className="flex gap-32 relative justify-center">
            {rewards.map((reward) => {
              const unlocked = userPoints >= reward.points;
              const isActive = reward.id === activeRewardId;

              return (
                <RewardMilestone
                  key={reward.id}
                  reward={reward}
                  unlocked={unlocked}
                  onClaim={onClaimReward}
                  isActive={isActive}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag hint */}
      <p className="text-center text-white/70 text-sm mt-4">
        👆 Click and drag to explore the road
      </p>
    </div>
  );
}

// Import Sparkles for the unlocked message
import { Sparkles } from 'lucide-react';