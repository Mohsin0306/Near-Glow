import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { campaignAPI } from '../../utils/api';

const CampaignCircles = () => {
  const { currentTheme } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        // Use the getActiveCampaigns function from your campaignAPI
        const response = await campaignAPI.getActiveCampaigns();
        
        if (response.data && response.data.success) {
          // Format the data for display
          let campaignsToDisplay = [];
          
          // Check if the data structure includes campaigns with products
          if (response.data.data && Array.isArray(response.data.data)) {
            campaignsToDisplay = response.data.data.map(campaign => ({
              _id: campaign._id,
              title: campaign.title,
              image: campaign.image,
              link: `/campaign/${campaign._id}`,
              productsCount: campaign.productsCount || 0
            }));
          } else if (response.data.campaigns && Array.isArray(response.data.campaigns)) {
            // Alternative data structure
            campaignsToDisplay = response.data.campaigns;
          }
          
          setCampaigns(campaignsToDisplay);
          console.log('Fetched campaigns:', campaignsToDisplay);
        } else {
          console.warn('No active campaigns found or invalid response format');
          setCampaigns([]);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className={`w-full py-3 ${
        currentTheme === 'dark' 
          ? 'bg-gray-800/95' 
          : currentTheme === 'eyeCare' 
          ? 'bg-[#F5E6D3]/95'
          : 'bg-white/95'
      } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* Heading skeleton */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-full w-16 animate-pulse"></div>
          </div>
          
          {/* Circles skeleton */}
          <div className="animate-pulse flex space-x-2.5 overflow-x-hidden px-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-1.5">
                <div className="rounded-full bg-gray-200 h-11 w-11 md:h-14 md:w-14 flex-shrink-0"></div>
                <div className="h-2 bg-gray-200 rounded w-10 md:w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return null; // Don't render section if no campaigns
  }

  return (
    <div className={`w-full py-2 md:py-3 ${
      currentTheme === 'dark' 
        ? 'bg-gray-800/95' 
        : currentTheme === 'eyeCare' 
        ? 'bg-[#F5E6D3]/95'
        : 'bg-white/95'
    } backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Professional heading with "See All" link */}
        <div className="flex items-center justify-between mb-2.5 md:mb-3 px-1">
          <h2 className={`text-sm md:text-base font-medium ${
            currentTheme === 'dark' 
              ? 'text-white' 
              : currentTheme === 'eyeCare' 
              ? 'text-[#433422]'
              : 'text-gray-900'
          }`}>
            <span className="flex items-center">
              Special Offers
              {/* Optional small indicator */}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                currentTheme === 'dark' 
                  ? 'bg-purple-500/20 text-purple-200' 
                  : currentTheme === 'eyeCare' 
                  ? 'bg-[#E6D5B8] text-[#433422]'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {campaigns.length}
              </span>
            </span>
          </h2>
          <Link 
            to="/campaigns" 
            className={`text-xs md:text-sm ${
              currentTheme === 'dark' 
                ? 'text-purple-300 hover:text-purple-200' 
                : currentTheme === 'eyeCare' 
                ? 'text-[#433422]/80 hover:text-[#433422]'
                : 'text-purple-600 hover:text-purple-700'
            }`}
          >
            See All
          </Link>
        </div>

        {/* Scrollable container with touch events */}
        <div 
          className="overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Center the content on desktop */}
          <div className="flex md:justify-center">
            <div className="flex gap-2.5 md:gap-5 px-1">
              {campaigns.map((campaign) => (
                <Link 
                  key={campaign._id} 
                  to={campaign.link}
                  className="flex flex-col items-center space-y-1 min-w-[52px] md:min-w-[76px]"
                >
                  <div className={`relative w-11 h-11 md:w-14 md:h-14 rounded-full overflow-hidden 
                    transition-all hover:scale-105 ${
                      currentTheme === 'dark' 
                        ? 'ring-1 ring-gray-700/80 shadow-[0_0_6px_rgba(255,255,255,0.06)]' 
                        : currentTheme === 'eyeCare' 
                        ? 'ring-1 ring-[#E6D5B8]/80 shadow-[0_0_6px_rgba(67,52,34,0.06)]' 
                        : 'ring-1 ring-gray-200/80 shadow-[0_0_6px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    <img 
                      src={campaign.image.url} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=Campaign';
                      }}
                    />
                    {/* Add modern overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-80"></div>
                    
                    {/* Add badge showing number of products if available */}
                    {campaign.productsCount > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] md:text-[10px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">
                        {campaign.productsCount > 99 ? '99+' : campaign.productsCount}
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] md:text-[11px] text-center font-medium truncate w-full ${
                    currentTheme === 'dark' 
                      ? 'text-gray-300' 
                      : currentTheme === 'eyeCare' 
                      ? 'text-[#433422]'
                      : 'text-gray-800'
                  }`}>
                    {campaign.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hide scrollbar with CSS
const styles = document.createElement('style');
styles.textContent = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;
document.head.appendChild(styles);

export default CampaignCircles; 