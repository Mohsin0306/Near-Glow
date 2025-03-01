import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ProductCard } from './CategoryProducts'; // Assuming you'll export ProductCard

const SubcategoryView = () => {
  const { currentTheme } = useTheme();
  const { categoryId, subcategory } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://192.168.100.17:5000/api/products/category/${categoryId}`);
        const data = await response.json();
        
        if (data.success) {
          // Filter products by subcategory
          const filteredProducts = data.data.filter(product => 
            product.subcategories?.includes(subcategory)
          );
          setProducts(filteredProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, subcategory]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen p-4 ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' 
      : currentTheme === 'eyeCare' ? 'bg-[#F5E6D3] text-[#433422]'
      : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{subcategory}</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {products.map((product) => (
            <div key={product._id}>
              <ProductCard 
                product={product} 
                currentTheme={currentTheme}
              />
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl">No products available in this subcategory</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubcategoryView;
