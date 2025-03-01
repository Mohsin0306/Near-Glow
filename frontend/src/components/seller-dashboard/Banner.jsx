import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { bannerAPI } from '../../utils/api';

const Banner = () => {
  const { currentTheme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState([]);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await bannerAPI.getBanners();
        if (response.data.banners.length > 0) {
          // Sort banners by order
          const sortedBanners = response.data.banners
            .filter(banner => banner.isActive)
            .sort((a, b) => a.order - b.order);
          setBanners(sortedBanners);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    };

    fetchBanners();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleButtonClick = (link) => {
    if (link) {
      // Check if it's an internal or external link
      if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = link;
      }
    }
  };

  // If no banners, show default banner
  if (banners.length === 0) {
    return (
      <div className="relative w-full bg-gray-50">
        <div className="relative h-[150px] sm:h-[250px] md:h-[350px] overflow-hidden">
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent">
              <div className="flex flex-col justify-center h-full max-w-lg px-6 md:px-16">
                <h2 className="text-lg sm:text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4">
                  Welcome to Our Store
                </h2>
                <p className="text-sm sm:text-xl md:text-2xl text-white/90 mb-3 md:mb-6">
                  Discover Amazing Products
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gray-50">
      {/* Main Banner */}
      <div className="relative h-[150px] sm:h-[250px] md:h-[350px] overflow-hidden">
        {/* Slides Container */}
        <div 
          className="flex transition-transform duration-500 h-full w-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div 
              key={banner._id} 
              className="min-w-full h-full relative flex-shrink-0"
            >
              <div className="w-full h-full relative overflow-hidden">
                {banner.media.type === 'video' ? (
                  <video
                    src={banner.media.url}
                    className="w-full h-full object-cover object-center absolute inset-0"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={banner.media.url}
                    alt={banner.title}
                    className="w-full h-full object-cover object-center absolute inset-0"
                    loading="lazy"
                  />
                )}
                {/* Modern gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent">
                  <div className="flex flex-col justify-center h-full max-w-lg px-6 md:px-16">
                    {/* Accent line */}
                    <div className="hidden md:flex items-center gap-3 mb-6">
                      <div className="w-12 h-[3px] bg-white rounded-full"></div>
                      <div className="w-3 h-[3px] bg-white/70 rounded-full"></div>
                    </div>
                    
                    <h2 className="text-lg sm:text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4">
                      {banner.title}
                    </h2>
                    <p className="text-sm sm:text-xl md:text-2xl text-white/90 mb-3 md:mb-6">
                      {banner.description}
                    </p>
                    {banner.buttonText && (
                      <button 
                        onClick={() => handleButtonClick(banner.buttonLink)}
                        className="group w-fit px-4 py-1.5 sm:px-6 sm:py-2 md:px-8 md:py-3 
                          bg-white text-black text-sm sm:text-base md:text-lg font-medium 
                          rounded-full hover:bg-white/90 transition-all duration-300 
                          hover:translate-y-[-2px] cursor-pointer"
                      >
                        {banner.buttonText}
                        <span className="ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 
                hover:bg-white/50 transition-all duration-300 backdrop-blur-sm"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 
                hover:bg-white/50 transition-all duration-300 backdrop-blur-sm"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Modern Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? 'w-8 bg-white' 
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Banner; 