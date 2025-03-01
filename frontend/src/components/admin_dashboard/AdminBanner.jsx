import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { bannerAPI } from '../../utils/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBanner = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    buttonText: '',
    buttonLink: '',
    order: 1,
    media: null
  });

  const fetchBanners = async () => {
    try {
      const response = await bannerAPI.getBanners();
      setBanners(response.data.banners);
      // Set next order number automatically
      const maxOrder = Math.max(...response.data.banners.map(b => b.order), 0);
      setFormData(prev => ({ ...prev, order: maxOrder + 1 }));
    } catch (error) {
      toast.error('Failed to fetch banners');
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, media: file });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.media) {
      toast.error('Please upload a media file');
      setLoading(false);
      return;
    }

    // Check if order already exists
    if (banners.some(banner => banner.order === parseInt(formData.order))) {
      toast.error('This order number is already in use');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      if (formData.title) formDataToSend.append('title', formData.title);
      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.buttonText) formDataToSend.append('buttonText', formData.buttonText);
      if (formData.buttonLink) formDataToSend.append('buttonLink', formData.buttonLink);
      formDataToSend.append('order', formData.order);
      formDataToSend.append('media', formData.media);

      await bannerAPI.createBanner(formDataToSend, token);
      toast.success('Banner created successfully');
      fetchBanners();
      // Reset form
      setFormData({
        title: '',
        description: '',
        buttonText: '',
        buttonLink: '',
        order: formData.order + 1,
        media: null
      });
      setPreviewUrl(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create banner');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bannerId) => {
    try {
      await bannerAPI.deleteBanner(bannerId, token);
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  return (
    <div className={`min-h-screen ${theme.background} pt-[64px] sm:pt-[80px] p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
          <h2 className={`text-3xl font-bold ${theme.text}`}>Banner Management</h2>
          <p className={`mt-2 ${theme.textSecondary}`}>Create and manage your website banners</p>
        </div>

        {/* Add Banner Form */}
        <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
          <h3 className={`text-xl font-semibold mb-6 ${theme.text}`}>Add New Banner</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className={`w-full p-3 ${theme.input} rounded-xl`}
                    placeholder="Enter banner title"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full p-3 ${theme.input} rounded-xl`}
                    rows="4"
                    placeholder="Enter banner description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Button Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                      className={`w-full p-3 ${theme.input} rounded-xl`}
                      placeholder="Enter button text"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Button Link</label>
                    <input
                      type="text"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
                      className={`w-full p-3 ${theme.input} rounded-xl`}
                      placeholder="Enter button link"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Order*</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                    className={`w-full p-3 ${theme.input} rounded-xl`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme.text}`}>Media (Image/Video)*</label>
                  <div className={`border-2 border-dashed ${theme.border} rounded-xl p-6 text-center`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                      onChange={handleMediaChange}
                      className="hidden"
                      id="media-upload"
                      required
                    />
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <div className="space-y-2">
                        <div className={`mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center`}>
                          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className={theme.text}>Click to upload or drag and drop</div>
                        <div className={`text-sm ${theme.textSecondary}`}>
                          Supported formats: JPEG, PNG, WebP, GIF, MP4, WebM, MOV
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Media Preview */}
                {previewUrl && (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                    {formData.media?.type.startsWith('video') ? (
                      <video src={previewUrl} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.media}
              className={`w-full md:w-auto px-8 py-3 bg-gradient-to-r ${theme.buttonPrimary} rounded-xl
                transition duration-200 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Creating...' : 'Create Banner'}
            </button>
          </form>
        </div>

        {/* Banners List */}
        <div className={`${theme.card} rounded-2xl shadow-sm p-6`}>
          <h3 className={`text-xl font-semibold mb-6 ${theme.text}`}>Current Banners</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {banners.map((banner) => (
                <motion.div
                  key={banner._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`group relative ${theme.card} rounded-xl shadow-sm overflow-hidden ${theme.border} hover:shadow-lg transition-shadow`}
                >
                  {/* Order Number Tag */}
                  <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white w-8 h-8 
                    rounded-full flex items-center justify-center font-semibold shadow-sm">
                    {banner.order}
                  </div>

                  {/* Media */}
                  <div className="aspect-video relative">
                    {banner.media.type === 'video' ? (
                      <video
                        src={banner.media.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={banner.media.url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {banner.title && (
                      <h4 className={`font-semibold text-lg mb-2 ${theme.text}`}>{banner.title}</h4>
                    )}
                    {banner.description && (
                      <p className={`${theme.textSecondary} text-sm mb-3 line-clamp-2`}>
                        {banner.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {banner.buttonText && (
                          <span className={`text-sm ${theme.textSecondary}`}>
                            Button: {banner.buttonText}
                          </span>
                        )}
                        {banner.buttonLink && (
                          <a 
                            href={banner.buttonLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            View Link
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBanner;
