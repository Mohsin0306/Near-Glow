import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const EmptyState = ({ icon, title, description, action }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`text-center py-12 px-4 ${theme.card} rounded-lg shadow-sm border ${theme.border}`}>
      <div className={`mx-auto flex items-center justify-center h-24 w-24 rounded-full ${theme.background}`}>
        {icon}
      </div>
      <h3 className={`mt-4 text-lg font-medium ${theme.text}`}>{title}</h3>
      <p className={`mt-2 text-sm ${theme.textSecondary}`}>{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState; 