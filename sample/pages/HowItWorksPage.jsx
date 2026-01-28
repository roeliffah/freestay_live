import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Sparkles, Check, ArrowRight, XCircle, CheckCircle, Euro,
  Home, ChevronRight
} from "lucide-react";

// Reusable HowItWorksTabs component (same as homepage)
const HowItWorksTabs = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('discover');
  
  const tabs = [
    { id: 'discover', label: t('howItWorks.tabs.discover', 'Discover') },
    { id: 'activate', label: t('howItWorks.tabs.activatePass', 'Activate Pass') },
    { id: 'save', label: t('howItWorks.tabs.saveBig', 'Save Big') },
    { id: 'book', label: t('howItWorks.tabs.bookEnjoy', 'Book & Enjoy') },
  ];
  
  const tabContent = {
    discover: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          {t('howItWorks.discover.intro', 'Hotels keep their revenue instead of losing up to 30% to booking platforms. This allows them to:')}
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            {t('howItWorks.discover.benefit1', 'Offer better value')}
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            {t('howItWorks.discover.benefit2', 'Invest in service and quality')}
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            {t('howItWorks.discover.benefit3', 'Keep prices fair and competitive')}
          </li>
        </ul>
        <p className="font-medium text-foreground">
          {t('howItWorks.discover.conclusion', 'Freestays saves hotels money — without cutting corners.')}
        </p>
      </div>
    ),
    activate: (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">1</div>
            <h4 className="font-semibold">{t('howItWorks.activate.step1Title', 'Choose Your FreeStays Pass')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.activate.step1Desc', 'Search 450,000+ Hotels Worldwide. Use our powerful search to find your perfect hotel anywhere in the world.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.activate.step1Desc2', 'Real-time availability and instant pricing from our hotel network.')}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">2</div>
            <h4 className="font-semibold">{t('howItWorks.activate.step2Title', 'Instant Activation')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.activate.step2Desc', 'Your pass is activated immediately after purchase.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.activate.step2Desc2', 'Start booking right away with exclusive member pricing.')}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">3</div>
            <h4 className="font-semibold">{t('howItWorks.activate.step3Title', 'No Booking Fees')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.activate.step3Desc', 'New Pass holders never pay the first €15 booking fee.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.activate.step3Desc2', 'Enjoy unlimited searches and bookings with your pass.')}
          </p>
        </div>
      </div>
    ),
    save: (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">1</div>
            <h4 className="font-semibold">{t('howItWorks.save.step1Title', 'Hotels Pay 0% Commission')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.save.step1Desc', 'Traditional platforms charge hotels 15-30% commission.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.save.step1Desc2', 'We charge hotels nothing — they pass the savings to YOU.')}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">2</div>
            <h4 className="font-semibold">{t('howItWorks.save.step2Title', 'No Markup')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.save.step2Desc', 'While other platforms add 20%+ markup, we add zero.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11 font-medium text-primary">
            {t('howItWorks.save.step2Desc2', 'The result? Your room is essentially FREE — you only pay for meals!')}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">3</div>
            <h4 className="font-semibold">{t('howItWorks.save.step3Title', 'Transparent Pricing')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.save.step3Desc', 'See the full price breakdown before you book.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.save.step3Desc2', 'Your Pass calculates your Net price + one time booking costs (including VAT) = Your total. No surprises ever.')}
          </p>
        </div>
      </div>
    ),
    book: (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">1</div>
            <h4 className="font-semibold">{t('howItWorks.book.step1Title', 'Secure Payment')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.book.step1Desc', 'Pay securely through Stripe with your credit card, iDEAL and more.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.book.step1Desc2', 'Your booking is confirmed instantly with the hotel.')}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">2</div>
            <h4 className="font-semibold">{t('howItWorks.book.step2Title', 'Instant Confirmation')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.book.step2Desc', 'Receive your booking confirmation and voucher by email.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.book.step2Desc2', 'All details ready for your trip — no waiting, no hassle.')}
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">3</div>
            <h4 className="font-semibold">{t('howItWorks.book.step3Title', 'Travel & Save')}</h4>
          </div>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.book.step3Desc', 'Show your voucher at check-in and enjoy your stay.')}
          </p>
          <p className="text-muted-foreground text-sm pl-11">
            {t('howItWorks.book.step3Desc2', 'Refer friends and earn €15 credit to apply on booking costs, for each referral!')}
          </p>
        </div>
      </div>
    ),
  };
  
  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 shadow-lg border border-border/50">
      {/* Tab Headers */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`how-it-works-tab-${tab.id}`}
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-accent text-white shadow-lg'
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[200px] animate-fadeInUp">
        {tabContent[activeTab]}
      </div>
    </div>
  );
};

const HowItWorksPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 pb-16" data-testid="how-it-works-page">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
            {t('breadcrumbs.home', 'Home')}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{t('howItWorks.pageTitle', 'How It Works')}</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 md:px-8 relative text-center">
          <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
            <Sparkles className="w-4 h-4 mr-1" /> {t('howItWorks.badge', 'The FreeStays Concept')}
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6">
            {t('howItWorks.title', 'How Freestays Makes Travel Smarter — and Rooms FREE')}
          </h1>
          <p className="text-xl md:text-2xl font-medium text-primary mb-4">
            {t('howItWorks.subtitle', 'Booking as it should be in this day and age')}
          </p>
          <div className="text-muted-foreground text-lg max-w-3xl mx-auto space-y-4">
            <p>{t('howItWorks.intro1', 'We live fast. We book online. We want clarity, fair prices, and real benefits.')}</p>
            <p>{t('howItWorks.intro2', 'Freestays is made for how we travel now — smart, transparent, and without unnecessary costs.')}</p>
          </div>
        </div>
      </section>

      {/* 4-Tab Navigation Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              {t('howItWorks.exploreTitle', 'Explore the FreeStays Way')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('howItWorks.exploreSubtitle', 'Click through the tabs to learn how we make your room essentially FREE')}
            </p>
          </div>

          {/* The Tabs Component */}
          <HowItWorksTabs />

          {/* 3 Comparison Squares */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {t('howItWorks.otherPlatforms', 'Other Platforms')}
              </h4>
              <p className="text-red-600 dark:text-red-300 text-sm">
                {t('howItWorks.otherPlatformsDesc', 'Charge hotels 15-30% commission, add 20%+ markup to your price')}
              </p>
            </Card>
            
            <Card className="p-6 rounded-2xl bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                FreeStays
              </h4>
              <p className="text-green-600 dark:text-green-300 text-sm">
                {t('howItWorks.freestaysDesc', '0% hotel commission, 0% customer commission — Your room is FREE!')}
              </p>
            </Card>
            
            <Card className="p-6 rounded-2xl bg-accent/10 border-accent/30">
              <h4 className="font-semibold text-accent-foreground mb-3 flex items-center gap-2">
                <Euro className="w-5 h-5" />
                {t('howItWorks.yourSavings', 'Your Savings')}
              </h4>
              <p className="text-muted-foreground text-sm">
                {t('howItWorks.yourSavingsDesc', 'Average 30% savings on every booking. Room = FREE, you only pay for meals!')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            {t('howItWorks.ctaTitle', 'Ready to Start Saving?')}
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            {t('howItWorks.ctaSubtitle', 'Join thousands of smart travelers who book smarter with FreeStays.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="rounded-full px-8 bg-accent hover:bg-accent/90"
              onClick={() => navigate('/search')}
              data-testid="how-it-works-search-btn"
            >
              {t('common.searchHotels', 'Search Hotels')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="rounded-full px-8"
              onClick={() => navigate('/?signup=true')}
              data-testid="how-it-works-signup-btn"
            >
              {t('common.getStarted', 'Get Started Free')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
