'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface Person {
  name: string;
  role: string;
  company: string;
  avatar: string;
  color: string;
}

interface DetailedTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  result: string;
  avatar: string;
  color: string;
  image: string;
}

const people: Person[] = [
  { name: "Sarah Chen", role: "VP Sales", company: "TechStart Solutions", avatar: "SC", color: "from-blue-400 to-purple-500" },
  { name: "Marcus Rodriguez", role: "Enterprise AE", company: "Growth Dynamics", avatar: "MR", color: "from-green-400 to-blue-500" },
  { name: "Jennifer Walsh", role: "Sales Director", company: "B2B Solutions", avatar: "JW", color: "from-purple-400 to-pink-500" },
  { name: "David Park", role: "SDR Manager", company: "Scale Inc", avatar: "DP", color: "from-orange-400 to-red-500" },
  { name: "Lisa Thompson", role: "Sales Manager", company: "Revenue Pro", avatar: "LT", color: "from-indigo-400 to-purple-500" },
  { name: "Michael Chen", role: "Account Executive", company: "SalesForce Pro", avatar: "MC", color: "from-teal-400 to-blue-500" },
  { name: "Amanda Johnson", role: "BDR Lead", company: "Startup Hub", avatar: "AJ", color: "from-pink-400 to-purple-500" },
  { name: "Robert Kim", role: "Sales VP", company: "Tech Dynamics", avatar: "RK", color: "from-yellow-400 to-orange-500" },
  { name: "Elena Rodriguez", role: "Inside Sales", company: "CloudTech", avatar: "ER", color: "from-cyan-400 to-blue-500" },
  { name: "James Wilson", role: "Regional Manager", company: "Enterprise Co", avatar: "JW2", color: "from-emerald-400 to-green-500" }
];

const detailedTestimonials: DetailedTestimonial[] = [
  {
    quote: "I went from 12% close rate to 67% close rate in just 3 months. The AI literally reads minds and tells me exactly how to communicate with each prospect based on their psychology.",
    name: "Sarah Chen",
    role: "VP Sales",
    company: "TechStart Solutions",
    result: "+558% close rate",
    avatar: "SC",
    color: "from-blue-400 to-purple-500",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    quote: "My response rates went from 3% to 34%. The psychology insights are game-changing. I know exactly which emotional triggers to use for each personality type.",
    name: "Marcus Rodriguez",
    role: "Enterprise AE", 
    company: "Growth Dynamics",
    result: "+$1.2M revenue",
    avatar: "MR",
    color: "from-green-400 to-blue-500",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    quote: "Every email now hits like a precision strike. My prospects actually thank me for reaching out. It's like having Tony Robbins writing my emails.",
    name: "Jennifer Walsh",
    role: "Sales Director",
    company: "B2B Solutions", 
    result: "+423% ROI",
    avatar: "JW",
    color: "from-purple-400 to-pink-500",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    quote: "The DISC personality insights changed everything. Now I know whether I'm talking to a Driver or an Influencer within seconds. My conversion rates doubled.",
    name: "David Park",
    role: "SDR Manager",
    company: "Scale Inc",
    result: "+247% conversion",
    avatar: "DP",
    color: "from-orange-400 to-red-500",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    quote: "Understanding Cialdini's influence principles through AI recommendations helped me close deals I never thought possible. The psychology approach works.",
    name: "Lisa Thompson",
    role: "Sales Manager",
    company: "Revenue Pro",
    result: "+89% close rate",
    avatar: "LT",
    color: "from-indigo-400 to-purple-500",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    quote: "The behavioral triggers and emotional mapping features are incredible. I can predict exactly how prospects will respond before I even send the email.",
    name: "Michael Chen",
    role: "Account Executive",
    company: "SalesForce Pro",
    result: "+15 hrs saved/week",
    avatar: "MC",
    color: "from-teal-400 to-blue-500",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  }
];

export function TestimonialsGallery() {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [controls, isInView]);

  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden" ref={ref}>
      <div className="container px-4 mx-auto max-w-7xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Loved by Sales Professionals Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join thousands of professionals who've transformed their sales results with psychology-powered AI
          </p>
        </motion.div>

        {/* Moving Testimonials Gallery */}
        <div className="w-full overflow-hidden mb-16">
          <motion.div 
            className="flex space-x-6 items-center"
            animate={{ x: [0, -1800] }}
            transition={{ 
              repeat: Infinity, 
              duration: 40, 
              ease: "linear" 
            }}
          >
            {[...detailedTestimonials, ...detailedTestimonials].map((testimonial, index) => (
              <div key={index} className="flex-shrink-0 bg-white p-6 rounded-2xl shadow-lg border border-gray-100 w-96">
                <div className="flex items-center mb-4">
                  <Image 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    <p className="text-blue-600 text-sm font-medium">{testimonial.company}</p>
                  </div>
                </div>
                <blockquote className="text-gray-700 italic mb-4 leading-relaxed text-sm">
                  "{testimonial.quote}"
                </blockquote>
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{testimonial.result}</div>
                  <div className="text-xs text-gray-500">improvement</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Key Metrics section moved to hero section */}

        {/* Overall Rating */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center space-x-2 bg-white px-8 py-4 rounded-full shadow-lg border border-gray-100 max-w-md mx-auto">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  className="w-5 h-5 text-yellow-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-lg font-bold text-gray-900">4.9/5</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">3,247+ reviews</span>
          </div>
          <p className="text-gray-500 text-sm mt-4">Based on verified customer reviews and results</p>
        </motion.div>
      </div>
    </section>
  );
}