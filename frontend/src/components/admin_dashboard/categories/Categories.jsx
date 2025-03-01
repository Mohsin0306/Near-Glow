import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import CategoryList from './CategoryList';
import CategoryModal from './CategoryModal';
import { RiAddLine } from 'react-icons/ri';
import { themes } from '../../../context/ThemeContext';
import axios from 'axios';
import DeleteModal from './DeleteModal';

const createAPI = (token) => {
  const api = axios.create({
    baseURL: 'http://192.168.100.17:5000/api',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true
  });

  // Add request interceptor to log requests
  api.interceptors.request.use(
    (config) => {
      console.log('Making request to:', config.url);
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for handling auth errors and logging
  api.interceptors.response.use(
    (response) => {
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      return response;
    },
    (error) => {
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return api;
};

const Categories = () => {
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  const api = createAPI(token);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'seller') {
      fetchCategories();

      // Refresh categories every 30 seconds to keep counts updated
      const intervalId = setInterval(fetchCategories, 30000);

      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, user]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/categories');
      if (response.data.success) {
        // Sort categories by items count in descending order
        const sortedCategories = response.data.data.sort((a, b) => b.items - a.items);
        setCategories(sortedCategories);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (newCategory) => {
    try {
      const formData = new FormData();
      
      // Append basic fields
      formData.append('name', newCategory.name);
      formData.append('description', newCategory.description);
      formData.append('icon', newCategory.icon?.name || 'RiFlowerLine');
      formData.append('color', newCategory.color || 'from-pink-400 to-rose-500');
      formData.append('bgPattern', newCategory.bgPattern || '');
      
      // Handle arrays
      formData.append('subcategories', JSON.stringify(newCategory.subcategories || []));
      formData.append('featured', JSON.stringify(newCategory.featured || []));
      
      // Handle image file
      if (newCategory.image instanceof File) {
        formData.append('image', newCategory.image);
      }

      const response = await api.post('/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        setCategories(prev => [...prev, response.data.data]);
        setIsAddingCategory(false);
        toast.success('Category created successfully');
      }
    } catch (error) {
      handleApiError(error, 'Failed to create category');
    }
  };

  const handleEditCategory = async (updatedCategory) => {
    try {
      if (!updatedCategory || !updatedCategory._id) {
        toast.error('Invalid category data');
        return;
      }

      console.log('Updating category:', updatedCategory); // Debug log

      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', updatedCategory.name || '');
      formData.append('description', updatedCategory.description || '');
      formData.append('icon', updatedCategory.icon?.name || '');
      formData.append('color', updatedCategory.color || '');
      formData.append('bgPattern', updatedCategory.bgPattern || '');
      
      // Safely append arrays
      if (Array.isArray(updatedCategory.subcategories)) {
        formData.append('subcategories', JSON.stringify(updatedCategory.subcategories));
      }
      if (Array.isArray(updatedCategory.featured)) {
        formData.append('featured', JSON.stringify(updatedCategory.featured));
      }
      
      // Handle image
      if (updatedCategory.image instanceof File) {
        formData.append('image', updatedCategory.image);
      }

      // Log FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await api.put(
        `/categories/${updatedCategory._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (response.data.success) {
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat._id === updatedCategory._id ? response.data.data : cat
          )
        );
        setEditingCategory(null);
        toast.success('Category updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteClick = (category) => {
    if (!category || !category._id) {
      toast.error('Invalid category selected');
      return;
    }
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) {
      toast.error('Invalid category ID');
      return;
    }

    try {
      console.log('Deleting category with ID:', categoryId); // Debug log
      const response = await api.delete(`/categories/${categoryId}`);
      
      if (response.data.success) {
        setCategories(prevCategories => 
          prevCategories.filter(cat => cat._id !== categoryId)
        );
        toast.success('Category deleted successfully');
        setDeleteModalOpen(false);
        setCategoryToDelete(null);
      } else {
        toast.error(response.data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  // Helper function to handle API errors
  const handleApiError = (error, defaultMessage) => {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error
      toast.error(error.response.data?.message || defaultMessage);
    } else if (error.request) {
      // Request made but no response
      toast.error('No response from server. Please check your connection.');
    } else {
      // Other errors
      toast.error('Error setting up request');
    }
  };

  // Check if user is not authenticated or not a seller
  if (!isAuthenticated || user?.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">
          You are not authorized to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 sm:pt-6 pb-6 px-4 sm:px-6 
      ${themes[currentTheme].background}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Added z-index and fixed dark mode text */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0 mb-8 relative z-10">
          <div className="w-full sm:w-auto animate-fadeIn">
            <h1 className={`text-3xl sm:text-4xl font-bold mb-3 
              ${currentTheme === 'eyeCare' 
                ? 'text-[#433422]' 
                : currentTheme === 'dark'
                ? 'text-white'
                : 'bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent'
              }`}
            >
              Category Management
            </h1>
            <p className={themes[currentTheme].textSecondary}>
              Manage your store categories and subcategories
            </p>
          </div>
          <button
            onClick={() => setIsAddingCategory(true)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5
              bg-gradient-to-r ${themes[currentTheme].buttonPrimary}
              rounded-xl sm:rounded-full transition-all duration-300 shadow-lg hover:shadow-xl 
              transform hover:-translate-y-0.5 active:scale-95`}
          >
            <RiAddLine className="text-white" size={22} />
            <span className="font-medium tracking-wide text-white">Add New Category</span>
          </button>
        </div>

        {/* Form Section - Updated styling */}
        {(isAddingCategory || editingCategory) && (
          <CategoryModal
            isOpen={true}
            onClose={() => {
              setIsAddingCategory(false);
              setEditingCategory(null);
            }}
            onSubmit={editingCategory ? handleEditCategory : handleAddCategory}
            initialData={editingCategory}
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className={`flex flex-col justify-center items-center h-64 animate-fadeIn
            ${themes[currentTheme].text}`}
          >
            <div className={`animate-spin rounded-full h-12 w-12 border-2 
              ${currentTheme === 'eyeCare' 
                ? 'border-[#433422] border-t-transparent' 
                : 'border-black border-t-transparent'}`}
            />
            <p className={`mt-4 ${themes[currentTheme].textSecondary}`}>
              Loading categories...
            </p>
          </div>
        ) : categories.length === 0 ? (
          // Empty State
          <div className={`text-center py-16 px-4 rounded-2xl border-2 border-dashed 
            ${themes[currentTheme].border} animate-fadeIn 
            transform hover:scale-[1.01] transition-all duration-300
            ${themes[currentTheme].card}`}
          >
            <div className="max-w-md mx-auto">
              <p className={`text-2xl font-semibold mb-4 ${themes[currentTheme].text}`}>
                No categories found
              </p>
              <p className={`mb-6 ${themes[currentTheme].textSecondary}`}>
                Start by creating your first category to organize your products
              </p>
              <button
                onClick={() => setIsAddingCategory(true)}
                className={`px-8 py-3 bg-gradient-to-r ${themes[currentTheme].buttonPrimary}
                  rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl
                  transform hover:-translate-y-0.5 active:scale-95`}
              >
                Create your first category
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <CategoryList
              categories={categories}
              onEdit={setEditingCategory}
              onDelete={handleDeleteClick}
            />
          </div>
        )}
      </div>

      {/* Delete Modal with ID check */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={() => {
          if (categoryToDelete && categoryToDelete._id) {
            handleDeleteCategory(categoryToDelete._id);
          } else {
            toast.error('Invalid category selected');
          }
        }}
        category={categoryToDelete}
      />
    </div>
  );
};

export default Categories;