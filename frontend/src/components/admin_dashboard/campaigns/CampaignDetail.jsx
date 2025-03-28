import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../../../context/ThemeContext';
import { campaignAPI, productAPI } from '../../../utils/api';
import Spinner from '../../common/Spinner';
import axios from 'axios';

// Add custom icon components to replace heroicons
const XMarkIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PencilSquareIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const LinkIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const FolderIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const ArrowTopRightOnSquareIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

// Add new icon for products
const ShoppingBagIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// Update the ProductSelectionModal component
const ProductSelectionModal = ({ isOpen, onClose, onSave, products, loadingProducts }) => {
  const { theme } = useTheme();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discount, setDiscount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset selections when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts([]);
      setSearchTerm('');
      setDiscount(10);
    }
  }, [isOpen]);

  const filteredProducts = React.useMemo(() => {
    if (!Array.isArray(products)) {
      console.error("Products array is invalid:", products);
      return [];
    }
    return products.filter(product => 
      product.name && product.name.toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  }, [products, searchTerm]);

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleSave = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    // Log what we're submitting
    console.log('Submitting selected products:', selectedProducts, 'with discount:', discount);
    
    onSave(selectedProducts, discount);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl my-2 sm:my-4 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Compact Header */}
          <div className="px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className={`text-base font-semibold ${theme.text}`}>Add Products</h3>
                <span className={`text-xs ${theme.textSecondary}`}>
                  {selectedProducts.length} selected
                </span>
              </div>
              <button onClick={onClose} className={`p-1 ${theme.textSecondary} hover:text-gray-700 dark:hover:text-gray-300`}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Compact Search and Controls */}
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm rounded-lg border ${theme.input}`}
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className={`text-xs sm:text-sm ${theme.text} whitespace-nowrap`}>Discount (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                  className={`w-20 px-2 py-1.5 text-sm rounded-lg border ${theme.input}`}
                />
              </div>
            </div>

            {/* Products Grid with updated responsive layout */}
            {loadingProducts ? (
              <div className="flex justify-center py-6">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="mt-3">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className={`mt-2 text-sm font-medium ${theme.text}`}>No products found</h3>
                    <p className={`mt-1 text-sm ${theme.textSecondary}`}>
                      {searchTerm ? 'Try adjusting your search' : 'No products available to add'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[60vh] overflow-y-auto px-0.5 py-1">
                    {filteredProducts.map(product => (
                      <div
                        key={product._id}
                        onClick={() => handleProductToggle(product._id)}
                        className={`relative rounded-lg border cursor-pointer transition-all ${
                          selectedProducts.includes(product._id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : `${theme.border} hover:border-gray-300 dark:hover:border-gray-600`
                        }`}
                      >
                        {/* Selected Indicator */}
                        {selectedProducts.includes(product._id) && (
                          <div className="absolute top-1 right-1 z-10 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Product Card Content */}
                        <div className="p-1.5">
                          <div className="aspect-square mb-1.5 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img
                              src={(product.media && product.media[0] && product.media[0].url) || 
                                  'https://via.placeholder.com/400?text=No+Image'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className={`font-medium ${theme.text} text-xs leading-tight line-clamp-2 min-h-[2.5rem]`}>
                              {product.name}
                            </h4>
                            <div className="flex items-center justify-between">
                              <p className={`text-xs ${theme.textSecondary}`}>
                                Rs. {product.price || product.salePrice}
                              </p>
                              {product.discountPercentage > 0 && (
                                <span className="text-[10px] text-green-600 font-medium">
                                  -{product.discountPercentage}%
                                </span>
                              )}
                            </div>
                            {product.stock <= 0 && (
                              <p className="text-[10px] text-red-500 font-medium">Out of stock</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact Footer */}
          <div className="px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
              <button
                onClick={onClose}
                className={`w-full sm:w-auto px-3 py-1.5 text-sm border rounded-lg ${theme.buttonSecondary}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={selectedProducts.length === 0}
                className={`w-full sm:w-auto px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r ${theme.buttonPrimary} flex items-center justify-center ${
                  selectedProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="mr-1">Add</span>
                <span className="font-medium">{selectedProducts.length}</span>
                <span className="ml-1">to Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CampaignDetail = () => {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    description: '',
    image: null
  });
  
  // Campaign products state
  const [allProducts, setAllProducts] = useState([]);
  const [campaignProducts, setCampaignProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add new state for modal loading
  const [modalLoading, setModalLoading] = useState(false);

  // Add this at the top of your component
  const [error, setError] = useState(null);

  // Fetch campaign details and products
  useEffect(() => {
    const fetchCampaignAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        
        // Fetch campaign details
        const campaignResponse = await campaignAPI.getCampaignById(id, token);
        setCampaign(campaignResponse.data.data);
        setFormData({
          title: campaignResponse.data.data.title,
          link: campaignResponse.data.data.link,
          description: campaignResponse.data.data.description || '',
          image: null
        });
        
        // Fetch all products
        const productsResponse = await productAPI.getProducts();
        
        // Make sure we have an array of products - add error checking
        if (productsResponse.data && Array.isArray(productsResponse.data.data)) {
          setAllProducts(productsResponse.data.data);
        } else {
          console.error("Products data is not in expected format:", productsResponse.data);
          setAllProducts([]); // Set to empty array as fallback
        }
        
        // Fetch campaign products if the API supports it
        try {
          const campaignProductsResponse = await campaignAPI.getCampaignProducts(id, token);
          if (campaignProductsResponse.data && Array.isArray(campaignProductsResponse.data.data)) {
            setCampaignProducts(campaignProductsResponse.data.data);
          } else {
            console.error("Campaign products data is not in expected format:", campaignProductsResponse.data);
            setCampaignProducts([]);
          }
        } catch (error) {
          console.error("Could not fetch campaign products:", error);
          setCampaignProducts([]);
        }
      } catch (error) {
        setError(error.response?.data?.message || 'An error occurred');
        toast.error('Failed to load campaign details');
        console.error(error);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignAndProducts();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });

      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Please provide a campaign title');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const form = new FormData();
      form.append('campaignId', campaign._id);
      form.append('title', formData.title);
      form.append('link', formData.link || '');
      form.append('description', formData.description || '');
      
      if (formData.image) {
        form.append('image', formData.image);
      }

      // Log the data being sent to help debug
      console.log('Updating campaign with data:', {
        campaignId: campaign._id,
        title: formData.title,
        link: formData.link || '',
        description: formData.description || '',
        hasImage: !!formData.image
      });

      await campaignAPI.updateCampaign(form, token);
      toast.success('Campaign updated successfully');
      setIsEditing(false);
      
      // Refresh campaign data
      const response = await campaignAPI.getCampaignById(id, token);
      setCampaign(response.data.data);
    } catch (error) {
      toast.error('Failed to update campaign');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProducts = async (selectedProducts, discountPercent) => {
    try {
      setLoadingProducts(true);
      const token = localStorage.getItem('authToken');
      
      // Make sure we have the proper request format
      const requestData = {
        products: selectedProducts,
        discount: discountPercent
      };
      
      console.log('Adding products to campaign:', requestData);
      
      // Fix the API URL by not using process.env.REACT_APP_API_URL directly
      // Instead, use the configured API utility if available
      let response;
      
      // Option 1: If you have a campaignAPI utility
      response = await campaignAPI.addProductsBatchToCampaign(
        campaign._id,
        requestData,
        token
      );
      
      // Option 2: If you need to use axios directly, make sure the base URL is correct
      /* 
      const baseUrl = 'http://localhost:5000'; // Hard-code the base URL to ensure it's correct
      response = await axios.post(
        `${baseUrl}/api/campaigns/${campaign._id}/products/batch`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      */
      
      if (response.data && response.data.success) {
        toast.success('Products added to campaign successfully');
        
        // Refresh campaign products
        const productsResponse = await campaignAPI.getCampaignProducts(campaign._id, token);
        if (productsResponse.data && productsResponse.data.success) {
          setCampaignProducts(productsResponse.data.data);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to add products');
      }
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error(error.response?.data?.message || 'Failed to add products to campaign');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    try {
      setLoadingProducts(true);
      const token = localStorage.getItem('authToken');
      
      // This is a placeholder - you'll need to implement this API endpoint
      await campaignAPI.removeProductFromCampaign(campaign._id, productId, token);
      
      toast.success('Product removed from campaign');
      
      // Refresh campaign products
      const response = await campaignAPI.getCampaignProducts(id, token);
      setCampaignProducts(response.data.data);
    } catch (error) {
      toast.error('Failed to remove product from campaign');
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = React.useMemo(() => {
    if (!Array.isArray(allProducts)) {
      console.error("allProducts is not an array:", allProducts);
      return [];
    }
    
    return allProducts.filter(product => 
      product.name && product.name.toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  }, [allProducts, searchTerm]);

  // Separate function to fetch products
  const fetchProducts = async () => {
    try {
      setModalLoading(true);
      const token = localStorage.getItem('authToken');
      const productsResponse = await productAPI.getProducts(token);
      
      if (productsResponse.data && productsResponse.data.success) {
        // Process the products data
        let productsData = productsResponse.data.data;
        
        // Check if data has a different structure
        if (productsResponse.data.data.topSales || productsResponse.data.data.trending) {
          productsData = [
            ...(productsResponse.data.data.topSales || []),
            ...(productsResponse.data.data.trending || [])
          ];
        }
        
        // Remove duplicates and filter out products already in the campaign
        const existingProductIds = new Set(campaignProducts.map(p => p._id));
        const uniqueProducts = Array.from(
          new Map(
            productsData
              .filter(product => !existingProductIds.has(product._id))
              .map(item => [item._id, item])
          ).values()
        );
        
        console.log('Filtered products for selection:', uniqueProducts.length);
        setAllProducts(uniqueProducts);
      } else {
        throw new Error(productsResponse.data?.message || 'Failed to load products');
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.response?.data?.message || 'Failed to load products');
      setAllProducts([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Update modal open handler to fetch products
  const handleOpenModal = async () => {
    setIsModalOpen(true);
    await fetchProducts(); // Fetch fresh products when modal opens
  };

  // Update the Add Product button
  const addProductButton = (
    <button
      onClick={handleOpenModal}
      className={`px-4 py-2 rounded-lg bg-gradient-to-r ${theme.buttonPrimary} flex items-center`}
    >
      <PlusIcon className="w-5 h-5 mr-2" />
      Add Products
    </button>
  );

  if (loading) {
    return (
      <div className={`${theme.background} min-h-screen pt-20 pb-10 px-4`}>
        <div className="max-w-6xl mx-auto flex justify-center items-center" style={{ height: "70vh" }}>
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={`${theme.background} min-h-screen pt-20 pb-10 px-4`}>
        <div className="max-w-6xl mx-auto">
          <div className={`${theme.card} rounded-xl p-6 text-center`}>
            <h2 className={`text-xl font-semibold ${theme.text}`}>Campaign not found</h2>
            <p className={`mt-2 ${theme.textSecondary}`}>The campaign you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => navigate(-1)}
              className={`mt-4 px-4 py-2 rounded-lg ${theme.buttonSecondary}`}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.background} min-h-screen pt-20 pb-10 px-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Navigation and Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className={`inline-flex items-center text-sm ${theme.textSecondary} hover:underline mb-2`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Campaigns
            </button>
            <h1 className={`text-2xl font-bold ${theme.text}`}>
              {isEditing ? 'Edit Campaign' : campaign.title}
            </h1>
          </div>
          {!isEditing && (
            <div className="mt-3 sm:mt-0">
              <button
                onClick={() => setIsEditing(true)}
                className={`flex items-center px-4 py-2 rounded-lg bg-gradient-to-r ${theme.buttonPrimary} transition-all`}
              >
                <PencilSquareIcon className="w-5 h-5 mr-2" />
                Edit Campaign
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Campaign Details - without campaign link */}
          <div className="lg:col-span-1">
            <div className={`${theme.card} rounded-xl shadow-md overflow-hidden`}>
              {isEditing ? (
                <div className="p-6">
                  <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Edit Campaign</h2>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="title" className={`block mb-1 text-sm font-medium ${theme.text}`}>
                        Campaign Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        maxLength={50}
                        required
                      />
                      <div className="text-xs text-right mt-1">
                        <span className={theme.textSecondary}>{formData.title.length}/50</span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="link" className={`block mb-1 text-sm font-medium ${theme.text}`}>
                        Campaign Link <span className="text-xs text-gray-500">(optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LinkIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          id="link"
                          name="link"
                          value={formData.link}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                          placeholder="https://example.com (optional)"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className={`block mb-1 text-sm font-medium ${theme.text}`}>
                        Campaign Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        placeholder="Describe your campaign..."
                        rows={3}
                        maxLength={200}
                      />
                      <div className="text-xs text-right mt-1">
                        <span className={theme.textSecondary}>{formData.description.length}/200</span>
                      </div>
                    </div>

                    <div>
                      <label className={`block mb-1 text-sm font-medium ${theme.text}`}>
                        Campaign Image
                      </label>
                      <div
                        className={`flex items-center justify-center h-12 px-4 border border-dashed rounded-lg ${theme.border} cursor-pointer`}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FolderIcon className="w-5 h-5 mr-2 text-gray-400" />
                        <span className={theme.textSecondary}>
                          {formData.image ? formData.image.name : 'Choose new image (optional)'}
                        </span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                      <p className={`text-xs mt-1 ${theme.textSecondary}`}>
                        Leave blank to keep current image
                      </p>
                    </div>

                    {previewImage ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden mt-4">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null);
                            setFormData({...formData, image: null});
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                        >
                          <XMarkIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className={`text-sm font-medium ${theme.textSecondary}`}>Current Image:</p>
                        <div className="mt-2 rounded-lg overflow-hidden">
                          <img
                            src={campaign.image.url}
                            alt={campaign.title}
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className={`px-4 py-2 border rounded-lg ${theme.buttonSecondary} transition-colors`}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded-lg bg-gradient-to-r ${theme.buttonPrimary} transition-all flex items-center`}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Campaign'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div className="w-full h-48 relative">
                    <img 
                      src={campaign.image.url} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${campaign.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className={`text-sm font-medium ${theme.textSecondary}`}>Campaign Title</h3>
                      <p className={`mt-1 text-lg font-semibold ${theme.text}`}>{campaign.title}</p>
                    </div>
                    
                    <div>
                      <h3 className={`text-sm font-medium ${theme.textSecondary}`}>Image Public ID</h3>
                      <p className={`mt-1 text-sm ${theme.text} font-mono break-all`}>{campaign.image.public_id}</p>
                    </div>

                    <div>
                      <h3 className={`text-sm font-medium ${theme.textSecondary}`}>Campaign Description</h3>
                      <p className={`mt-1 text-sm ${theme.text}`}>
                        {campaign.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Campaign Products - with compact mobile header */}
          <div className="lg:col-span-2">
            <div className={`${theme.card} rounded-xl shadow-md p-4 sm:p-6`}>
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-4 gap-2">
                <h2 className={`text-base sm:text-lg font-semibold ${theme.text} flex items-center whitespace-nowrap`}>
                  <ShoppingBagIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Campaign Products</span>
                </h2>
                <button
                  onClick={handleOpenModal}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm rounded-lg bg-gradient-to-r ${theme.buttonPrimary} flex items-center flex-shrink-0`}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  <span>Add Products</span>
                </button>
              </div>
              
              {/* Products List - Updated with responsive grid layout */}
              {loadingProducts ? (
                <div className="flex justify-center items-center p-12">
                  <Spinner size="lg" />
                </div>
              ) : campaignProducts.length === 0 ? (
                <div className={`text-center py-12 ${theme.textSecondary}`}>
                  <ShoppingBagIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-3 text-lg font-medium">No products in this campaign yet</p>
                  <p className="mt-1 text-sm">Add products to offer them at a discount during this campaign</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {campaignProducts.map(product => {
                    // Parse values
                    const price = parseFloat(product.price) || 0;
                    const discountPercent = parseInt(product.discountPercent) || 0;
                    const finalPrice = Math.round(price * (1 - discountPercent/100));
                    
                    return (
                      <div 
                        key={product._id} 
                        className={`${theme.border} border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          {product.image && product.image.url ? (
                            <img 
                              src={product.image.url} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                              <ShoppingBagIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          {discountPercent > 0 && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                              {discountPercent}% OFF
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3">
                          <h3 className={`${theme.text} font-medium text-sm line-clamp-2 h-10`}>
                            {product.name}
                          </h3>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <p className={`${theme.textSecondary} text-xs line-through`}>
                                Rs. {price.toLocaleString()}
                              </p>
                              <p className={`${theme.text} font-semibold`}>
                                Rs. {finalPrice.toLocaleString()}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveProduct(product._id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Remove from campaign"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {product.stock <= 0 && (
                            <span className="mt-1.5 inline-block w-full text-center py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded">
                              Out of stock
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal - Make this fully responsive */}
      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddProducts}
        products={allProducts}
        loadingProducts={modalLoading}
      />
    </div>
  );
};

export default CampaignDetail;
