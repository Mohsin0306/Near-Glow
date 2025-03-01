import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCustomerService2Fill, 
  RiWhatsappLine, 
  RiInstagramLine, 
  RiMailLine,
  RiPhoneLine,
  RiCloseLine,
  RiFacebookBoxFill,
  RiTiktokFill
} from 'react-icons/ri';
import { useTheme } from '../context/ThemeContext';

const FloatingContact = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme } = useTheme();

  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    const message = "Hello, I need assistant";
    const phoneNumber = "03313269415"; // Replace with your WhatsApp number
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const socialLinks = [
    { 
      icon: RiWhatsappLine, 
      href: '#',
      onClick: handleWhatsAppClick,
      color: 'bg-[#25D366] hover:bg-[#128C7E]',
      tooltip: 'WhatsApp Assistant',
      label: 'Chat with us'
    },
    { 
      icon: RiFacebookBoxFill, 
      href: 'https://www.facebook.com/profile.php?id=61573764568564&mibextid=rS40aB7S9Ucbxw6v',
      color: 'bg-[#1877F2] hover:bg-[#0E5FC0]',
      tooltip: 'Facebook',
      label: 'Follow us'
    },
    { 
      icon: RiInstagramLine, 
      href: 'https://www.instagram.com/nearglow.store/',
      color: 'bg-[#E4405F] hover:bg-[#D93248]',
      tooltip: 'Instagram',
      label: 'Follow us'
    },
    { 
      icon: RiTiktokFill,
      href: 'https://www.tiktok.com/@nearglow.store',
      color: 'bg-[#000000] hover:bg-[#333333]',
      tooltip: 'TikTok',
      label: 'Follow us'
    },
    { 
      icon: RiPhoneLine, 
      href: 'tel:+923043197988',
      color: 'bg-blue-500 hover:bg-blue-600',
      tooltip: 'Call Us',
      label: '+92 304 3197988'
    },
    { 
      icon: RiMailLine, 
      href: 'mailto:support@nearglow.com',
      color: 'bg-red-500 hover:bg-red-600',
      tooltip: 'Email Us',
      label: 'support@nearglow.com'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 z-50 md:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2"
          >
            {socialLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                onClick={link.onClick}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  group relative flex items-center
                  ${link.color}
                  transform transition-all duration-200
                  shadow-lg rounded-full md:rounded-xl
                  ${window.innerWidth >= 768 ? 'pr-6' : 'p-2.5'}
                `}
              >
                <span className={`
                  text-white flex items-center justify-center
                  ${window.innerWidth >= 768 ? 'p-3' : 'p-1'}
                `}>
                  <link.icon size={window.innerWidth >= 768 ? 24 : 20} />
                </span>
                
                {/* Desktop Label */}
                <span className="hidden md:block text-white font-medium">
                  {link.label}
                </span>

                {/* Mobile Tooltip */}
                <span className="md:hidden absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs 
                               rounded whitespace-nowrap opacity-0 group-hover:opacity-100 
                               transition-opacity pointer-events-none">
                  {link.tooltip}
                </span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`
          p-3 md:p-4 rounded-full shadow-lg text-white
          ${currentTheme === 'dark' 
            ? 'bg-gray-800 hover:bg-gray-700' 
            : currentTheme === 'eyeCare'
            ? 'bg-[#433422] hover:bg-[#5B483A]'
            : 'bg-black hover:bg-gray-800'
          }
          transition-colors duration-200
        `}
      >
        <motion.div
          animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <RiCloseLine size={window.innerWidth >= 768 ? 28 : 24} />
          ) : (
            <RiCustomerService2Fill size={window.innerWidth >= 768 ? 28 : 24} />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default FloatingContact; 