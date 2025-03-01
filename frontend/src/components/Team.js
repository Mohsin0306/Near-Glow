import React, { useState } from 'react';
import Sidebar from './layout/Sidebar';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Team = () => {
  const [expandedMember, setExpandedMember] = useState(null);
  const location = useLocation();
  const { theme, currentTheme } = useTheme();

  const teamMembers = [
    {
      name: "Mohsin Ashraf",
      role: "Developer & Designer",
      image: "/images/developer.jpeg",
      description: "Lead developer and UI/UX designer responsible for building and maintaining the website architecture",
      portfolio: "https://mohsin-portfolio-seven.vercel.app"
    },
    {
      name: "Nabeal Ahmed",
      role: "Producer",
      image: "/images/producer.jpeg",
      description: "Product management and business development specialist"
    },
    {
      name: "Hammad Ahmed",
      role: "Graphic Designer",
      image: "/images/hammad.jpg",
      description: "Creative lead handling all visual aspects and branding",
      portfolio: "https://hammad-portfolio.com"
    }
  ];

  const handlePortfolioClick = (portfolio) => {
    if (portfolio) {
      window.open(portfolio, '_blank');
    }
  };

  const toggleMemberDetails = (index) => {
    setExpandedMember(expandedMember === index ? null : index);  // Toggle the expanded state
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className={`flex-1 min-h-screen py-12 px-4 ${theme.background}`}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 md:mb-12">
            <span className={`${theme.text}`}>
              Meet Our Team
            </span>
          </h1>
          
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[900px]">
              {/* Top member */}
              <div className="flex justify-center mb-12 md:mb-16">
                <div className="w-full max-w-sm">
                  <TeamMember 
                    {...teamMembers[0]} 
                    index={0}
                    isExpanded={true}
                    onPortfolioClick={handlePortfolioClick}
                    onToggle={toggleMemberDetails}
                    isDeveloper={true}
                    theme={theme}
                    currentTheme={currentTheme}
                  />
                </div>
              </div>
              
              {/* Bottom row */}
              <div className="flex justify-between px-4 md:px-0">
                <div className="w-[45%] max-w-sm transform -translate-x-[10%] md:translate-x-[10%]">
                  <TeamMember 
                    {...teamMembers[1]} 
                    index={1}
                    isExpanded={expandedMember === 1}
                    onPortfolioClick={handlePortfolioClick}
                    onToggle={toggleMemberDetails}
                    theme={theme}
                    currentTheme={currentTheme}
                  />
                </div>
                <div className="w-[45%] max-w-sm transform translate-x-[10%] md:-translate-x-[10%]">
                  <TeamMember 
                    {...teamMembers[2]} 
                    index={2}
                    isExpanded={expandedMember === 2}
                    onPortfolioClick={handlePortfolioClick}
                    onToggle={toggleMemberDetails}
                    theme={theme}
                    currentTheme={currentTheme}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamMember = ({ 
  name, 
  role, 
  image, 
  description, 
  portfolio, 
  index, 
  isExpanded, 
  onPortfolioClick, 
  onToggle,
  isDeveloper,
  theme,
  currentTheme
}) => {
  const isMobile = window.innerWidth < 768;

  const handleImageClick = (e) => {
    e.preventDefault();
    if (isDeveloper && portfolio) {
      window.open('https://mohsin-portfolio-seven.vercel.app', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="group flex flex-col items-center transition-all duration-300 hover:-translate-y-2">
      <div className="relative mb-4 sm:mb-6">
        <div 
          role="button"
          tabIndex={0}
          onClick={handleImageClick}
          onKeyPress={(e) => e.key === 'Enter' && handleImageClick(e)}
          className={`${isDeveloper ? 'w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 cursor-pointer' : 'w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48'}
            rounded-full overflow-hidden 
            bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 p-1 
            shadow-lg hover:shadow-2xl transition-all duration-300 
            transform hover:scale-105 relative z-10`}
        >
          <img
            src={image}
            alt={name}
            className={`w-full h-full rounded-full object-cover ${isDeveloper ? 'cursor-pointer' : ''}`}
            onClick={handleImageClick}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/200';
            }}
          />
        </div>
        <div className="absolute inset-0 rounded-full bg-gray-800 dark:bg-gray-200 opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-300 -z-10"></div>
      </div>
      
      <div className="text-center w-full px-2 sm:px-4 transform transition-all duration-300 group-hover:scale-105">
        <h3 
          className={`text-base sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 whitespace-nowrap
            ${theme.text}
            ${isDeveloper ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300' : ''}`}
          onClick={isDeveloper ? handleImageClick : undefined}
        >
          {name}
        </h3>
        <p className={`text-xs sm:text-md md:text-lg ${theme.text} font-semibold mb-2 sm:mb-3`}>
          {role}
        </p>
        
        <div className="overflow-hidden transition-all duration-500 ease-in-out max-h-40 opacity-100 translate-y-0">
          <p className={`text-xs sm:text-sm md:text-base ${theme.textSecondary} text-center mx-auto max-w-[200px] sm:max-w-xs leading-relaxed`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Team; 