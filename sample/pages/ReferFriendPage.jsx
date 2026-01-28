import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import axios from "axios";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import { 
  Gift, Euro, Users, Heart, Sparkles, Copy, Check,
  MessageCircle, Twitter, Mail, Trophy, Crown, Star,
  Zap, Target, TrendingUp, Award, Flame, PartyPopper,
  Share2, ChevronRight, Rocket, Medal, Loader2
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Default tier styling (merged with API data)
const TIER_STYLES = {
  "Starter": { 
    color: "from-slate-400 to-slate-500", 
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-600 dark:text-slate-300",
    icon: Star
  },
  "Bronze": { 
    color: "from-amber-600 to-amber-700", 
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-400",
    icon: Medal
  },
  "Silver": { 
    color: "from-gray-400 to-gray-500", 
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-600 dark:text-gray-300",
    icon: Award
  },
  "Gold": { 
    color: "from-yellow-400 to-yellow-600", 
    bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-400",
    icon: Trophy
  },
  "Diamond": { 
    color: "from-cyan-400 to-blue-500", 
    bgColor: "bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
    icon: Crown
  }
};

// Fallback tiers if API fails
const DEFAULT_TIERS = [
  { name: "Starter", min: 0, max: 2, extraDiscount: 0, reward: "€15 per referral" },
  { name: "Bronze", min: 3, max: 5, extraDiscount: 5, reward: "€15 + 5% extra discount" },
  { name: "Silver", min: 6, max: 9, extraDiscount: 10, reward: "€15 + 10% extra discount" },
  { name: "Gold", min: 10, max: 19, extraDiscount: 15, reward: "FREE Annual Pass + 15% discount" },
  { name: "Diamond", min: 20, max: 999, extraDiscount: 20, reward: "VIP Status + 20% lifetime discount" }
];

// Confetti animation component
const Confetti = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        >
          <div 
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'][Math.floor(Math.random() * 6)],
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

const ReferFriendPage = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState('share');
  const [rewardTiers, setRewardTiers] = useState(DEFAULT_TIERS);
  const [loadingTiers, setLoadingTiers] = useState(true);
  
  const referralCode = user?.referral_code || 'LOGIN-TO-GET-CODE';
  const referralLink = `https://freestays.eu/?ref=${referralCode}`;
  const referralCount = referralData?.referral_count || user?.referral_count || 0;
  
  // Helper functions using dynamic tiers
  const getTier = (count) => {
    const tier = rewardTiers.find(t => count >= t.min && count <= (t.max === 999 ? Infinity : t.max));
    if (!tier) return { ...rewardTiers[0], ...TIER_STYLES[rewardTiers[0]?.name] || TIER_STYLES["Starter"] };
    return { ...tier, ...TIER_STYLES[tier.name] || TIER_STYLES["Starter"] };
  };
  
  const getNextTier = (count) => {
    const currentIndex = rewardTiers.findIndex(t => count >= t.min && count <= (t.max === 999 ? Infinity : t.max));
    if (currentIndex < rewardTiers.length - 1) {
      const nextTier = rewardTiers[currentIndex + 1];
      return { ...nextTier, ...TIER_STYLES[nextTier.name] || TIER_STYLES["Starter"] };
    }
    return null;
  };
  
  const currentTier = getTier(referralCount);
  const nextTier = getNextTier(referralCount);
  const progressToNext = nextTier ? ((referralCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  useEffect(() => {
    fetchRewardTiers();
    fetchLeaderboard();
    if (user) {
      fetchReferralData();
    }
  }, [user]);
  
  const fetchRewardTiers = async () => {
    try {
      const response = await axios.get(`${API}/referral/tiers`);
      if (response.data.tiers && response.data.tiers.length > 0) {
        setRewardTiers(response.data.tiers);
      }
    } catch (error) {
      console.log('Using default tiers');
    } finally {
      setLoadingTiers(false);
    }
  };

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('freestays_token');
      const response = await axios.get(`${API}/referral/my-code`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReferralData(response.data);
    } catch (error) {
      console.log('Could not fetch referral data');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/referral/leaderboard`);
      setLeaderboard(response.data?.leaderboard || []);
    } catch (error) {
      console.log('Could not fetch leaderboard');
    }
  };

  const copyToClipboard = (text, isLink = false) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast.success('Copied to clipboard!');
    
    // Show confetti for first copy
    if (!localStorage.getItem('referral_confetti_shown')) {
      setShowConfetti(true);
      localStorage.setItem('referral_confetti_shown', 'true');
      setTimeout(() => setShowConfetti(false), 4000);
    }
  };

  const handleLogin = () => {
    navigate('/?signup=true');
  };

  const shareToSocial = (platform) => {
    const message = `🏨 Get FREE hotel stays with FreeStays! Use my code: ${referralCode} and save €15 on your first booking! 🎁`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`,
      email: `mailto:?subject=${encodeURIComponent('Free Hotel Stays with FreeStays!')}&body=${encodeURIComponent(message + '\n\n' + referralLink)}`
    };
    window.open(urls[platform], '_blank');
  };

  const TierCard = ({ tier, isActive, isNext }) => {
    const TierIcon = tier.icon;
    return (
      <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
        isActive 
          ? `border-primary shadow-lg scale-105 ${tier.bgColor}` 
          : isNext
            ? 'border-dashed border-primary/50 bg-primary/5'
            : 'border-border/50 bg-card/50 opacity-60'
      }`}>
        {isActive && (
          <div className="absolute -top-2 -right-2">
            <span className="flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-primary items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            </span>
          </div>
        )}
        {isNext && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Next Goal</Badge>
          </div>
        )}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3 mx-auto shadow-lg`}>
          <TierIcon className="w-6 h-6 text-white" />
        </div>
        <h4 className={`font-bold text-center ${tier.textColor}`}>{tier.name}</h4>
        <p className="text-xs text-muted-foreground text-center mt-1">{tier.min}+ referrals</p>
        <p className="text-xs text-center mt-2 font-medium text-primary">{tier.reward}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-b from-background via-background to-secondary/20" data-testid="refer-page">
      <Confetti show={showConfetti} />
      
      {/* Animated Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          {/* Floating badges */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 px-4 py-1.5 text-sm font-bold animate-bounce shadow-lg">
              <Gift className="w-4 h-4 mr-2" />
              Earn €15 Per Friend
            </Badge>
            <Badge className="bg-gradient-to-r from-accent to-yellow-500 text-accent-foreground border-0 px-4 py-1.5 text-sm font-bold shadow-lg">
              <Crown className="w-4 h-4 mr-2" />
              Reach Gold = FREE Pass
            </Badge>
          </div>
          
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent animate-gradient">
              Share. Earn. Travel.
            </span>
            <span className="block text-2xl md:text-4xl mt-2 text-foreground/80">
              Your Friends Save, You Level Up! 🚀
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of travelers earning rewards. Every friend you invite gets <strong className="text-primary">€15 off</strong>, 
            and you unlock exclusive perks as you climb the ranks.
          </p>

          {/* Stats banner */}
          <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent-foreground">€750K+</div>
              <div className="text-sm text-muted-foreground">Rewards Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600">89%</div>
              <div className="text-sm text-muted-foreground">Book Again</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Section (only for logged in users) */}
      {user && (
        <section className="py-8 -mt-8 relative z-10">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            {/* Current Status Card */}
            <Card className="p-6 md:p-8 rounded-3xl shadow-2xl border-0 bg-card overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-tr-full" />
              
              <div className="relative grid md:grid-cols-3 gap-8">
                {/* Left - Current Tier */}
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentTier.color} flex items-center justify-center shadow-lg`}>
                      <currentTier.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Rank</p>
                      <h3 className={`text-2xl font-bold ${currentTier.textColor}`}>{currentTier.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Current Perk: <span className="text-primary font-medium">{currentTier.reward}</span></p>
                </div>

                {/* Center - Progress */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
                      <circle 
                        cx="64" cy="64" r="56" 
                        stroke="url(#progressGradient)" 
                        strokeWidth="8" 
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${progressToNext * 3.52} 352`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold">{referralCount}</span>
                      <span className="text-xs text-muted-foreground">referrals</span>
                    </div>
                  </div>
                  {nextTier && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <span className="text-primary font-medium">{nextTier.min - referralCount}</span> more to {nextTier.name}
                    </p>
                  )}
                </div>

                {/* Right - Quick Share */}
                <div className="text-center md:text-right">
                  <p className="text-sm text-muted-foreground mb-2">Your Code</p>
                  <div className="flex items-center justify-center md:justify-end gap-2 mb-4">
                    <code className="bg-primary/10 text-primary font-mono text-lg font-bold px-4 py-2 rounded-xl">
                      {referralCode}
                    </code>
                    <Button 
                      size="icon" 
                      variant="outline"
                      className="rounded-xl h-10 w-10"
                      onClick={() => copyToClipboard(referralCode)}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex justify-center md:justify-end gap-2">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => shareToSocial('whatsapp')}>
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => shareToSocial('twitter')}>
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => shareToSocial('email')}>
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Reward Tiers Section */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
              <Trophy className="w-4 h-4 mr-2" />
              Reward Tiers
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Level Up Your Rewards</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The more friends you invite, the better your perks. Climb the ranks and unlock exclusive benefits!
            </p>
          </div>

          {/* Tier Cards */}
          {loadingTiers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {rewardTiers.map((tier, index) => {
                const styling = TIER_STYLES[tier.name] || TIER_STYLES["Starter"];
                const styledTier = { ...tier, ...styling };
                const tierMax = tier.max === 999 ? Infinity : tier.max;
                return (
                  <TierCard 
                    key={tier.name} 
                    tier={styledTier} 
                    isActive={user && referralCount >= tier.min && referralCount <= tierMax}
                    isNext={user && nextTier?.name === tier.name}
                  />
                );
              })}
            </div>
          )}

          {/* Progress bar connecting tiers */}
          <div className="hidden md:block mt-8">
            <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-primary via-green-500 to-yellow-500 rounded-full transition-all duration-1000"
                style={{ width: user ? `${Math.min((referralCount / 20) * 100, 100)}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Share Section (for non-logged in or logged in users) */}
      {!user ? (
        <section className="py-12 -mt-8 relative z-10">
          <div className="max-w-2xl mx-auto px-4 md:px-8">
            <Card className="p-8 rounded-3xl shadow-2xl border-0 bg-card text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">Ready to Start Earning?</h2>
              <p className="text-muted-foreground mb-6">Join FreeStays to get your unique referral code and start earning rewards!</p>
              <Button size="lg" className="rounded-full px-8" onClick={handleLogin}>
                <Sparkles className="w-5 h-5 mr-2" />
                Get Your Referral Code
              </Button>
            </Card>
          </div>
        </section>
      ) : (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <Card className="p-6 md:p-8 rounded-3xl border-0 shadow-xl bg-gradient-to-br from-primary/5 to-accent/5">
              <h3 className="font-serif text-2xl font-bold text-center mb-6">Share Your Link</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  value={referralLink}
                  readOnly
                  className="flex-1 h-14 rounded-xl bg-background text-center sm:text-left font-medium"
                />
                <Button 
                  size="lg"
                  className="rounded-xl h-14 px-8 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  onClick={() => copyToClipboard(referralLink, true)}
                >
                  {copiedLink ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
              
              {/* Social Share Buttons */}
              <div className="flex justify-center gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="rounded-full px-6 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                  onClick={() => shareToSocial('whatsapp')}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full px-6 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
                  onClick={() => shareToSocial('twitter')}
                >
                  <Twitter className="w-5 h-5 mr-2" />
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full px-6 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
                  onClick={() => shareToSocial('facebook')}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Facebook
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full px-6 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                  onClick={() => shareToSocial('email')}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Live Leaderboard Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30">
              <Flame className="w-4 h-4 mr-2" />
              Live Rankings
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Top Referrers This Month</h2>
            <p className="text-muted-foreground text-lg">Join the ranks of our top ambassadors!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Leaderboard */}
            <Card className="p-6 rounded-3xl border-0 shadow-xl bg-card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-full" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Leaderboard</h3>
                  <p className="text-sm text-muted-foreground">Top 10 referrers</p>
                </div>
              </div>

              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => {
                    const tier = getTier(entry.referral_count);
                    const TierIcon = tier.icon;
                    const isTopThree = index < 3;
                    const medalColors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-400', 'from-amber-600 to-amber-700'];
                    
                    return (
                      <div 
                        key={index}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                          isTopThree 
                            ? 'bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10' 
                            : 'bg-secondary/30 hover:bg-secondary/50'
                        }`}
                      >
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          isTopThree 
                            ? `bg-gradient-to-br ${medalColors[index]} text-white shadow-lg` 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{entry.name}</span>
                            <TierIcon className={`w-4 h-4 ${tier.textColor}`} />
                          </div>
                          <span className={`text-xs ${tier.textColor}`}>{tier.name}</span>
                        </div>
                        
                        {/* Count */}
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">{entry.referral_count}</span>
                          <p className="text-xs text-muted-foreground">referrals</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Be the first on the leaderboard!</p>
                    <p className="text-sm">Start referring friends today.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats & Motivation */}
            <div className="space-y-6">
              {/* Community Stats */}
              <Card className="p-6 rounded-3xl border-0 shadow-xl bg-gradient-to-br from-primary to-blue-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-tr-full" />
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">Community Stats</h3>
                      <p className="text-sm text-white/70">This month's activity</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                      <div className="text-3xl font-bold">{leaderboard.reduce((sum, u) => sum + u.referral_count, 0) || '—'}</div>
                      <div className="text-sm text-white/70">Total Referrals</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                      <div className="text-3xl font-bold">{leaderboard.length || '—'}</div>
                      <div className="text-sm text-white/70">Active Referrers</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Your Position (if logged in and has referrals) */}
              {user && referralCount > 0 && (
                <Card className="p-6 rounded-3xl border-0 shadow-xl bg-card">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentTier.color} flex items-center justify-center shadow-lg`}>
                      <currentTier.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Your Position</p>
                      <p className="font-bold text-xl">
                        {leaderboard.findIndex(u => u.referral_count <= referralCount) + 1 || 'Top 50%'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{referralCount}</p>
                      <p className="text-xs text-muted-foreground">referrals</p>
                    </div>
                  </div>
                  {nextTier && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-xl">
                      <p className="text-sm text-center">
                        <span className="text-primary font-bold">{nextTier.min - referralCount} more</span> referrals to reach <span className="font-semibold">{nextTier.name}</span> and unlock <span className="text-primary">{nextTier.reward}</span>!
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {/* Motivation Card */}
              <Card className="p-6 rounded-3xl border-0 shadow-xl bg-gradient-to-br from-accent/10 to-green-500/10 border border-accent/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <PartyPopper className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Did you know?</h4>
                    <p className="text-sm text-muted-foreground">
                      Top referrers save an average of <strong className="text-primary">€500+ per year</strong> on their travels. 
                      Some have earned FREE vacations just by sharing with friends!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Modern Steps */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-4 h-4 mr-2" />
              Super Simple
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three steps to start earning. It's that easy!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Share Your Code", desc: "Share your unique referral link via WhatsApp, email, or social media. The more you share, the more you earn!", icon: Share2, color: "from-blue-500 to-cyan-500" },
              { num: "02", title: "Friend Signs Up", desc: "Your friend creates a FreeStays account using your code. They instantly get €15 off their booking fee!", icon: Users, color: "from-purple-500 to-pink-500" },
              { num: "03", title: "Both Get Rewarded", desc: "When they book, you earn €15 credit AND climb the reward tiers for even bigger perks!", icon: Gift, color: "from-amber-500 to-orange-500" },
            ].map((step, index) => (
              <div key={index} className="relative group">
                <Card className="p-8 rounded-3xl border-0 shadow-lg h-full bg-card hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-6xl font-bold text-muted/10 absolute top-4 right-6">{step.num}</div>
                  <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </Card>
                {index < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 w-8 h-8 bg-accent rounded-full items-center justify-center z-10 transform -translate-y-1/2">
                    <ChevronRight className="w-5 h-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 text-6xl">🎁</div>
          <div className="absolute top-20 right-40 text-5xl">✨</div>
          <div className="absolute bottom-20 left-40 text-5xl">🏨</div>
          <div className="absolute bottom-10 right-20 text-6xl">🎉</div>
        </div>
        
        <div className="relative max-w-3xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-white/80 text-lg md:text-xl mb-8">
            Join the FreeStays community today. Share with friends, climb the ranks, and unlock amazing rewards!
          </p>
          {!user && (
            <Button 
              size="lg" 
              className="rounded-full px-12 h-16 text-lg bg-white text-primary hover:bg-white/90 font-bold shadow-2xl hover:scale-105 transition-all"
              onClick={handleLogin}
            >
              <Rocket className="mr-2 w-6 h-6" />
              Join Now & Get Your Code
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReferFriendPage;
