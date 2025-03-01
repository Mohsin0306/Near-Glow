import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiErrorWarningLine, RiLoader4Line } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';

const DeleteModal = ({ isOpen, onClose, onConfirm, product }) => {
  const { currentTheme } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete confirmation error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl 
                ${currentTheme === 'dark' 
                  ? 'bg-gray-800/95 backdrop-blur-md' 
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC]'
                  : 'bg-white/95 backdrop-blur-md'
                }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 mb-4 rounded-full flex items-center justify-center
                  ${currentTheme === 'eyeCare' 
                    ? 'bg-[#433422]/10' 
                    : 'bg-red-100'
                  }`}
                >
                  <RiErrorWarningLine 
                    size={24} 
                    className={currentTheme === 'eyeCare' ? 'text-[#433422]' : 'text-red-600'} 
                  />
                </div>

                <h3 className={`text-xl font-bold mb-2 ${
                  currentTheme === 'dark' 
                    ? 'text-white' 
                    : currentTheme === 'eyeCare'
                    ? 'text-[#433422]'
                    : 'text-gray-900'
                }`}>
                  Delete Product
                </h3>

                <p className={`mb-6 ${
                  currentTheme === 'dark' 
                    ? 'text-gray-300' 
                    : currentTheme === 'eyeCare'
                    ? 'text-[#433422]/80'
                    : 'text-gray-500'
                }`}>
                  Are you sure you want to delete "{product?.name}"? This action cannot be undone.
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                      currentTheme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800'
                        : currentTheme === 'eyeCare'
                        ? 'bg-[#433422]/10 text-[#433422] hover:bg-[#433422]/20 disabled:bg-[#433422]/5'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50'
                    } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isDeleting}
                    className={`px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-200 
                      ${currentTheme === 'eyeCare'
                        ? 'bg-[#433422] hover:bg-[#433422]/90 disabled:bg-[#433422]/70'
                        : 'bg-red-600 hover:bg-red-700 disabled:bg-red-500'
                      } ${isDeleting ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {isDeleting ? (
                        <>
                          <RiLoader4Line className="w-5 h-5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <span>Delete</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteModal; 