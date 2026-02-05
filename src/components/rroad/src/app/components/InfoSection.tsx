import { motion } from 'motion/react';
import { Coins, ShoppingBag, Instagram, Info } from 'lucide-react';

export function InfoSection() {
  return (
    <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
      {/* How to earn points - Primary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-8 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-3">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">How to Earn Points</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
            <ShoppingBag className="w-6 h-6 mt-1 flex-shrink-0 text-[#EA9217]" />
            <div>
              <p className="font-semibold text-gray-900">Order under $500</p>
              <p className="text-sm text-gray-600">Earn <span className="font-bold text-[#F7A11E]">2 point</span></p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
            <ShoppingBag className="w-6 h-6 mt-1 flex-shrink-0 text-[#EA9217]" />
            <div>
              <p className="font-semibold text-gray-900">Order $500 or more</p>
              <p className="text-sm text-gray-600">Earn <span className="font-bold text-[#F7A11E]">3 points</span></p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
            <Instagram className="w-6 h-6 text-[#EA9217] mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Share on Instagram Story</p>
              <p className="text-sm text-gray-600">Earn <span className="font-bold text-[#F7A11E]">2 point</span></p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* How it works - Secondary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/90 rounded-3xl p-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gray-400 rounded-full p-3">
            <Info className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-700">How It Works</h2>
        </div>

        <div className="space-y-3 text-gray-600">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            <p className="text-sm">Earn points by placing orders and sharing on social media</p>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            <p className="text-sm">Unlock rewards when you reach each milestone on the road</p>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </span>
            <p className="text-sm">Click "Claim" to activate your rewards</p>
          </div>

          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </span>
            <p className="text-sm">
              When you reach the final reward, your progress resets and starts over for another round of rewards!
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-2 flex-wrap">
          <p className="text-sm text-gray-600">For any questions, contact us on</p>
          <a
            href="https://instagram.com/shop_buster50"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-red-600 font-semibold hover:text-red-700"
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </a>
        </div>
      </motion.div>
    </div>
  );
}