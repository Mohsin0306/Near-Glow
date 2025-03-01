import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

const ProductList = ({ products, onEdit, onDelete, loadingProducts }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6"
    >
      {/* Show skeleton for new product being added */}
      {loadingProducts['new'] && (
        <ProductCardSkeleton />
      )}

      {/* Existing products */}
      {products?.map((product) => (
        loadingProducts[product._id] ? (
          <ProductCardSkeleton key={product._id} />
        ) : (
          <ProductCard
            key={product._id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={loadingProducts[product._id]}
          />
        )
      ))}
    </motion.div>
  );
};

export default ProductList; 