import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  RiUser3Line,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiEditLine,
  RiImageEditLine,
  RiShoppingBag3Line,
  RiHeartLine,
  RiSettings4Line,
  RiShareCircleLine,
  RiWallet3Line,
  RiShieldLine,
  RiTimeLine,
  RiCheckLine,
  RiUserLine,
  RiDeleteBin6Line
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    preferredScents: user?.preferredScents || [],
    allergies: user?.allergies || [],
    bio: user?.bio || '',
    image: null
  });

  // Add default stats data
  const defaultStats = {
    orders: 0,
    totalSaved: 0,
    wishlist: 0
  };

  const stats = [
    { 
      icon: RiShoppingBag3Line, 
      label: 'Total Orders', 
      value: user?.stats?.orders || 0,
      color: 'bg-blue-500/10 text-blue-500'
    },
    { 
      icon: RiWallet3Line, 
      label: 'Total Saved', 
      value: user?.stats?.totalSaved || 0,
      color: 'bg-green-500/10 text-green-500'
    },
    { 
      icon: RiHeartLine, 
      label: 'Wishlist', 
      value: user?.stats?.wishlist || 0,
      color: 'bg-red-500/10 text-red-500'
    },
  ];

  // Add state for tag inputs
  const [tagInputs, setTagInputs] = useState({
    preferredScents: '',
    allergies: ''
  });

  // Add state for image preview
  const [imagePreview, setImagePreview] = useState(null);

  // Update handleInputChange for regular inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle tag inputs separately
    if (name === 'preferredscents' || name === 'allergies') {
      // Check if the value ends with a comma
      if (value.endsWith(',')) {
        const fieldName = name;
        const inputValue = value;
        handleTagAddition(fieldName, inputValue);
        return;
      }
      
      setTagInputs(prev => ({
        ...prev,
        [name === 'preferredscents' ? 'preferredScents' : 'allergies']: value
      }));
      return;
    }

    // Handle other fields
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update handleTagAddition to handle both comma and manual addition
  const handleTagAddition = (fieldName, inputValue) => {
    // Remove any trailing comma and trim whitespace
    const cleanedValue = inputValue.replace(/,\s*$/, '').trim();
    if (!cleanedValue) return;

    // Split by comma if multiple values are pasted
    const newTags = cleanedValue.split(',').map(tag => tag.trim()).filter(tag => tag);
    const arrayFieldName = fieldName === 'preferredscents' ? 'preferredScents' : 'allergies';

    setFormData(prev => ({
      ...prev,
      [arrayFieldName]: [...new Set([...prev[arrayFieldName], ...newTags])]
    }));

    // Clear the input
    setTagInputs(prev => ({
      ...prev,
      [arrayFieldName]: ''
    }));
  };

  // Add function to handle tag deletion
  const handleTagDeletion = (fieldName, tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(tag => tag !== tagToDelete)
    }));
  };

  // Update handleSubmit function
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Append basic fields
      const allowedFields = [
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'address',
        'city',
        'country',
        'bio'
      ];

      allowedFields.forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Handle arrays
      if (formData.preferredScents?.length > 0) {
        formDataToSend.append('preferredScents', formData.preferredScents.join(','));
      }
      if (formData.allergies?.length > 0) {
        formDataToSend.append('allergies', formData.allergies.join(','));
      }

      // Handle image upload separately - IMPORTANT: Use 'image' as the field name
      if (formData.image instanceof File) {
        formDataToSend.append('image', formData.image); // Changed to 'image' to match multer
      }

      const response = await axios.put(
        'http://192.168.100.17:5000/api/buyers/profile',
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setUser(response.data.buyer);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'Error updating profile');
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  // Update handleImageChange function
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, JPG, or WebP)');
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Update formData with the new image
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Add function to fetch profile data
  const fetchProfileData = async () => {
    try {
      const response = await axios.get('http://192.168.100.17:5000/api/buyers/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.success) {
        const buyerData = response.data.buyer;
        setUser(buyerData);
        setFormData({
          firstName: buyerData.firstName || '',
          lastName: buyerData.lastName || '',
          email: buyerData.email || '',
          phoneNumber: buyerData.phoneNumber || '',
          address: buyerData.address || '',
          city: buyerData.city || '',
          country: buyerData.country || '',
          preferredScents: buyerData.preferredScents || [],
          allergies: buyerData.allergies || [],
          bio: buyerData.bio || '',
          image: null
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching profile data');
      toast.error(err.response?.data?.message || 'Error fetching profile data');
    }
  };

  // Add useEffect to fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Update handleDeleteProfilePicture function
  const handleDeleteProfilePicture = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(
        'http://192.168.100.17:5000/api/buyers/profile/picture',
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          profilePicture: null
        }));
        setImagePreview(null);
        setFormData(prev => ({
          ...prev,
          image: null
        }));
        toast.success('Profile picture deleted successfully');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete profile picture');
      toast.error('Failed to delete profile picture');
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to monitor form data changes
  useEffect(() => {
    if (formData.image instanceof File) {
      console.log('Profile picture file ready for upload:', formData.image.name);
    }
  }, [formData.image]);

  const menuItems = [
    { 
      icon: RiShareCircleLine, 
      label: 'Referral Program', 
      subtext: 'Invite friends & earn rewards',
      path: '/referral',
      highlight: true,
      gradientColors: currentTheme === 'eyeCare' 
        ? 'from-[#A89078]/20 to-[#8B7355]/20' 
        : 'from-purple-500/10 to-blue-500/10',
      iconBg: currentTheme === 'eyeCare'
        ? 'bg-[#A89078]/20 text-[#8B7355]'
        : 'bg-purple-500/20 text-purple-500'
    },
    { 
      icon: RiShieldLine, 
      label: 'Security Settings', 
      subtext: 'Manage your account security',
      path: '/settings?section=privacy',
      gradientColors: currentTheme === 'eyeCare'
        ? 'from-[#B59B6D]/10 to-[#8B7355]/10'
        : 'from-blue-500/10 to-indigo-500/10',
      iconBg: currentTheme === 'eyeCare'
        ? 'bg-[#B59B6D]/20 text-[#8B7355]'
        : 'bg-blue-500/20 text-blue-500'
    },
    { 
      icon: RiSettings4Line, 
      label: 'Preferences', 
      subtext: 'Customize your experience',
      path: '/settings?section=account',
      gradientColors: currentTheme === 'eyeCare'
        ? 'from-[#C1A173]/10 to-[#8B7355]/10'
        : 'from-green-500/10 to-emerald-500/10',
      iconBg: currentTheme === 'eyeCare'
        ? 'bg-[#C1A173]/20 text-[#8B7355]'
        : 'bg-green-500/20 text-green-500'
    },
  ];

  const getThemeStyles = () => ({
    background: currentTheme === 'dark' ? 'bg-gray-800' 
      : currentTheme === 'eyeCare' ? 'bg-[#E6D5BC]'
      : 'bg-white',
    text: currentTheme === 'dark' ? 'text-white' 
      : currentTheme === 'eyeCare' ? 'text-[#433422]'
      : 'text-gray-900',
    subtext: currentTheme === 'dark' ? 'text-gray-400' 
      : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
      : 'text-gray-500',
  });

  const styles = getThemeStyles();

  // Update the profile details section
  const profileDetails = [
    { 
      icon: RiUser3Line, 
      label: 'First Name', 
      name: 'firstName',
      value: formData.firstName 
    },
    { 
      icon: RiUser3Line, 
      label: 'Last Name', 
      name: 'lastName',
      value: formData.lastName 
    },
    { 
      icon: RiMailLine, 
      label: 'Email', 
      name: 'email',
      value: formData.email,
      type: 'email',
      disabled: false
    },
    { 
      icon: RiPhoneLine, 
      label: 'Phone Number', 
      name: 'phoneNumber',
      value: formData.phoneNumber 
    },
    { 
      icon: RiMapPinLine, 
      label: 'Address', 
      name: 'address',
      value: formData.address 
    },
    { 
      icon: RiMapPinLine, 
      label: 'City', 
      name: 'city',
      value: formData.city 
    },
    { 
      icon: RiMapPinLine, 
      label: 'Country', 
      name: 'country',
      value: formData.country 
    },
  ];

  // Add new sections for preferred scents and allergies
  const additionalDetails = [
    {
      label: 'Preferred Scents',
      name: 'preferredscents',
      value: formData.preferredScents,
      isEditable: true,
      type: 'tags',
      placeholder: 'Enter scents separated by commas (e.g., Floral, Woody, Citrus)'
    },
    {
      label: 'Allergies',
      name: 'allergies',
      value: formData.allergies,
      isEditable: true,
      type: 'tags',
      placeholder: 'Enter allergies separated by commas (e.g., Lavender, Musk)'
    },
    {
      label: 'Bio',
      name: 'bio',
      value: formData.bio,
      isEditable: true,
      type: 'textarea'
    }
  ];

  // Update useEffect for fetching profile data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        preferredScents: user.preferredScents || [],
        allergies: user.allergies || [],
        bio: user.bio || '',
        image: null
      });
    }
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Modern Profile Header Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`${styles.background} rounded-xl sm:rounded-2xl overflow-hidden shadow-lg p-4 sm:p-6`}
      >
        {/* Profile Info */}
        <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          {/* Avatar Section */}
          <motion.div whileHover={{ scale: 1.05 }} className="relative mx-auto sm:mx-0">
            {(user?.profilePicture?.url || imagePreview) ? (
              // Show uploaded profile picture or preview if available
              <div className="relative group">
                <img 
                  src={imagePreview || user.profilePicture.url} 
                  alt={user?.firstName}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl shadow-lg object-cover ring-4 ring-white/10"
                />
                {isEditing && (
                  <div className="absolute -right-2 -bottom-2 flex gap-2 scale-90 sm:scale-100">
                    <label className="p-1.5 sm:p-2 rounded-xl bg-white/90 shadow-lg
                      hover:bg-white transition-colors cursor-pointer">
                      <input 
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            console.log('File selected:', file.name);
                            handleImageChange(e);
                          }
                        }}
                        onClick={(e) => e.target.value = null} // Reset input value
                      />
                      <RiImageEditLine size={16} className="text-gray-700 sm:w-[18px] sm:h-[18px]" />
                    </label>
                    {(user?.profilePicture?.url || imagePreview) && (
                      <button
                        onClick={handleDeleteProfilePicture}
                        className="p-1.5 sm:p-2 rounded-xl bg-white/90 shadow-lg
                        hover:bg-white hover:text-red-500 transition-colors"
                      >
                        <RiDeleteBin6Line size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    )}
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl sm:rounded-2xl 
                    flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <span className="text-white text-sm mt-2">Uploading...</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="absolute -bottom-8 left-0 right-0 text-center">
                    <span className="text-red-500 text-sm bg-white/90 px-2 py-1 rounded-lg shadow-lg">
                      {error}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // Show default profile icon if no picture
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl shadow-lg 
                flex items-center justify-center relative
                ${currentTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'}
                ring-4 ${currentTheme === 'dark' ? 'ring-white/10' : 'ring-gray-100'}`}
              >
                <RiUserLine 
                  size={48}
                  className={`sm:w-16 sm:h-16 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                />
                {isEditing && (
                  <label className="absolute -right-2 -bottom-2 p-1.5 sm:p-2 rounded-xl bg-white/90 shadow-lg
                    hover:bg-white transition-colors cursor-pointer scale-90 sm:scale-100">
                    <input 
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          console.log('File selected:', file.name);
                          handleImageChange(e);
                        }
                      }}
                      onClick={(e) => e.target.value = null} // Reset input value
                    />
                    <RiImageEditLine size={16} className="text-gray-700 sm:w-[18px] sm:h-[18px]" />
                  </label>
                )}
              </div>
            )}
          </motion.div>

          {/* Profile Details */}
          <div className="flex-1 space-y-3 sm:space-y-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-3 sm:gap-0">
              <div className="space-y-1">
                <h1 className={`text-xl sm:text-2xl font-bold ${styles.text}`}>
                  {user?.firstName} {user?.lastName}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                  <RiTimeLine className={styles.subtext} />
                  <span className={styles.subtext}>Member since {user?.memberSince}</span>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => isEditing ? handleSubmit() : setIsEditing(true)}
                disabled={loading}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-sm sm:text-base
                  ${currentTheme === 'dark' 
                    ? 'bg-gray-800/50 hover:bg-gray-800/70' 
                    : 'bg-gray-100 hover:bg-gray-200'} 
                  transition-colors ${styles.text} w-full sm:w-auto justify-center sm:justify-start`}
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <RiCheckLine size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Save Changes</span>
                      </>
                    ) : (
                      <>
                        <RiEditLine size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Edit Profile</span>
                      </>
                    )}
                  </>
                )}
              </motion.button>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center sm:text-left">
                {error}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Input Styles */}
      <style jsx>{`
        input, textarea {
          background: ${currentTheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.5)'};
          border: none;
          outline: none;
          transition: all 0.2s;
          font-size: 14px;
          @media (min-width: 640px) {
            font-size: 16px;
          }
        }

        input:focus, textarea:focus {
          ring: 2px;
          ring-offset: 2px;
          ring-opacity: 0.5;
          ring-color: ${currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        @media (max-width: 640px) {
          .input-group {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 md:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -2, scale: 1.02 }}
            className={`${styles.background} rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg
              h-[100px] md:h-[140px] flex flex-col justify-between`}
          >
            <div className={`inline-flex p-2 md:p-3 rounded-lg md:rounded-xl ${stat.color}`}>
              <stat.icon size={16} className="md:w-6 md:h-6" />
            </div>
            <div>
              <p className={`${styles.subtext} text-xs md:text-sm`}>{stat.label}</p>
              <p className={`${styles.text} text-base md:text-xl font-bold mt-0.5`}>
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Updated Profile Details Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`${styles.background} rounded-2xl p-6 shadow-lg`}
      >
        <h2 className={`${styles.text} text-xl font-bold mb-6`}>Profile Details</h2>
        
        {/* Basic Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {profileDetails.map((detail, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <detail.icon size={18} className={styles.subtext} />
                <p className={`${styles.subtext} text-sm`}>{detail.label}</p>
              </div>
              {isEditing ? (
                <input
                  type={detail.type}
                  name={detail.name}
                  value={detail.value}
                  onChange={handleInputChange}
                  disabled={detail.disabled}
                  className={`w-full pl-7 py-2 rounded-lg ${
                    currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  } ${detail.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              ) : (
                <p className={`${styles.text} pl-7`}>{detail.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {additionalDetails.map((detail, index) => (
            <div key={index} className="space-y-2">
              <p className={`${styles.subtext} text-sm`}>{detail.label}</p>
              {isEditing ? (
                detail.type === 'tags' ? (
                  <div className="space-y-2">
                    {/* Display existing tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData[detail.name === 'preferredscents' ? 'preferredScents' : 'allergies']
                        .map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                              currentTheme === 'dark' 
                                ? 'bg-gray-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {tag}
                            <button
                              onClick={() => handleTagDeletion(
                                detail.name === 'preferredscents' ? 'preferredScents' : 'allergies',
                                tag
                              )}
                              className="text-red-500 hover:text-red-700 focus:outline-none"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                    {/* Update the tag input field */}
                    <input
                      type="text"
                      value={tagInputs[detail.name === 'preferredscents' ? 'preferredScents' : 'allergies']}
                      onChange={(e) => handleInputChange({
                        target: {
                          name: detail.name,
                          value: e.target.value
                        }
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const fieldName = detail.name;
                          const inputValue = tagInputs[detail.name === 'preferredscents' ? 'preferredScents' : 'allergies'];
                          handleTagAddition(fieldName, inputValue);
                        }
                      }}
                      onInput={(e) => {
                        // Handle comma input for mobile
                        if (e.target.value.includes(',')) {
                          const fieldName = detail.name;
                          handleTagAddition(fieldName, e.target.value);
                        }
                      }}
                      onBlur={(e) => {
                        // Add tag when input loses focus
                        const fieldName = detail.name;
                        const inputValue = tagInputs[detail.name === 'preferredscents' ? 'preferredScents' : 'allergies'];
                        if (inputValue.trim()) {
                          handleTagAddition(fieldName, inputValue);
                        }
                      }}
                      placeholder={detail.placeholder}
                      className={`w-full py-2 px-3 rounded-lg ${
                        currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    />
                  </div>
                ) : (
                  <textarea
                    name={detail.name}
                    value={detail.value}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full py-2 px-3 rounded-lg ${
                      currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  />
                )
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.type === 'tags' ? (
                    formData[detail.name === 'preferredscents' ? 'preferredScents' : 'allergies']
                    .length > 0 ? (
                      formData[detail.name === 'preferredscents' ? 'preferredScents' : 'allergies']
                      .map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`px-3 py-1 rounded-full text-sm ${
                            currentTheme === 'dark' 
                              ? 'bg-gray-700 text-gray-300' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className={`${styles.subtext} italic`}>No {detail.label.toLowerCase()} added</p>
                    )
                  ) : (
                    <p className={`${styles.text}`}>
                      {detail.value || `No ${detail.label.toLowerCase()} added`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Menu */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`${styles.background} rounded-2xl p-6 shadow-lg`}
      >
        <h2 className={`${styles.text} text-xl font-bold mb-6`}>Quick Actions</h2>
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                ${item.highlight 
                  ? `bg-gradient-to-r ${item.gradientColors}` 
                  : currentTheme === 'dark'
                    ? 'hover:bg-gray-700/50'
                    : currentTheme === 'eyeCare'
                    ? 'hover:bg-[#D4C3AA]/50'
                    : 'hover:bg-gray-100'
                }
                transform hover:shadow-lg hover:-translate-y-0.5
                ${currentTheme === 'dark' 
                  ? 'hover:bg-opacity-50 hover:ring-1 hover:ring-gray-700' 
                  : currentTheme === 'eyeCare'
                  ? 'hover:ring-1 hover:ring-[#A89078]/30'
                  : 'hover:ring-1 hover:ring-gray-200'
                }`}
            >
              <div className={`p-3 rounded-xl ${item.iconBg}`}>
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <p className={`${styles.text} font-medium`}>{item.label}</p>
                <p className={`${styles.subtext} text-sm`}>{item.subtext}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile; 