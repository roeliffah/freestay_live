import React from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Wallet, Globe, RefreshCw, Gift, ClipboardCheck, 
  Clock, CalendarX, CheckCircle, Sparkles, Plane 
} from "lucide-react";

const WhoWeArePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Simple handler to redirect to home with auth dialog trigger
  const handleSignUp = () => {
    // Trigger auth by navigating with hash that the home page can detect
    navigate('/?signup=true');
  };
  
  const benefits = [
    { icon: Wallet, title: "Cost-effective", desc: "By paying only for meals, you can save money on accommodation costs and stretch your travel budget further." },
    { icon: Globe, title: "Endless Destinations", desc: "Access to a range of top destinations and partner hotels, giving you the freedom to explore new places and cultures." },
    { icon: RefreshCw, title: "Flexibility", desc: "Choose from one-time stays or annual subscriptions, allowing you to plan your travels around your schedule." },
    { icon: Gift, title: "Thoughtful Gifts", desc: "Freestays vouchers make a unique and thoughtful gift for friends and family who love to travel." },
    { icon: ClipboardCheck, title: "Practicality", desc: "Hotel descriptions clearly outline any conditions. Factor in meals, transport, and incidentals when planning." },
  ];

  const offerings = [
    "Free hotel nights with half board or all-inclusive bookings",
    "Up to 50% discount on regular (room-only) stays",
    "Access to over 450,000 partner hotels worldwide",
    "Instant digital delivery of your hotel voucher",
    "Valid for 12 months – flexible, no obligations",
    "Exclusive deals and room upgrades",
    "Family sharing included with the Annual Card (up to 4 people)",
    "Choose between one-time or unlimited bookings for a year",
    "24/7 Booking Support – Always Available by Phone",
  ];

  const considerations = [
    { icon: Clock, title: "Limited Availability", desc: "Popular hotels may have limited availability, so plan ahead for the best options." },
    { icon: CalendarX, title: "Usage Restrictions", desc: "Check for blackout dates or restrictions to ensure your voucher can be used when and where you want." },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16" data-testid="whoweare-page">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 px-6 py-2 text-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Since 1996 • Barneveld, Netherlands
          </Badge>
          
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Dine at the Hotel.
            <span className="block text-accent">Stay for Free!</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            Welcome to <span className="font-bold text-accent">Freestays</span>, the innovative hospitality concept 
            that's redefining the way we travel.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="rounded-full px-10 h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-xl hover:scale-105 transition-all"
              onClick={handleSignUp}
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Yes! I Want This!
            </Button>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-secondary/50 to-background">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Located in the heart of the Netherlands, <strong className="text-foreground">Barneveld</strong>, our company has been a 
            <strong className="text-primary"> pioneer in the industry since 1996</strong>, starting as a licensee in Germany. 
            With a unique approach that offers <span className="text-primary font-semibold">free stays at partner hotels</span> in 
            exchange for breakfast and dinner, Freestays is the perfect choice for travel enthusiasts looking for an 
            <strong className="text-foreground"> affordable and exciting experience</strong>.
          </p>
        </div>
      </section>

      {/* Experience Freedom Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
              <Plane className="w-4 h-4 mr-2" />
              Travel Freedom
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
              Experience the Freedom to Travel!
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here are just a few reasons why our vouchers are the perfect choice for travelers:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                  <benefit.icon className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Considerations Section */}
      <section className="py-16 bg-amber-50/50 dark:bg-amber-950/20">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3">
              Before Using Freestays Vouchers
            </h2>
            <p className="text-muted-foreground">Consider these key factors to make the most of your experience:</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {considerations.map((item, index) => (
              <Card key={index} className="p-6 rounded-2xl border-amber-200 dark:border-amber-800 bg-white dark:bg-card shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
            By understanding these factors, you can make the most of your Freestays voucher and enjoy a unique 
            and cost-effective travel experience. Whether you're a frequent traveler or using it as a gift, 
            consider your individual needs and preferences.
          </p>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <CheckCircle className="w-4 h-4 mr-2" />
              What We Offer
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">
              What Freestays.eu Offers
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {offerings.map((offering, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
              >
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-white/95 text-sm md:text-base">{offering}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="relative bg-card rounded-3xl p-10 md:p-16 shadow-2xl border border-border/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <Gift className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
                Ready to Travel Smarter?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join thousands of happy travelers who have discovered the joy of free stays. 
                Your next adventure is waiting!
              </p>
              <Button 
                size="lg" 
                className="rounded-full px-12 h-14 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                onClick={handleSignUp}
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Start My Free Journey
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhoWeArePage;
