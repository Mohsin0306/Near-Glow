import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminProfileAPI } from '../../utils/api';
import { FiEdit3, FiCamera, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { theme, currentTheme } = useTheme();
  const { token, updateUser, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Initialize with default values
  const defaultFormData = {
    name: '',
    username: '',
    email: '',
    phoneNumber: '',
    bio: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    businessDetails: {
      companyName: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: ''
    },
    profilePicture: {
      public_id: '',
      url: ''
    }
  };

  const [profile, setProfile] = useState(defaultFormData);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchProfile();
  }, [token, isAdmin, navigate]);

  const fetchProfile = async () => {
    try {
      if (!token || !user || !isAdmin) {
        setLoading(false);
        return;
      }

      const response = await adminProfileAPI.getProfile(token);
      const profileData = {
        ...defaultFormData,
        ...response.data.data,
        socialLinks: {
          ...defaultFormData.socialLinks,
          ...response.data.data.socialLinks
        },
        businessDetails: {
          ...defaultFormData.businessDetails,
          ...response.data.data.businessDetails
        }
      };
      setProfile(profileData);
      setFormData(profileData);
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    if (!isAdmin) {
      toast.error('Unauthorized access');
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      setUploadingImage(true);
      const response = await adminProfileAPI.updateProfilePicture(formData, token);
      setProfile(prev => ({
        ...prev,
        profilePicture: response.data.data.profilePicture
      }));
      setFormData(prev => ({
        ...prev,
        profilePicture: response.data.data.profilePicture
      }));
      toast.success('Profile picture updated');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!isAdmin) {
      toast.error('Unauthorized access');
      return;
    }
    try {
      await adminProfileAPI.deleteProfilePicture(token);
      setProfile(prev => ({
        ...prev,
        profilePicture: { public_id: '', url: '' }
      }));
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove profile picture');
    }
  };

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target;
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isAdmin) {
        toast.error('Unauthorized access');
        return;
      }

      // Only send fields that are in the Seller model
      const updateData = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        socialLinks: formData.socialLinks,
        businessDetails: formData.businessDetails
      };

      const response = await adminProfileAPI.updateProfile(updateData, token);
      
      // Update local state
      setProfile(response.data.data);
      setFormData(response.data.data);
      setEditing(false);
      
      // Update user context without redirecting
      updateUser({
        ...user,
        ...response.data.data
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Mobile Header - Always visible on mobile */}
      <div className="block md:hidden fixed top-0 left-0 right-0 z-10 bg-opacity-95 backdrop-blur-sm shadow-lg">
        <div className={`${theme.card} p-3 flex justify-between items-center`}>
          <h1 className={`text-lg font-bold ${theme.text}`}>Profile Settings</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(!editing)}
            className={`px-3 py-1.5 rounded-lg ${editing ? theme.buttonDanger : theme.buttonSecondary} flex items-center gap-1.5 text-sm`}
          >
            {editing ? (
              <>
                <FiX size={18} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <FiEdit3 size={18} />
                <span>Edit</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Main Content - Adjusted padding for mobile */}
      <div className="max-w-7xl mx-auto p-3 md:p-6 lg:p-8 mt-14 md:mt-0">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl ${theme.card} p-4 md:p-6 mb-4 md:mb-6 shadow-lg relative`}
        >
          {/* Edit Button - Visible on both mobile and desktop */}
          <div className="absolute top-4 right-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(!editing)}
              className={`
                px-4 py-2 
                rounded-lg 
                ${editing ? 
                  'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white' : 
                  'bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white'
                } 
                flex items-center gap-2 
                shadow-sm hover:shadow-md 
                transition-all duration-300
                text-[15px]
                font-medium
                border border-gray-200/10
              `}
            >
              {editing ? (
                <>
                  <FiX size={18} />
                  <span className="hidden md:inline">Cancel</span>
                </>
              ) : (
                <>
                  <FiEdit3 size={18} />
                  <span className="hidden md:inline">Edit Profile</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Profile Content - More compact on mobile */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mt-8 md:mt-0">
            {/* Profile Picture - Smaller on mobile */}
            <div className="relative group">
              <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 ${theme.border} shadow-lg transition-transform duration-300 group-hover:scale-105`}>
                {profile?.profilePicture?.url ? (
                  <img
                    src={profile.profilePicture.url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${theme.background} ${theme.text} text-3xl md:text-4xl font-bold`}>
                    {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              
              {/* Image Upload Controls - Compact on mobile */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="flex gap-1.5 md:gap-2 backdrop-blur-sm bg-black/30 p-1.5 md:p-2 rounded-lg">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 md:p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
                    title="Upload new picture"
                  >
                    <FiCamera size={16} className="md:w-5 md:h-5" />
                  </button>
                  {profile.profilePicture?.url && (
                    <button
                      onClick={handleDeleteImage}
                      className="p-1.5 md:p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                      title="Remove picture"
                    >
                      <FiTrash2 size={16} className="md:w-5 md:h-5" />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
            </div>

            {/* Profile Info - Compact on mobile */}
            <div className="flex-1 text-center md:text-left space-y-2 md:space-y-3">
              <h1 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>{profile.name}</h1>
              <p className={`text-base md:text-lg ${theme.textSecondary}`}>{profile.email}</p>
              <p className={`${theme.textSecondary} text-sm max-w-2xl hidden md:block`}>
                {profile.bio || 'No bio added yet'}
              </p>
              
              {/* Social Links - Compact grid on mobile */}
              {!editing && (
                <div className="grid grid-cols-4 md:flex gap-3 justify-center md:justify-start mt-3">
                  {profile.socialLinks?.facebook && (
                    <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                      <FaFacebook size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                  {profile.socialLinks?.twitter && (
                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
                      <FaTwitter size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                  {profile.socialLinks?.instagram && (
                    <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                      <FaInstagram size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                  {profile.socialLinks?.linkedin && (
                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800">
                      <FaLinkedin size={20} className="md:w-6 md:h-6" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Edit Form - More compact on mobile */}
        <AnimatePresence>
          {editing && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleSubmit}
              className="space-y-4 md:space-y-6 mb-24 md:mb-0"
            >
              {/* Personal Information */}
              <div className={`rounded-xl ${theme.card} p-4 md:p-6 shadow-lg`}>
                <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${theme.text} border-b ${theme.border} pb-2`}>
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Name"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Bio"
                    className={`p-2 rounded-lg col-span-2 ${theme.input}`}
                    rows="3"
                  />
                </div>
              </div>

              {/* Business Details */}
              <div className={`rounded-xl ${theme.card} p-4 md:p-6 shadow-lg`}>
                <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${theme.text} border-b ${theme.border} pb-2`}>
                  Business Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <input
                    type="text"
                    name="companyName"
                    value={formData.businessDetails.companyName}
                    onChange={(e) => handleInputChange(e, 'businessDetails')}
                    placeholder="Company Name"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                  <input
                    type="text"
                    name="businessAddress"
                    value={formData.businessDetails.businessAddress}
                    onChange={(e) => handleInputChange(e, 'businessDetails')}
                    placeholder="Business Address"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                  <input
                    type="tel"
                    name="businessPhone"
                    value={formData.businessDetails.businessPhone}
                    onChange={(e) => handleInputChange(e, 'businessDetails')}
                    placeholder="Business Phone"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessDetails.businessEmail}
                    onChange={(e) => handleInputChange(e, 'businessDetails')}
                    placeholder="Business Email"
                    className={`p-2 rounded-lg ${theme.input}`}
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className={`rounded-xl ${theme.card} p-4 md:p-6 shadow-lg mb-16 md:mb-6`}>
                <h2 className={`text-lg md:text-xl font-semibold mb-3 md:mb-4 ${theme.text} border-b ${theme.border} pb-2`}>
                  Social Links
                </h2>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="flex items-center gap-2">
                    <FaFacebook className="text-blue-600 min-w-[20px]" size={20} />
                    <input
                      type="url"
                      name="facebook"
                      value={formData.socialLinks.facebook}
                      onChange={(e) => handleInputChange(e, 'socialLinks')}
                      placeholder="Facebook URL"
                      className={`p-2 rounded-lg flex-1 ${theme.input}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTwitter className="text-blue-400 min-w-[20px]" size={20} />
                    <input
                      type="url"
                      name="twitter"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => handleInputChange(e, 'socialLinks')}
                      placeholder="Twitter URL"
                      className={`p-2 rounded-lg flex-1 ${theme.input}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FaInstagram className="text-pink-600 min-w-[20px]" size={20} />
                    <input
                      type="url"
                      name="instagram"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => handleInputChange(e, 'socialLinks')}
                      placeholder="Instagram URL"
                      className={`p-2 rounded-lg flex-1 ${theme.input}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FaLinkedin className="text-blue-700 min-w-[20px]" size={20} />
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.socialLinks.linkedin}
                      onChange={(e) => handleInputChange(e, 'socialLinks')}
                      placeholder="LinkedIn URL"
                      className={`p-2 rounded-lg flex-1 ${theme.input}`}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button - Fixed at bottom with increased z-index */}
              <div className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto p-3 md:p-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm md:bg-transparent z-50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className={`
                    w-full md:w-auto 
                    px-6 py-2.5 
                    rounded-lg 
                    bg-gray-900 hover:bg-gray-800 
                    dark:bg-gray-800 dark:hover:bg-gray-700 
                    text-white 
                    font-medium 
                    shadow-sm hover:shadow-md 
                    transition-all duration-300 
                    flex items-center justify-center gap-2
                    border border-gray-200/10
                  `}
                >
                  <FiSave size={18} className="text-white/90" />
                  <span className="text-[15px]">Save Changes</span>
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
