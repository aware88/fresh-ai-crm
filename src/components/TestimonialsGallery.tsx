'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Head of Sales, TechCorp',
    content: 'CRM Mind has completely transformed how we manage our sales pipeline. The AI insights help us focus on the right deals at the right time.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'CEO, StartUpX',
    content: "The automation features saved us dozens of hours per week. Our team can now focus on building relationships instead of data entry.",
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Marketing Director, GrowthLabs',
    content: "The integration with our existing tools was seamless. We've seen a 30% increase in lead conversion since implementing CRM Mind.",
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Founder, SaaS Venture',
    content: "The analytics dashboard gives us real-time insights that help us make data-driven decisions. It's become an essential tool for our business.",
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 5,
    name: 'Jessica Williams',
    role: 'Customer Success Manager, Enterprise Co',
    content: "Our customer satisfaction scores have improved by 25% since implementing CRM Mind. The team loves how intuitive it is to use.",
    image: 'https://images.unsplash.com/photo-1508214758996-5c2c2c9b6a5d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&q=80'
  }
];

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => (
  <motion.div
    className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex-shrink-0 w-80 mx-4"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    viewport={{ once: true }}
  >
    <div className="flex items-center mb-4">
      <img 
        src={testimonial.image} 
        alt={testimonial.name}
        className="w-12 h-12 rounded-full object-cover mr-4"
      />
      <div>
        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
        <p className="text-sm text-gray-600">{testimonial.role}</p>
      </div>
    </div>
    <p className="text-gray-700 italic">"{testimonial.content}"</p>
    <div className="flex mt-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg 
          key={star}
          className="w-5 h-5 text-yellow-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  </motion.div>
);

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
    <section className="py-20 bg-white relative overflow-hidden" ref={ref}>
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Loved by teams worldwide
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of businesses that trust our platform to grow their customer relationships.
          </p>
        </div>

        <div className="relative overflow-hidden py-8">
          <motion.div 
            className="flex" 
            animate={{
              x: ['0%', '-50%'],
              transition: {
                x: {
                  repeat: Infinity,
                  repeatType: 'loop' as const,
                  duration: 30,
                  ease: 'linear',
                },
              },
            }}
          >
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <TestimonialCard 
                key={`${testimonial.id}-${index}`} 
                testimonial={testimonial} 
                index={index % testimonials.length} 
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
