import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PointsCard } from './components/PointsCard';
import { RewardRoad } from './components/RewardRoad';
import { InfoSection } from './components/InfoSection';
import type { Reward } from './components/RewardMilestone';
// @ts-ignore
import { useAuth } from '../../../../AuthContext';
// @ts-ignore
import { supabase } from '../../../../supabaseClient';


// Define the 10 rewards
const initialRewards: Reward[] = [
  {
    id: 1,
    points: 5,
    title: '10% OFF',
    description: 'Additional discount',
    type: 'discount',
    claimed: false,
  },
  {
    id: 2,
    points: 8,
    title: 'VIP Store',
    description: 'Designers, Electronics & more',
    type: 'exclusive',
    claimed: false,
  },
  {
    id: 3,
    points: 12,
    title: 'Free Order',
    description: 'Order on us!',
    type: 'free-order',
    claimed: false,
  },
];

export default function App() {
  // Simulated user points - in a real app, this would come from a backend
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [showResetMessage, setShowResetMessage] = useState(false);
  const [setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);

  // Fetch user's reward data
  useEffect(() => {
    const fetchRewardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('reward_points, claimed_rewards')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setUserPoints(data.reward_points || 0);
          setRewards(prev =>
            prev.map(r => ({
              ...r,
              claimed: (data.claimed_rewards || []).includes(r.id)
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching reward data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewardData();
  }, [user]);

  const handleClaimReward = async (id: number) => {
    if (!user) return;

    // Update local state immediately for snappy UI
    setRewards((prev) =>
      prev.map((reward) =>
        reward.id === id ? { ...reward, claimed: true } : reward
      )
    );

    try {
      // Get current claimed rewards from Supabase
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('claimed_rewards')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentClaimed = data?.claimed_rewards || [];

      // Update Supabase with new claimed reward
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          claimed_rewards: [...currentClaimed, id]
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Check if this is the final reward (id === 10)
      if (id === 3) {
        setShowResetMessage(true);

        // Reset after 3 seconds
        setTimeout(async () => {
          setRewards(initialRewards);
          setUserPoints(0);
          setShowResetMessage(false);

          // Reset in Supabase too
          await supabase
            .from('user_profiles')
            .update({
              reward_points: 0,
              claimed_rewards: []
            })
            .eq('id', user.id);
        }, 3000);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      // Revert local state if Supabase update failed
      setRewards((prev) =>
        prev.map((reward) =>
          reward.id === id ? { ...reward, claimed: false } : reward
        )
      );
    }
  };


  return (
    <div className="min-h-screen bg-[#E783FF] overflow-x-hidden">
      {/* Header */}
      <header className="pt-12 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-5xl font-bold text-white mb-2"
        >
          Reward Road
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-white/80 text-lg"
        >
          Earn points, unlock rewards, and enjoy the journey!
        </motion.p>
      </header>

      {/* Points Card - Center top */}
      <div className="flex justify-center mb-12">
        <PointsCard points={userPoints} />
      </div>

      {/* Reset message overlay */}
      {showResetMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
        >
          <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Congratulations!</h2>
            <p className="text-lg text-gray-600 mb-2">You've claimed the exclusive reward!</p>
            <p className="text-sm text-gray-500">Starting a new journey...</p>
          </div>
        </motion.div>
      )}

      {/* Reward Road */}
      <div className="bg-white/10 rounded-3xl mx-8 p-8 backdrop-blur-sm">
        <RewardRoad
          rewards={rewards}
          userPoints={userPoints}
          onClaimReward={handleClaimReward}
        />
      </div>

      {/* Info Section */}
      <InfoSection />

      {/* Footer spacer */}
      <div className="h-20" />

    </div>
  );
}
