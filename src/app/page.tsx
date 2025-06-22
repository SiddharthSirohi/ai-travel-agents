'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Hotel, MapPin, Utensils, Sparkles, ArrowRight, Users, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const features = [
    {
      icon: <Plane className="w-8 h-8" />,
      title: "Smart Flight Search",
      description: "Find the best flights with AI-powered price predictions and route optimization"
    },
    {
      icon: <Hotel className="w-8 h-8" />,
      title: "Perfect Accommodations",
      description: "Discover hotels that match your style, budget, and location preferences"
    },
    {
      icon: <Utensils className="w-8 h-8" />,
      title: "Local Dining",
      description: "Uncover hidden gems and must-try restaurants recommended by locals"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Curated Activities",
      description: "Experience unique activities and attractions tailored to your interests"
    }
  ];

  const benefits = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Personalized for You",
      description: "Every recommendation is tailored to your travel style and preferences"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save Hours of Planning",
      description: "What takes days to research, Columbus AI does in minutes"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Trusted Recommendations",
      description: "Backed by real traveler reviews and verified local insights"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <BrandLogo size={120} className="mx-auto drop-shadow-lg" />
            
            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl font-extrabold"
              >
                <span className="bg-gradient-to-r from-primary via-purple-600 to-secondary bg-clip-text text-transparent">
                  Columbus AI
                </span>
                <br />
                <span className="text-3xl md:text-4xl font-semibold text-muted-foreground">
                  Your AI Travel Planning Companion
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              >
                Plan unforgettable trips with the power of Columbus AI's smart travel agents. 
                From flights to restaurants, we handle the research so you can focus on the adventure.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button asChild size="lg" className="px-12 py-6 text-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href="/plan" className="flex items-center gap-2">
                  Start Planning <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Free to use • No credit card required</span>
              </div>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap justify-center gap-4 pt-8"
            >
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                ✈️ 1000+ Destinations
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                🏨 50,000+ Hotels
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                🍽️ Local Dining Experts
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                🎯 Personalized Recommendations
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Your Personal Travel Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Columbus AI deploys specialized travel agents to handle every aspect of your trip planning
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full p-6 hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-0 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose Columbus AI?
              </h2>
              <p className="text-xl text-muted-foreground">
                Experience the future of travel planning
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center space-y-4"
                >
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary via-purple-600 to-secondary">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              Join thousands of travelers who trust Columbus AI to plan their perfect trips
            </p>
            <Button asChild size="lg" variant="secondary" className="px-12 py-6 text-xl bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300">
              <Link href="/plan" className="flex items-center gap-2">
                Start Planning Now <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
