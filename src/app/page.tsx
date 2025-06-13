'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useInView } from 'react-intersection-observer';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AICapabilitiesGrid from '@/components/AICapabilitiesGrid';
import { TestimonialsGallery } from "@/components/TestimonialsGallery";

// This is a new landing page implementation with modern design and animations
// The original is safely backed up at: /src/app/backup/landing-page-original.tsx

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(heroRef, { once: true, amount: 0.1 });
  const prefersReducedMotion = useReducedMotion?.() ?? false;
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag to avoid hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animated gradient background effect with reduced motion support
  useEffect(() => {
    if (prefersReducedMotion || !isClient) return;
    
    const background = backgroundRef.current;
    if (!background) return;

    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 20;
        const y = (clientY / window.innerHeight - 0.5) * 20;
        
        background.style.setProperty('--mouse-x', `${x}px`);
        background.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    const handleMouseLeave = () => {
      background.style.setProperty('--mouse-x', '0px');
      background.style.setProperty('--mouse-y', '0px');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [prefersReducedMotion, isClient]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden relative">
      {/* Animated Background - Only render if not in reduced motion mode */}
      {!prefersReducedMotion && isClient && (
        <div 
          ref={backgroundRef}
          className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div 
            className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
              transformStyle: 'preserve-3d'
            }}
          >
            <div 
              className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform, opacity'
              }}
              aria-hidden="true"
            >
              <div 
                className="absolute top-0 -right-1/4 w-[800px] h-[800px] bg-gradient-to-r from-blue-100 to-transparent rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform, opacity'
                }}
                aria-hidden="true"
              />
              <div 
                className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-gradient-to-r from-indigo-100 to-transparent rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform, opacity'
                }}
                aria-hidden="true"
              />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-purple-100 to-transparent rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform, opacity'
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header with glass morphism */}
      <header className="fixed w-full py-4 md:py-6 z-50">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.nav 
            className="backdrop-blur-md bg-white/80 rounded-2xl p-4 shadow-sm border border-gray-100"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between w-full">
              <motion.div 
                className="flex items-center flex-shrink-0"
                variants={itemVariants}
              >
                <Link href="/" className="flex items-center space-x-2 group">
                  <motion.div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                    whileHover={{ rotate: 10, scale: 1.05 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 0 1 10 10c0 6-10 10-10 10S2 18 2 12A10 10 0 0 1 12 2Z"></path>
                      <path d="M12 12v4"></path>
                      <path d="M12 8h.01"></path>
                    </svg>
                  </motion.div>
                  <motion.span 
                    className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    CRM Mind
                  </motion.span>
                </Link>
              </motion.div>
              
              <motion.div 
                className="hidden md:flex items-center space-x-1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {[
                  { name: 'Features', id: 'features' },
                  { name: 'Pricing', id: 'pricing' },
                  { name: 'Testimonials', id: 'testimonials' },
                  { name: 'About', id: 'contact' }  // Using contact section as About for now
                ].map((item) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <a 
                      href={`#${item.id}`}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                    >
                      {item.name}
                    </a>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div 
                className="flex items-center space-x-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <Link href="/signin" passHref>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="ghost" 
                        className="text-gray-700 hover:bg-gray-100/80"
                      >
                        Sign In
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link href="/signup" passHref>
                    <motion.div 
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="shadow-lg shadow-blue-500/20"
                    >
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full h-full"
                      >
                        Join for BETA
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-24 px-4 relative z-10">
        <motion.section 
          ref={heroRef}
          className="container mx-auto max-w-7xl"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div 
              className="text-center lg:text-left"
              variants={itemVariants}
            >
              <motion.div 
                className="text-center lg:text-left"
                variants={itemVariants}
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    AI-Powered CRM
                  </span>
                  <span className="text-gray-800">that Understands Human Psychology</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-blue-600 font-medium mb-4">
                  It&apos;s not what you say, it&apos;s how you say it
                </p>
                
                <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Close more deals with psychology-based AI that helps you communicate more effectively with every prospect and customer.
                </p>
              </motion.div>
              
              <motion.div 
                className="flex justify-center lg:justify-start"
                variants={itemVariants}
              >
                <Link href="/signup" passHref>
                  <motion.div
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="shadow-lg shadow-blue-500/20"
                  >
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 text-lg font-medium"
                    >
                      Join for BETA
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              
              <motion.div 
                className="mt-10 flex flex-col items-start space-y-3"
                variants={itemVariants}
              >
                <p className="text-sm font-medium text-gray-600">Trusted by 10,000+ businesses</p>
                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">4.8/5.0</span>
                  <span className="text-sm text-gray-500">(1,200+ reviews)</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Hero Image/Illustration */}
            <motion.div 
              className="relative mt-16 lg:mt-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative z-10 bg-white p-2 rounded-2xl shadow-2xl border border-gray-100">
                <div className="bg-gray-100 rounded-xl w-full aspect-[4/3] flex items-center justify-center text-gray-400">
                  {/* Animated Background - Only render if reduced motion is not preferred */}
                  {!prefersReducedMotion && (
                    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                      <div 
                        ref={backgroundRef}
                        className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'translateZ(0)',
                          transformStyle: 'preserve-3d',
                          willChange: 'transform'
                        }}
                      >
                        <div 
                          className="absolute top-1/4 -left-1/4 w-[30rem] h-[30rem] rounded-full bg-blue-100 opacity-30 mix-blend-multiply filter blur-[120px] animate-blob"
                          style={{
                            transform: 'translate3d(0, 0, 0)',
                            backfaceVisibility: 'hidden',
                            willChange: 'transform, opacity'
                          }}
                          aria-hidden="true"
                        />
                        <div 
                          className="absolute top-1/3 -right-1/4 w-[35rem] h-[35rem] rounded-full bg-purple-100 opacity-30 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000"
                          style={{
                            transform: 'translate3d(0, 0, 0)',
                            backfaceVisibility: 'hidden',
                            willChange: 'transform, opacity'
                          }}
                          aria-hidden="true"
                        />
                        <div 
                          className="absolute -bottom-1/4 left-1/4 w-[32rem] h-[32rem] rounded-full bg-pink-100 opacity-30 mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000"
                          style={{
                            transform: 'translate3d(0, 0, 0)',
                            backfaceVisibility: 'hidden',
                            willChange: 'transform, opacity'
                          }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  )}
                  <span>Dashboard Preview</span>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 -left-6 w-32 h-32 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-16 right-20 w-24 h-24 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* Features Section - Moved up after Hero */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-gradient-to-b from-blue-500/5 to-transparent rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="container px-4 mx-auto max-w-7xl relative z-10">
          {/* AI Capabilities Grid */}
          <div className="mb-20">
            <AICapabilitiesGrid />
          </div>
        </div>
        
        <div className="container px-4 mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div 
              className="text-left max-w-4xl mx-auto mb-12 bg-blue-50 p-8 rounded-2xl border border-blue-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                🧠 The Intelligence Behind Our AI Assistant
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                What if every message you sent was perfectly tailored to how the other person thinks, decides, and feels — in seconds?
                <span className="block mt-2 font-medium">That&apos;s exactly what our AI was built for.</span>
              </p>
              <p className="text-gray-600">
                This isn&apos;t just another chatbot. It&apos;s a trained psychological sales assistant that draws from the most powerful minds in human behavior and influence.
              </p>
            </motion.div>
            
            <motion.div 
              className="text-left max-w-4xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                📚 Trained on Real Science, Not Guesswork
              </h3>
              <p className="text-gray-600 mb-6">
                Our system is built from the same principles used by elite coaches, negotiators, and sales leaders &mdash; now applied to your inbox.
              </p>
              
              <h4 className="font-semibold text-gray-800 mb-3">🔥 Core Frameworks That Power It:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-8">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>DISC profiling, as taught by Tony Robbins, to decode personality types</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>MBTI and Big Five personality models for decision-making insights</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Cialdini&#39;s 6 Principles of Influence</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Neuroscience-based emotional triggers</span>
                </li>
              </ul>
              
              <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
                <h4 className="font-semibold text-gray-800 mb-3">🤖 But It Gets Smarter…</h4>
                <p className="text-gray-600 mb-4">
                  Every time you paste an email, message, or lead into the system:
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Matches tone and phrasing to known psychological profiles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Pulls real behavior-based strategies from our database</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Returns personality type, emotional triggers, and ready-to-send responses</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">🧠 Powered by:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Tony Robbins&apos; DISC insights</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Robert Cialdini&apos;s persuasion science</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Behavioral psychology from modern sales</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>OpenAI GPT-4, trained on your message history</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/features" passHref>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Button 
                  variant="outline" 
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg font-medium group"
                >
                  <span className="relative">
                    Explore All Features
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Built For Section */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for teams that want more wins, fewer regrets
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform how you communicate with AI that understands human psychology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'For SDRs',
                description: 'Stop sending cold emails that fall flat',
                icon: '💼'
              },
              {
                title: 'For Founders',
                description: 'Spend less time on follow-ups without losing opportunities',
                icon: '🚀'
              },
              {
                title: 'For Marketers',
                description: 'Match your tone to your buyer\'s psychology',
                icon: '🎯'
              },
              {
                title: 'For Sales Teams',
                description: 'Close more deals with psychology-backed communication',
                icon: '💡'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-2xl font-medium text-gray-800 mb-6">
              Close more deals. With more humanity. And less guesswork.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section - Moved after Features */}
      <section id="pricing" className="relative py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container px-4 mx-auto max-w-4xl">
          {/* Beta Badge */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
              🚀 Currently in Beta - Try It Free!
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start Using Our Platform Today
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get full access to all Pro features for free during our beta period. No credit card required.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl p-8 border-2 border-blue-500 shadow-xl max-w-2xl mx-auto relative">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-semibold px-6 py-1.5 rounded-full whitespace-nowrap">
              FREE BETA ACCESS
            </div>
            
            {/* Plan Info */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="ml-2 text-xl text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mb-8">For growing businesses</p>
              
              {/* Features */}
              <ul className="space-y-3 mb-8 text-left max-w-md mx-auto">
                {[
                  '✓ Up to 20 users',
                  '✓ Advanced analytics',
                  '✓ Priority support',
                  '✓ 100GB storage',
                  '✓ API access',
                  '✓ Advanced integrations',
                  '✓ Up to 10 team members',
                  '✓ Custom branding',
                  '✓ Advanced reporting'
                ].map((feature, i) => (
                  <li key={i} className="text-gray-700">
                    {feature}
                  </li>
                ))}
              </ul>
              
              {/* CTA Button */}
              <Button 
                className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 text-lg font-medium rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Join for BETA
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">No credit card required. Cancel anytime.</p>
            </div>
          </div>
          
          {/* Coming Soon Notice */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">Other plans coming soon</p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                Starter: Coming Soon
              </span>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                Enterprise: Contact Us
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <TestimonialsGallery />
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-50 border-t border-gray-100 py-6">
        <div className="container px-4 mx-auto">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} CRM Mind, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
