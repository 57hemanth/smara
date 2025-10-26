"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SharedHeaderProps {
  showAuthButtons?: boolean;
  currentPage?: 'login' | 'signup' | 'home';
}

export function SharedHeader({ showAuthButtons = true, currentPage }: SharedHeaderProps) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when at top or scrolling up, hide when scrolling down
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down (with minimum scroll distance)
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className={`fixed top-6 left-0 right-0 z-50 px-4 transition-all duration-500 ease-out ${
        isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
      }`}>
        <div className="mx-auto max-w-[70%] bg-black/70 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl shadow-black/40 hover:shadow-black/60 transition-all duration-300 hover:scale-[1.02] hover:bg-black/80">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <img src="/dark-logo.png" alt="SMARA Logo" className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span className="text-lg font-semibold">SMARA</span>
            </Link>
            
            {showAuthButtons && (
              <>
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-4">
                  {currentPage === 'login' ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">Don&apos;t have an account?</span>
                      <Button size="sm" className="bg-white text-black hover:bg-gray-100 rounded-full px-4 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg" asChild>
                        <Link href="/signup">Sign Up</Link>
                      </Button>
                    </div>
                  ) : currentPage === 'signup' ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">Already have an account?</span>
                      <Button size="sm" className="bg-white text-black hover:bg-gray-100 rounded-full px-4 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg" asChild>
                        <Link href="/login">Sign In</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Link href="/login" className="text-gray-300 hover:text-white transition-all duration-200 text-sm relative group">
                        Sign In
                        <span className="absolute inset-x-0 -bottom-1 h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
                      </Link>
                      <Button size="sm" className="bg-white text-black hover:bg-gray-100 rounded-full px-4 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg" asChild>
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </>
                  )}
                </nav>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[280px] bg-black/95 backdrop-blur-xl border-l border-white/10 z-50 md:hidden transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <img src="/dark-logo.png" alt="SMARA Logo" className="w-6 h-6" />
              <span className="text-lg font-semibold">SMARA</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <nav className="flex flex-col space-y-6 flex-1">
            {currentPage === 'login' ? (
              <>
                <Link 
                  href="/" 
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <div className="pt-4 border-t border-white/10">
                  <Button 
                    size="lg" 
                    className="w-full bg-white text-black hover:bg-gray-100 rounded-full"
                    asChild
                  >
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              </>
            ) : currentPage === 'signup' ? (
              <>
                <Link 
                  href="/" 
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <div className="pt-4 border-t border-white/10">
                  <Button 
                    size="lg" 
                    className="w-full bg-white text-black hover:bg-gray-100 rounded-full"
                    asChild
                  >
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <div className="pt-4 border-t border-white/10">
                  <Button 
                    size="lg" 
                    className="w-full bg-white text-black hover:bg-gray-100 rounded-full"
                    asChild
                  >
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </nav>

          <div className="text-xs text-gray-500 text-center mt-auto">
            © 2025 SMARA. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}
