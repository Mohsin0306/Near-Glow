import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCloseLine, 
  RiImageAddLine, 
  RiInformationLine,
  RiFileListLine,
  RiImageLine,
  RiCheckLine,
  RiPriceTag3Line,
  RiSettings4Line,
  RiVideoAddLine,
  RiVideoLine
} from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const steps = [
  { 
    id: 1, 
    title: 'Basic Info', 
    icon: RiInformationLine,
    description: 'Product name and brand details'
  },
  { 
    id: 2, 
    title: 'Category', 
    icon: RiPriceTag3Line,
    description: 'Category and subcategory selection'
  },
  { 
    id: 3, 
    title: 'Pricing', 
    icon: RiFileListLine,
    description: 'Price and stock information'
  },
  { 
    id: 4, 
    title: 'Details', 
    icon: RiSettings4Line,
    description: 'Specifications and features'
  },
  { 
    id: 5, 
    title: 'Images', 
    icon: RiImageLine,
    description: 'Product images and gallery'
  }
];

const ProductModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const { currentTheme, theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    stock: '',
    status: 'draft',
    subcategories: [],
    specifications: [],
    features: [],
    media: []
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        category: initialData.category?._id || initialData.category || '',
        brand: initialData.brand || '',
        stock: initialData.stock || '',
        status: initialData.status || 'draft',
        subcategories: Array.isArray(initialData.subcategories) 
          ? initialData.subcategories 
          : [],
        specifications: initialData.specifications || [],
        features: initialData.features || [],
        media: initialData.media || [],
        removedMedia: []
      });

      if (initialData.media) {
        const images = initialData.media.filter(m => m.type === 'image');
        const videos = initialData.media.filter(m => m.type === 'video');
        
        setPreviewImages(images.map(img => img.url));
        setPreviewVideos(videos.map(video => ({
          url: video.url,
          thumbnail: video.thumbnail
        })));
        setExistingMedia(initialData.media);
      }
    }
  }, [initialData]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://192.168.0.105:5000/api/categories');
        if (response.data.success) {
          setCategories(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat._id === formData.category);
      if (selectedCategory?.subcategories) {
        setSubcategories(selectedCategory.subcategories);
      }
    }
  }, [formData.category, categories]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      
      if (!isValidType) toast.error(`${file.name} must be JPEG, PNG or WebP`);
      if (!isValidSize) toast.error(`${file.name} must be under 5MB`);
      
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    const newPreviewImages = validFiles.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviewImages]);

    setFormData(prev => ({
      ...prev,
      media: [
        ...prev.media,
        ...validFiles.map(file => ({
          type: 'image',
          file,
          url: URL.createObjectURL(file),
          isNew: true
        }))
      ]
    }));
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      brand: '',
      stock: '',
      status: 'draft',
      subcategories: [],
      specifications: [],
      features: [],
      media: []
    });
    setPreviewImages([]);
    onClose();
  };

  const LoadingSpinner = () => (
    <div className="flex items-center gap-2">
      <svg 
        className="animate-spin h-5 w-5 text-white" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-white">Saving...</span>
    </div>
  );

  const handleSubmit = async () => {
    try {
      const productData = new FormData();
      
      // Add all form fields
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('price', formData.price);
      productData.append('category', formData.category);
      productData.append('brand', formData.brand);
      productData.append('stock', formData.stock);
      productData.append('status', formData.status);
      productData.append('subcategories', JSON.stringify(formData.subcategories));
      productData.append('specifications', JSON.stringify(formData.specifications));
      productData.append('features', JSON.stringify(formData.features));

      // Handle media files
      if (formData.media) {
        formData.media.forEach((mediaItem) => {
          if (mediaItem.file) {
            if (mediaItem.type === 'image') {
              productData.append('images', mediaItem.file);
            } else if (mediaItem.type === 'video') {
              productData.append('videos', mediaItem.file);
            }
          }
        });
      }

      // Handle removed media
      if (formData.removedMedia?.length > 0) {
        productData.append('removedMedia', JSON.stringify(formData.removedMedia));
      }

      // Close modal immediately
      handleClose();
      
      // Submit the form data
      await onSubmit(productData);
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleRemoveImage = (index) => {
    const mediaItem = formData.media[index];
    console.log('Removing media item:', mediaItem);

    setFormData(prev => {
      const updatedMedia = [...prev.media];
      const removedItem = updatedMedia.splice(index, 1)[0];
      
      const updatedRemovedMedia = removedItem.public_id 
        ? [...(prev.removedMedia || []), removedItem.public_id]
        : (prev.removedMedia || []);

      return {
        ...prev,
        media: updatedMedia,
        removedMedia: updatedRemovedMedia
      };
    });

    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      subcategories: []
    }));
  };

  const handleSubcategoryChange = (subcategory) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.includes(subcategory)
        ? prev.subcategories.filter(sub => sub !== subcategory)
        : [...prev.subcategories, subcategory]
    }));
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValidType = ['video/mp4', 'video/webm'].includes(file.type);
      const isValidSize = file.size <= 50 * 1024 * 1024;
      
      if (!isValidType) toast.error(`${file.name} must be MP4 or WebM`);
      if (!isValidSize) toast.error(`${file.name} must be under 50MB`);
      
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    if (previewVideos.length + validFiles.length > 1) {
      toast.error('Only one video allowed');
      return;
    }

    const newPreviewVideos = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    setPreviewVideos(prev => [...prev, ...newPreviewVideos]);

    setFormData(prev => ({
      ...prev,
      media: [
        ...prev.media.filter(item => item.type !== 'video'),
        ...validFiles.map(file => ({
          type: 'video',
          file,
          isNew: true
        }))
      ]
    }));
  };

  const handleRemoveVideo = (index) => {
    const mediaItem = formData.media.find(item => item.type === 'video');
    
    setFormData(prev => {
      const updatedMedia = prev.media.filter(item => item.type !== 'video');
      const updatedRemovedMedia = mediaItem?.public_id 
        ? [...(prev.removedMedia || []), mediaItem.public_id]
        : (prev.removedMedia || []);

      return {
        ...prev,
        media: updatedMedia,
        removedMedia: updatedRemovedMedia
      };
    });

    setPreviewVideos([]);
  };

  const handleStatusChange = (e) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  required
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  rows="4"
                  required
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      category: e.target.value,
                      subcategories: []
                    });
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Subcategories (Select Multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map(subcategory => (
                    <label
                      key={subcategory}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full cursor-pointer ${
                        formData.subcategories.includes(subcategory)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.subcategories.includes(subcategory)}
                        onChange={() => handleSubcategoryChange(subcategory)}
                      />
                      {subcategory}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={handleStatusChange}
                  className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="outOfStock">Out of Stock</option>
                </select>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Price (RS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.text}`}>
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  required
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className={`text-lg font-semibold ${theme.text}`}>
                  Specifications
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      specifications: [...prev.specifications, { key: '', value: '' }]
                    }));
                  }}
                  className={`px-4 py-2 rounded-xl bg-gradient-to-r ${theme.buttonPrimary} transition-all duration-200`}
                >
                  + Add Specification
                </button>
              </div>
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Key"
                    value={spec.key}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        specifications: prev.specifications.map((spec, i) => 
                          i === index ? { ...spec, key: e.target.value } : spec
                        )
                      }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        specifications: prev.specifications.map((spec, i) => 
                          i === index ? { ...spec, value: e.target.value } : spec
                        )
                      }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        specifications: prev.specifications.filter((_, i) => i !== index)
                      }));
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <RiCloseLine size={24} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className={`text-lg font-semibold ${theme.text}`}>
                  Features
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      features: [...prev.features, '']
                    }));
                  }}
                  className={`px-4 py-2 rounded-xl bg-gradient-to-r ${theme.buttonPrimary} transition-all duration-200`}
                >
                  + Add Feature
                </button>
              </div>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Feature"
                    value={feature}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        features: prev.features.map((feature, i) => 
                          i === index ? e.target.value : feature
                        )
                      }));
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} transition-all duration-200`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        features: prev.features.filter((_, i) => i !== index)
                      }));
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <RiCloseLine size={24} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 5:
        return renderMediaSection();

      default:
        return null;
    }
  };

  const renderMediaSection = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div>
          <h4 className={`text-lg font-semibold mb-4 ${theme.text}`}>Images</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewImages.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600"
                  >
                    <RiCloseLine size={16} />
                  </button>
                </div>
              </div>
            ))}
            {previewImages.length < 5 && (
              <label className={`cursor-pointer aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center ${theme.border} hover:border-blue-500 transition-all duration-200`}>
                <RiImageAddLine size={24} className={theme.textSecondary} />
                <span className={`text-sm mt-2 ${theme.textSecondary}`}>Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <h4 className={`text-lg font-semibold mb-4 ${theme.text}`}>Video (Optional)</h4>
          <div className="grid grid-cols-1 gap-4">
            {previewVideos.map((video, index) => (
              <div key={index} className="relative rounded-xl overflow-hidden group bg-black">
                <video
                  src={video.url}
                  className="w-full h-48 object-cover"
                  controls
                  poster={video.thumbnail}
                />
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(index)}
                    className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600"
                  >
                    <RiCloseLine size={16} />
                  </button>
                </div>
              </div>
            ))}
            {previewVideos.length === 0 && (
              <label className={`cursor-pointer h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center ${theme.border} hover:border-blue-500 transition-all duration-200`}>
                <RiVideoAddLine size={24} className={theme.textSecondary} />
                <span className={`text-sm mt-2 ${theme.textSecondary}`}>Add Video</span>
                <span className={`text-xs mt-1 ${theme.textSecondary}`}>MP4 or WebM, max 50MB</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoChange}
                  className="hidden"
                  name="videos"
                />
              </label>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-20 backdrop-blur-sm"
        >
          <div className="flex items-start md:items-center justify-center min-h-screen p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full min-h-screen md:min-h-0 md:max-w-4xl md:rounded-2xl shadow-xl ${theme.modalBg}`}
            >
              <div className="p-4 md:p-6 pt-16 md:pt-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl ${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      {steps[Math.max(0, currentStep - 1)].icon && React.createElement(steps[Math.max(0, currentStep - 1)].icon, {
                        size: 24,
                        className: theme.text
                      })}
                    </div>
                    <h3 className={`text-xl font-semibold ${theme.text}`}>
                      {steps[Math.max(0, currentStep - 1)].title}
                    </h3>
                  </div>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    {steps[Math.max(0, currentStep - 1)].description}
                  </p>
                </div>

                <div className="flex justify-center items-center gap-3 mb-6">
                  {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                          step.id === currentStep
                            ? 'bg-gradient-to-r ' + theme.buttonPrimary
                            : step.id < currentStep
                            ? 'bg-gradient-to-r ' + theme.buttonPrimary + ' opacity-50'
                            : currentTheme === 'dark'
                            ? 'border-2 border-white/20'
                            : 'border-2 ' + theme.border
                        }`}
                      >
                        {step.id < currentStep ? (
                          <RiCheckLine 
                            size={20} 
                            className={currentTheme === 'dark' ? 'text-white' : ''}
                          />
                        ) : (
                          <step.icon 
                            size={20} 
                            className={currentTheme === 'dark' ? 'text-white' : ''}
                          />
                        )}
                      </div>
                      <div className={`h-1 w-8 mt-2 ${
                        step.id !== steps.length
                          ? step.id < currentStep
                            ? 'bg-gradient-to-r ' + theme.buttonPrimary + ' opacity-50'
                            : currentTheme === 'dark'
                            ? 'bg-white/20'
                            : theme.border
                          : 'bg-transparent'
                      }`} />
                    </div>
                  ))}
                </div>

                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="mb-8"
                >
                  {renderStepContent()}
                </motion.div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      currentStep === 1 || loading ? 'opacity-50 cursor-not-allowed' : theme.buttonSecondary
                    }`}
                    disabled={currentStep === 1 || loading}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep < steps.length) {
                        setCurrentStep(currentStep + 1);
                      } else {
                        handleSubmit();
                      }
                    }}
                    className={`px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r ${theme.buttonPrimary} transition-all duration-200`}
                  >
                    {currentStep === steps.length ? 'Save Product' : 'Next'}
                  </button>
                </div>

                <button
                  onClick={handleClose}
                  className={`absolute top-4 right-4 p-2 rounded-xl ${theme.hover} transition-all duration-200`}
                  disabled={loading}
                >
                  <RiCloseLine 
                    size={24} 
                    className={theme.text}
                  />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal; 