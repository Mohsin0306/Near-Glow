import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { PlusIcon, FolderIcon, XMarkIcon, CheckIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { campaignAPI } from '../../../utils/api';
import { useTheme } from '../../../context/ThemeContext';
import CampaignDetail from './CampaignDetail';
import Spinner from '../../common/Spinner';
import EmptyState from '../../common/EmptyState';
import { useNavigate, useParams } from 'react-router-dom';

// Custom icon components
const PlusIconCustom = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const FolderIconCustom = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const XMarkIconCustom = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIconCustom = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const TrashIconCustom = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ArrowPathIconCustom = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CampaignManager = () => {
  const { theme } = useTheme();
  const { userId } = useParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    description: '',
    image: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await campaignAPI.getCampaigns(token);
      setCampaigns(response.data.data);
    } catch (error) {
      toast.error('Failed to load campaigns');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });

      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.image) {
      toast.error('Please provide a title and upload an image');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const form = new FormData();
      form.append('title', formData.title);
      form.append('link', formData.link || '');
      form.append('description', formData.description || '');
      form.append('image', formData.image);

      // Log the data being sent to help debug
      console.log('Creating campaign with data:', {
        title: formData.title,
        link: formData.link || '',
        description: formData.description || '',
        hasImage: !!formData.image
      });

      await campaignAPI.createCampaign(form, token);
      toast.success('Campaign created successfully');
      resetForm();
      fetchCampaigns();
      setIsCreating(false);
    } catch (error) {
      toast.error('Failed to create campaign');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      link: '',
      description: '',
      image: null
    });
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleStatus = async (campaignId, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('authToken');
      await campaignAPI.updateCampaignStatus(campaignId, token);
      fetchCampaigns();
      toast.success('Campaign status updated');
    } catch (error) {
      toast.error('Failed to update campaign status');
      console.error(error);
    }
  };

  const handleDelete = async (campaignId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        const token = localStorage.getItem('authToken');
        await campaignAPI.deleteCampaign(campaignId, token);
        fetchCampaigns();
        toast.success('Campaign deleted successfully');
      } catch (error) {
        toast.error('Failed to delete campaign');
        console.error(error);
      }
    }
  };

  const handleViewDetail = (campaign) => {
    navigate(`/${userId}/admin/campaigns/${campaign._id}`);
  };

  return (
    <div className={`${theme.background} min-h-screen w-full`}>
      {/* Main Content - With increased top margin for navbar */}
      <div className="pt-20 sm:pt-24 pb-8 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
            <h1 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>Campaign Manager</h1>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className={`flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r ${theme.buttonPrimary} transition-all w-full sm:w-auto`}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Campaign
              </button>
            )}
          </div>

          {/* Create Campaign Form - Fully Responsive */}
          {isCreating && (
            <div className={`${theme.card} rounded-lg shadow-lg p-4 sm:p-6 mb-6 transition-all animate-fadeIn`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>Create New Campaign</h2>
                <button 
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <div className="mb-4">
                      <label htmlFor="title" className={`block mb-2 text-sm font-medium ${theme.text}`}>
                        Campaign Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        placeholder="Enter campaign title"
                        maxLength={50}
                      />
                      <div className="text-xs text-right mt-1">
                        <span className={theme.textSecondary}>{formData.title.length}/50</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="link" className={`block mb-2 text-sm font-medium ${theme.text}`}>
                        Campaign Link <span className="text-xs text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="url"
                        id="link"
                        name="link"
                        value={formData.link}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        placeholder="https://example.com/campaign (optional)"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="description" className={`block mb-2 text-sm font-medium ${theme.text}`}>
                        Campaign Description <span className="text-xs text-gray-500">(optional)</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg border ${theme.input} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                        placeholder="Describe your campaign..."
                        rows={3}
                        maxLength={200}
                      />
                      <div className="text-xs text-right mt-1">
                        <span className={theme.textSecondary}>{formData.description.length}/200</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className={`block mb-2 text-sm font-medium ${theme.text}`}>
                        Campaign Image
                      </label>
                      <div className={`flex items-center justify-center h-12 px-4 border border-dashed rounded-lg ${theme.border} cursor-pointer`}
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FolderIcon className="w-5 h-5 mr-2 text-gray-400" />
                        <span className={theme.textSecondary}>
                          {formData.image ? formData.image.name : 'Choose banner image'}
                        </span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    {previewImage ? (
                      <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
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
                      <div className={`w-full h-48 sm:h-64 flex items-center justify-center border-2 border-dashed ${theme.border} rounded-lg`}>
                        <div className="text-center p-4">
                          <FolderIcon className="mx-auto h-10 w-10 text-gray-400" />
                          <p className={`mt-1 ${theme.textSecondary} text-sm`}>Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end mt-6 space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      resetForm();
                    }}
                    className={`px-4 py-2 border rounded-lg ${theme.buttonSecondary} transition-colors w-full sm:w-auto`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg bg-gradient-to-r ${theme.buttonPrimary} transition-all w-full sm:w-auto`}
                  >
                    Create Campaign
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Campaigns List - Updated grid columns */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={<FolderIcon className="w-12 h-12 sm:w-16 sm:h-16" />}
              title="No campaigns yet"
              description="Start creating promotional campaigns to showcase on your website"
              action={
                <button
                  onClick={() => setIsCreating(true)}
                  className={`mt-4 flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r ${theme.buttonPrimary} transition-all w-full sm:w-auto`}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create First Campaign
                </button>
              }
            />
          ) : (
            <div className="w-full">
              {/* Modified grid: 2 columns on mobile, 6 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {campaigns.map((campaign) => (
                  <div 
                    key={campaign._id}
                    onClick={() => handleViewDetail(campaign)}
                    className={`${theme.card} overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer`}
                  >
                    {/* Campaign Image */}
                    <div className="relative aspect-square">
                      <img
                        src={campaign.image.url}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-xs font-medium
                        ${campaign.isActive 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-500 text-white'}`}>
                        {campaign.isActive ? 'Active' : 'Inactive'}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={(e) => handleToggleStatus(campaign._id, e)}
                          className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm"
                          aria-label={campaign.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {campaign.isActive ? (
                            <CheckIcon className="w-3.5 h-3.5" />
                          ) : (
                            <XMarkIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleDelete(campaign._id, e)}
                          className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white shadow-sm"
                          aria-label="Delete"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Campaign Info */}
                    <div className="p-3">
                      <h3 className={`font-semibold text-sm truncate ${theme.text}`}>
                        {campaign.title}
                      </h3>
                      <p className={`text-xs truncate mt-1 ${theme.textSecondary}`}>
                        {campaign.link.replace(/^https?:\/\//, '')}
                      </p>
                      
                      {/* View button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(campaign);
                        }}
                        className={`mt-2 w-full text-xs font-medium ${theme.buttonSecondary} px-3 py-1.5 rounded-md border flex items-center justify-center`}
                      >
                        <EyeIcon className="w-3.5 h-3.5 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          {campaigns.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={fetchCampaigns}
                className={`flex items-center px-4 py-2 rounded-lg ${theme.buttonSecondary} transition-all`}
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Refresh Campaigns
              </button>
            </div>
          )}

          {/* Campaign Detail Modal */}
          {showDetail && selectedCampaign && (
            <CampaignDetail
              campaign={selectedCampaign}
              onClose={() => {
                setShowDetail(false);
                setSelectedCampaign(null);
              }}
              onUpdate={fetchCampaigns}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignManager;
