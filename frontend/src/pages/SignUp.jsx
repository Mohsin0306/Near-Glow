import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  RiUser3Line,
  RiPhoneLine,
  RiUserSmileLine
} from 'react-icons/ri';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTheme } = useTheme();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phoneNumber: '',
    referralCode: ''
  });

  // Extract referral code from URL on component mount
  useEffect(() => {
    // Check if we came from a referral link
    const path = location.pathname;
    if (path.startsWith('/ref/')) {
      const referralCode = path.split('/ref/')[1];
      console.log('Referral code found:', referralCode); // Debug log
      setFormData(prev => ({
        ...prev,
        referralCode
      }));
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Log the data being sent
      console.log('Submitting registration with data:', {
        ...formData,
        referralCode: formData.referralCode || location.pathname.split('/ref/')[1] || ''
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.nearglow.com/api'}/auth/register/buyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referralCode: formData.referralCode || location.pathname.split('/ref/')[1] || ''
        })
      });

      const data = await response.json();
      console.log('Registration response:', data); // Debug log

      if (data.success) {
        toast.success('Registration successful!');
        
        if (data.token && data.user) {
          await login(data.token, data.user);
          window.location.href = `/${data.user._id}`;
        } else {
          window.location.href = '/login';
        }
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          {formData.referralCode && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">
              Signing up with referral code: {formData.referralCode}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Sign in
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <RiUserSmileLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-all
                  ${currentTheme === 'dark'
                    ? 'bg-gray-800/50 focus:bg-gray-800 text-white'
                    : 'bg-white/50 focus:bg-white text-gray-900'
                  }
                  border border-transparent focus:border-purple-500
                `}
                required
              />
            </div>

            <div className="relative">
              <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-all
                  ${currentTheme === 'dark'
                    ? 'bg-gray-800/50 focus:bg-gray-800 text-white'
                    : 'bg-white/50 focus:bg-white text-gray-900'
                  }
                  border border-transparent focus:border-purple-500
                `}
                required
              />
            </div>

            <div className="relative">
              <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone Number"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-all
                  ${currentTheme === 'dark'
                    ? 'bg-gray-800/50 focus:bg-gray-800 text-white'
                    : 'bg-white/50 focus:bg-white text-gray-900'
                  }
                  border border-transparent focus:border-purple-500
                `}
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-lg
              text-white bg-purple-600 hover:bg-purple-700 focus:outline-none
              focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
              transition-colors duration-200"
          >
            Sign Up
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;