import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  RiUserAddLine,
  RiGiftLine,
  RiFileCopyLine,
  RiShareForwardLine,
  RiWhatsappLine,
  RiTwitterXFill,
  RiFacebookCircleLine,
  RiMailLine,
  RiCheckLine,
} from 'react-icons/ri';

const Referrals = () => {
  const { theme, currentTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const referralCode = 'JOHN2024';
  const referralLink = `https://yourstore.com/ref/${referralCode}`;

  const referralStats = [
    {
      icon: RiUserAddLine,
      label: 'Total Referrals',
      value: '24',
      color: currentTheme === 'eyeCare' ? 'from-[#A89078] to-[#8B7355]' : 'from-blue-500 to-indigo-600',
    },
    {
      icon: RiGiftLine,
      label: 'Rewards Earned',
      value: '$120',
      color: currentTheme === 'eyeCare' ? 'from-[#C1A173] to-[#8B7355]' : 'from-green-500 to-emerald-600',
    },
  ];

  const shareOptions = [
    { 
      icon: RiWhatsappLine, 
      label: 'WhatsApp',
      color: currentTheme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      link: `https://wa.me/?text=Use my referral code ${referralCode} to get a discount!`
    },
    { 
      icon: RiTwitterXFill, 
      label: 'Twitter',
      color: currentTheme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-black',
      hoverColor: 'hover:bg-gray-900',
      link: `https://twitter.com/intent/tweet?text=Use my referral code ${referralCode} to get a discount!`
    },
    { 
      icon: RiFacebookCircleLine, 
      label: 'Facebook',
      color: currentTheme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      link: `https://www.facebook.com/sharer/sharer.php?u=${referralLink}`
    },
    { 
      icon: RiMailLine, 
      label: 'Email',
      color: currentTheme === 'eyeCare' 
        ? 'bg-[#A89078] text-white' 
        : currentTheme === 'dark' 
        ? 'bg-purple-500/20 text-purple-400'
        : 'bg-purple-500',
      hoverColor: currentTheme === 'eyeCare' ? 'hover:bg-[#8B7355]' : 'hover:bg-purple-600',
      link: `mailto:?subject=Special Discount&body=Use my referral code ${referralCode} to get a discount!`
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`min-h-screen pb-20 ${theme.background}`}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold ${theme.text}`}>
            Referral Program
          </h1>
          <p className={`mt-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Share and earn rewards together
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {referralStats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -2 }}
              className={`${theme.card} border ${theme.border} p-4 rounded-2xl flex items-center gap-4`}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                <stat.icon size={20} />
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${theme.text}`}>{stat.value}</h3>
                <p className={currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Referral Link Section */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${theme.card} border ${theme.border} p-6 rounded-2xl space-y-4`}
        >
          <h2 className={`text-xl font-bold ${theme.text}`}>Your Referral Link</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className={`flex-1 p-4 rounded-xl bg-opacity-50 ${
              currentTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <p className={`font-mono ${theme.text} text-sm sm:text-base break-all`}>{referralLink}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyToClipboard}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                ${currentTheme === 'eyeCare' 
                  ? 'bg-[#A89078] hover:bg-[#8B7355] text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              {copied ? (
                <>
                  <RiCheckLine size={20} />
                  <span className="whitespace-nowrap">Copied!</span>
                </>
              ) : (
                <>
                  <RiFileCopyLine size={20} />
                  <span className="whitespace-nowrap">Copy Link</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Share Options */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`${theme.card} border ${theme.border} p-6 rounded-2xl space-y-4`}
        >
          <h2 className={`text-xl font-bold ${theme.text}`}>Share Your Link</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {shareOptions.map((option, index) => (
              <motion.a
                key={index}
                href={option.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all
                  ${option.color} ${option.hoverColor} cursor-pointer`}
              >
                <option.icon size={24} className="text-white" />
                <span className="text-sm font-medium text-white">{option.label}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Recent Referrals */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${theme.card} border ${theme.border} p-6 rounded-2xl space-y-4`}
        >
          <h2 className={`text-xl font-bold ${theme.text}`}>Recent Referrals</h2>
          
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <motion.div 
                key={index}
                whileHover={{ x: 4 }}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  currentTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    currentTheme === 'eyeCare' ? 'bg-[#A89078]' : 'bg-blue-500'
                  } text-white`}>
                    <RiUserAddLine size={20} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme.text}`}>User{index + 1}</h3>
                    <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Joined 2 days ago
                    </p>
                  </div>
                </div>
                <span className={`font-medium ${
                  currentTheme === 'eyeCare' ? 'text-[#8B7355]' : 'text-green-500'
                }`}>
                  +$5.00
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Referrals; 