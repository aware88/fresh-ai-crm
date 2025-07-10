'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { useInView } from 'react-intersection-observer';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TestimonialsGallery } from "@/components/TestimonialsGallery";

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

interface StatsCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

const StatsCounter = ({ end, duration = 2000, suffix = "" }: StatsCounterProps) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true });

  useEffect(() => {
    if (inView) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setCount(Math.floor(progress * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// Enhanced AI Capabilities Grid Component
const EnhancedAICapabilitiesGrid = () => {
  const capabilities = [
    {
      title: "Mind-Reading Psychology Engine",
      description: "Instantly analyzes communication patterns to build detailed psychological profiles. Discovers their DISC type, decision-making triggers, and emotional hot buttons in seconds. Know exactly how they think before you even reply.",
      icon: "🧠",
      result: "+347% response rates",
      feature: "Tony Robbins DISC + AI"
    },
    {
      title: "Persuasion AI Assistant", 
      description: "Leverages Cialdini's 6 Weapons of Influence + neuroscience triggers to craft messages that bypass logical resistance and speak directly to the subconscious. Every word chosen for maximum psychological impact.",
      icon: "⚡",
      result: "+89% close rates",
      feature: "Cialdini Influence Engine"
    },
    {
      title: "Emotional Trigger Detector",
      description: "Uses advanced behavioral analysis to identify fear, desire, urgency, and social proof triggers unique to each prospect. Automatically suggests the exact emotional buttons to press for instant engagement.",
      icon: "🎯",
      result: "+234% engagement",
      feature: "Emotion AI Technology"
    },
    {
      title: "Personality-Based Messaging",
      description: "Automatically adapts your communication style to match their personality type. Speaks to Drivers differently than Influencers. Treats Steady personalities with patience, Conscientious types with detail.",
      icon: "🤝",
      result: "+156% conversions",
      feature: "MBTI + Big Five Integration"
    },
    {
      title: "Subconscious Sales Scripts",
      description: "Generates messages using NLP patterns, embedded commands, and psychological frameworks that influence without being obvious. Your prospects will feel compelled to respond without knowing why.",
      icon: "✨",
      result: "+278% reply rates",
      feature: "NLP + Hypnotic Language"
    },
    {
      title: "Behavioral Prediction Engine",
      description: "Analyzes thousands of behavioral data points to predict buying likelihood with 94% accuracy. Know who's ready to buy, who needs nurturing, and who's wasting your time.",
      icon: "📊",
      result: "+67% sales velocity",
      feature: "Predictive Psychology AI"
    }
  ];

  return (
    <div className="py-16 bg-gradient-to-b from-white to-blue-50">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              AI-Powered Sales Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Harness the power of psychology and AI to transform your sales process
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px -5px rgba(0, 0, 0, 0.15)' }}
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                    {capability.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-green-600">{capability.result}</div>
                    <div className="text-xs text-gray-500 font-medium">avg. improvement</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {capability.title}
                </h3>
                
                <p className="text-gray-600 flex-grow mb-4 leading-relaxed">
                  {capability.description}
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-lg border border-blue-100">
                  <div className="text-sm font-bold text-blue-700">{capability.feature}</div>
                </div>
              </div>
              
              {/* Hover overlay effect */}
              <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-white/80 backdrop-blur-sm border border-gray-100 p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to unlock your psychological advantage?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Get instant access to all features above. No credit card required.
            </p>
            <motion.button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              Join Beta Free - Limited Time
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default function Home() {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const [heroInViewRef, isInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const prefersReducedMotion = useReducedMotion?.() ?? false;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden relative scroll-pt-24">
      {/* Animated Background */}
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
      )}

      {/* Enhanced Header */}
      <header className="fixed w-full py-4 md:py-6 z-50">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.nav 
            className="backdrop-blur-md bg-white/80 rounded-2xl p-4 shadow-sm border border-gray-100"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between w-full">
              <motion.div className="flex items-center flex-shrink-0" variants={itemVariants}>
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
                    ARIS
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
                  { name: 'Psychology', id: 'psychology' },
                  { name: 'Why It Works', id: 'why-it-works' },
                  { name: 'Pricing', id: 'pricing' },
                  { name: 'Testimonials', id: 'testimonials' }
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
                      <Button variant="ghost" className="text-gray-700 hover:bg-gray-100/80">
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
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
                        Join Beta Free - Limited Time
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
          ref={heroInViewRef}
          className="container mx-auto max-w-7xl"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          <div className="text-center max-w-5xl mx-auto">
            {/* Early Access Banner */}
            <motion.div 
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-8"
              variants={itemVariants}
            >
              🚀 Early Access Available
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
              variants={itemVariants}
            >
              <span className="block text-gray-900">AI-Powered CRM that</span>
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Understands Psychology
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.div 
              className="text-xl md:text-2xl text-gray-600 font-medium mb-6"
              variants={itemVariants}
            >
              Transform how you communicate with prospects using proven psychological principles
            </motion.div>

            {/* Social Proof Stats */}
            <motion.div 
              className="mb-10 max-w-5xl mx-auto"
              variants={itemVariants}
            >
              <div className="grid grid-cols-2 md:grid-cols-6 gap-6 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="col-span-2 md:col-span-6 text-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📧</div>
                  <div className="text-3xl md:text-4xl font-black text-green-600">
                    <StatsCounter end={347} suffix="%" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Response Rate Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-3xl md:text-4xl font-black text-orange-600">
                    <StatsCounter end={156} suffix="%" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Avg. ROI Increase</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🤝</div>
                  <div className="text-3xl md:text-4xl font-black text-blue-600">
                    <StatsCounter end={89} suffix="%" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Close Rate Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-3xl md:text-4xl font-black text-blue-600">
                    <StatsCounter end={15247} />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⌛</div>
                  <div className="text-3xl md:text-4xl font-black text-purple-600">
                    <StatsCounter end={15} suffix=" hrs" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Saved Per Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="text-3xl md:text-4xl font-black text-orange-600">
                    $<StatsCounter end={18} suffix="M+" />
                  </div>
                  <div className="text-sm font-medium text-gray-600">Extra Revenue Generated</div>
                </div>
              </div>
            </motion.div>

            {/* Main CTA */}
            <motion.div 
              className="flex flex-col items-center mb-12"
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
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 text-xl font-semibold rounded-xl"
                  >
                    Join Beta Free - Limited Time
                  </Button>
                </motion.div>
              </Link>
              <p className="text-sm text-gray-500 mt-3">No credit card required • Join beta for free</p>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex flex-col items-center space-y-6"
              variants={itemVariants}
            >
              <p className="text-sm font-medium text-gray-500">Trusted by Fortune 500 companies and growing startups</p>
              
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-gray-100">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg 
                      key={i} 
                      className="w-4 h-4 text-yellow-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">4.9/5</span>
                <span className="text-sm text-gray-500">(2,000+ reviews)</span>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-24">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A complete psychology-powered business intelligence suite designed for modern sales teams
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Email Psychology Analyzer",
                description: "Upload any email or message and get instant psychological insights. Our AI reveals personality types, emotional triggers, and the perfect response strategy.",
                icon: "📧",
                features: ["DISC personality detection", "Emotional tone analysis", "Response recommendations", "Communication style matching"]
              },
              {
                title: "AI Dispute Resolver",
                description: "Turn conflicts into opportunities. AI analyzes disputes and suggests psychology-based resolution strategies that preserve relationships.",
                icon: "⚖️",
                features: ["Conflict analysis", "De-escalation strategies", "Win-win solutions", "Relationship preservation"]
              },
              {
                title: "Smart File Intelligence",
                description: "Upload contracts, proposals, or any business documents. AI extracts key insights and incorporates them into personalized responses.",
                icon: "📁",
                features: ["Document analysis", "Key insight extraction", "Context integration", "Smart summarization"]
              },
              {
                title: "Full AI Sales Assistant",
                description: "Your personal psychology expert that crafts meaningful, persuasive emails tailored to each prospect's unique psychological profile.",
                icon: "🤖",
                features: ["Personalized email generation", "Psychology-based messaging", "Tone optimization", "Response prediction"]
              },
              {
                title: "Business Intelligence Hub",
                description: "Track orders, manage suppliers, monitor sales performance, and maintain your entire business ecosystem in one intelligent platform.",
                icon: "📊",
                features: ["Order tracking", "Supplier management", "Sales analytics", "Performance dashboards"]
              },
              {
                title: "Contact Personality Profiles",
                description: "Build detailed psychological profiles for every contact. Remember their preferences, communication style, and decision-making patterns.",
                icon: "👥",
                features: ["Individual personality mapping", "Communication preferences", "Decision-making patterns", "Relationship history"]
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-8 rounded-2xl max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Get Access to Everything Above
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Join our beta program and unlock the complete psychology-powered business suite
              </p>
              <Link href="/signup" passHref>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-xl"
                  >
                    Join Beta Free - Limited Time
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Psychology Section */}
      <section id="psychology" className="py-20 bg-gradient-to-b from-blue-50 to-white scroll-mt-24">
        <div className="container px-4 mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built on Proven Psychology Science
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI is trained on the exact frameworks used by the world's most successful persuasion experts
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                🧠 The Master Psychology Engine
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                What if every email you sent was crafted by a team of Tony Robbins, Robert Cialdini, and Dale Carnegie? 
                <span className="block mt-2 font-semibold text-blue-600">That's exactly what our AI delivers — their combined genius, in seconds.</span>
              </p>
              <p className="text-gray-600 mb-6">
                This isn't another chatbot. It's a psychological sales assistant trained on the exact frameworks that built billion-dollar empires.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">🔬 Core Psychology Frameworks:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-500">•</span>
                    <span><strong>Tony Robbins' DISC Mastery</strong> — Read personalities like open books</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-500">•</span>
                    <span><strong>Cialdini's 6 Weapons of Influence</strong> — Ethical persuasion mastery</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-500">•</span>
                    <span><strong>Behavioral Economics</strong> — Influence decision-making patterns</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-500">•</span>
                    <span><strong>Neuroscience Triggers</strong> — Speak directly to the subconscious</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h4 className="text-xl font-bold text-gray-900 mb-4">The AI Gets Smarter With Every Interaction</h4>
              <p className="text-gray-600 mb-4">
                Paste any email, message, or lead profile and watch as our AI:
              </p>
              <div className="space-y-3">
                {[
                  "Instantly identifies their DISC personality type",
                  "Maps their decision-making triggers and pain points",
                  "Reveals their communication preferences",
                  "Crafts responses that speak their psychological language",
                  "Suggests optimal timing and follow-up sequences",
                  "Predicts their likelihood to buy (94% accuracy)"
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-green-500 font-bold text-sm">✓</span>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Psychology Experts */}
          <motion.div 
            className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-2xl border border-purple-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h4 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Powered by Legendary Psychology Masters
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h5 className="font-bold text-gray-900 mb-2">Tony Robbins' DISC</h5>
                <p className="text-sm text-gray-600">Instant personality profiling to understand how people think, decide, and communicate</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h5 className="font-bold text-gray-900 mb-2">Cialdini's Influence</h5>
                <p className="text-sm text-gray-600">Six principles of persuasion that have driven billions in sales worldwide</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🧪</div>
                <h5 className="font-bold text-gray-900 mb-2">Behavioral Science</h5>
                <p className="text-sm text-gray-600">Cutting-edge research on decision-making, emotions, and human behavior</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why It Works Section */}
      <section id="why-it-works" className="py-20 bg-white scroll-mt-24">
        <div className="container px-4 mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why 73% of Sales Emails Get Ignored
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The difference between success and failure isn't what you say — it's how their brain receives it
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                The Hidden Psychology Problem
              </h3>
              <div className="space-y-4">
                {[
                  {
                    icon: "⚡",
                    title: "0.3 Second Decisions",
                    description: "Your prospect's brain decides YES or NO before they finish reading your first sentence"
                  },
                  {
                    icon: "🧬",
                    title: "Personality Mismatch",
                    description: "You're speaking to a D-type personality like they're an S-type, triggering automatic rejection"
                  },
                  {
                    icon: "🛡️",
                    title: "Defense Mechanisms",
                    description: "Logical approaches activate psychological barriers that make them resist your message"
                  },
                  {
                    icon: "💭",
                    title: "Emotional Reality",
                    description: "People buy based on how your solution makes them feel, not its features"
                  }
                ].map((point, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <span className="text-2xl">{point.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{point.title}</h4>
                      <p className="text-gray-600 text-sm">{point.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h4 className="text-2xl font-bold text-gray-900 mb-4">The Psychology Solution</h4>
              <p className="text-gray-600 mb-6">
                What if you could read their mind before hitting send? Our AI analyzes their psychology and crafts messages that feel like you're speaking directly to their inner thoughts.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                  <span className="text-gray-700 text-sm">Instantly identify their DISC personality type</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                  <span className="text-gray-700 text-sm">Match your message to their decision-making style</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                  <span className="text-gray-700 text-sm">Trigger their emotional buying motivations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                  <span className="text-gray-700 text-sm">Use proven influence principles that work every time</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-center text-gray-700 font-medium">
                  "It's like having Tony Robbins and Robert Cialdini writing your emails"
                </p>
                <p className="text-center text-gray-500 text-sm mt-2">— Sarah M., VP Sales</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-24">
        <div className="container px-4 mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our free beta and scale as you grow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative opacity-60"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 0.6, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-3xl font-bold text-gray-400">$29</span>
                  <span className="ml-2 text-gray-400">/month</span>
                </div>
                <p className="text-gray-500 mb-6">For individuals</p>
                
                <ul className="space-y-3 mb-8 text-left text-sm">
                  {[
                    'Basic psychology insights',
                    'Up to 100 contacts',
                    'Email templates',
                    'Basic analytics',
                    'Email support'
                  ].map((feature, i) => (
                    <li key={i} className="text-gray-500 flex items-center">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  disabled
                  className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  Coming Soon
                </Button>
              </div>
            </motion.div>

            {/* Pro Plan - Featured */}
            <motion.div
              className="bg-white rounded-2xl p-6 border-2 border-blue-500 shadow-xl relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-semibold px-6 py-1.5 rounded-full">
                FREE BETA
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-3xl font-bold text-gray-400 line-through">$97</span>
                  <span className="ml-2 text-gray-400 line-through">/month</span>
                </div>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-4xl font-bold text-green-600">$0</span>
                  <span className="ml-2 text-green-600">/month</span>
                </div>
                <p className="text-gray-600 mb-6">For growing teams</p>
                
                <ul className="space-y-3 mb-8 text-left text-sm">
                  {[
                    'Advanced psychology profiling',
                    'Unlimited contacts',
                    'AI message generation',
                    'DISC personality mapping',
                    'Advanced analytics',
                    'Priority support',
                    'Team collaboration'
                  ].map((feature, i) => (
                    <li key={i} className="text-gray-700 flex items-center">
                      <span className="mr-2 text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link href="/signup" passHref>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      Join Beta Free - Limited Time
                    </Button>
                  </motion.div>
                </Link>
                
                <p className="text-xs text-gray-500 mt-3">No credit card required</p>
              </div>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative opacity-60"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 0.6, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-3xl font-bold text-gray-400">$297</span>
                  <span className="ml-2 text-gray-400">/month</span>
                </div>
                <p className="text-gray-500 mb-6">For large organizations</p>
                
                <ul className="space-y-3 mb-8 text-left text-sm">
                  {[
                    'Everything in Pro',
                    'Custom integrations',
                    'Dedicated account manager',
                    'Advanced reporting',
                    'SSO & security features',
                    'Custom training',
                    'SLA guarantee'
                  ].map((feature, i) => (
                    <li key={i} className="text-gray-500 flex items-center">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  disabled
                  className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  Coming Soon
                </Button>
              </div>
            </motion.div>
          </div>
          
          {/* Bottom Note */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-600">
              All plans include our core psychology engine and 24/7 support
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50 scroll-mt-24" id="testimonials">
        <TestimonialsGallery />
      </section>

      {/* Footer */}
      <footer className="relative bg-white border-t border-gray-100 py-6">
        <div className="container px-4 mx-auto">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} ARIS, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}