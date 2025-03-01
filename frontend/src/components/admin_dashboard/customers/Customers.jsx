import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiUserLine, RiLoader4Line, RiFilter3Line, RiSearchLine, RiUserAddLine } from 'react-icons/ri';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import CustomerList from './CustomerList';
import CustomerStats from './CustomerStats';
import { createAPI } from '../../../utils/api';

const Customers = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const api = createAPI(localStorage.getItem('authToken'));

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/buyers');
      if (response.data.success) {
        setCustomers(response.data.data.buyers);
      }
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/buyers/stats/overview');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = filterGender === 'all' || customer.gender === filterGender;
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className={`min-h-screen pt-16 md:pt-0 ${
      currentTheme === 'dark'
        ? 'bg-gray-900'
        : currentTheme === 'eyeCare'
        ? 'bg-[#F5E6D3]'
        : 'bg-gray-50'
    }`}>
      <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${
              currentTheme === 'dark' ? 'text-white' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]'
              : 'text-gray-900'
            }`}>
              Customers
            </h1>
            <p className={`mt-1 text-sm md:text-base ${
              currentTheme === 'dark' ? 'text-gray-400' 
              : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
              : 'text-gray-500'
            }`}>
              Manage and view your customer base
            </p>
          </div>
        </div>

        {/* Stats Section */}
        {stats && <CustomerStats stats={stats} />}

        {/* Search and Filters Section */}
        <div className="space-y-4 md:space-y-0">
          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex-1 relative">
              <RiSearchLine className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                currentTheme === 'dark' ? 'text-gray-400' 
                : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-colors ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800 text-white border border-gray-700 focus:border-gray-600' 
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC]/50 text-[#433422] hover:bg-[#E6D5BC]/70'
                    : 'bg-gray-100 text-gray-900'
                } focus:outline-none`}
              />
            </div>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className={`px-4 py-2.5 rounded-xl transition-colors ${
                currentTheme === 'dark'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC]/50 text-[#433422]'
                  : 'bg-gray-100 text-gray-900'
              } focus:outline-none min-w-[120px]`}
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2.5 rounded-xl transition-colors ${
                currentTheme === 'dark'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : currentTheme === 'eyeCare'
                  ? 'bg-[#E6D5BC]/50 text-[#433422]'
                  : 'bg-gray-100 text-gray-900'
              } focus:outline-none min-w-[140px]`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Mobile Search and Filter */}
          <div className="md:hidden relative">
            <div className="relative">
              <RiSearchLine className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                currentTheme === 'dark' ? 'text-gray-400' 
                : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-12 py-2.5 rounded-xl transition-colors ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800 text-white border border-gray-700' 
                    : currentTheme === 'eyeCare'
                    ? 'bg-[#E6D5BC]/50 text-[#433422]'
                    : 'bg-gray-100 text-gray-900'
                } focus:outline-none`}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                  currentTheme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700'
                    : currentTheme === 'eyeCare'
                    ? 'text-[#433422]/70 hover:bg-[#433422]/10'
                    : 'text-gray-500 hover:bg-gray-200'
                }`}
              >
                <RiFilter3Line className="text-xl" />
              </button>
            </div>

            {/* Mobile Filters Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg z-10 ${
                    currentTheme === 'dark'
                      ? 'bg-gray-900 border border-gray-700'
                      : currentTheme === 'eyeCare'
                      ? 'bg-[#E6D5BC] border border-[#433422]/20'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="p-2 space-y-1">
                    <p className={`px-3 py-2 text-xs font-medium ${
                      currentTheme === 'dark' ? 'text-gray-400' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                      : 'text-gray-500'
                    }`}>
                      Filter by Gender
                    </p>
                    {['all', 'male', 'female', 'other'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => {
                          setFilterGender(gender);
                          setShowFilters(false);
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                          filterGender === gender
                            ? currentTheme === 'dark'
                              ? 'bg-gray-700 text-white'
                              : currentTheme === 'eyeCare'
                              ? 'bg-[#433422]/10 text-[#433422]'
                              : 'bg-gray-100 text-gray-900'
                            : currentTheme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700'
                            : currentTheme === 'eyeCare'
                            ? 'text-[#433422] hover:bg-[#433422]/10'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </button>
                    ))}

                    <div className="my-2 border-t border-gray-200/10"></div>

                    <p className={`px-3 py-2 text-xs font-medium ${
                      currentTheme === 'dark' ? 'text-gray-400' 
                      : currentTheme === 'eyeCare' ? 'text-[#433422]/70'
                      : 'text-gray-500'
                    }`}>
                      Sort by
                    </p>
                    {[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'name', label: 'Name' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowFilters(false);
                        }}
                        className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                          sortBy === option.value
                            ? currentTheme === 'dark'
                              ? 'bg-gray-700 text-white'
                              : currentTheme === 'eyeCare'
                              ? 'bg-[#433422]/10 text-[#433422]'
                              : 'bg-gray-100 text-gray-900'
                            : currentTheme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700'
                            : currentTheme === 'eyeCare'
                            ? 'text-[#433422] hover:bg-[#433422]/10'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Customer List */}
        <div className="-mx-4 md:-mx-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RiLoader4Line className={`animate-spin text-4xl ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
          ) : (
            <CustomerList customers={filteredCustomers} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers; 