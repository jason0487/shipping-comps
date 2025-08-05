'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch token balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTokenBalance();
    }
  }, [isAuthenticated, user]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  const fetchTokenBalance = async () => {
    try {
      const response = await fetch(`/api/user-stats?userId=${user.id}`);
      const data = await response.json();
      setTokenBalance(data.tokensRemaining || 0);
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-in-out ${
      isScrolled 
        ? 'bg-white shadow-lg' 
        : 'bg-white'
    }`}>
      <div className="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[104px] relative">
          {/* Logo - Left */}
          <Link href="/about" className="flex items-center">
            <img
              className="h-12 w-auto"
              src="/images/deliveri-labs-logo.png"
              alt="Deliveri Labs"
            />
          </Link>
          
          {/* Desktop Navigation - Center */}
          <nav className="hidden md:absolute md:left-1/2 md:transform md:-translate-x-1/2 md:flex md:items-center md:space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-gray-900 font-normal text-sm"
            >
              🎯 Analyze
            </Link>
            <Link 
              href="/how-it-works" 
              className="text-gray-700 hover:text-gray-900 font-normal text-sm"
            >
              How it Works
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-700 hover:text-gray-900 font-normal text-sm"
            >
              Pricing
            </Link>
          </nav>
          
          {/* Desktop Auth - Right */}
          <div className="hidden md:flex ml-auto items-center space-x-6">
            {isAuthenticated && user ? (
              <div className="flex flex-col items-end space-y-1">
                <span className="text-xs text-gray-500">
                  You have {tokenBalance} Tokens
                </span>
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1"
                  >
                    <span>Welcome, {user.fullName || user.email?.split('@')[0] || 'User'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/sign-in"
                  className="text-gray-700 hover:text-gray-900 font-normal text-sm transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/sign-in?mode=signup"
                  className="text-gray-700 hover:text-gray-900 font-normal text-sm border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ml-auto md:hidden flex items-center justify-center w-8 h-8"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col justify-center items-center w-6 h-6">
              <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
              <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`bg-gray-700 block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0'}`}>
          <nav className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-gray-900 font-medium px-2 py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              🎯 Analyze
            </Link>
            <Link 
              href="/how-it-works" 
              className="text-gray-700 hover:text-gray-900 font-medium px-2 py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-700 hover:text-gray-900 font-medium px-2 py-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            
            {/* Mobile Auth Links */}
            <div className="border-t border-gray-200 pt-4">
              {isAuthenticated && user ? (
                <>
                  <span className="text-gray-500 px-2 py-1 block text-xs">
                    You have {tokenBalance} Tokens
                  </span>
                  <Link 
                    href="/profile" 
                    className="text-gray-700 hover:text-gray-900 font-medium px-2 py-1 block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="text-gray-700 hover:text-gray-900 font-medium px-2 py-1 block w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link 
                    href="/sign-in"
                    className="text-gray-700 hover:text-gray-900 font-medium px-2 py-1 block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/sign-in?mode=signup"
                    className="text-gray-700 hover:text-gray-900 font-medium px-2 py-1 block border border-gray-300 rounded-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}