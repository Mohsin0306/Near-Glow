import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';

const DeleteModal = ({ isOpen, onClose, onConfirm, category }) => {
  const { currentTheme } = useTheme();

  if (!isOpen || !category || !category._id) return null;

  const handleConfirm = () => {
    if (category && category._id) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative w-full max-w-md rounded-2xl p-6 shadow-xl
              ${currentTheme === 'dark' 
                ? 'bg-gray-800' 
                : currentTheme === 'eyeCare'
                ? 'bg-[#E6D5BC]'
                : 'bg-white'
              }`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`absolute right-4 top-4 p-2 rounded-full transition-all
                ${currentTheme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : currentTheme === 'eyeCare'
                  ? 'hover:bg-[#433422]/10 text-[#433422]'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
            >
              <RiCloseLine size={24} />
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <RiErrorWarningLine className="h-10 w-10 text-red-500" />
              </div>

              <h3 className={`mt-4 text-xl font-semibold
                ${currentTheme === 'dark' 
                  ? 'text-white' 
                  : currentTheme === 'eyeCare'
                  ? 'text-[#433422]'
                  : 'text-gray-900'
                }`}
              >
                Delete Category
              </h3>

              <p className={`mt-2 text-sm
                ${currentTheme === 'dark'
                  ? 'text-gray-400'
                  : currentTheme === 'eyeCare'
                  ? 'text-[#433422]/70'
                  : 'text-gray-500'
                }`}
              >
                Are you sure you want to delete "{category?.name}"? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-xl transition-all
                    ${currentTheme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#433422]/10 hover:bg-[#433422]/20 text-[#433422]'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteModal; 