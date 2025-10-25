"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Upload, Chrome, Zap, Shield, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
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
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute left-[32%] top-[-10%] h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className={`fixed top-6 left-0 right-0 z-50 px-4 transition-all duration-500 ease-out ${
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'
        }`}>
          <div className="mx-auto max-w-[70%] bg-black/70 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-2xl shadow-black/40 hover:shadow-black/60 transition-all duration-300 hover:scale-[1.02] hover:bg-black/80">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2 group">
                <img src="/dark-logo.png" alt="SMARA Logo" className="w-6 h-6 transition-transform group-hover:scale-110" />
                <span className="text-lg font-semibold">SMARA</span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-6">
                <Link href="#features" className="text-gray-300 hover:text-white transition-all duration-200 text-sm relative group">
                  Features
                  <span className="absolute inset-x-0 -bottom-1 h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
                </Link>
                <Link href="#pricing" className="text-gray-300 hover:text-white transition-all duration-200 text-sm relative group">
                  Pricing
                  <span className="absolute inset-x-0 -bottom-1 h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
                </Link>
                <Link href="/login" className="text-gray-300 hover:text-white transition-all duration-200 text-sm relative group">
                  Sign In
                  <span className="absolute inset-x-0 -bottom-1 h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
                </Link>
                <Button size="sm" className="bg-white text-black hover:bg-gray-100 rounded-full px-4 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-32 sm:pt-24 sm:pb-40 mt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-gray-800 text-gray-300 border-gray-700">
                ⚡️ Now with Browser Extension
              </Badge>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white">
                Remember Everything,
                <br />
                <span className="text-gray-400">
                  Effortlessly
                </span>
              </h1>
              
              <p className="text-xl sm:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Search, upload, and organize any content. From documents to images, audio to video. Make everything instantly searchable with AI-powered intelligence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="px-8 py-4 text-lg bg-white text-black hover:bg-gray-100" asChild>
                  <Link href="/signup">
                    Start Free Trial
                    <Zap className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                {/* <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-gray-600 text-gray-300 hover:text-white hover:border-gray-400" asChild>
                  <Link href="#features">
                    See How It Works
                  </Link>
                </Button> */}
              </div>
              
              <div className="mt-16 text-sm text-gray-400">
                Trusted by 100+ users worldwide • Free 14-day trial • No credit card required
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-gradient-to-b from-transparent to-gray-900/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-white">
                Everything you need to
                <br />
                <span className="text-gray-400">
                  never lose anything again
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Powerful AI-driven features that make content capture and search effortless across all your devices.
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <CardTitle className="text-white">Intelligent Search</CardTitle>
                  <CardDescription className="text-gray-300">
                    Find any content instantly with AI-powered semantic search across all your files, images, and captured content.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-gray-300" />
                  </div>
                  <CardTitle className="text-white">Universal Upload</CardTitle>
                  <CardDescription className="text-gray-300">
                    Drag & drop any file type. Documents, images, videos, audio - everything becomes searchable automatically.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <Chrome className="w-6 h-6 text-gray-300" />
                  </div>
                  <CardTitle className="text-white">Browser Extension</CardTitle>
                  <CardDescription className="text-gray-300">
                    Capture text, images, and bookmarks from any website. Right-click to save, search from your browser.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-gray-300" />
                  </div>
                  <CardTitle className="text-white">AI Processing</CardTitle>
                  <CardDescription className="text-gray-300">
                    Automatic transcription, OCR, and content extraction. Voice notes become text, images become searchable.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-gray-300" />
                  </div>
                  <CardTitle className="text-white">Privacy First</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your data stays secure with enterprise-grade encryption. User-filtered search ensures privacy by default.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-gray-300" />
                  </div>
                  <CardTitle className="text-white">Cross-Platform</CardTitle>
                  <CardDescription className="text-gray-300">
                    Access your content from anywhere. Web dashboard, mobile apps, and browser extension sync seamlessly.
                  </CardDescription>
                </CardHeader>
              </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Start free and scale as you grow. All plans include core features with generous limits.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Free</CardTitle>
                  <div className="text-4xl font-bold text-white">$0</div>
                  <CardDescription className="text-gray-300">Perfect to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-300 mb-8">
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Quick search
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      1GB storage
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      100 uploads/month
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Basic search
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Browser extension
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full border-gray-600 text-gray-900 hover:text-white" asChild>
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="bg-gray-900/70 border-white/20 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-white text-black">Most Popular</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Pro</CardTitle>
                  <div className="text-4xl font-bold text-white">
                    $12
                    <span className="text-lg text-gray-300">/month</span>
                  </div>
                  <CardDescription className="text-gray-300">For power users</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-300 mb-8">
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      50GB storage
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Unlimited uploads
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      AI-powered search
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Priority processing
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      API access
                    </li>
                  </ul>
                  <Button className="w-full bg-white text-black hover:bg-gray-100" asChild>
                    <Link href="/signup">Start Free Trial</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">Enterprise</CardTitle>
                  <div className="text-4xl font-bold text-white">Custom</div>
                  <CardDescription className="text-gray-300">For teams & organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-300 mb-8">
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Unlimited storage
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Team management
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      SSO integration
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Custom deployment
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      24/7 support
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full border-gray-600 text-gray-900 hover:text-white" asChild>
                    <Link href="#">Contact Sales</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-black/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              
              {/* Brand Column */}
              <div className="lg:col-span-1">
                <Link href="/" className="flex items-center space-x-2 mb-6 justify-center">
                  <img src="/dark-logo.png" alt="SMARA Logo" className="w-6 h-6 transition-transform group-hover:scale-110" />
                  <span className="text-xl font-semibold">SMARA</span>
                </Link>
                <p className="text-gray-300 mb-6 leading-relaxed max-w-xs mx-auto">
                  Remember everything, effortlessly. The AI-powered content capture and search platform.
                </p>
                <div className="text-sm text-gray-400">
                  © 2025 SMARA. All rights reserved.
                </div>
              </div>

              {/* Product Column */}
              <div>
                <h3 className="font-semibold text-white mb-6">Product</h3>
                <ul className="space-y-3 text-gray-300">
                  <li><Link href="#features" className="hover:text-white transition-colors inline-block py-1">Features</Link></li>
                  <li><Link href="#pricing" className="hover:text-white transition-colors inline-block py-1">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">API</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Integrations</Link></li>
                </ul>
              </div>

              {/* Company Column */}
              <div>
                <h3 className="font-semibold text-white mb-6">Company</h3>
                <ul className="space-y-3 text-gray-300">
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">About</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Blog</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Careers</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Contact</Link></li>
                </ul>
              </div>

              {/* Support Column */}
              <div>
                <h3 className="font-semibold text-white mb-6">Support</h3>
                <ul className="space-y-3 text-gray-300">
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Help Center</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Terms of Service</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors inline-block py-1">Status</Link></li>
                </ul>
              </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}