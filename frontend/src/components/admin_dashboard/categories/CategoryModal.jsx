import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';
import toast from 'react-hot-toast';
import { 
  RiCloseLine, 
  RiImageAddLine, 
  RiArrowRightLine, 
  RiArrowLeftLine,
  RiStarLine, 
  RiAddLine, 
  RiDeleteBinLine, 
  RiPlantLine,
  RiLeafLine,
  RiSunLine, 
  RiMoonLine, 
  RiHeartLine,
  RiFireLine,
  RiWaterFlashLine,
  RiSparklingLine,
  RiGiftLine,
  RiVipCrownLine,
  RiDropLine,
  RiFlowerLine,
  RiMagicLine,
  RiShiningLine,
  RiStarSLine,
  RiMoonClearLine,
  RiSunFoggyLine,
  RiRainbowLine,
  RiCloudLine,
  RiWindyLine,
  RiUmbrellaLine,
  RiPaletteLine
} from 'react-icons/ri';
import * as RiIcons from 'react-icons/ri';

// Separate IconSelector component with proper theme context
const IconSelector = ({ selectedIcon, onSelect }) => {
  const { currentTheme, theme } = useTheme();
  
  const icons = [
    { icon: RiFlowerLine, name: 'Flower' },
    { icon: RiLeafLine, name: 'Leaf' },
    { icon: RiPlantLine, name: 'Plant' },
    { icon: RiSunLine, name: 'Sun' },
    { icon: RiMoonLine, name: 'Moon' },
    { icon: RiHeartLine, name: 'Heart' },
    { icon: RiFireLine, name: 'Fire' },
    { icon: RiWaterFlashLine, name: 'Water' },
    { icon: RiDropLine, name: 'Drop' },
    { icon: RiSparklingLine, name: 'Sparkling' },
    { icon: RiGiftLine, name: 'Gift' },
    { icon: RiVipCrownLine, name: 'Luxury' },
    { icon: RiMagicLine, name: 'Magic' },
    { icon: RiShiningLine, name: 'Shine' },
    { icon: RiStarSLine, name: 'Star' },
    { icon: RiMoonClearLine, name: 'Moon Clear' },
    { icon: RiSunFoggyLine, name: 'Sun Foggy' },
    { icon: RiRainbowLine, name: 'Rainbow' },
    { icon: RiCloudLine, name: 'Cloud' },
    { icon: RiWindyLine, name: 'Windy' },
    { icon: RiUmbrellaLine, name: 'Umbrella' },
    { icon: RiPaletteLine, name: 'Palette' }
  ];

  return (
    <div className="grid grid-cols-7 gap-2">
      {icons.map((IconItem, index) => (
        <button
          key={index}
          onClick={() => onSelect(IconItem.icon)}
          className={`p-2 rounded-lg transition-all duration-300 ${
            selectedIcon === IconItem.icon
              ? currentTheme === 'dark'
                ? 'bg-gray-700'
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5B8]'
                : 'bg-gray-200'
              : currentTheme === 'dark'
              ? 'hover:bg-gray-700'
              : currentTheme === 'eyeCare'
              ? 'hover:bg-[#E6D5B8]'
              : 'hover:bg-gray-100'
          }`}
          title={IconItem.name}
        >
          <IconItem.icon 
            size={24} 
            className={
              currentTheme === 'dark' 
                ? 'text-white' 
                : currentTheme === 'eyeCare'
                ? 'text-[#433422]'
                : 'text-gray-700'
            }
          />
        </button>
      ))}
    </div>
  );
};

const gradientColors = [
  { value: 'from-pink-400 to-rose-500', label: 'Pink Rose' },
  { value: 'from-amber-500 to-red-600', label: 'Amber Red' },
  { value: 'from-cyan-400 to-blue-500', label: 'Cyan Blue' },
  { value: 'from-purple-500 to-indigo-600', label: 'Purple Indigo' },
  { value: 'from-gray-700 to-gray-900', label: 'Dark Gray' },
  { value: 'from-green-400 to-emerald-600', label: 'Green Emerald' }
];

const patternOptions = [
  {
    value: 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),transparent_70%)]',
    label: 'Top Right'
  },
  {
    value: 'bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-from),transparent_70%)]',
    label: 'Bottom Left'
  },
  {
    value: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from),transparent_70%)]',
    label: 'Center'
  },
  {
    value: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-from),transparent_70%)]',
    label: 'Top Left'
  },
  {
    value: 'bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-from),transparent_70%)]',
    label: 'Bottom Right'
  }
];


const collections = [
  "Summer Collection",
  "Winter Collection",
  "Limited Edition",
  "Signature Collection",
  "Classic Collection"
];

const allSubcategories = {
  "Perfumes": {
    "Men's Fragrances": [
      "Light Perfume",
      "Strong Perfume",
      "Daily Wear",
      "Sport Perfume",
      "Woody Scents",
      "Oriental Scents",
      "Fresh Scents"
    ],
    "Women's Fragrances": [
      "Strong Perfume",
      "Light Perfume",
      "Body Spray",
      "Floral Scents",
      "Oriental Scents",
      "Fresh Scents",
      "Fruity Scents"
    ],
    // ... existing perfume subcategories ...
  },
  "Cosmetics": {
    "Makeup": [
      "Face Makeup",
      "Eye Makeup",
      "Lip Products",
      "Makeup Tools",
      "Makeup Sets"
    ],
    "Skincare": [
      "Cleansers",
      "Moisturizers",
      "Serums",
      "Face Masks",
      "Sun Protection"
    ],
    "Nail Care": [
      "Nail Polish",
      "Nail Tools",
      "Nail Treatment",
      "Nail Art"
    ]
  },
  "Beauty": {
    "Hair Care": [
      "Shampoo",
      "Conditioner",
      "Hair Treatments",
      "Styling Products",
      "Hair Tools"
    ],
    "Body Care": [
      "Body Wash",
      "Body Lotion",
      "Hand Care",
      "Foot Care",
      "Body Scrubs"
    ],
    "Beauty Tools": [
      "Makeup Brushes",
      "Beauty Devices",
      "Hair Styling Tools",
      "Accessories"
    ]
  }
};

const CategoryModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { currentTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    _id: initialData?._id || null,
    name: initialData?.name || '',
    description: initialData?.description || '',
    icon: initialData?.icon ? { name: initialData.icon } : null,
    image: null,
    imagePreview: initialData?.image?.url || '',
    color: initialData?.color || 'from-pink-400 to-rose-500',
    bgPattern: initialData?.bgPattern || 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),transparent_70%)]',
    subcategories: initialData?.subcategories || [],
    featured: initialData?.featured || []
  });

  const steps = [
    {
      title: "Basic Information",
      subtitle: "Add category details"
    },
    {
      title: "Visual Elements",
      subtitle: "Choose icon and colors"
    },
    {
      title: "Image Upload",
      subtitle: "Add category image"
    },
    {
      title: "Subcategories",
      subtitle: "Select subcategories"
    },
    {
      title: "Collections",
      subtitle: "Add collections"
    }
  ];

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.icon) {
      toast.error('Name and icon are required');
      return;
    }

    // Create submission data
    const submissionData = {
      ...formData,
      // Ensure icon is properly formatted
      icon: formData.icon ? { name: formData.icon.name || formData.icon } : null,
      // Only include image if it's a new file
      image: formData.image instanceof File ? formData.image : undefined
    };

    console.log('Submitting form data:', submissionData); // Debug log
    onSubmit(submissionData);
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Get theme-specific classes
  const getThemeClass = (element) => {
    switch(currentTheme) {
      case 'dark':
        return {
          input: 'bg-gray-800 border-gray-700 text-white',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          border: 'border-gray-700',
          hover: 'hover:bg-gray-700',
          card: 'bg-gray-800',
        }[element];
      case 'eyeCare':
        return {
          input: 'bg-[#FFF8ED] border-[#E6D5B8] text-[#433422]',
          text: 'text-[#433422]',
          textSecondary: 'text-[#6B5D4D]',
          border: 'border-[#E6D5B8]',
          hover: 'hover:bg-[#E6D5B8]',
          card: 'bg-[#FFF8ED]',
        }[element];
      default:
        return {
          input: 'bg-white border-gray-200 text-gray-900',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-100',
          card: 'bg-white',
        }[element];
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <div className="flex min-h-screen items-center justify-center">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={`relative w-full max-w-2xl p-6 my-8 mx-auto 
                ${getThemeClass('card')} rounded-2xl shadow-xl`}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300
                  ${currentTheme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : currentTheme === 'eyeCare'
                    ? 'hover:bg-[#E6D5B8] text-[#6B5D4D] hover:text-[#433422]'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
              >
                <RiCloseLine size={24} />
              </button>

              {/* Header */}
              <div className="mb-6 pr-8">
                <h2 className={`text-2xl font-bold ${getThemeClass('text')}`}>
                  {initialData ? 'Edit Category' : 'Create New Category'}
                </h2>
                <p className={getThemeClass('textSecondary')}>
                  Step {step} of 5 - {steps[step-1].title}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((stepNumber) => (
                  <div key={stepNumber} className="h-1 rounded-full overflow-hidden bg-gray-200">
                    <motion.div
                      initial={false}
                      animate={{
                        width: stepNumber <= step ? '100%' : '0%'
                      }}
                      className={`h-full ${
                        currentTheme === 'dark' 
                          ? 'bg-white' 
                          : currentTheme === 'eyeCare'
                          ? 'bg-[#433422]'
                          : 'bg-black'
                      }`}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="mb-6">
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full p-3 border rounded-xl transition-all duration-300
                          ${getThemeClass('input')}`}
                        placeholder="Enter category name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className={`w-full p-3 border rounded-xl transition-all duration-300
                          ${getThemeClass('input')}`}
                        rows="3"
                        placeholder="Describe your category"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category Icon</label>
                      <IconSelector
                        selectedIcon={formData.icon}
                        onSelect={(icon) => setFormData({...formData, icon})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Gradient Color</label>
                      <select
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className={`w-full p-3 border rounded-xl transition-all duration-300
                          ${getThemeClass('input')}`}
                      >
                        {gradientColors.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Background Pattern</label>
                      <select
                        value={formData.bgPattern}
                        onChange={(e) => setFormData({...formData, bgPattern: e.target.value})}
                        className={`w-full p-3 border rounded-xl transition-all duration-300
                          ${getThemeClass('input')}`}
                      >
                        {patternOptions.map((pattern) => (
                          <option key={pattern.value} value={pattern.value}>
                            {pattern.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Preview */}
                    <div className="relative h-32 rounded-xl overflow-hidden">
                      <div className={`absolute inset-0 ${formData.bgPattern} ${formData.color} opacity-70`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      <div className="relative z-10 h-full flex items-center justify-center">
                        {formData.icon && (
                          <span className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            {React.createElement(RiIcons[formData.icon.name], {
                              size: 24,
                              className: "text-white"
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center">
                      <label 
                        className={`w-full h-64 flex flex-col items-center justify-center 
                          border-2 border-dashed rounded-xl cursor-pointer
                          transition-all duration-300 relative overflow-hidden
                          ${getThemeClass('border')} ${getThemeClass('hover')}`}
                      >
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        
                        {formData.imagePreview ? (
                          <>
                            <img 
                              src={formData.imagePreview}
                              alt="Preview"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className={`absolute inset-0 ${formData.bgPattern} ${formData.color} 
                              opacity-70 mix-blend-multiply`} />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                              <p className="text-white text-center">
                                <RiImageAddLine size={40} className="mx-auto mb-2" />
                                Click to change image
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <RiImageAddLine size={40} className={getThemeClass('text')} />
                            <p className={`mt-2 ${getThemeClass('text')}`}>
                              Click to upload image
                            </p>
                            <p className={`text-sm ${getThemeClass('textSecondary')}`}>
                              PNG, JPG up to 5MB
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Subcategories</label>
                      
                      {/* Add custom subcategory input */}
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <input
                            id="customSubcategory"
                            type="text"
                            placeholder="Add custom subcategory"
                            className={`flex-1 p-3 border rounded-xl transition-all duration-300 ${getThemeClass('input')}`}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                setFormData({
                                  ...formData,
                                  subcategories: [...formData.subcategories, e.target.value.trim()]
                                });
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('customSubcategory');
                              if (input && input.value.trim()) {
                                setFormData({
                                  ...formData,
                                  subcategories: [...formData.subcategories, input.value.trim()]
                                });
                                input.value = '';
                              }
                            }}
                            className={`px-4 py-2 rounded-xl transition-all duration-300
                              ${currentTheme === 'dark'
                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                : currentTheme === 'eyeCare'
                                ? 'bg-[#E6D5B8] text-[#433422] hover:bg-[#D6C5A8]'
                                : 'bg-gray-900 text-white hover:bg-gray-700'
                              }`}
                          >
                            <RiAddLine size={24} />
                          </button>
                        </div>
                      </div>

                      {/* Predefined subcategories */}
                      <div className="space-y-4">
                        {Object.entries(allSubcategories).map(([mainCategory, categories]) => (
                          <div key={mainCategory} className="space-y-2">
                            <h3 className={`font-medium ${getThemeClass('text')}`}>{mainCategory}</h3>
                            {Object.entries(categories).map(([category, items]) => (
                              <div key={category} className="ml-4 space-y-2">
                                <h4 className={`text-sm font-medium ${getThemeClass('textSecondary')}`}>{category}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {items.map((item) => (
                                    <button
                                      key={item}
                                      onClick={() => {
                                        if (!formData.subcategories.includes(item)) {
                                          setFormData({
                                            ...formData,
                                            subcategories: [...formData.subcategories, item]
                                          });
                                        } else {
                                          setFormData({
                                            ...formData,
                                            subcategories: formData.subcategories.filter(sub => sub !== item)
                                          });
                                        }
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition-all duration-300
                                        ${formData.subcategories.includes(item)
                                          ? currentTheme === 'dark'
                                            ? 'bg-gray-700 text-white'
                                            : currentTheme === 'eyeCare'
                                            ? 'bg-[#E6D5B8] text-[#433422]'
                                            : 'bg-gray-900 text-white'
                                          : currentTheme === 'dark'
                                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                          : currentTheme === 'eyeCare'
                                          ? 'bg-[#FFF8ED] text-[#6B5D4D] hover:bg-[#E6D5B8]'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                      {item}
                                      {formData.subcategories.includes(item) && (
                                        <RiCloseLine className="w-4 h-4" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Show selected subcategories */}
                    {formData.subcategories.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Selected Subcategories</label>
                        <div className="flex flex-wrap gap-2">
                          {formData.subcategories.map((sub, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2
                                ${getThemeClass('card')} ${getThemeClass('text')}`}
                            >
                              {sub}
                              <RiDeleteBinLine
                                className="cursor-pointer hover:text-red-500"
                                onClick={() => setFormData({
                                  ...formData,
                                  subcategories: formData.subcategories.filter((_, i) => i !== idx)
                                })}
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Featured Collections</label>
                      <div className="flex flex-wrap gap-2">
                        {collections.map((collection) => (
                          <button
                            key={collection}
                            onClick={() => {
                              if (!formData.featured.includes(collection)) {
                                setFormData({
                                  ...formData,
                                  featured: [...formData.featured, collection]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  featured: formData.featured.filter(col => col !== collection)
                                });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 transition-all duration-300
                              ${formData.featured.includes(collection)
                                ? currentTheme === 'dark'
                                  ? 'bg-gray-700 text-white'
                                  : currentTheme === 'eyeCare'
                                  ? 'bg-[#E6D5B8] text-[#433422]'
                                  : 'bg-gray-900 text-white'
                                : currentTheme === 'dark'
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : currentTheme === 'eyeCare'
                                ? 'bg-[#FFF8ED] text-[#6B5D4D] hover:bg-[#E6D5B8]'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {collection}
                            {formData.featured.includes(collection) && (
                              <RiCloseLine className="w-4 h-4" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between gap-4">
                {step > 1 && (
                  <button
                    onClick={handlePrev}
                    className={`px-6 py-2 rounded-xl transition-all duration-300
                      ${getThemeClass('hover')} ${getThemeClass('text')}`}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={step === 5 ? handleSubmit : handleNext}
                  className={`px-6 py-2 rounded-xl transition-all duration-300
                    bg-gradient-to-r from-black to-gray-700 text-white
                    hover:from-gray-900 hover:to-gray-600
                    ${currentTheme === 'eyeCare' 
                      ? 'from-[#433422] to-[#6B5D4D] hover:from-[#5B483A] hover:to-[#7B6D5D]' 
                      : ''
                    }`}
                >
                  {step === 5 ? 'Save Category' : 'Next'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CategoryModal; 