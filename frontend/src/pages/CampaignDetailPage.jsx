import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { campaignAPI } from '../utils/api';
import Spinner from '../components/common/Spinner';
import Header from '../components/layout/Header';
import FloatingContact from '../components/FloatingContact';

// Icons
const BackIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const CartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

const ShareIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 0 2.25 2.25 0 00-3.935 0z" />
  </svg>
);

const CampaignDetailPage = () => {
  const { id } = useParams();
  const { theme, currentTheme } = useTheme();
  const [campaign, setCampaign] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        // Get campaign details
        const campaignResponse = await campaignAPI.getActiveCampaigns();
        
        if (!campaignResponse.data || !campaignResponse.data.success) {
          throw new Error('Failed to fetch campaigns');
        }
        
        // Find the specific campaign by ID
        const campaignData = campaignResponse.data.data.find(c => c._id === id);
        
        if (!campaignData) {
          throw new Error('Campaign not found');
        }
        
        setCampaign(campaignData);
        
        // Campaign products are already included in the response
        if (campaignData.products && Array.isArray(campaignData.products)) {
          setProducts(campaignData.products);
          console.log("Campaign products:", campaignData.products);
        }
        
      } catch (err) {
        console.error('Error fetching campaign details:', err);
        setError(err.message || 'Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampaignDetails();
    }
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign?.title || 'Check out this campaign',
        text: `Amazing deals on ${campaign?.title || 'our campaign'}!`,
        url: window.location.href,
      })
      .catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Could not copy text:', err));
    }
  };

  return (
    <>
      <Header className="fixed top-0 w-full z-50" />
      <div className={`${theme.background} min-h-screen pt-16 pb-24`}>
        {loading ? (
          <div className="flex justify-center items-center h-[70vh]">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-[60vh] px-4">
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>Oops!</h2>
            <p className={`${theme.textSecondary} mb-6 text-center`}>{error}</p>
            <Link to="/" className={`px-4 py-2 rounded-lg ${theme.buttonPrimary}`}>
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Modern Campaign Header */}
            <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : currentTheme === 'eyeCare' ? 'bg-[#E6D5B8]' : 'bg-white'} shadow-sm mb-4`}>
              <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center mb-1">
                  <button 
                    onClick={() => navigate(-1)} 
                    className={`p-2 -ml-2 rounded-full ${theme.textSecondary} hover:${theme.text}`}
                  >
                    <BackIcon className="w-5 h-5" />
                  </button>
                  <h1 className={`text-xl font-bold ${theme.text} ml-1`}>{campaign.title}</h1>
                </div>
                
                {campaign.description && (
                  <p className={`${theme.textSecondary} mt-2 text-sm`}>
                    {campaign.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center">
                    <span className={`${currentTheme === 'dark' ? 'bg-purple-600' : currentTheme === 'eyeCare' ? 'bg-[#d0b994]' : 'bg-purple-100'} text-xs font-medium px-2.5 py-1 rounded-full ${currentTheme === 'dark' ? 'text-white' : currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-purple-700'}`}>
                      {products.length} {products.length === 1 ? 'product' : 'products'}
                    </span>
                    <span className={`ml-2 text-xs ${theme.textSecondary}`}>
                      Limited time offer
                    </span>
                  </div>
                  <button 
                    onClick={handleShare}
                    className={`p-2 rounded-full ${currentTheme === 'dark' ? 'bg-gray-700 text-gray-300' : currentTheme === 'eyeCare' ? 'bg-[#d0b994] text-[#433422]' : 'bg-gray-100 text-gray-700'}`}
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="px-4 py-2">
              <div className="max-w-6xl mx-auto">
                {products.length === 0 ? (
                  <div className={`text-center py-12 ${theme.textSecondary}`}>
                    <p className="text-lg font-medium">No products in this campaign yet</p>
                    <p className="mt-1 text-sm">Come back later for amazing deals!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {products.map(product => {
                      // Check and parse discount percentage to ensure it's a number
                      const discountPercent = parseInt(product.discountPercent || 0);
                      
                      // Calculate discounted price
                      const originalPrice = parseFloat(product.originalPrice || product.price || 0);
                      const discountedPrice = !isNaN(originalPrice) && !isNaN(discountPercent) 
                        ? Math.round(originalPrice * (1 - discountPercent/100)) 
                        : originalPrice;
                      
                      // Log for debugging
                      console.log('Product pricing:', {
                        name: product.name,
                        originalPrice,
                        discountPercent,
                        discountedPrice,
                        raw: {
                          price: product.price,
                          discountPercent: product.discountPercent,
                          originalPrice: product.originalPrice
                        }
                      });
                      
                      return (
                        <Link
                          key={product._id}
                          to={`/products/${product._id}`}
                          className={`${theme.card} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
                        >
                          <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
                            <img
                              src={
                                product.image?.url || 
                                (product.images && product.images[0]?.url) || 
                                (product.images && typeof product.images[0] === 'string' && product.images[0]) ||
                                (product.media && product.media[0]?.url) ||
                                'https://via.placeholder.com/150?text=Product'
                              }
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/150?text=Product';
                              }}
                            />
                            {/* Only show discount badge if discount is a valid number > 0 */}
                            {!isNaN(discountPercent) && discountPercent > 0 && (
                              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 m-2 rounded-md">
                                {discountPercent}% OFF
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3">
                            <h3 className={`${theme.text} font-medium text-sm line-clamp-2 h-10`}>
                              {product.name}
                            </h3>
                            
                            <div className="mt-2 flex flex-col">
                              <p className={`${theme.textSecondary} text-xs line-through`}>
                                Rs. {!isNaN(originalPrice) ? originalPrice.toLocaleString() : 'N/A'}
                              </p>
                              <p className={`${theme.text} font-semibold`}>
                                Rs. {!isNaN(discountedPrice) ? discountedPrice.toLocaleString() : 'N/A'}
                              </p>
                            </div>
                            
                            {(product.stock <= 0) && (
                              <span className="mt-1.5 inline-block w-full text-center py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                                Out of stock
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <FloatingContact />
    </>
  );
};

export default CampaignDetailPage; 