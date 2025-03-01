import React from 'react';
import { motion } from 'framer-motion';
import { RiUserLine, RiUserAddLine, RiMenLine, RiWomenLine } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';

const CustomerStats = ({ stats }) => {
  const { currentTheme } = useTheme();

  const statCards = [
    {
      title: 'Total Customers',
      mobileTitle: 'Customers',
      value: stats.totalBuyers,
      icon: RiUserLine,
      color: 'blue'
    },
    {
      title: 'New This Month',
      mobileTitle: 'New',
      value: stats.newBuyers,
      icon: RiUserAddLine,
      color: 'green'
    }
  ];

  // Calculate percentages for gender distribution
  const totalUsers = stats.genderStats.reduce((acc, curr) => acc + curr.count, 0);
  const genderStats = stats.genderStats.map(stat => ({
    name: stat._id.charAt(0).toUpperCase() + stat._id.slice(1),
    shortName: stat._id.charAt(0).toUpperCase(),
    value: stat.count,
    percentage: ((stat.count / totalUsers) * 100).toFixed(1),
    icon: stat._id === 'male' ? RiMenLine : stat._id === 'female' ? RiWomenLine : RiUserLine,
    color: stat._id === 'male' ? 'blue' : stat._id === 'female' ? 'pink' : 'purple'
  }));

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:grid grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-2xl ${
              currentTheme === 'dark'
                ? 'bg-gray-800 border border-gray-700'
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC]'
                : 'bg-white'
            } shadow-sm`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                currentTheme === 'dark' 
                  ? `bg-${stat.color}-500/10` 
                  : `bg-${stat.color}-50`
              }`}>
                <stat.icon className={`text-xl ${
                  currentTheme === 'dark' 
                    ? `text-${stat.color}-400` 
                    : `text-${stat.color}-500`
                }`} />
              </div>
              <div>
                <h3 className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-gray-400'
                  : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                  : 'text-gray-500'
                }`}>
                  {stat.title}
                </h3>
                <p className={`text-2xl font-bold ${
                  currentTheme === 'dark' ? 'text-white'
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {genderStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 2) * 0.1 }}
            className={`p-6 rounded-2xl ${
              currentTheme === 'dark'
                ? 'bg-gray-800 border border-gray-700'
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC]'
                : 'bg-white'
            } shadow-sm`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                currentTheme === 'dark' 
                  ? `bg-${stat.color}-500/10` 
                  : `bg-${stat.color}-50`
              }`}>
                <stat.icon className={`text-xl ${
                  currentTheme === 'dark' 
                    ? `text-${stat.color}-400` 
                    : `text-${stat.color}-500`
                }`} />
              </div>
              <div>
                <h3 className={`text-sm font-medium ${
                  currentTheme === 'dark' ? 'text-gray-400'
                  : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                  : 'text-gray-500'
                }`}>
                  {stat.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <p className={`text-2xl font-bold ${
                    currentTheme === 'dark' ? 'text-white'
                    : currentTheme === 'eyeCare' ? 'text-[#433422]'
                    : 'text-gray-900'
                  }`}>
                    {stat.value.toLocaleString()}
                  </p>
                  <span className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400'
                    : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                    : 'text-gray-500'
                  }`}>
                    ({stat.percentage}%)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile View - Compact Stats */}
      <div className="md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {[...statCards, ...genderStats].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-2.5 rounded-xl ${
                currentTheme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC]'
                  : 'bg-white'
              } shadow-sm`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' 
                    ? `bg-${stat.color}-500/10` 
                    : `bg-${stat.color}-50`
                }`}>
                  <stat.icon className={`text-base ${
                    currentTheme === 'dark' 
                      ? `text-${stat.color}-400` 
                      : `text-${stat.color}-500`
                  }`} />
                </div>
                <p className={`text-[10px] font-medium text-center ${
                  currentTheme === 'dark' ? 'text-gray-400'
                  : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                  : 'text-gray-500'
                }`}>
                  {stat.mobileTitle || stat.shortName}
                </p>
                <p className={`text-xs font-bold ${
                  currentTheme === 'dark' ? 'text-white'
                  : currentTheme === 'eyeCare' ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}>
                  {stat.percentage ? `${stat.percentage}%` : stat.value.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CustomerStats; 