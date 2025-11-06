'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface TestimonialsSectionProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Fashion Blogger',
    content: 'The quality of products here is outstanding! I\'ve been shopping here for months and every purchase has exceeded my expectations. The customer service is also top-notch.',
    rating: 5,
    avatar: '/avatars/sarah.jpg',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Tech Enthusiast',
    content: 'Fast shipping, great prices, and excellent product selection. This is my go-to store for all my tech needs. Highly recommended!',
    rating: 5,
    avatar: '/avatars/michael.jpg',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Home Decorator',
    content: 'I love how easy it is to find exactly what I\'m looking for. The website is user-friendly and the products always arrive exactly as described.',
    rating: 5,
    avatar: '/avatars/emily.jpg',
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Small Business Owner',
    content: 'As a business owner, I appreciate the reliable service and competitive pricing. This store has become an essential part of my supply chain.',
    rating: 5,
    avatar: '/avatars/david.jpg',
  },
];

export default function TestimonialsSection({
  className,
  title = 'What Our Customers Say',
  subtitle = 'Don\'t just take our word for it - hear from our satisfied customers',
}: TestimonialsSectionProps) {
  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <div className="flex justify-center mb-4">
                    <Quote className="h-8 w-8 text-primary/20" />
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < testimonial.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground text-sm mb-6 text-center leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {testimonial.name}
                    </h4>
                    <p className="text-muted-foreground text-xs">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-primary mb-2">50K+</div>
            <div className="text-muted-foreground text-sm">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-muted-foreground text-sm">Average Rating</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">99%</div>
            <div className="text-muted-foreground text-sm">Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground text-sm">Customer Support</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

