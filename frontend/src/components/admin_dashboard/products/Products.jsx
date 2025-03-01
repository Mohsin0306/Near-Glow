import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiAddLine, RiLoader4Line, RiFilter3Line, RiSearchLine, RiArrowDownSLine, RiCloseLine, RiInboxUnarchiveLine } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';
import { themes } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import ProductList from './ProductList';
import ProductModal from './ProductModal';
import DeleteModal from './DeleteModal';
import { createAPI, productAPI } from '../../../utils/api';

const Products = () => {
  const { currentTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price-high, price-low
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState({});

  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  const api = createAPI(token);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'seller') {
      fetchProducts();
    }
  }, [isAuthenticated, user]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getProducts(token);
      
      if (response.data.success) {
        // Combine topSales and trending products and remove duplicates
        const topSales = response.data.data.topSales || [];
        const trending = response.data.data.trending || [];
        
        // Combine arrays and remove duplicates based on _id
        const allProducts = [...topSales, ...trending];
        const uniqueProducts = Array.from(new Map(allProducts.map(item => [item._id, item])).values());
        
        setProducts(uniqueProducts);
        setFilteredProducts(uniqueProducts);
      } else {
        toast.error('Failed to fetch products');
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProduct = async (formData) => {
    const productId = editingProduct?._id || 'new';
    try {
      setLoadingProducts(prev => ({
        ...prev,
        [productId]: true
      }));

      let response;

      if (editingProduct) {
        response = await productAPI.updateProduct(editingProduct._id, formData, token);
      } else {
        response = await productAPI.createProduct(formData, token);
      }

      if (response.data.success) {
        toast.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        await fetchProducts();
        setIsAddingProduct(false);
        setEditingProduct(null);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoadingProducts(prev => ({
        ...prev,
        [productId]: false
      }));
    }
  };

  // Filter and sort products
  useEffect(() => {
    if (!products) return;
    
    let result = [...(Array.isArray(products) ? products : [])];

    // Search filter
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(product => product.category?._id === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory) {
      result = result.filter(product => 
        product.subcategories && 
        product.subcategories.includes(selectedSubcategory)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory, selectedSubcategory, sortBy]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Get subcategories for selected category
  const getSubcategories = () => {
    if (!selectedCategory) return [];
    const category = categories.find(cat => cat._id === selectedCategory);
    return category?.subcategories || [];
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`/products/${productToDelete._id}`);
      if (response.data.success) {
        toast.success('Product deleted successfully');
        // Remove product from state
        setProducts(prevProducts => 
          prevProducts.filter(p => p._id !== productToDelete._id)
        );
        setDeleteModalOpen(false);
        setProductToDelete(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  // Handle delete click
  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
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
    <div className={`min-h-screen pt-24 sm:pt-6 pb-6 px-4 sm:px-6 ${themes[currentTheme].background}`}>
      <div className="max-w-8xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="w-full sm:w-auto">
              <h1 className={`text-3xl sm:text-4xl font-bold mb-3 
                ${currentTheme === 'eyeCare' 
                  ? 'text-[#433422]' 
                  : currentTheme === 'dark'
                  ? 'text-white'
                  : 'bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent'
                }`}
              >
                Product Management
              </h1>
              <p className={themes[currentTheme].textSecondary}>
                Manage your store products and inventory
              </p>
            </div>
            <button
              onClick={() => setIsAddingProduct(true)}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5
                ${currentTheme === 'eyeCare' 
                  ? 'bg-[#433422] hover:bg-[#433422]/90' 
                  : currentTheme === 'dark'
                  ? 'bg-gradient-to-r from-gray-800 to-gray-700'
                  : 'bg-gradient-to-r from-gray-900 to-gray-800'
                } rounded-xl sm:rounded-full transition-all duration-300 shadow-lg hover:shadow-xl 
                transform hover:-translate-y-0.5 active:scale-95`}
            >
              <RiAddLine className="text-white" size={22} />
              <span className="font-medium tracking-wide text-white">Add New Product</span>
            </button>
          </div>

          {/* Mobile Search and Filter */}
          <div className="lg:hidden relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 pr-24 py-3.5 rounded-xl outline-none
                ${currentTheme === 'dark' 
                  ? 'bg-gray-800/50 focus:bg-gray-800/80 text-white placeholder-gray-400' 
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC] focus:bg-[#E6D5BC] text-[#433422] placeholder-[#433422]/60'
                  : 'bg-white/90 focus:bg-white text-gray-900 placeholder-gray-400'
                } border-0 ring-0 focus:ring-0 shadow-sm focus:shadow-md
                backdrop-blur-sm transition-all duration-200`}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
                ${showFilters 
                  ? 'bg-blue-500 text-white' 
                  : currentTheme === 'dark'
                  ? 'bg-gray-700 text-gray-300'
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC] text-[#433422]'
                  : 'bg-gray-100 text-gray-900'
                } transition-all duration-200`}
            >
              {showFilters ? <RiCloseLine size={20} /> : <RiFilter3Line size={20} />}
            </button>
          </div>

          {/* Mobile Filters (Expandable) */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden space-y-3"
            >
              {/* Category Select */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl appearance-none outline-none
                    ${currentTheme === 'dark' 
                      ? 'bg-gray-800/50 text-white' 
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] text-[#433422]'
                      : 'bg-white/90 text-gray-900'
                    } border-0 ring-0 shadow-sm backdrop-blur-sm`}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                <RiArrowDownSLine 
                  className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none
                    ${currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-gray-400'}`} 
                  size={20} 
                />
              </div>

              {/* Subcategory Select */}
              {selectedCategory && (
                <div className="relative">
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl appearance-none outline-none
                      ${currentTheme === 'dark' 
                        ? 'bg-gray-800/50 text-white' 
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#E6D5BC] text-[#433422]'
                        : 'bg-white/90 text-gray-900'
                      } border-0 ring-0 shadow-sm backdrop-blur-sm`}
                  >
                    <option value="">All Subcategories</option>
                    {getSubcategories().map(subcategory => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                  <RiArrowDownSLine 
                    className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none
                      ${currentTheme === 'eyeCare' 
                        ? 'text-[#433422]' 
                        : currentTheme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-500'
                      }`}
                    size={20}
                  />
                </div>
              )}

              {/* Sort Select */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl appearance-none outline-none
                    ${currentTheme === 'dark' 
                      ? 'bg-gray-800/50 text-white' 
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] text-[#433422]'
                      : 'bg-white/90 text-gray-900'
                    } border-0 ring-0 shadow-sm backdrop-blur-sm`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
                <RiArrowDownSLine 
                  className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none
                    ${currentTheme === 'eyeCare' 
                      ? 'text-[#433422]' 
                      : currentTheme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                    }`}
                  size={20}
                />
              </div>
            </motion.div>
          )}

          {/* Desktop Search and Filters */}
          <div className="hidden lg:flex gap-4 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl outline-none
                  ${currentTheme === 'dark' 
                    ? 'bg-gray-800/50 focus:bg-gray-800/80 text-white placeholder-gray-400' 
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC] focus:bg-[#E6D5BC] text-[#433422] placeholder-[#433422]/60'
                    : 'bg-gray-100 focus:bg-gray-50 text-gray-900 placeholder-gray-500'
                  } border-0 ring-0 focus:ring-0 shadow-sm focus:shadow-md
                  backdrop-blur-sm transition-all duration-200`}
              />
              <RiSearchLine 
                className={`absolute right-4 top-1/2 -translate-y-1/2 
                  ${currentTheme === 'eyeCare' 
                    ? 'text-[#433422]' 
                    : currentTheme === 'dark'
                    ? 'text-gray-400'
                    : 'text-gray-500'
                  }`}
                size={20}
              />
            </div>

            <div className="flex gap-3">
              <div className="relative min-w-[180px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl appearance-none outline-none
                    ${currentTheme === 'dark' 
                      ? 'bg-gray-800/50 text-white' 
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] text-[#433422]'
                      : 'bg-gray-100 text-gray-900'
                    } border-0 ring-0 shadow-sm backdrop-blur-sm`}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                <RiArrowDownSLine 
                  className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none
                    ${currentTheme === 'eyeCare' 
                      ? 'text-[#433422]' 
                      : currentTheme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                    }`}
                  size={20}
                />
              </div>

              {selectedCategory && (
                <div className="relative min-w-[180px]">
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className={`w-full px-4 py-3.5 rounded-xl appearance-none outline-none
                      ${currentTheme === 'dark' 
                        ? 'bg-gray-800/50 text-white' 
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#E6D5BC] text-[#433422]'
                        : 'bg-gray-100 text-gray-900'
                      } border-0 ring-0 shadow-sm backdrop-blur-sm`}
                  >
                    <option value="">All Subcategories</option>
                    {getSubcategories().map(subcategory => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                  <RiArrowDownSLine 
                    className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none
                      ${currentTheme === 'eyeCare' 
                        ? 'text-[#433422]' 
                        : currentTheme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-500'
                      }`}
                    size={20}
                  />
                </div>
              )}

              <div className="relative min-w-[180px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-xl appearance-none outline-none
                    ${currentTheme === 'dark' 
                      ? 'bg-gray-800/50 text-white' 
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] text-[#433422]'
                      : 'bg-gray-100 text-gray-900'
                    } border-0 ring-0 shadow-sm backdrop-blur-sm`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
                <RiArrowDownSLine 
                  className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none
                    ${currentTheme === 'eyeCare' 
                      ? 'text-[#433422]' 
                      : currentTheme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                    }`}
                  size={20}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RiLoader4Line className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RiInboxUnarchiveLine className={`w-16 h-16 mb-4 ${themes[currentTheme].textTertiary}`} />
            <h3 className={`text-lg font-semibold mb-2 ${themes[currentTheme].textPrimary}`}>
              No Products Found
            </h3>
            <p className={themes[currentTheme].textSecondary}>
              {isAuthenticated && user?.role === 'seller' 
                ? "You haven't added any products yet. Click 'Add New Product' to get started!"
                : "No products available. Check back later!"}
            </p>
          </div>
        ) : (
          <ProductList 
            products={filteredProducts} 
            onEdit={setEditingProduct} 
            onDelete={handleDelete}
            loadingProducts={loadingProducts} 
          />
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isAddingProduct || !!editingProduct}
        onClose={() => {
          setIsAddingProduct(false);
          setEditingProduct(null);
        }}
        initialData={editingProduct}
        onSubmit={handleSubmitProduct}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        product={productToDelete}
      />
    </div>
  );
};

export default Products; 