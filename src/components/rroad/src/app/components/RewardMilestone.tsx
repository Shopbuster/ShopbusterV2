import { Gift, Lock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export interface Reward {
  id: number;
  points: number;
  title: string;
  description: string;
  type: 'discount' | 'free-order' | 'exclusive';
  claimed: boolean;
}

interface RewardMilestoneProps {
  reward: Reward;
  unlocked: boolean;
  onClaim: (id: number) => void;
  isActive: boolean;
}

export function RewardMilestone({ reward, unlocked, onClaim, isActive }: RewardMilestoneProps) {
  const handleClaim = () => {
    if (unlocked && !reward.claimed) {
      onClaim(reward.id);
    }
  };

  return (
    <div className="flex flex-col items-center relative">
      {/* Milestone marker */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: reward.id * 0.15, type: 'spring', stiffness: 150 }}
        className="relative"
      >
        {/* Gift box icon - BIGGER */}
        <motion.div
          whileHover={unlocked && !reward.claimed ? { scale: 1.08, rotate: [0, -3, 3, 0] } : {}}
          className={`
            w-36 h-36 rounded-3xl flex items-center justify-center shadow-2xl transition-all relative
            ${
              reward.claimed
                ? 'bg-gradient-to-br from-green-400 to-green-500 border-4 border-green-300'
                : unlocked
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-300 cursor-pointer'
                : 'bg-gray-400 border-4 border-gray-300'
            }
          `}
        >
          {reward.claimed ? (
            <Sparkles className="w-20 h-20 text-white" />
          ) : unlocked ? (
            <Gift className="w-20 h-20 text-white" />
          ) : (
            <Lock className="w-20 h-20 text-gray-200" />
          )}

          {/* Active indicator */}
          {isActive && !reward.claimed && (
            <motion.div
              className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full border-4 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.div>

        {/* Claim button - BIGGER */}
        {unlocked && !reward.claimed && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClaim}
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-red-600 px-8 py-3 rounded-full text-base font-bold shadow-lg hover:shadow-xl transition-shadow"
          >
            Claim
          </motion.button>
        )}
      </motion.div>

      {/* Info card - BIGGER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reward.id * 0.15 + 0.2 }}
        className={`
          mt-10 bg-white rounded-2xl p-6 shadow-lg w-72 text-center
          ${!unlocked && !reward.claimed ? 'opacity-60' : ''}
        `}
      >
        <p className="text-3xl font-bold text-gray-900 mb-2">{reward.title}</p>
        <p className="text-lg font-semibold text-gray-700 mb-2">{reward.description}</p>
        <p className="text-sm text-gray-500">{reward.points} pts</p>
        {reward.claimed && (
          <p className="text-sm text-green-600 font-bold mt-3">✓ Claimed</p>
        )}
      </motion.div>
    </div>
  );
}
