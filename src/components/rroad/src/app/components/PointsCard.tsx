import { useEffect, useState } from 'react';
import { motion, animate } from 'motion/react';
import { Trophy } from 'lucide-react';

interface PointsCardProps {
  points: number;
}

export function PointsCard({ points }: PointsCardProps) {
  const [displayPoints, setDisplayPoints] = useState(points);

  useEffect(() => {
    const controls = animate(displayPoints, points, {
      duration: 0.8,
      onUpdate: (value) => setDisplayPoints(Math.floor(value)),
    });

    return () => controls.stop();
  }, [points, displayPoints]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl px-10 py-6 shadow-lg inline-flex items-center gap-4"
    >
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3">
        <Trophy className="w-8 h-8 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">Your Total Points</p>
        <motion.p
          key={displayPoints}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold text-gray-900"
        >
          {displayPoints}
        </motion.p>
      </div>
    </motion.div>
  );
}
