import React from 'react';
import CategoryCard from './CategoryCard';

const CategoryList = ({ categories, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <CategoryCard
          key={category._id}
          category={category}
          onEdit={() => {
            if (category && category._id) {
              onEdit(category);
            }
          }}
          onDelete={() => {
            if (category && category._id) {
              onDelete(category);
            }
          }}
        />
      ))}
    </div>
  );
};

export default CategoryList; 