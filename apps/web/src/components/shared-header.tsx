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

  return (
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
            <nav className="flex items-center space-x-4">
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
          )}
        </div>
      </div>
    </header>
  );
}
