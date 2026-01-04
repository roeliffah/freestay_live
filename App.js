import React, { useState, useEffect, createContext, useContext, useRef, useCallback, useMemo } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link, useParams, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { format, addDays, differenceInDays } from "date-fns";
import { Toaster, toast } from "sonner";
import { useTranslation } from 'react-i18next';
import './i18n';
import { languages } from './i18n';

// Stripe
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import { 
  Search, MapPin, Calendar as CalendarIcon, Users, Star, Wifi, Car, Utensils, 
  Dumbbell, Waves, Coffee, Heart, ChevronDown, Menu, X, Loader2, Check, 
  CreditCard, Shield, Tag, Copy, LogOut, User, Settings, Ticket, Building2,
  ArrowRight, ArrowLeft, Sparkles, Phone, Mail, Globe, ChevronLeft, ChevronRight,
  Bed, Bath, Mountain, TreePine, UtensilsCrossed, PlaneTakeoff, Clock, Zap, Crown,
  Lock, Trash2, Plus, Edit, BarChart3, DollarSign, Gift, Percent, Info, AlertCircle,
  CheckCircle, XCircle, Send, Euro, Briefcase, LogIn, Share2, MessageCircle, Twitter,
  Languages, Wallet, Plane, ClipboardCheck, CalendarX, RefreshCw, MoreVertical,
  Eye, FileText, Download, Printer, UserPlus, Moon, Sun
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const queryClient = new QueryClient();

// ==================== THEME CONTEXT ====================
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch dark mode setting from backend
  useEffect(() => {
    const fetchDarkModeSetting = async () => {
      try {
        const response = await axios.get(`${API}/settings/ui`);
        const enabled = response.data?.darkMode_enabled !== false; // Default to true
        setDarkModeEnabled(enabled);
        setSettingsLoaded(true);
        
        // If dark mode is disabled and user was in dark mode, force light mode
        if (!enabled && theme === 'dark') {
          setTheme('light');
        }
      } catch (error) {
        // Default to enabled if fetch fails
        setDarkModeEnabled(true);
        setSettingsLoaded(true);
      }
    };
    fetchDarkModeSetting();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (darkModeEnabled) {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, darkModeEnabled, settingsLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Theme Toggle Button Component
const ThemeToggle = ({ variant = "ghost", size = "sm", showLabel = false }) => {
  const { theme, toggleTheme, darkModeEnabled } = useTheme();
  const { t } = useTranslation();
  
  // Don't render if dark mode is disabled by admin
  if (!darkModeEnabled) {
    return null;
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className="gap-2"
      data-testid="theme-toggle"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
      {showLabel && (
        <span className="hidden sm:inline text-sm">
          {theme === 'light' ? t('darkMode', 'Dark') : t('lightMode', 'Light')}
        </span>
      )}
    </Button>
  );
};

// ==================== PWA INSTALL PROMPT ====================
const InstallAppPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 10 seconds on site
      setTimeout(() => setShowInstallBanner(true), 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideInRight">
      <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">{t('pwa.installTitle', 'Install FreeStays App')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t('pwa.installDesc', 'Get quick access, offline support & push notifications for deals!')}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInstall} className="rounded-full gap-2">
                  <Download className="w-4 h-4" />
                  {t('pwa.install', 'Install')}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="rounded-full">
                  {t('pwa.notNow', 'Not Now')}
                </Button>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 flex-shrink-0" 
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== LANGUAGE SELECTOR COMPONENT ====================
const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 px-3">
          <span className="text-lg">{currentLang.flag}</span>
          <span className="hidden sm:inline text-sm">{currentLang.code.toUpperCase()}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`flex items-center gap-3 cursor-pointer ${i18n.language === lang.code ? 'bg-primary/10 text-primary' : ''}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {i18n.language === lang.code && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ==================== PRICING CONSTANTS ====================
const MARKUP_RATE = 0.16;
const VAT_RATE = 0.21;
const FREESTAYS_DISCOUNT = 0.15;
const BOOKING_FEE = 15.00;
const PASS_ONE_TIME_PRICE = 35.00;
const PASS_ANNUAL_PRICE = 129.00;

// ==================== HELPER FUNCTIONS ====================
const isPackageBoard = (boardType) => {
  if (!boardType) return false;
  const lower = boardType.toLowerCase();
  return ['half board', 'full board', 'all inclusive', 'halfboard', 'fullboard', 'allinclusive'].some(pkg => lower.includes(pkg));
};

const calculatePricing = (nettPrice, hasValidPass, passPurchaseType = null, referralDiscount = 0) => {
  const markup = nettPrice * MARKUP_RATE;
  const vatOnMarkup = markup * VAT_RATE;
  const priceBeforeDiscount = nettPrice + markup + vatOnMarkup;
  
  const applyDiscount = hasValidPass || passPurchaseType;
  let discountAmount = 0;
  let roomTotal = priceBeforeDiscount;
  
  if (applyDiscount) {
    discountAmount = priceBeforeDiscount * FREESTAYS_DISCOUNT;
    roomTotal = priceBeforeDiscount - discountAmount;
  }
  
  // Booking fee is waived if: buying a pass OR has referral discount
  const hasReferralDiscount = referralDiscount > 0;
  const bookingFee = (passPurchaseType || hasReferralDiscount) ? 0 : BOOKING_FEE;
  
  let passPrice = 0;
  if (passPurchaseType === 'one_time') passPrice = PASS_ONE_TIME_PRICE;
  if (passPurchaseType === 'annual') passPrice = PASS_ANNUAL_PRICE;
  
  const finalTotal = roomTotal + bookingFee + passPrice;
  
  return {
    nettPrice,
    markup,
    vatOnMarkup,
    priceBeforeDiscount,
    discountApplied: applyDiscount,
    discountAmount,
    roomTotal,
    bookingFee,
    passPrice,
    finalTotal,
    potentialSavings: applyDiscount ? 0 : priceBeforeDiscount * FREESTAYS_DISCOUNT,
    referralDiscountApplied: hasReferralDiscount,
    referralDiscountAmount: hasReferralDiscount ? BOOKING_FEE : 0
  };
};

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("freestays_token"));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = localStorage.getItem("freestays_token");
      if (savedToken) {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
          withCredentials: true
        });
        setUser(response.data);
        setToken(savedToken);
      }
    } catch (e) {
      localStorage.removeItem("freestays_token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    setUser(response.data.user);
    setToken(response.data.token);
    localStorage.setItem("freestays_token", response.data.token);
    return response.data;
  };

  const register = async (email, password, name, referralCode = null) => {
    const response = await axios.post(`${API}/auth/register`, { 
      email, 
      password, 
      name,
      referral_code: referralCode 
    });
    setUser(response.data.user);
    setToken(response.data.token);
    localStorage.setItem("freestays_token", response.data.token);
    return response.data;
  };

  const loginWithGoogle = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem("freestays_token");
  };

  const hasValidPass = () => {
    if (!user) return false;
    return user.pass_type === 'one_time' || user.pass_type === 'annual';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, loginWithGoogle, setUser, setToken, checkAuth, hasValidPass }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== DESTINATION SEARCH HOOK ====================
const useDestinationSearch = () => {
  const [query, setQuery] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const debounceRef = useRef(null);

  const searchDestinations = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setDestinations([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/destinations/search`, {
        params: { q: searchQuery }
      });
      setDestinations(response.data.destinations || []);
    } catch (e) {
      console.error("Destination search error:", e);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchDestinations(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchDestinations]);

  return { query, setQuery, destinations, loading, selectedDestination, setSelectedDestination };
};

// ==================== HEADER ====================
const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <img 
              src="/assets/logo.png" 
              alt="FreeStays" 
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" data-testid="nav-search">
              {t('header.searchHotels', 'Search Hotels')}
            </Link>
            <Link to="/last-minute" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Zap className="w-4 h-4" /> {t('header.lastMinute')}
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('header.howItWorks', 'How It Works')}
            </Link>
            <Link to="/who-we-are" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {t('header.whoWeAre', 'Who We Are')}
            </Link>
            <Link to="/refer-a-friend" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" data-testid="nav-refer">
              <Gift className="w-4 h-4" /> {t('header.referFriend', 'Refer a Friend')}
            </Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" data-testid="nav-contact">
              {t('footer.contact', 'Contact')}
            </Link>
            {user && (
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" data-testid="nav-dashboard">
                {t('dashboard.myBookings')}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.pass_type && user.pass_type !== 'free' && (
                      <Badge className="mt-1 bg-accent text-accent-foreground text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        {user.pass_type === 'annual' ? t('pass.annualPass') : t('pass.oneTimePass')}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                    <Ticket className="w-4 h-4 mr-2" /> {t('dashboard.myBookings')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard?tab=passcode')} data-testid="menu-passcode">
                    <Tag className="w-4 h-4 mr-2" /> {t('dashboard.myPass')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/refer-a-friend')} data-testid="menu-refer">
                    <Gift className="w-4 h-4 mr-2" /> {t('header.referFriend', 'Refer a Friend')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="menu-logout">
                    <LogOut className="w-4 h-4 mr-2" /> {t('auth.signIn', 'Log Out').includes('Log') ? 'Log Out' : 'Uitloggen'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="hidden md:flex" data-testid="login-btn">{t('header.signIn')}</Button>
                  </DialogTrigger>
                  <AuthDialog />
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="rounded-full px-6" data-testid="signup-btn">{t('hero.getFreeRoom')}</Button>
                  </DialogTrigger>
                  <AuthDialog defaultTab="register" />
                </Dialog>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    <img 
                      src="/assets/logo.png" 
                      alt="FreeStays" 
                      className="h-10 w-auto object-contain"
                    />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Search className="w-5 h-5" /> {t('header.searchHotels', 'Search Hotels')}
                  </Link>
                  <Link to="/last-minute" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Zap className="w-5 h-5" /> {t('header.lastMinute')}
                  </Link>
                  <Link to="/about" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Info className="w-5 h-5" /> {t('header.howItWorks', 'How It Works')}
                  </Link>
                  <Link to="/who-we-are" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Users className="w-5 h-5" /> {t('header.whoWeAre', 'Who We Are')}
                  </Link>
                  <Link to="/refer-a-friend" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Gift className="w-5 h-5" /> {t('header.referFriend', 'Refer a Friend')}
                  </Link>
                  <Link to="/contact" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Phone className="w-5 h-5" /> {t('footer.contact', 'Contact')}
                  </Link>
                  {user && (
                    <>
                      <Separator className="my-1" />
                      <Link to="/dashboard" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Ticket className="w-5 h-5" /> {t('dashboard.myBookings')}
                      </Link>
                      <Link to="/dashboard?tab=favorites" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Heart className="w-5 h-5" /> {t('dashboard.favorites')}
                      </Link>
                      <Link to="/dashboard?tab=passcode" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Crown className="w-5 h-5" /> {t('dashboard.myPass')}
                      </Link>
                      <Link to="/refer-a-friend" className="text-lg font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                        <Gift className="w-5 h-5" /> {t('header.referFriend', 'Refer a Friend')}
                      </Link>
                    </>
                  )}
                  
                  {/* Mobile Language Selector */}
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Languages className="w-4 h-4" /> {t('common.language', 'Language')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.map((lang) => (
                        <Button
                          key={lang.code}
                          variant={i18n.language === lang.code ? "default" : "outline"}
                          size="sm"
                          className="justify-start gap-2"
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <span>{lang.flag}</span>
                          <span className="truncate">{lang.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Theme Toggle */}
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                      <Sun className="w-4 h-4" /> {t('common.theme', 'Theme')}
                    </p>
                    <ThemeToggle variant="outline" size="default" showLabel={true} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

// ==================== AUTH DIALOG ====================
const AuthDialog = ({ defaultTab = "login" }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(defaultTab);
  const { login, register, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "", referralCode: "" });
  const dialogCloseRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "login") {
        await login(formData.email, formData.password);
        toast.success(t('auth.welcomeBack'));
      } else {
        await register(formData.email, formData.password, formData.name, formData.referralCode || null);
        toast.success(t('auth.accountCreated'));
      }
      // Close dialog on success
      dialogCloseRef.current?.click();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden">
      {/* Hidden close button for programmatic closing */}
      <DialogClose ref={dialogCloseRef} className="hidden" />
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 p-2">
            <img 
              src="/assets/logo.png" 
              alt="FreeStays" 
              className="h-full w-auto object-contain"
            />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-primary-foreground mb-1">
            {tab === "login" ? t('auth.welcomeBack') : t('auth.joinFreeStays')}
          </h2>
          <p className="text-primary-foreground/80 text-sm">
            {tab === "login" ? t('auth.signInSubtitle') : t('auth.createSubtitle')}
          </p>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-full p-1">
            <TabsTrigger value="login" className="rounded-full">{t('auth.signIn')}</TabsTrigger>
            <TabsTrigger value="register" className="rounded-full">{t('auth.createAccount')}</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {tab === "register" && (
              <div>
                <Label htmlFor="name" className="text-sm font-medium">{t('auth.fullName')}</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  required={tab === "register"}
                  className="h-12 rounded-xl mt-1.5"
                  data-testid="input-name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">{t('auth.emailAddress')}</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                required
                className="h-12 rounded-xl mt-1.5"
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</Label>
              <Input 
                id="password" 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12 rounded-xl mt-1.5"
                data-testid="input-password"
              />
              {tab === "login" && (
                <Link to="/forgot-password" className="text-xs text-primary hover:underline mt-2 block text-right" onClick={() => document.querySelector('[data-state="open"] button[data-state]')?.click()}>
                  {t('auth.forgotPassword')}
                </Link>
              )}
            </div>
            
            {tab === "register" && (
              <div>
                <Label htmlFor="referralCode" className="text-sm font-medium">{t('auth.referralCode')}</Label>
                <Input 
                  id="referralCode" 
                  value={formData.referralCode} 
                  onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                  placeholder="e.g., FS12345678"
                  className="h-12 rounded-xl mt-1.5"
                  data-testid="input-referral-code"
                />
                <p className="text-xs text-muted-foreground mt-1">{t('auth.referralCodeHint')}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full rounded-full h-12 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all" 
              disabled={loading} 
              data-testid="submit-auth"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {tab === "login" ? t('auth.signIn') : t('auth.createAccount')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><Separator /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full rounded-full h-12 font-medium hover:bg-secondary/80 transition-all" 
            onClick={loginWithGoogle} 
            data-testid="google-login"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Benefits reminder */}
          <div className="mt-6 p-4 bg-accent/10 rounded-2xl">
            <p className="text-xs text-center text-muted-foreground mb-2">With a FreeStays account you get:</p>
            <div className="flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-primary font-medium">
                <Gift className="w-3.5 h-3.5" /> Free Rooms
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Percent className="w-3.5 h-3.5" /> No Fees
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Shield className="w-3.5 h-3.5" /> Secure
              </span>
            </div>
          </div>
        </Tabs>
      </div>
    </DialogContent>
  );
};

// ==================== AUTH CALLBACK ====================
const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionId = new URLSearchParams(hash.slice(1)).get('session_id');
      
      if (sessionId) {
        try {
          const response = await axios.get(`${API}/auth/session`, {
            headers: { "X-Session-ID": sessionId }
          });
          
          setUser(response.data);
          if (response.data.session_token) {
            setToken(response.data.session_token);
            localStorage.setItem("freestays_token", response.data.session_token);
          }
          
          toast.success("Welcome to FreeStays!");
          navigate('/dashboard', { replace: true });
        } catch (error) {
          toast.error("Authentication failed");
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

// ==================== VERIFY EMAIL PAGE ====================
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/verify-email`, { token });
        setStatus('success');
        setMessage(response.data.message);
        setTimeout(() => navigate('/'), 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            status === 'success' ? 'bg-green-100' : status === 'error' ? 'bg-red-100' : 'bg-primary/10'
          }`}>
            {status === 'verifying' && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-red-600" />}
          </div>
          <CardTitle className="font-serif text-2xl">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'success' && (
            <p className="text-sm text-muted-foreground mb-4">Redirecting to homepage...</p>
          )}
          {status === 'error' && (
            <Button onClick={() => navigate('/')} className="mt-4">
              Go to Homepage
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== FORGOT PASSWORD PAGE ====================
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 p-2 shadow-sm border">
            <img src="/assets/logo.png" alt="FreeStays" className="h-full w-auto object-contain" />
          </div>
          <CardTitle className="font-serif text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {sent 
              ? "Check your email for a password reset link" 
              : "Enter your email and we'll send you a reset link"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                If an account exists with <strong>{email}</strong>, you'll receive an email with instructions to reset your password.
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full mt-4">
                  Back to Homepage
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Reset Link
              </Button>
              <Link to="/" className="block text-center">
                <Button variant="link" className="text-sm">
                  Back to Sign In
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== RESET PASSWORD PAGE ====================
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, { token, new_password: password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="font-serif text-2xl">Invalid Link</CardTitle>
            <CardDescription>This password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/forgot-password">
              <Button className="mt-4">Request New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 p-2 shadow-sm border">
            <img src="/assets/logo.png" alt="FreeStays" className="h-full w-auto object-contain" />
          </div>
          <CardTitle className="font-serif text-2xl">
            {success ? 'Password Reset!' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {success ? 'Your password has been reset successfully' : 'Enter your new password below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to homepage...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 rounded-xl mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 rounded-xl mt-1.5"
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== CHILDREN AGES DIALOG ====================
const ChildrenAgesDialog = ({ open, onOpenChange, childrenCount, childrenAges, onAgesChange, onConfirm }) => {
  // Initialize ages based on childrenCount, ensuring proper defaults
  const getInitialAges = (count, existingAges) => {
    const newAges = [...(existingAges || [])];
    while (newAges.length < count) {
      newAges.push(5); // Default age
    }
    while (newAges.length > count) {
      newAges.pop();
    }
    return newAges;
  };

  const [ages, setAges] = useState(() => getInitialAges(childrenCount, childrenAges));

  // Update ages when dialog opens with different childrenCount
  useEffect(() => {
    if (open) {
      setAges(getInitialAges(childrenCount, childrenAges));
    }
  }, [open, childrenCount, childrenAges]);

  const updateAge = (index, newAge) => {
    const newAges = [...ages];
    newAges[index] = newAge;
    setAges(newAges);
  };

  const handleConfirm = () => {
    onAgesChange(ages);
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="children-ages-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Users className="w-5 h-5" />
            Children&apos;s Ages
          </DialogTitle>
          <DialogDescription>
            Please select the age of each child (0-17 years)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Array.from({ length: childrenCount }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="font-medium">Child {index + 1}</span>
              <Select 
                value={String(ages[index] ?? 5)} 
                onValueChange={(value) => updateAge(index, parseInt(value))}
              >
                <SelectTrigger className="w-32" data-testid={`child-age-select-${index}`}>
                  <SelectValue placeholder="Age" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 18 }).map((_, age) => (
                    <SelectItem key={age} value={String(age)}>
                      {age === 0 ? 'Under 1 year' : age === 1 ? '1 year' : `${age} years`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} data-testid="confirm-children-ages">
            Confirm Ages
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== GUEST SELECTOR WITH CHILDREN AGES ====================
const GuestSelector = ({ guests, setGuests, childrenAges, setChildrenAges, variant = "default" }) => {
  const [showAgesDialog, setShowAgesDialog] = useState(false);

  const handleChildrenChange = (newCount) => {
    const updatedGuests = { ...guests, children: newCount };
    setGuests(updatedGuests);
    
    // If increasing children, show ages dialog
    if (newCount > 0 && newCount > guests.children) {
      setShowAgesDialog(true);
    }
    
    // Adjust ages array
    if (newCount === 0) {
      setChildrenAges([]);
    } else if (newCount < childrenAges.length) {
      setChildrenAges(childrenAges.slice(0, newCount));
    }
  };

  const buttonClass = variant === "outline" 
    ? "h-11" 
    : "h-12 rounded-xl bg-white/50 border-0 px-4";

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={buttonClass} data-testid="guest-selector">
            <Users className="mr-2 h-5 w-5 text-muted-foreground" />
            {guests.adults} Adults, {guests.children} Children
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Adults</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setGuests({...guests, adults: Math.max(1, guests.adults - 1)})}
                >-</Button>
                <span className="w-8 text-center">{guests.adults}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => setGuests({...guests, adults: guests.adults + 1})}
                >+</Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Children</span>
                <p className="text-xs text-muted-foreground">Ages 0-17</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => handleChildrenChange(Math.max(0, guests.children - 1))}
                >-</Button>
                <span className="w-8 text-center">{guests.children}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => handleChildrenChange(guests.children + 1)}
                >+</Button>
              </div>
            </div>

            {guests.children > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Children&apos;s ages:</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-primary p-0 h-auto"
                      onClick={() => setShowAgesDialog(true)}
                      data-testid="edit-children-ages"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit ages
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {childrenAges.map((age, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1">
                        Child {i + 1}: {age} {age === 1 ? 'year' : 'years'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <ChildrenAgesDialog
        open={showAgesDialog}
        onOpenChange={setShowAgesDialog}
        childrenCount={guests.children}
        childrenAges={childrenAges}
        onAgesChange={setChildrenAges}
      />
    </>
  );
};

// ==================== DESTINATION AUTOCOMPLETE ====================
const DestinationAutocomplete = ({ value, onChange, onSelect, placeholder = "City, region, or hotel" }) => {
  const { query, setQuery, destinations, loading, setSelectedDestination } = useDestinationSearch();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value, setQuery]);

  const handleSelect = (dest) => {
    setSelectedDestination(dest);
    onChange(dest.name);
    onSelect(dest);
    setOpen(false);
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      <Input 
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="pl-10 h-14 rounded-xl bg-white/50 border-0 text-base"
        data-testid="search-destination"
      />
      
      {open && (value.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border z-50 max-h-64 overflow-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : destinations.length > 0 ? (
            destinations.map((dest) => (
              <button
                key={dest.id}
                className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center gap-3 transition-colors"
                onClick={() => handleSelect(dest)}
                data-testid={`dest-option-${dest.id}`}
              >
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{dest.name}</p>
                  <p className="text-sm text-muted-foreground">{dest.country}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No destinations found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== LAST MINUTE DEALS SECTION ====================
const LastMinuteDeals = () => {
  const navigate = useNavigate();
  const { user, hasValidPass } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['lastMinuteDeals'],
    queryFn: async () => {
      const response = await axios.get(`${API}/hotels/last-minute`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden">
            <div className="h-48 skeleton" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-32 skeleton rounded" />
              <div className="h-4 w-24 skeleton rounded" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const hotels = data?.hotels || [];
  const badgeText = data?.badge_text || "Hot Deals";

  // Dynamically adjust grid columns based on number of hotels
  const gridCols = hotels.length <= 3 ? 'md:grid-cols-3' : hotels.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3 lg:grid-cols-5';
  
  return (
    <div className={`grid ${gridCols} gap-6`}>
      {hotels.map(hotel => {
        const pricing = calculatePricing(hotel.min_price, hasValidPass?.());
        
        return (
          <Card key={hotel.hotel_id} className="overflow-hidden card-hover group" data-testid={`lastminute-${hotel.hotel_id}`}>
            <div className="relative h-48 overflow-hidden">
              <img 
                src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
                alt={hotel.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                <Zap className="w-3 h-3 mr-1" />
                {badgeText}
              </Badge>
              <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                -30%
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="font-semibold truncate">{hotel.name}</h3>
              <p className="text-sm text-muted-foreground">{hotel.city}, {hotel.country}</p>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <span className="text-xl font-semibold">€{pricing.roomTotal.toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">/night</span>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => navigate(`/hotel/${hotel.hotel_id}?checkIn=${hotel.last_minute_check_in || format(addDays(new Date(), 1), 'yyyy-MM-dd')}&checkOut=${hotel.last_minute_check_out || format(addDays(new Date(), 3), 'yyyy-MM-dd')}&adults=2&children=0&b2c=1`)}
                >
                  Book Now
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Testimonials Section Component
const TestimonialsSection = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const response = await axios.get(`${API}/testimonials`);
      return response.data.testimonials;
    }
  });

  const testimonials = data || [];

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-secondary/30 to-background overflow-hidden" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Star className="w-3 h-3 mr-1 fill-current" /> {t('testimonials.badge')}
          </Badge>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.slice(0, 4).map((testimonial, index) => (
            <Card 
              key={testimonial.testimonial_id} 
              className="p-6 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card relative overflow-hidden group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-primary/10 transition-all" />
              
              {/* Rating Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                  />
                ))}
              </div>
              
              {/* Title */}
              <h4 className="font-semibold text-base mb-2 line-clamp-1">{testimonial.title}</h4>
              
              {/* Content */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              {/* Author & Hotel */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {testimonial.user_name?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.user_name}</p>
                    {testimonial.hotel_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {testimonial.hotel_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="text-center p-6 rounded-2xl bg-card shadow-md">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">4.9</div>
            <div className="flex justify-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{t('testimonials.averageRating')}</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card shadow-md">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">15K+</div>
            <p className="text-sm text-muted-foreground mt-2">{t('testimonials.happyGuests')}</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card shadow-md">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">€2.5M</div>
            <p className="text-sm text-muted-foreground mt-2">{t('testimonials.totalSaved')}</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-card shadow-md">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">98%</div>
            <p className="text-sm text-muted-foreground mt-2">{t('testimonials.wouldRecommend')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Last Minute Section with dynamic settings
const LastMinuteSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['lastMinuteDeals'],
    queryFn: async () => {
      const response = await axios.get(`${API}/hotels/last-minute`);
      return response.data;
    }
  });

  const title = data?.title || "Last Minute Offers";
  const subtitle = data?.subtitle || "Book now and save up to 30% on selected hotels";
  const badgeText = data?.badge_text || "Hot Deals";
  const checkIn = data?.check_in;
  const checkOut = data?.check_out;

  return (
    <section className="py-16 md:py-20 bg-red-50/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge className="mb-2 bg-red-500 text-white">
              <Zap className="w-3 h-3 mr-1" /> {badgeText}
            </Badge>
            <h2 className="font-serif text-3xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">{subtitle}</p>
            {checkIn && checkOut && (
              <p className="text-sm text-red-600 mt-1">
                Valid for: {format(new Date(checkIn), 'MMM d, yyyy')} - {format(new Date(checkOut), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <Link to="/last-minute" className="hidden md:flex items-center text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <LastMinuteDeals />
      </div>
    </section>
  );
};

// ==================== HOME PAGE ====================
const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [resortId, setResortId] = useState("");
  const [checkIn, setCheckIn] = useState(addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState(addDays(new Date(), 10));
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [childrenAges, setChildrenAges] = useState([]);

  const handleSearch = () => {
    const params = new URLSearchParams({
      destination,
      destinationId: destinationId || '',
      resortId: resortId || '',
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      adults: guests.adults.toString(),
      children: guests.children.toString(),
      childrenAges: childrenAges.join(','),
      rooms: guests.rooms.toString()
    });
    navigate(`/search?${params.toString()}`);
  };

  const handleDestinationSelect = (dest) => {
    setDestination(dest.name);
    setDestinationId(dest.id);
    setResortId(dest.resort_id || '');
  };

  const featuredDestinations = [
    { name: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600", hotels: "1,240+", id: "10045" },
    { name: "Barcelona", country: "Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600", hotels: "2,100+", id: "10012" },
    { name: "Vienna", country: "Austria", image: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600", hotels: "890+", id: "10025" },
    { name: "Amalfi", country: "Italy", image: "https://images.unsplash.com/photo-1612698093158-e07ac200d44e?w=600", hotels: "450+", id: "10078" }
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section - Revolutionary Design */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920')` }}
        >
          {/* Darker gradient overlay - especially on right side */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
          {/* Additional right side shadow for mobile */}
          <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent md:from-black/30" />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float hidden lg:block" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-float hidden md:block" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="animate-fadeInUp text-center md:text-left">
              {/* Revolutionary Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-blue-400 text-accent-foreground px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold mb-6 md:mb-8 shadow-lg animate-pulse-glow" data-testid="hero-badge">
                <Gift className="w-4 h-4 md:w-5 md:h-5" />
                {t('hero.badge')}
              </div>
              
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white font-bold leading-[1.1] mb-4 md:mb-6">
                <span className="block">{t('hero.title1')}</span>
                <span className="block text-accent">{t('hero.title2')}</span>
              </h1>
              
              <div className="text-base md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                {/* Mobile: inline text */}
                <p className="md:hidden">
                  {t('hero.subtitle')}
                  <span className="text-accent font-semibold"> {t('hero.hotelsSave')}</span> {t('hero.passItToYou')}
                </p>
                {/* Desktop: 3 separate lines */}
                <div className="hidden md:block space-y-1">
                  <p>{t('hero.subtitle')}</p>
                  <p className="text-accent font-semibold">{t('hero.hotelsSave')}</p>
                  <p>{t('hero.passItToYou')}</p>
                </div>
              </div>

              {/* Key Benefits - Improved mobile layout */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-8 md:mb-10">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{t('hero.roomFree')}</p>
                    <p className="text-white/70 text-xs">{t('hero.payMealsOnly')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Percent className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{t('hero.saved')}</p>
                    <p className="text-white/70 text-xs">{t('hero.noCommissions')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{t('hero.hotels')}</p>
                    <p className="text-white/70 text-xs">{t('hero.worldwideAccess')}</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons - Better mobile layout */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center md:items-start">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 md:h-14 text-base md:text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                      <Sparkles className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                      {t('hero.getFreeRoom')}
                    </Button>
                  </DialogTrigger>
                  <AuthDialog defaultTab="register" />
                </Dialog>
                <Link to="/about" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 h-12 md:h-14 text-base md:text-lg bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                    {t('hero.howItWorks')}
                    <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Search Card */}
            <Card className="hero-search-box rounded-3xl p-6 md:p-8 shadow-2xl border-0 bg-white/95 backdrop-blur-md animate-fadeInUp stagger-2" data-testid="search-card">
              <div className="text-center mb-6">
                <h3 className="font-serif text-2xl font-semibold text-primary mb-2">{t('search.title')}</h3>
                <p className="text-muted-foreground text-sm">{t('cta.hotels')} • {t('cta.bestPrice')}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">{t('search.destination')}</Label>
                  <DestinationAutocomplete 
                    value={destination}
                    onChange={setDestination}
                    onSelect={handleDestinationSelect}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">{t('search.checkIn')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-14 rounded-xl bg-secondary/50 border-border justify-start text-left font-normal hover:bg-secondary transition-all" data-testid="search-checkin">
                          <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                          {format(checkIn, "MMM d")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={(date) => date && setCheckIn(date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">{t('search.checkOut')}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-14 rounded-xl bg-secondary/50 border-border justify-start text-left font-normal hover:bg-secondary transition-all" data-testid="search-checkout">
                          <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                          {format(checkOut, "MMM d")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={(date) => date && setCheckOut(date)}
                          disabled={(date) => date <= checkIn}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <GuestSelector 
                  guests={guests}
                  setGuests={setGuests}
                  childrenAges={childrenAges}
                  setChildrenAges={setChildrenAges}
                />

                <Button 
                  onClick={handleSearch} 
                  size="lg" 
                  className="w-full rounded-xl h-14 text-lg font-bold btn-primary-enhanced shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                  data-testid="search-btn"
                >
                  <Search className="mr-2 w-5 h-5" />
                  {t('search.searchButton')}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>{t('cta.securePayment')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>{t('cta.bestPrice')}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - The Secret Revealed */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-secondary/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
              <Sparkles className="w-4 h-4 mr-1" /> The FreeStays Concept
            </Badge>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">How Your Room Becomes FREE</h2>
            <div className="text-muted-foreground text-lg max-w-4xl mx-auto space-y-4">
              <p>
                Unlike other booking platforms that charge hotels up to 30% commission, Freestays does not charge commission on room bookings.
              </p>
              <p>
                Instead of keeping margins, we return the full value directly to you — and that value equals <span className="font-semibold text-primary">100% of your room price</span> when you book with a meal package (Half Board, Full Board or All Inclusive).
              </p>
              <p className="text-primary font-medium">
                Fair, transparent and built to benefit you.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">1</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">Hotels Pay 0%</h3>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>Hotels save up to <span className="font-semibold">50%</span> compared to other booking platforms.</p>
                  <p>Freestays charges no commission on room accommodation, allowing hotels to keep their revenue and invest in better service and quality.</p>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">2</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">No Commission on Rooms</h3>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>Freestays does not earn money on your room.</p>
                  <p>Hotels only contribute a small, transparent fee for bringing them guests — not a commission on accommodation.</p>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">3</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">We Give It Back to YOU</h3>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>Instead of keeping that value, Freestays gives it entirely to you as a discount.</p>
                  <p>That discount always equals the room price when you book with a meal package.</p>
                </div>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-accent to-blue-400 rounded-3xl p-8 shadow-xl h-full card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg">
                  <Gift className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3 text-accent-foreground">Room = FREE!</h3>
                <div className="text-accent-foreground/90 text-sm space-y-3">
                  <p>You only pay for your meals<br/>(Half Board, Full Board or All Inclusive).</p>
                  <p className="text-lg">💙 The room accommodation is on us.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Learn More Button */}
          <div className="text-center mt-12">
            <Link to="/about">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                {t('hero.howItWorks', 'Learn More')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Last Minute Deals */}
      <LastMinuteSection />

      {/* Value Proposition - FreeStays Pass */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">Your FreeStays Pass</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Unlock free rooms and exclusive savings. Choose the pass that fits your travel style.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* One-Time Pass */}
            <Card className="p-8 rounded-3xl bg-card border-2 border-border shadow-lg card-hover relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Ticket className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-2">One-Time Pass</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-primary">€35</span>
                <span className="text-muted-foreground">/booking</span>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Perfect for a single trip. Get your room free on your next booking.
              </p>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Room price = FREE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Only pay for meals (HB/FB/AI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No €15 booking fee</span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-xl" variant="outline">Get Pass</Button>
                </DialogTrigger>
                <AuthDialog defaultTab="register" />
              </Dialog>
            </Card>

            {/* Annual Pass - Featured */}
            <Card className="p-8 rounded-3xl bg-gradient-to-br from-primary to-primary/90 border-0 shadow-2xl card-hover relative overflow-hidden transform md:-translate-y-4">
              <div className="absolute top-4 right-4">
                <Badge className="bg-accent text-accent-foreground font-bold">BEST VALUE</Badge>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <Crown className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-2 text-primary-foreground">Annual Pass</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-primary-foreground">€129</span>
                <span className="text-primary-foreground/70">/year</span>
              </div>
              <p className="text-primary-foreground/80 mb-6 text-sm">
                Unlimited free rooms for a whole year. For frequent travelers.
              </p>
              <div className="space-y-3 text-sm mb-6 text-primary-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Unlimited FREE rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Only pay for meals (HB/FB/AI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>No €15 booking fee EVER</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Priority customer support</span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-xl bg-white text-primary hover:bg-white/90 font-bold">
                    Get Annual Pass
                  </Button>
                </DialogTrigger>
                <AuthDialog defaultTab="register" />
              </Dialog>
            </Card>

            {/* No Pass */}
            <Card className="p-8 rounded-3xl bg-card border-2 border-border shadow-lg card-hover relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-2xl font-semibold mb-2">Guest Booking</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-muted-foreground">€15</span>
                <span className="text-muted-foreground">/booking fee</span>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Book without a pass. Still great prices, just with a small fee.
              </p>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-muted-foreground" />
                  <span>Access to all hotels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-muted-foreground" />
                  <span>No hotel commission prices</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Room not included free</span>
                </div>
              </div>
              <Button className="w-full rounded-xl" variant="secondary" onClick={() => navigate('/search')}>
                Browse Hotels
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge className="mb-3 bg-secondary text-secondary-foreground">Popular Destinations</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-2">Where Will Your Free Room Be?</h2>
              <p className="text-muted-foreground">Discover stunning destinations with commission-free stays</p>
            </div>
            <Link to="/search" className="hidden md:flex items-center text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {featuredDestinations.map((dest, idx) => (
              <Link 
                key={dest.name} 
                to={`/search?destination=${dest.name}&destinationId=${dest.id}`}
                className="group relative rounded-3xl overflow-hidden aspect-[4/5] card-hover shadow-xl"
                data-testid={`destination-${dest.name.toLowerCase()}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
                    {dest.hotels} hotels
                  </Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-serif text-2xl text-white font-semibold mb-1">{dest.name}</h3>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {dest.country}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Gift className="w-4 h-4" />
            Limited Time: Get Your First Room FREE
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready for Your Free Stay?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of smart travelers who get their rooms for FREE. 
            Start with €35 one-time pass or go unlimited with €129/year.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full px-10 h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all" data-testid="cta-signup">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Create Free Account
                </Button>
              </DialogTrigger>
              <AuthDialog defaultTab="register" />
            </Dialog>
            <Link to="/about">
              <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg bg-transparent border-2 border-white/30 text-primary-foreground hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/20 flex flex-wrap justify-center gap-8 text-primary-foreground/70 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span>450,000+ Hotels</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Best Price Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Footer */}
      <footer className="py-16 bg-secondary/50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/assets/logo.png" 
                  alt="FreeStays" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('footer.tagline')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('footer.company')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/who-we-are" className="hover:text-primary transition-colors">{t('footer.about')}</Link></li>
                <li><Link to="/refer-a-friend" className="hover:text-primary transition-colors">{t('footer.referFriend')}</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link to="/about" className="hover:text-primary transition-colors">{t('footer.terms')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-3">
                <a href="https://freestays.eu" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="mailto:hello@freestays.eu" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <Separator className="my-10" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
              <Link to="/about" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ==================== SEARCH PAGE ====================
const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasValidPass, user } = useAuth();
  
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [destinationId, setDestinationId] = useState(searchParams.get('destinationId') || '');
  const [resortId, setResortId] = useState(searchParams.get('resortId') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')) : addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')) : addDays(new Date(), 10));
  const [guests, setGuests] = useState({
    adults: parseInt(searchParams.get('adults') || '2'),
    children: parseInt(searchParams.get('children') || '0'),
    rooms: parseInt(searchParams.get('rooms') || '1')
  });
  // Parse children ages from URL
  const initialChildrenAges = searchParams.get('childrenAges') 
    ? searchParams.get('childrenAges').split(',').filter(a => a).map(a => parseInt(a))
    : [];
  const [childrenAges, setChildrenAges] = useState(initialChildrenAges);
  
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [starFilter, setStarFilter] = useState([]);
  const [themeFilter, setThemeFilter] = useState([]);
  const [amenityFilter, setAmenityFilter] = useState([]);
  const [sortBy, setSortBy] = useState("recommended");
  
  // Email capture popup state
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [captureEmail, setCaptureEmail] = useState('');
  const [emailCaptureSubmitted, setEmailCaptureSubmitted] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ['hotels', resortId || destinationId || destination, checkIn, checkOut, guests, childrenAges],
    queryFn: async () => {
      const response = await axios.post(`${API}/hotels/search`, {
        destination: destination,
        destination_id: destinationId || null,
        resort_id: resortId || null,
        check_in: format(checkIn, 'yyyy-MM-dd'),
        check_out: format(checkOut, 'yyyy-MM-dd'),
        adults: guests.adults,
        children: guests.children,
        children_ages: childrenAges.length > 0 ? childrenAges : null,
        rooms: guests.rooms,
        currency: 'EUR',
        b2c: 0
      });
      return response.data;
    },
    enabled: destination.length > 0
  });

  // Show email capture popup for non-logged-in users when comparison data is available
  useEffect(() => {
    const hasShownPopup = sessionStorage.getItem('email_capture_shown');
    if (!user && searchResults?.comparison_data?.hotels_with_savings > 0 && !hasShownPopup && !emailCaptureSubmitted) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setShowEmailCapture(true);
        sessionStorage.setItem('email_capture_shown', 'true');
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [user, searchResults, emailCaptureSubmitted]);

  const handleEmailCapture = async (e) => {
    e.preventDefault();
    if (!captureEmail) return;
    
    try {
      // Save comparison with visitor email
      await axios.post(`${API}/price-comparison/save`, {
        comparison_data: searchResults.comparison_data,
        visitor_email: captureEmail
      });
      setEmailCaptureSubmitted(true);
      toast.success(t('priceComparison.subscribed'));
      setShowEmailCapture(false);
    } catch (error) {
      toast.error("Failed to save. Please try again.");
    }
  };

  const nights = differenceInDays(checkOut, checkIn);
  
  let filteredHotels = searchResults?.hotels || [];
  
  // Apply star filter
  if (starFilter.length > 0) {
    filteredHotels = filteredHotels.filter(h => starFilter.includes(Math.floor(h.star_rating)));
  }
  
  // Apply price filter
  filteredHotels = filteredHotels.filter(h => h.min_price >= priceRange[0] && h.min_price <= priceRange[1]);
  
  // Apply theme filter
  if (themeFilter.length > 0) {
    filteredHotels = filteredHotels.filter(h => {
      const hotelThemes = h.themes || [];
      return themeFilter.some(t => hotelThemes.some(ht => ht.toLowerCase().includes(t.toLowerCase())));
    });
  }
  
  // Apply amenity filter
  if (amenityFilter.length > 0) {
    filteredHotels = filteredHotels.filter(h => {
      const hotelAmenities = h.amenities || [];
      return amenityFilter.every(a => hotelAmenities.some(ha => ha.toLowerCase().includes(a.toLowerCase())));
    });
  }
  
  // Apply sorting
  if (sortBy === 'price_low') {
    filteredHotels = [...filteredHotels].sort((a, b) => a.min_price - b.min_price);
  } else if (sortBy === 'price_high') {
    filteredHotels = [...filteredHotels].sort((a, b) => b.min_price - a.min_price);
  } else if (sortBy === 'rating') {
    filteredHotels = [...filteredHotels].sort((a, b) => b.review_score - a.review_score);
  } else if (sortBy === 'stars') {
    filteredHotels = [...filteredHotels].sort((a, b) => b.star_rating - a.star_rating);
  }

  const handleSearch = () => {
    const params = new URLSearchParams({
      destination,
      destinationId: destinationId || '',
      resortId: resortId || '',
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      adults: guests.adults.toString(),
      children: guests.children.toString(),
      childrenAges: childrenAges.join(','),
      rooms: guests.rooms.toString()
    });
    setSearchParams(params);
    refetch();
  };

  const handleDestinationSelect = (dest) => {
    setDestination(dest.name);
    setDestinationId(dest.id);
    setResortId(dest.resort_id || '');
  };

  return (
    <div className="min-h-screen pt-20" data-testid="search-page">
      {/* Compact Search Bar */}
      <div className="bg-secondary/50 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <DestinationAutocomplete 
                value={destination}
                onChange={setDestination}
                onSelect={handleDestinationSelect}
                placeholder="Where to?"
              />
            </div>
            
            <Button onClick={handleSearch} className="h-11 rounded-lg" data-testid="search-submit">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Date & Guests Selector Row */}
      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-10 px-4 hover:bg-white" data-testid="checkin-picker">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Check-in</div>
                      <div className="font-medium">{format(checkIn, "EEE, MMM d")}</div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={(date) => {
                      if (date) {
                        setCheckIn(date);
                        if (date >= checkOut) {
                          setCheckOut(addDays(date, 1));
                        }
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <ArrowRight className="w-4 h-4 text-muted-foreground" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-10 px-4 hover:bg-white" data-testid="checkout-picker">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Check-out</div>
                      <div className="font-medium">{format(checkOut, "EEE, MMM d")}</div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={(date) => date && setCheckOut(date)}
                    disabled={(date) => date <= checkIn}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="h-8 w-px bg-border mx-1" />

              <div className="px-3 py-1 text-center">
                <div className="text-xs text-muted-foreground">Nights</div>
                <div className="font-semibold text-primary">{nights}</div>
              </div>
            </div>

            {/* Guest Selector */}
            <GuestSelector 
              guests={guests}
              setGuests={setGuests}
              childrenAges={childrenAges}
              setChildrenAges={setChildrenAges}
              variant="outline"
            />

            {/* Update Search Button */}
            <Button 
              onClick={handleSearch} 
              size="sm" 
              className="rounded-full px-6"
              data-testid="update-search-btn"
            >
              <Search className="w-4 h-4 mr-2" />
              Update
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Enhanced Filter Sidebar */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <Card className="p-6 sticky top-24 shadow-lg border-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  {t('search.filters')}
                </h3>
                {(starFilter.length > 0 || themeFilter.length > 0 || amenityFilter.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setStarFilter([]);
                      setThemeFilter([]);
                      setAmenityFilter([]);
                      setPriceRange([0, 1000]);
                    }}
                  >
                    {t('search.clearFilters')}
                  </Button>
                )}
              </div>
              
              <div className="space-y-5">
                {/* Price Range Filter - Enhanced */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Euro className="w-4 h-4 text-primary" />
                      {t('search.price')}
                    </Label>
                    <span className="text-sm font-medium text-primary">
                      €{priceRange[0]} - €{priceRange[1] === 1000 ? '1000+' : priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    step={25}
                    className="mb-3"
                  />
                  <div className="flex gap-2">
                    {[100, 200, 300, 500].map(price => (
                      <Button
                        key={price}
                        variant={priceRange[1] <= price ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => setPriceRange([0, price])}
                      >
                        &lt;€{price}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Star Rating Filter - Interactive Stars */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {t('search.stars')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {[5, 4, 3, 2].map(star => (
                      <Button
                        key={star}
                        variant={starFilter.includes(star) ? "default" : "outline"}
                        size="sm"
                        className={`h-10 justify-start gap-1 ${starFilter.includes(star) ? 'bg-primary' : 'hover:bg-primary/10'}`}
                        onClick={() => {
                          if (starFilter.includes(star)) {
                            setStarFilter(starFilter.filter(s => s !== star));
                          } else {
                            setStarFilter([...starFilter, star]);
                          }
                        }}
                      >
                        {Array.from({ length: star }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${starFilter.includes(star) ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'}`} />
                        ))}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Hotel Type Filter - Dropdown with Popup */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Hotel Type
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-10 mt-2">
                        <span className="text-sm">
                          {themeFilter.length === 0 
                            ? 'All types' 
                            : `${themeFilter.length} selected`}
                        </span>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4" align="start">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-semibold text-sm">Select Hotel Types</span>
                          {themeFilter.length > 0 && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setThemeFilter([])}>
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {[
                            { name: 'Beach', icon: '🏖️' },
                            { name: 'City', icon: '🏙️' },
                            { name: 'Spa', icon: '💆' },
                            { name: 'Business', icon: '💼' },
                            { name: 'Family', icon: '👨‍👩‍👧‍👦' },
                            { name: 'Romantic', icon: '💕' },
                            { name: 'Budget', icon: '💰' },
                            { name: 'Luxury', icon: '👑' },
                            { name: 'Boutique', icon: '🎨' },
                            { name: 'Resort', icon: '🌴' }
                          ].map(theme => (
                            <Button
                              key={theme.name}
                              variant={themeFilter.includes(theme.name) ? "default" : "outline"}
                              size="sm"
                              className={`justify-start gap-2 h-9 ${themeFilter.includes(theme.name) ? '' : 'hover:bg-primary/10'}`}
                              onClick={() => {
                                if (themeFilter.includes(theme.name)) {
                                  setThemeFilter(themeFilter.filter(t => t !== theme.name));
                                } else {
                                  setThemeFilter([...themeFilter, theme.name]);
                                }
                              }}
                            >
                              <span>{theme.icon}</span>
                              <span className="text-xs">{theme.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {themeFilter.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {themeFilter.map(theme => (
                        <Badge 
                          key={theme} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-destructive hover:text-white transition-colors"
                          onClick={() => setThemeFilter(themeFilter.filter(t => t !== theme))}
                        >
                          {theme} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amenities Filter - Dropdown with Popup */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Amenities
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-10 mt-2">
                        <span className="text-sm">
                          {amenityFilter.length === 0 
                            ? 'Any amenities' 
                            : `${amenityFilter.length} selected`}
                        </span>
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4" align="start">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="font-semibold text-sm">Must-have Amenities</span>
                          {amenityFilter.length > 0 && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAmenityFilter([])}>
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {[
                            { name: 'WiFi', icon: <Wifi className="w-4 h-4" /> },
                            { name: 'Pool', icon: '🏊' },
                            { name: 'Parking', icon: <Car className="w-4 h-4" /> },
                            { name: 'Restaurant', icon: <UtensilsCrossed className="w-4 h-4" /> },
                            { name: 'Gym', icon: '🏋️' },
                            { name: 'Spa', icon: '💆' },
                            { name: 'Air Conditioning', icon: '❄️' },
                            { name: 'Pet Friendly', icon: '🐕' },
                            { name: 'Bar', icon: '🍸' },
                            { name: 'Room Service', icon: '🛎️' }
                          ].map(amenity => (
                            <Button
                              key={amenity.name}
                              variant={amenityFilter.includes(amenity.name) ? "default" : "outline"}
                              size="sm"
                              className={`justify-start gap-2 h-9 ${amenityFilter.includes(amenity.name) ? '' : 'hover:bg-primary/10'}`}
                              onClick={() => {
                                if (amenityFilter.includes(amenity.name)) {
                                  setAmenityFilter(amenityFilter.filter(a => a !== amenity.name));
                                } else {
                                  setAmenityFilter([...amenityFilter, amenity.name]);
                                }
                              }}
                            >
                              <span className="text-sm">{typeof amenity.icon === 'string' ? amenity.icon : amenity.icon}</span>
                              <span className="text-xs">{amenity.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {amenityFilter.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {amenityFilter.map(amenity => (
                        <Badge 
                          key={amenity} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-destructive hover:text-white transition-colors"
                          onClick={() => setAmenityFilter(amenityFilter.filter(a => a !== amenity))}
                        >
                          {amenity} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Filters Summary */}
                {(starFilter.length > 0 || themeFilter.length > 0 || amenityFilter.length > 0) && (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <CheckCircle className="w-4 h-4" />
                      {starFilter.length + themeFilter.length + amenityFilter.length} filters active
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </aside>

          <main className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold">
                  {destination ? `Hotels in ${destination}` : t('search.searchTitle', 'Search Results')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredHotels.length} {t('search.hotelsFoundText', 'hotels found')} • {nights} {nights !== 1 ? t('search.nights') : t('search.night')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">{t('search.sortBy')}:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px] bg-white shadow-sm" data-testid="sort-select">
                    <SelectValue placeholder={t('search.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Recommended
                      </span>
                    </SelectItem>
                    <SelectItem value="price_low">
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 rotate-[-90deg]" /> {t('search.price')}: Low to High
                      </span>
                    </SelectItem>
                    <SelectItem value="price_high">
                      <span className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 rotate-90" /> {t('search.price')}: High to Low
                      </span>
                    </SelectItem>
                    <SelectItem value="rating">
                      <span className="flex items-center gap-2">
                        <Star className="w-4 h-4" /> {t('search.rating')}
                      </span>
                    </SelectItem>
                    <SelectItem value="stars">
                      <span className="flex items-center gap-2">
                        <Crown className="w-4 h-4" /> {t('search.stars')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-72 h-48 skeleton" />
                      <div className="flex-1 p-6 space-y-4">
                        <div className="h-6 w-48 skeleton rounded" />
                        <div className="h-4 w-32 skeleton rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredHotels.length > 0 ? (
              <div className="space-y-6">
                {filteredHotels.map(hotel => (
                  <HotelCard 
                    key={hotel.hotel_id} 
                    hotel={hotel} 
                    nights={nights}
                    checkIn={format(checkIn, 'yyyy-MM-dd')}
                    checkOut={format(checkOut, 'yyyy-MM-dd')}
                    guests={guests}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-2">{t('search.noResults')}</h3>
                <p className="text-muted-foreground mb-6">{t('search.tryDifferent')}</p>
                <Button variant="outline" onClick={() => { setPriceRange([0, 1000]); setStarFilter([]); }}>
                  {t('search.clearFilters')}
                </Button>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Email Capture Popup for Non-logged-in Users */}
      <Dialog open={showEmailCapture} onOpenChange={setShowEmailCapture}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-2xl">
              {t('priceComparison.title', 'Save Your Price Comparison')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('priceComparison.subtitle', 'Get these deals delivered to your inbox!')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Savings Summary */}
            {searchResults?.comparison_data && (
              <div className="bg-accent/10 rounded-xl p-4 text-center border border-accent/30">
                <p className="text-sm text-muted-foreground mb-1">Potential Savings Found</p>
                <p className="text-3xl font-bold text-accent">€{searchResults.comparison_data.total_savings?.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  across {searchResults.comparison_data.hotels_with_savings} hotels in {searchResults.comparison_data.destination}
                </p>
              </div>
            )}

            {!emailCaptureSubmitted ? (
              <form onSubmit={handleEmailCapture} className="space-y-4">
                <div>
                  <Label>{t('priceComparison.getEmailAlerts')}</Label>
                  <Input 
                    type="email"
                    placeholder={t('priceComparison.emailPlaceholder')}
                    value={captureEmail}
                    onChange={(e) => setCaptureEmail(e.target.value)}
                    className="mt-2"
                    required
                    data-testid="email-capture-input"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" data-testid="email-capture-submit">
                  <Mail className="w-4 h-4 mr-2" />
                  {t('priceComparison.subscribe')}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="font-semibold text-primary">{t('priceComparison.subscribed')}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm text-center text-muted-foreground mb-3">
                {t('priceComparison.registerPrompt')}
              </p>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 rounded-full" data-testid="register-from-popup">
                      <UserPlus className="w-4 h-4 mr-2" />
                      {t('priceComparison.registerNow')}
                    </Button>
                  </DialogTrigger>
                  <AuthDialog defaultTab="register" />
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="flex-1 rounded-full">
                      {t('priceComparison.login')}
                    </Button>
                  </DialogTrigger>
                  <AuthDialog defaultTab="login" />
                </Dialog>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== HOTEL CARD ====================
const HotelCard = ({ hotel, nights, checkIn, checkOut, guests }) => {
  const navigate = useNavigate();
  const { hasValidPass, user, token } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  const validPass = hasValidPass?.() || false;
  const pricing = calculatePricing(hotel.min_price * nights, validPass);

  // Check if hotel is favorited
  useEffect(() => {
    if (user && token) {
      axios.get(`${API}/favorites/check/${hotel.hotel_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setIsFavorite(res.data.is_favorite)).catch(() => {});
    }
  }, [hotel.hotel_id, user, token]);

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${hotel.hotel_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await axios.post(`${API}/favorites`, {
          hotel_id: hotel.hotel_id,
          hotel_name: hotel.name,
          star_rating: hotel.star_rating,
          image_url: hotel.image_url,
          location: `${hotel.city}, ${hotel.country}`,
          min_price: hotel.min_price
        }, { headers: { Authorization: `Bearer ${token}` } });
        setIsFavorite(true);
        toast.success("Added to favorites!");
      }
    } catch (error) {
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Theme to style mapping (no emojis as per guidelines)
  const themeStyles = {
    'Beach': { icon: Waves, bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    'City': { icon: Building2, bg: 'bg-slate-50 text-slate-700 border-slate-200' },
    'Spa': { icon: Heart, bg: 'bg-pink-50 text-pink-700 border-pink-200' },
    'Business': { icon: Briefcase, bg: 'bg-gray-50 text-gray-700 border-gray-200' },
    'Family': { icon: Users, bg: 'bg-primary/10 text-primary border-primary/30' },
    'Romantic': { icon: Heart, bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    'Budget': { icon: Tag, bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    'Luxury': { icon: Crown, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Boutique': { icon: Sparkles, bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    'Resort': { icon: TreePine, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };

  const getThemeStyle = (theme) => {
    const lowerTheme = theme.toLowerCase();
    for (const [key, style] of Object.entries(themeStyles)) {
      if (lowerTheme.includes(key.toLowerCase())) {
        return style;
      }
    }
    return { icon: Building2, bg: 'bg-secondary text-secondary-foreground border-border' };
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 group" data-testid={`hotel-card-${hotel.hotel_id}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Image Section */}
        <div className="relative w-full lg:w-80 h-56 lg:h-auto flex-shrink-0 overflow-hidden">
          <img 
            src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isFavorite 
                ? 'bg-red-500 text-white shadow-lg scale-110' 
                : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500 shadow-md'
            } ${favoriteLoading ? 'opacity-50' : ''}`}
            data-testid={`favorite-btn-${hotel.hotel_id}`}
          >
            <Heart className={`w-5 h-5 transition-transform ${isFavorite ? 'fill-current scale-110' : ''}`} />
          </button>
          
          {/* Badges Container */}
          <div className="absolute top-3 left-3 flex items-start gap-2">
            {hotel.is_last_minute && (
              <Badge className="bg-red-500 text-white font-semibold shadow-lg animate-pulse">
                <Zap className="w-3.5 h-3.5 mr-1" /> Last Minute
              </Badge>
            )}
            
            {validPass ? (
              <Badge className="bg-accent text-accent-foreground font-semibold shadow-lg animate-pulse-glow">
                <Gift className="w-3.5 h-3.5 mr-1" />
                Save €{pricing.discountAmount.toFixed(0)}
              </Badge>
            ) : (
              <Badge className="bg-white/90 text-primary backdrop-blur-sm shadow-lg group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Save €{pricing.potentialSavings.toFixed(0)}
              </Badge>
            )}
          </div>
          
          {/* Guest Count Badge */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
            <Users className="w-3.5 h-3.5" />
            {guests.adults} Adult{guests.adults !== 1 ? 's' : ''}{guests.children > 0 && `, ${guests.children} Child${guests.children !== 1 ? 'ren' : ''}`}
          </div>

          {/* Star Rating on Image */}
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-0.5 shadow-lg">
            {Array.from({ length: Math.floor(hotel.star_rating) }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-5 lg:p-6">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 
                    className="font-serif text-xl font-semibold hover:text-primary cursor-pointer transition-colors line-clamp-1" 
                    onClick={() => navigate(`/hotel/${hotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests.adults}&children=${guests.children}`)}
                  >
                    {hotel.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {hotel.city}, {hotel.country}
                  </div>
                </div>
                
                {/* Review Score */}
                {hotel.review_score > 0 && (
                  <div className="flex flex-col items-end">
                    <Badge className="bg-primary text-primary-foreground font-bold text-base px-2.5">
                      {hotel.review_score.toFixed(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {hotel.review_score >= 9 ? 'Exceptional' : hotel.review_score >= 8 ? 'Excellent' : 'Very Good'}
                    </span>
                  </div>
                )}
              </div>

              {/* Hotel Themes - With Icons */}
              {hotel.themes && hotel.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[...new Set(hotel.themes.map(t => t.toLowerCase()))].slice(0, 3).map((themeLower, idx) => {
                    const theme = hotel.themes.find(t => t.toLowerCase() === themeLower) || themeLower;
                    const style = getThemeStyle(theme);
                    const IconComponent = style.icon;
                    return (
                      <Badge key={`theme-${idx}`} variant="outline" className={`text-xs ${style.bg} font-medium`}>
                        <IconComponent className="w-3 h-3 mr-1" />
                        {theme}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[...new Set(hotel.amenities?.map(a => a.toLowerCase()))].slice(0, 4).map((amenityLower, idx) => {
                  const amenity = hotel.amenities?.find(a => a.toLowerCase() === amenityLower) || amenityLower;
                  return (
                    <span key={`${amenity}-${idx}`} className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                      {amenity}
                    </span>
                  );
                })}
                {hotel.amenities?.length > 4 && (
                  <span className="text-xs text-primary font-medium px-2 py-1">
                    +{hotel.amenities.length - 4} more
                  </span>
                )}
              </div>

              {/* Distances */}
              {hotel.distances && hotel.distances.length > 0 && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {hotel.distances.slice(0, 2).map((dist, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      {dist.name || dist.type}: {dist.distance || dist.value}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex items-end justify-between pt-4 mt-4 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{nights} night{nights !== 1 ? 's' : ''}, {guests.adults} guest{guests.adults !== 1 ? 's' : ''}</p>
                
                {/* Price Comparison Badge */}
                {hotel.price_comparison?.show_comparison && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold">
                        <Check className="w-3 h-3 mr-1" />
                        PRICE CHECK
                      </Badge>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-help" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="max-w-xs p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-start gap-2">
                              <Badge className="bg-primary/100 text-white text-xs font-bold shrink-0">TIP</Badge>
                              <p className="text-sm">Other platforms show price per person per night instead of the total price per night for this booking</p>
                            </div>
                            <PopoverClose asChild>
                              <button className="text-muted-foreground hover:text-foreground shrink-0">
                                <X className="w-4 h-4" />
                              </button>
                            </PopoverClose>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-xs text-primary font-medium">
                      Save €{hotel.price_comparison.savings_amount?.toFixed(0)} vs other platforms <span className="line-through text-primary">€{hotel.price_comparison.ota_estimated_price?.toFixed(0)}</span>
                    </p>
                  </div>
                )}
                
                <div>
                  <div className="flex items-baseline gap-2">
                    {/* Only show crossed out price here if NO comparison (for pass holders) */}
                    {validPass && !hotel.price_comparison?.show_comparison && (
                      <span className="text-sm text-muted-foreground line-through">€{pricing.priceBeforeDiscount.toFixed(0)}</span>
                    )}
                    {/* Use comparison price if available, otherwise use calculated pricing */}
                    <span className="text-2xl font-bold text-primary">
                      €{hotel.price_comparison?.show_comparison 
                        ? hotel.price_comparison.freestays_price?.toFixed(0) 
                        : pricing.roomTotal.toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground">per night</span>
                  </div>
                  {!validPass && (
                    <p className="text-xs text-muted-foreground">+ €{BOOKING_FEE} booking fee</p>
                  )}
                </div>
              </div>

              <Button 
                className="rounded-full px-6 h-11 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                onClick={() => navigate(`/hotel/${hotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests.adults}&children=${guests.children}`)}
              >
                View Deal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ==================== HOTEL DETAIL PAGE ====================
const HotelDetailPage = () => {
  const { t } = useTranslation();
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, hasValidPass } = useAuth();
  
  const checkIn = searchParams.get('checkIn') || format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const checkOut = searchParams.get('checkOut') || format(addDays(new Date(), 10), 'yyyy-MM-dd');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const b2c = parseInt(searchParams.get('b2c') || '0');  // 1 for last minute deals
  
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  const validPass = hasValidPass?.() || false;

  const { data: hotel, isLoading } = useQuery({
    queryKey: ['hotel', hotelId, checkIn, checkOut, adults, children, b2c],
    queryFn: async () => {
      const response = await axios.get(`${API}/hotels/${hotelId}`, {
        params: {
          check_in: checkIn,
          check_out: checkOut,
          adults: adults,
          children: children,
          b2c: b2c  // Pass b2c flag for last minute availability
        }
      });
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-2xl mb-4">{t('common.error', 'Hotel not found')}</h2>
          <Button onClick={() => navigate('/search')}>{t('common.back', 'Back to Search')}</Button>
        </div>
      </div>
    );
  }

  const handleBookRoom = (room) => {
    const nettPrice = room.price * nights;
    navigate(`/booking/new?hotelId=${hotelId}&roomId=${room.room_id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}&price=${nettPrice}&roomType=${encodeURIComponent(room.room_type)}&boardType=${encodeURIComponent(room.board_type || 'Room Only')}&sunhotelsRoomTypeId=${room.sunhotels_room_type_id || ''}&sunhotelsBlockId=${room.sunhotels_block_id || ''}`);
  };

  return (
    <div className="min-h-screen pt-20" data-testid="hotel-detail-page">
      <div className="relative h-[40vh] md:h-[50vh]">
        <img 
          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'} 
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < hotel.star_rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'}`} />
              ))}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-white font-semibold mb-2">{hotel.name}</h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-5 h-5" />
              <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {hotel.review_score > 0 && (
                  <>
                    <Badge className="bg-primary text-primary-foreground text-lg px-3 py-1">
                      {hotel.review_score.toFixed(1)}
                    </Badge>
                    <div>
                      <p className="font-semibold">
                        {hotel.review_score >= 9 ? 'Exceptional' : hotel.review_score >= 8 ? 'Excellent' : 'Very Good'}
                      </p>
                      <p className="text-sm text-muted-foreground">{hotel.review_count} reviews</p>
                    </div>
                  </>
                )}
              </div>
              <p className="text-muted-foreground">{hotel.description}</p>
            </Card>

            <Card className="p-6">
              <h2 className="font-serif text-xl font-semibold mb-4">{t('hotel.facilities')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.amenities?.map(amenity => (
                  <div key={amenity} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div>
              <h2 className="font-serif text-xl font-semibold mb-4">{t('hotel.roomsAvailable', 'Available Rooms')}</h2>
              
              {/* Hotel Notes */}
              {hotel.hotel_notes && (
                <Card className="p-4 mb-4 bg-amber-50 border-amber-200">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 text-sm">{t('hotel.description', 'Hotel Information')}</p>
                      <p className="text-sm text-amber-700">{hotel.hotel_notes}</p>
                    </div>
                  </div>
                </Card>
              )}
              
              <div className="space-y-4">
                {hotel.rooms?.map(room => {
                  const pricing = calculatePricing(room.price * nights, validPass);

                  return (
                    <Card key={room.room_id} className="p-6" data-testid={`room-${room.room_id}`}>
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Room Image */}
                        {room.image_url && (
                          <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={room.image_url} 
                              alt={room.room_type}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{room.room_type}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{room.board_type}</p>
                            
                            {/* Room Amenities */}
                            {room.amenities && room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {room.amenities.slice(0, 6).map((amenity, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs font-normal">
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                Up to {room.max_occupancy} guests
                              </span>
                              
                              {/* Room Size */}
                              {room.size_m2 && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Bed className="w-4 h-4" />
                                  {room.size_m2} m²
                                </span>
                              )}
                              
                              {/* Cancellation Policy Badge */}
                              <Badge 
                                variant={room.is_refundable ? "outline" : "destructive"} 
                                className={`text-xs ${room.is_refundable ? 'border-primary text-primary bg-primary/10' : ''}`}
                              >
                                {room.is_refundable ? (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> Refundable</>
                                ) : (
                                  'Non-refundable'
                                )}
                              </Badge>
                            </div>
                            
                            {/* Room Description */}
                            {room.description && (
                              <p className="text-sm text-muted-foreground mb-2">{room.description}</p>
                            )}
                          
                          {/* Room Fees (City Tax, etc.) */}
                          {room.fees && room.fees.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-2">
                              {room.fees.map((fee, idx) => (
                                <span key={idx} className="flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  {fee.name}: €{fee.amount} {fee.included_in_price ? '(included)' : '(payable at hotel)'}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Room Notes */}
                          {room.room_notes && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                              <span className="font-medium">Note:</span> {room.room_notes}
                            </div>
                          )}

                          {/* Cancellation Policy Note */}
                          {room.is_refundable && room.cancellation_deadline_display && (
                            <div className="mt-2 p-2 bg-primary/10 rounded text-xs text-primary">
                              <span className="font-medium">Cancellation:</span> Free cancellation until {room.cancellation_deadline_display}
                            </div>
                          )}
                          
                          {/* Cancellation Policy Terms */}
                          <p className="text-xs text-muted-foreground mt-2">
                            Cancellation policy follows the policy and terms of this hotel, you need to accept this at your booking.
                          </p>
                        </div>
                        
                        <div className="text-right min-w-[140px]">
                          <div className="flex items-baseline gap-2 justify-end">
                            {validPass && (
                              <span className="text-sm text-muted-foreground line-through">€{pricing.priceBeforeDiscount.toFixed(0)}</span>
                            )}
                            <span className="text-2xl font-semibold">€{pricing.roomTotal.toFixed(0)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {nights} nights {!validPass && `+ €${BOOKING_FEE} fee`}
                          </p>
                          {validPass ? (
                            <Badge className="bg-accent text-accent-foreground mb-2">
                              <Tag className="w-3 h-3 mr-1" />
                              {t('common.save', 'Save')} €{pricing.discountAmount.toFixed(0)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="mb-2">
                              {t('common.save', 'Save')} €{pricing.potentialSavings.toFixed(0)} {t('booking.discount', 'with pass')}
                            </Badge>
                          )}
                          <Button 
                            className="w-full md:w-auto rounded-full mt-2"
                            onClick={() => handleBookRoom(room)}
                          >
                            {t('hotel.bookNow')}
                          </Button>
                        </div>
                      </div>
                    </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold mb-4">{t('booking.title', 'Your Stay')}</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('search.checkIn')}</span>
                  <span className="font-medium">{format(new Date(checkIn), 'EEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('search.checkOut')}</span>
                  <span className="font-medium">{format(new Date(checkOut), 'EEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('search.guests')}</span>
                  <span className="font-medium">{adults} {t('search.adults')}{children > 0 ? `, ${children} ${t('search.children')}` : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('search.nights', 'Nights')}</span>
                  <span className="font-medium">{nights}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {validPass ? (
                <div className="bg-accent/20 rounded-lg p-4 text-center">
                  <Crown className="w-6 h-6 mx-auto mb-2 text-accent-foreground" />
                  <p className="text-sm font-medium">{t('pass.yourPass', 'FreeStays Pass Active')}</p>
                  <p className="text-xs text-muted-foreground">{t('booking.noBookingFee', 'No booking fee')}</p>
                </div>
              ) : (
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-sm font-medium mb-2">Get your FreeStays Benefits With the</p>
                  <p className="text-xs text-muted-foreground">€35 {t('pass.oneTimePass')} or €129 {t('pass.annualPass')}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== BOOKING PAGE ====================
const BookingPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, hasValidPass } = useAuth();
  
  const hotelId = searchParams.get('hotelId');
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const nettPrice = parseFloat(searchParams.get('price') || '0');
  const roomType = decodeURIComponent(searchParams.get('roomType') || '');
  const boardType = decodeURIComponent(searchParams.get('boardType') || '');
  const sunhotelsRoomTypeId = searchParams.get('sunhotelsRoomTypeId') || '';
  const sunhotelsBlockId = searchParams.get('sunhotelsBlockId') || '';
  const initialPassPurchase = searchParams.get('passPurchase'); // 'one_time' or 'annual'
  
  // Check if this is a pass-only purchase (no hotel booking)
  const isPassOnlyPurchase = !hotelId && initialPassPurchase;
  
  const nights = (checkIn && checkOut) ? differenceInDays(new Date(checkOut), new Date(checkIn)) : 0;
  const validPass = hasValidPass?.() || false;
  const referralDiscount = user?.referral_discount || 0;

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    specialRequests: ''
  });

  const [existingPassCode, setExistingPassCode] = useState('');
  const [passCodeValid, setPassCodeValid] = useState(false);
  const [passCodeChecking, setPassCodeChecking] = useState(false);
  const [passPurchaseType, setPassPurchaseType] = useState(initialPassPurchase || null); // null, 'one_time', 'annual'
  const [loading, setLoading] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);

  // Calculate pricing based on pass status and referral discount
  const hasDiscount = validPass || passCodeValid || passPurchaseType;
  const pricing = calculatePricing(nettPrice, validPass || passCodeValid, passPurchaseType, referralDiscount);

  const { data: hotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: async () => {
      const response = await axios.get(`${API}/hotels/${hotelId}`);
      return response.data;
    },
    enabled: !!hotelId && !isPassOnlyPurchase
  });

  const room = hotel?.rooms?.find(r => r.room_id === roomId);
  
  // Determine if this is a package board type (must come after room is defined)
  const isPackage = isPackageBoard(boardType || room?.board_type);
  const currentBoardType = boardType || room?.board_type || 'Room Only';

  // Show popup when discount is applied
  useEffect(() => {
    if (hasDiscount && pricing.discountAmount > 0) {
      setShowDiscountPopup(true);
    }
  }, [hasDiscount, pricing.discountAmount]);

  const validatePassCode = async () => {
    if (!existingPassCode || existingPassCode.length < 4) return;
    
    setPassCodeChecking(true);
    try {
      const response = await axios.post(`${API}/pass-code/validate`, {
        pass_code: existingPassCode
      });
      
      if (response.data.valid && response.data.has_discount) {
        setPassCodeValid(true);
        setPassPurchaseType(null); // Don't need to buy pass if valid code
        toast.success(response.data.message);
      } else {
        setPassCodeValid(false);
        toast.error(response.data.message || "Invalid pass code");
      }
    } catch (error) {
      setPassCodeValid(false);
      toast.error("Could not validate pass code");
    } finally {
      setPassCodeChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingResponse = await axios.post(`${API}/bookings`, {
        hotel_id: hotelId,
        room_id: roomId,
        hotel_name: hotel?.name,
        room_type: roomType || room?.room_type,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children,
        guest_first_name: formData.firstName,
        guest_last_name: formData.lastName,
        guest_email: formData.email,
        guest_phone: formData.phone,
        special_requests: formData.specialRequests,
        total_price: nettPrice,
        currency: 'EUR',
        pass_code: passCodeValid ? existingPassCode : (validPass ? user?.pass_code : null),
        pass_purchase_type: passPurchaseType,
        board_type: currentBoardType,
        sunhotels_room_type_id: sunhotelsRoomTypeId,
        sunhotels_block_id: sunhotelsBlockId,
        use_referral_discount: referralDiscount > 0
      }, {
        headers: user ? { Authorization: `Bearer ${localStorage.getItem('freestays_token')}` } : {}
      });

      const paymentResponse = await axios.post(`${API}/payments/create-checkout`, {
        booking_id: bookingResponse.data.booking_id,
        amount: bookingResponse.data.final_price,
        currency: 'EUR'
      });

      window.location.href = paymentResponse.data.url;

    } catch (error) {
      toast.error(error.response?.data?.detail || "Booking failed. Please try again.");
      setLoading(false);
    }
  };

  // Handle pass-only purchase
  const handlePassOnlyPurchase = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/payments/purchase-pass`, {
        pass_type: passPurchaseType,
        user_email: user?.email || formData.email
      }, {
        headers: user ? { Authorization: `Bearer ${localStorage.getItem('freestays_token')}` } : {}
      });
      
      // Redirect to Stripe hosted checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error("Failed to create checkout session. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Purchase failed. Please try again.");
      setLoading(false);
    }
  };

  // If pass-only purchase and no hotel, show pass purchase UI
  if (isPassOnlyPurchase) {
    const passPrice = passPurchaseType === 'annual' ? 129 : 35;
    const passName = passPurchaseType === 'annual' ? 'Annual Pass' : 'One-Time Pass';
    
    return (
      <div className="min-h-screen pt-24 pb-20">
        <Header />
        <div className="max-w-2xl mx-auto px-4">
          <Card className="rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10" />
              </div>
              <h1 className="font-serif text-3xl font-bold mb-2">Purchase {passName}</h1>
              <p className="text-primary-foreground/80">Get 15% discount on all your hotel bookings</p>
            </div>
            
            <div className="p-8">
              <div className="bg-secondary/30 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">{passName}</span>
                  <span className="text-2xl font-bold text-primary">€{passPrice}</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    15% discount on hotel room costs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    No booking fees
                  </li>
                  {passPurchaseType === 'annual' ? (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Valid for 1 year with unlimited bookings
                    </li>
                  ) : (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Valid for your next booking
                    </li>
                  )}
                </ul>
              </div>
              
              {!user && (
                <div className="mb-6">
                  <Label className="text-sm font-medium">Your Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter your email"
                    className="h-12 rounded-xl mt-1.5"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your pass code will be sent to this email</p>
                </div>
              )}
              
              <Button
                onClick={handlePassOnlyPurchase}
                disabled={loading || (!user && !formData.email)}
                className="w-full h-14 rounded-xl text-lg font-semibold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                Pay €{passPrice} Now
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Secure payment powered by Stripe
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Discount message based on board type
  const DiscountMessage = () => {
    if (!hasDiscount || pricing.discountAmount <= 0) return null;
    
    if (isPackage) {
      return (
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-serif text-2xl font-semibold mb-2 text-primary">
            Your room is for FREE!
          </h3>
          <p className="text-primary font-medium mb-2">That's FreeStays!</p>
          <p className="text-muted-foreground">
            With {currentBoardType}, your discount of <strong>€{pricing.discountAmount.toFixed(2)}</strong> covers the room cost!
          </p>
        </div>
      );
    }
    
    return (
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
          <Tag className="w-10 h-10 text-white" />
        </div>
        <h3 className="font-serif text-2xl font-semibold mb-2 text-amber-700">
          Your discount is €{pricing.discountAmount.toFixed(2)}
        </h3>
        <p className="text-muted-foreground">
          FreeStays discount on your {currentBoardType} booking
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-secondary/30 to-background" data-testid="booking-page">
      {/* Discount Popup */}
      <Dialog open={showDiscountPopup} onOpenChange={setShowDiscountPopup}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center font-serif text-xl">
              {isPackage ? 'Amazing Deal!' : 'Great Savings!'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <DiscountMessage />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDiscountPopup(false)} className="w-full rounded-full h-12 font-semibold">
              Continue Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</div>
            <span className="text-sm font-medium hidden sm:inline">Select Room</span>
          </div>
          <div className="w-8 sm:w-16 h-0.5 bg-primary" />
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</div>
            <span className="text-sm font-medium hidden sm:inline">{t('booking.guestDetails')}</span>
          </div>
          <div className="w-8 sm:w-16 h-0.5 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-sm font-semibold">3</div>
            <span className="text-sm font-medium hidden sm:inline">{t('booking.payNow', 'Payment')}</span>
          </div>
        </div>

        <h1 className="font-serif text-3xl font-semibold mb-2 text-center animate-fadeInUp">{t('booking.title')}</h1>
        <p className="text-muted-foreground text-center mb-8 animate-fadeInUp stagger-1">{t('booking.confirmationEmail', "You're almost there!")}</p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 animate-fadeInUp stagger-2">
            <form onSubmit={handleSubmit}>
              <Card className="p-6 mb-6 rounded-2xl border-0 shadow-lg">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t('booking.guestDetails')}
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t('booking.firstName')}</Label>
                    <Input 
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      required
                      className="h-12 rounded-xl mt-1.5"
                      data-testid="input-firstname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t('booking.lastName')}</Label>
                    <Input 
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      required
                      data-testid="input-lastname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('booking.email')}</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      data-testid="input-booking-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('booking.phone')}</Label>
                    <Input 
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="specialRequests">{t('booking.specialRequests')} ({t('booking.optional')})</Label>
                  <Textarea 
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                    placeholder={t('booking.specialRequests', 'Any special requests for the hotel...')}
                  />
                </div>
              </Card>

              {/* Pass Code / Pass Purchase Section */}
              {!validPass && (
                <Card className="p-6 mb-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-accent-foreground" />
                    FreeStays Pass - Save 15%
                  </h2>

                  {/* Existing Pass Code */}
                  <div className="mb-6">
                    <Label className="mb-2 block">Have a pass code?</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter pass code (e.g., GOLD-XXXXXXXX)"
                        value={existingPassCode}
                        onChange={(e) => {
                          setExistingPassCode(e.target.value.toUpperCase());
                          setPassCodeValid(false);
                        }}
                        disabled={passPurchaseType !== null}
                        data-testid="input-passcode"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={validatePassCode}
                        disabled={passCodeChecking || existingPassCode.length < 4 || passPurchaseType !== null}
                      >
                        {passCodeChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {passCodeValid && (
                      <p className="text-sm text-primary mt-2 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Pass code applied! Your Freestays advantages are active.
                      </p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Buy Pass Options */}
                  <div>
                    <Label className="mb-3 block">Or buy a FreeStays Pass now:</Label>
                    <RadioGroup 
                      value={passPurchaseType || ''} 
                      onValueChange={(val) => {
                        setPassPurchaseType(val || null);
                        if (val) {
                          setExistingPassCode('');
                          setPassCodeValid(false);
                        }
                      }}
                      disabled={passCodeValid}
                    >
                      <div className="space-y-3">
                        <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${passPurchaseType === 'one_time' ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                          <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">One-Time Pass</span>
                              <span className="font-semibold">€{PASS_ONE_TIME_PRICE}</span>
                            </div>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary shrink-0" />
                                Book worldwide at any hotel
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary shrink-0" />
                                Single use during this booking
                              </li>
                              <li className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-primary font-medium">No €15,00 booking costs (one time welcome gift)</span>
                              </li>
                            </ul>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${passPurchaseType === 'annual' ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                          <RadioGroupItem value="annual" id="annual" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Annual Pass</span>
                                <Badge className="bg-accent text-accent-foreground text-xs">Best Value</Badge>
                              </div>
                              <span className="font-semibold">€{PASS_ANNUAL_PRICE}</span>
                            </div>
                            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary shrink-0" />
                                Book worldwide at any hotel
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-primary shrink-0" />
                                Unlimited use during 12 months
                              </li>
                              <li className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-primary font-medium">No €15,00 booking costs (one time welcome gift)</span>
                              </li>
                            </ul>
                          </div>
                        </label>

                        <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${passPurchaseType === null && !passCodeValid ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                          <RadioGroupItem value="" id="none" className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">No Pass</span>
                              <span className="font-semibold">€{BOOKING_FEE} fee</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Standard booking with €15 booking fee.</p>
                          </div>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>
                </Card>
              )}

              <Card className="p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Secure Payment</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to Stripe for secure payment. <strong>No booking is made with the hotel until payment is confirmed.</strong>
                </p>
              </Card>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full rounded-full"
                disabled={loading}
                data-testid="submit-booking"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-5 h-5 mr-2" />
                )}
                Pay €{pricing.finalTotal.toFixed(2)}
              </Button>
            </form>
          </div>

          {/* Summary */}
          <div>
            <Card className="p-6 sticky top-24">
              <div className="flex gap-4 mb-4">
                <img 
                  src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'} 
                  alt={hotel.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">{hotel.name}</h3>
                  <p className="text-sm text-muted-foreground">{hotel.city}, {hotel.country}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: Math.floor(hotel.star_rating) }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room</span>
                  <span>{roomType || room?.room_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mealplan</span>
                  <span>{currentBoardType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span>{format(new Date(checkIn), 'EEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('search.checkOut')}</span>
                  <span>{format(new Date(checkOut), 'EEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('search.guests')}</span>
                  <span>{adults} {t('search.adults')}{children > 0 ? `, ${children} ${t('search.children')}` : ''}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('booking.roomPrice')} ({nights} {t('search.nights')})</span>
                  <span>€{pricing.priceBeforeDiscount.toFixed(2)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-sm text-primary">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {t('booking.discount', 'FreeStays Discount')}
                    </span>
                    <span>-€{pricing.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {pricing.bookingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{t('booking.bookingFee')}</span>
                    <span>€{pricing.bookingFee.toFixed(2)}</span>
                  </div>
                )}
                {pricing.referralDiscountApplied && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {t('booking.referralDiscount', 'Referral Discount')}
                    </span>
                    <span>-€{BOOKING_FEE.toFixed(2)}</span>
                  </div>
                )}
                {pricing.passPrice > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>{passPurchaseType === 'annual' ? t('pass.annualPass') : t('pass.oneTimePass')}</span>
                    <span>€{pricing.passPrice.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('booking.total')}</span>
                  <span>€{pricing.finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Referral Discount Applied Banner */}
              {pricing.referralDiscountApplied && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Gift className="w-5 h-5" />
                    <p className="text-sm font-semibold">
                      {t('booking.referralApplied', 'Referral discount applied!')}
                    </p>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {t('booking.referralSaved', '€15 booking fee waived')}
                  </p>
                </div>
              )}

              {hasDiscount && (
                <div className="mt-4 bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-primary">
                    {t('common.save', 'You\'re saving')} €{pricing.discountAmount.toFixed(2)}!
                  </p>
                  {(passPurchaseType === 'one_time' || passPurchaseType === 'annual') && (
                    <p className="text-sm text-primary mt-1">
                      + €15,00 {t('booking.noBookingFee', 'no booking fee')}
                    </p>
                  )}
                </div>
              )}

              {!hasDiscount && !pricing.referralDiscountApplied && (
                <div className="mt-4 bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-amber-700">
                    Get a FreeStays Pass to save €{pricing.potentialSavings.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Change Booking Button */}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate(`/hotel/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`)}
                data-testid="change-booking-btn"
              >
                <Edit className="w-4 h-4 mr-2" />
                Change Booking
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== BOOKING SUCCESS ====================
const BookingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['payment', sessionId],
    queryFn: async () => {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
    refetchInterval: (data) => data?.payment_status === 'paid' ? false : 2000
  });

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const response = await axios.get(`${API}/bookings/${bookingId}`);
      return response.data;
    },
    enabled: !!bookingId && paymentStatus?.payment_status === 'paid'
  });

  if (isLoading || paymentStatus?.payment_status !== 'paid') {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl mb-2">Processing Payment...</h2>
          <p className="text-muted-foreground">Please wait while we confirm your booking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" data-testid="booking-success">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="font-serif text-3xl font-semibold mb-4">Booking Confirmed!</h1>
        <p className="text-muted-foreground mb-8">
          Your booking has been confirmed. A confirmation email has been sent to your email address.
        </p>

        <Card className="p-6 mb-8 text-left">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Booking Reference</span>
              <Badge variant="outline" className="font-mono">{bookingId}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold">€{(paymentStatus.amount_total || 0).toFixed(2)}</span>
            </div>
            {booking?.confirmation_number && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Confirmation #</span>
                <Badge className="font-mono">{booking.confirmation_number}</Badge>
              </div>
            )}
            {booking?.new_pass_code && (
              <>
                <Separator />
                <div className="bg-accent/20 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Your New FreeStays Pass Code:
                  </p>
                  <p className="font-mono text-lg font-semibold">{booking.new_pass_code}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {booking.pass_purchase_type === 'annual' ? 'Valid for 1 year' : 'Used for this booking'}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/dashboard')} className="rounded-full" data-testid="view-bookings-btn">
            View My Bookings
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="rounded-full">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==================== PASS PURCHASE SUCCESS ====================
const PassSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const sessionId = searchParams.get('session_id');
  const purchaseId = searchParams.get('purchase_id');
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);
  const maxRetries = 10; // Max 10 retries (20 seconds total)

  const { data: passData, isLoading, isError } = useQuery({
    queryKey: ['pass-verify', sessionId, retryCount],
    queryFn: async () => {
      const response = await axios.get(`${API}/pass/verify/${sessionId}`, {
        headers: localStorage.getItem('freestays_token') 
          ? { Authorization: `Bearer ${localStorage.getItem('freestays_token')}` } 
          : {}
      });
      return response.data;
    },
    enabled: !!sessionId && retryCount < maxRetries,
    retry: false,
    onError: (err) => {
      console.error("Verification error:", err);
      if (retryCount < maxRetries) {
        setTimeout(() => setRetryCount(r => r + 1), 2000);
      } else {
        setError("Unable to verify payment. Please check your dashboard or contact support.");
      }
    }
  });

  // Retry if payment not yet completed
  useEffect(() => {
    if (passData && !passData.success && retryCount < maxRetries) {
      const timer = setTimeout(() => setRetryCount(r => r + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [passData, retryCount]);

  useEffect(() => {
    if (passData?.success) {
      // Refresh user data to get updated pass info
      checkAuth();
    }
  }, [passData?.success, checkAuth]);

  // Show error after max retries
  if (error || (retryCount >= maxRetries && !passData?.success)) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <Header />
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="font-serif text-3xl font-semibold mb-4">Payment Processing</h1>
          <p className="text-muted-foreground mb-8">
            Your payment is being processed. This may take a few moments. 
            If you've completed payment, your pass will be activated shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/dashboard')} className="rounded-full">
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="rounded-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !passData?.success) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl mb-2">Processing Your Purchase...</h2>
          <p className="text-muted-foreground">Please wait while we activate your pass</p>
          <p className="text-xs text-muted-foreground mt-4">Attempt {retryCount + 1} of {maxRetries}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" data-testid="pass-success">
      <Header />
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
          <Crown className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="font-serif text-3xl font-semibold mb-4">Welcome to FreeStays!</h1>
        <p className="text-muted-foreground mb-8">
          {passData.message}
        </p>

        <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Pass Code</p>
              <p className="font-mono text-2xl font-bold text-primary tracking-wider">{passData.pass_code}</p>
            </div>
            <Separator />
            <div className="flex items-center justify-center gap-2 text-sm">
              <Badge className={passData.pass_type === 'annual' ? 'bg-accent' : 'bg-primary'}>
                {passData.pass_type === 'annual' ? 'Annual Pass' : 'One-Time Pass'}
              </Badge>
              {passData.pass_type === 'annual' && (
                <span className="text-muted-foreground">Valid for 1 year</span>
              )}
            </div>
          </div>
        </Card>

        <div className="bg-secondary/30 rounded-xl p-4 mb-8 text-left">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            What You Get
          </h3>
          {passData.pass_type === 'annual' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Unlimited free rooms for a whole year. For frequent travelers.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="font-semibold text-primary">Unlimited FREE rooms</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Only pay for meals (HB/FB/AI)</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Perfect for a single trip. Get your room free on your next booking.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="font-semibold text-primary">Room price = FREE</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Only pay for meals (HB/FB/AI)</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/')} className="rounded-full" data-testid="start-booking-btn">
            <Search className="w-4 h-4 mr-2" />
            Start Booking Hotels
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-full">
            View Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==================== EMBEDDED CHECKOUT PAGE ====================
const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkoutType = searchParams.get('type'); // 'pass' or 'booking'
  const passType = searchParams.get('pass_type');
  
  // Decode client secret (it may be URL encoded)
  const rawClientSecret = searchParams.get('client_secret');
  const clientSecret = rawClientSecret ? decodeURIComponent(rawClientSecret) : null;
  
  const [publishableKey, setPublishableKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Stripe publishable key on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${API}/payments/config`);
        const key = response.data.publishable_key;
        if (key) {
          setPublishableKey(key);
        } else {
          setError("Payment configuration not found. Please contact support.");
        }
      } catch (err) {
        console.error("Failed to load payment config:", err);
        setError("Failed to load payment configuration.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Create stripe promise only once when we have the key
  const stripePromise = useMemo(() => {
    if (publishableKey) {
      return loadStripe(publishableKey);
    }
    return null;
  }, [publishableKey]);

  // Options for embedded checkout - use fetchClientSecret callback
  const options = useMemo(() => ({
    fetchClientSecret: () => Promise.resolve(clientSecret)
  }), [clientSecret]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Invalid Checkout Session</h1>
          <p className="text-muted-foreground mb-6">The checkout session is invalid or has expired.</p>
          <Button onClick={() => navigate('/dashboard')} className="rounded-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !stripePromise) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Header />
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Payment Error</h1>
          <p className="text-muted-foreground mb-6">{error || "Unable to initialize payment. Please try again."}</p>
          <Button onClick={() => navigate(-1)} className="rounded-full">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    if (checkoutType === 'pass') {
      return passType === 'annual' ? 'Annual Pass Checkout' : 'One-Time Pass Checkout';
    }
    return 'Complete Your Booking';
  };

  const getSubtitle = () => {
    if (checkoutType === 'pass') {
      return passType === 'annual' 
        ? 'Get 15% discount on unlimited bookings for 1 year'
        : 'Get 15% discount on your next booking';
    }
    return 'Secure your hotel reservation';
  };

  return (
    <div className="min-h-screen bg-secondary/30 pt-24 pb-16" data-testid="checkout-page">
      <Header />
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold mb-2">{getTitle()}</h1>
          <p className="text-muted-foreground">{getSubtitle()}</p>
        </div>

        {/* Embedded Checkout */}
        <Card className="rounded-3xl overflow-hidden shadow-xl">
          <CardContent className="p-0">
            <div id="checkout-container" className="min-h-[500px]">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={options}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </CardContent>
        </Card>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>Secure payment powered by Stripe</span>
        </div>

        {/* Cancel Link */}
        <div className="text-center mt-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel and go back
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==================== LAST MINUTE PAGE ====================
const LastMinutePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasValidPass } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['lastMinuteAll'],
    queryFn: async () => {
      const response = await axios.get(`${API}/hotels/last-minute`);
      return response.data;
    }
  });

  const hotels = data?.hotels || [];
  // Use dates from API response or fallback to calculated dates
  const checkIn = data?.check_in || format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const checkOut = data?.check_out || format(addDays(new Date(), 3), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen pt-24 pb-16" data-testid="lastminute-page">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-red-500 text-white px-4 py-1.5">
            <Zap className="w-4 h-4 mr-2" />
            {t('lastMinute.limitedOffers')}
          </Badge>
          <h1 className="font-serif text-4xl font-semibold mb-4">{t('lastMinute.title')}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('lastMinute.subtitle')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('lastMinute.travelDates')}: {format(new Date(checkIn), 'MMM d, yyyy')} - {format(new Date(checkOut), 'MMM d, yyyy')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-4 w-24 skeleton rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold mb-2">{t('lastMinute.noDeals')}</h3>
            <p className="text-muted-foreground mb-6">{t('lastMinute.checkBack')}</p>
            <Button onClick={() => navigate('/')}>{t('common.back')}</Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {hotels.map(hotel => {
              const pricing = calculatePricing(hotel.min_price * 2, hasValidPass?.() || false);
              
              return (
                <Card key={hotel.hotel_id} className="overflow-hidden card-hover group">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
                      alt={hotel.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      {t('header.lastMinute')}
                    </Badge>
                    <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                      {t('lastMinute.save30')}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: Math.floor(hotel.star_rating) }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <h3 className="font-semibold text-lg truncate">{hotel.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{hotel.city}, {hotel.country}</p>
                    
                    {hotel.review_score > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {hotel.review_score.toFixed(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{hotel.review_count} reviews</span>
                      </div>
                    )}

                    <div className="flex items-end justify-between pt-3 border-t">
                      <div>
                        <span className="text-2xl font-semibold">€{pricing.roomTotal.toFixed(0)}</span>
                        <span className="text-sm text-muted-foreground">/2 nights</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="rounded-full"
                        onClick={() => navigate(`/hotel/${hotel.hotel_id}?checkIn=${hotel.last_minute_check_in || checkIn}&checkOut=${hotel.last_minute_check_out || checkOut}&adults=2&children=0&b2c=1`)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== BOOKING DETAILS DIALOG ====================
const BookingDetailsDialog = ({ booking, open, onOpenChange }) => {
  const { t } = useTranslation();
  
  if (!booking) return null;
  
  const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in));
  const isPast = new Date(booking.check_in) < new Date();
  const isUpcoming = new Date(booking.check_in) >= new Date();
  const canRequestCancellation = isUpcoming && booking.status === 'confirmed';
  
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Booking Confirmation - ${booking.hotel_name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #1e3a5f; }
            .slogan { font-size: 14px; color: #666; margin-top: 5px; }
            .title { font-size: 24px; color: #1e3a5f; margin: 20px 0; }
            .reference { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
            .reference-code { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1e3a5f; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: 600; color: #1e3a5f; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
            .detail-label { color: #666; }
            .detail-value { font-weight: 500; }
            .total { font-size: 20px; font-weight: bold; color: #059669; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">FreeStays</div>
            <div class="slogan">Commission-free bookings - Your room is FREE!</div>
          </div>
          <div class="title">Booking Confirmation</div>
          <div class="reference">
            <div style="color: #666; font-size: 12px;">Booking Reference</div>
            <div class="reference-code">${booking.booking_id}</div>
            ${booking.sunhotels_booking_id ? `<div style="margin-top: 8px; font-size: 12px; color: #666;">Sunhotels Ref: ${booking.sunhotels_booking_id}</div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Hotel Details</div>
            <div class="detail-row"><span class="detail-label">Hotel</span><span class="detail-value">${booking.hotel_name}</span></div>
            <div class="detail-row"><span class="detail-label">Room Type</span><span class="detail-value">${booking.room_type}</span></div>
            <div class="detail-row"><span class="detail-label">Board Type</span><span class="detail-value">${booking.board_type || 'Room Only'}</span></div>
            <div class="detail-row"><span class="detail-label">Check-in</span><span class="detail-value">${format(new Date(booking.check_in), 'EEEE, MMMM d, yyyy')}</span></div>
            <div class="detail-row"><span class="detail-label">Check-out</span><span class="detail-value">${format(new Date(booking.check_out), 'EEEE, MMMM d, yyyy')}</span></div>
            <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">${nights} night${nights !== 1 ? 's' : ''}</span></div>
            <div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">${booking.adults} Adult${booking.adults !== 1 ? 's' : ''}${booking.children > 0 ? `, ${booking.children} Child${booking.children !== 1 ? 'ren' : ''}` : ''}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Guest Details</div>
            <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${booking.guest_first_name} ${booking.guest_last_name}</span></div>
            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${booking.guest_email}</span></div>
            <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${booking.guest_phone}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Payment Summary</div>
            <div class="detail-row"><span class="detail-label">Total Paid</span><span class="detail-value total">€${booking.final_price?.toFixed(2)}</span></div>
            ${booking.discount_amount > 0 ? `<div class="detail-row"><span class="detail-label">You Saved</span><span class="detail-value" style="color: #059669;">€${booking.discount_amount.toFixed(2)}</span></div>` : ''}
          </div>
          
          ${booking.special_requests ? `
          <div class="section">
            <div class="section-title">Special Requests</div>
            <p>${booking.special_requests}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>FreeStays - Van Haersoltelaan 19, Barneveld, Netherlands</p>
            <p>info@freestays.eu | www.freestays.eu</p>
            <p>Thank you for booking with FreeStays!</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };
  
  const handleRequestCancellation = async () => {
    try {
      const response = await axios.post(`${API}/bookings/${booking.booking_id}/cancellation-request`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('freestays_token')}` }
      });
      toast.success("Cancellation request submitted. We'll contact you shortly.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit cancellation request");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Booking Details
          </DialogTitle>
          <DialogDescription>
            {isPast ? 'Past stay' : 'Upcoming stay'} at {booking.hotel_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl flex items-center justify-between ${
            booking.status === 'confirmed' 
              ? 'bg-primary/10 border border-primary/20' 
              : booking.status === 'cancelled'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {booking.status === 'confirmed' ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              ) : booking.status === 'cancelled' ? (
                <XCircle className="w-6 h-6 text-red-500" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className="font-semibold capitalize">{booking.status}</p>
                <p className="text-sm text-muted-foreground">Ref: {booking.booking_id}</p>
              </div>
            </div>
            {isUpcoming && (
              <Badge className="bg-accent text-accent-foreground">
                {differenceInDays(new Date(booking.check_in), new Date())} days away
              </Badge>
            )}
          </div>
          
          {/* Hotel Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Hotel Information
            </h3>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-lg">{booking.hotel_name}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Room Type</p>
                  <p className="font-medium">{booking.room_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Board Type</p>
                  <p className="font-medium">{booking.board_type || 'Room Only'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dates & Guests */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">Check-in</p>
              <p className="font-semibold">{format(new Date(booking.check_in), 'EEE, MMM d, yyyy')}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">Check-out</p>
              <p className="font-semibold">{format(new Date(booking.check_out), 'EEE, MMM d, yyyy')}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">Duration</p>
              <p className="font-semibold">{nights} Night{nights !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-muted-foreground text-sm mb-1">Guests</p>
              <p className="font-semibold">
                {booking.adults} Adult{booking.adults !== 1 ? 's' : ''}
                {booking.children > 0 && `, ${booking.children} Child${booking.children !== 1 ? 'ren' : ''}`}
              </p>
            </div>
          </div>
          
          {/* Guest Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Guest Details
            </h3>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{booking.guest_first_name} {booking.guest_last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{booking.guest_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{booking.guest_phone}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              Payment Summary
            </h3>
            <div className="bg-primary/5 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-bold text-xl text-primary">€{booking.final_price?.toFixed(2)}</span>
              </div>
              {booking.discount_amount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">You Saved</span>
                  <span className="font-semibold text-accent">€{booking.discount_amount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Special Requests */}
          {booking.special_requests && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Special Requests
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm">{booking.special_requests}</p>
              </div>
            </div>
          )}
          
          {/* Sunhotels Reference */}
          {booking.sunhotels_booking_id && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              Sunhotels Reference: {booking.sunhotels_booking_id}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {canRequestCancellation && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <CalendarX className="w-4 h-4 mr-2" />
                  Request Cancellation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Request Cancellation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to request cancellation for this booking? Our team will review your request and contact you regarding the cancellation policy and any applicable refunds.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRequestCancellation} className="bg-red-600 hover:bg-red-700">
                    Submit Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print / Download
          </Button>
          {booking.voucher_url && (
            <Button variant="outline" onClick={() => window.open(booking.voucher_url, '_blank')}>
              <FileText className="w-4 h-4 mr-2" />
              View Voucher
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== DASHBOARD ====================
const DashboardPage = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'bookings';
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await axios.get(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('freestays_token')}` },
        withCredentials: true
      });
      return response.data;
    },
    enabled: !!user
  });

  const { data: favoritesData, isLoading: favoritesLoading, refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user && !!token
  });

  const { data: comparisonsData, isLoading: comparisonsLoading } = useQuery({
    queryKey: ['user-comparisons'],
    queryFn: async () => {
      const response = await axios.get(`${API}/user/price-comparisons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user && !!token
  });

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const removeFavorite = async (hotelId) => {
    try {
      await axios.delete(`${API}/favorites/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Removed from favorites");
      refetchFavorites();
    } catch (error) {
      toast.error("Failed to remove from favorites");
    }
  };

  const copyPassCode = () => {
    navigator.clipboard.writeText(user?.pass_code || '');
    toast.success("Pass code copied!");
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-b from-secondary/30 to-background">
        <Card className="p-10 text-center max-w-md rounded-3xl shadow-xl border-0 animate-fadeInUp">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-3">Please Sign In</h2>
          <p className="text-muted-foreground mb-8">Sign in to view your bookings and manage your FreeStays Pass</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-full px-8 h-12 text-base" data-testid="signin-btn">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </DialogTrigger>
            <AuthDialog />
          </Dialog>
        </Card>
      </div>
    );
  }

  const hasActivePass = user.pass_type === 'one_time' || user.pass_type === 'annual';
  const upcomingBookings = bookingsData?.bookings?.filter(b => new Date(b.check_in) >= new Date()) || [];
  const pastBookings = bookingsData?.bookings?.filter(b => new Date(b.check_in) < new Date()) || [];
  const totalSaved = bookingsData?.bookings?.reduce((acc, b) => acc + (b.discount_amount || 0), 0) || 0;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-secondary/30 to-background" data-testid="dashboard-page">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Hero Profile Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-10 mb-8 overflow-hidden shadow-xl animate-fadeInUp">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-white/30 shadow-xl">
              <AvatarImage src={user.picture} />
              <AvatarFallback className="bg-white text-primary text-3xl font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-serif text-2xl md:text-3xl font-semibold text-primary-foreground">
                  {t('dashboard.welcome', { name: user.name?.split(' ')[0] })}
                </h1>
                {hasActivePass && (
                  <Badge className="bg-accent text-accent-foreground font-semibold animate-pulse-glow">
                    <Crown className="w-3.5 h-3.5 mr-1" />
                    {user.pass_type === 'annual' ? t('pass.annualPass') : t('pass.oneTimePass')}
                  </Badge>
                )}
              </div>
              <p className="text-primary-foreground/80">{user.email}</p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 md:gap-6">
              <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-2xl md:text-3xl font-bold text-primary-foreground">{bookingsData?.bookings?.length || 0}</p>
                <p className="text-xs text-primary-foreground/70">{t('dashboard.myBookings')}</p>
              </div>
              {totalSaved > 0 && (
                <div className="text-center px-4 py-2 bg-accent/30 rounded-xl backdrop-blur-sm">
                  <p className="text-2xl md:text-3xl font-bold text-accent">€{totalSaved.toFixed(0)}</p>
                  <p className="text-xs text-primary-foreground/70">{t('dashboard.totalSaved')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="animate-fadeInUp stagger-1">
          <TabsList className="mb-8 bg-secondary/50 p-1 rounded-full flex-wrap">
            <TabsTrigger value="bookings" className="rounded-full px-6" data-testid="tab-bookings">
              <Ticket className="w-4 h-4 mr-2" />
              {t('dashboard.myBookings')}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="rounded-full px-6" data-testid="tab-favorites">
              <Heart className="w-4 h-4 mr-2" />
              {t('dashboard.favorites')}
            </TabsTrigger>
            <TabsTrigger value="comparisons" className="rounded-full px-6" data-testid="tab-comparisons">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('dashboard.myComparisons')}
            </TabsTrigger>
            <TabsTrigger value="passcode" className="rounded-full px-6" data-testid="tab-passcode">
              <Crown className="w-4 h-4 mr-2" />
              {t('dashboard.myPass')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="p-6 rounded-2xl">
                    <div className="flex gap-4">
                      <div className="w-32 h-24 skeleton rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <div className="h-6 w-48 skeleton rounded" />
                        <div className="h-4 w-32 skeleton rounded" />
                        <div className="h-4 w-64 skeleton rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : bookingsData?.bookings?.length > 0 ? (
              <div className="space-y-8">
                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                  <div>
                    <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      Upcoming Stays
                    </h2>
                    <div className="space-y-4">
                      {upcomingBookings.map((booking, idx) => (
                        <Card 
                          key={booking.booking_id} 
                          className="p-0 rounded-2xl overflow-hidden shadow-lg border-0 card-hover animate-fadeInUp"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                          data-testid={`booking-${booking.booking_id}`}
                        >
                          <div className="flex flex-col lg:flex-row">
                            {/* Image Section */}
                            <div className="lg:w-48 h-40 lg:h-auto bg-gradient-to-br from-primary/20 to-primary/5 relative flex-shrink-0">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Building2 className="w-16 h-16 text-primary/30" />
                              </div>
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-accent text-accent-foreground font-semibold shadow-lg">
                                  {differenceInDays(new Date(booking.check_in), new Date())} days
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Content Section */}
                            <div className="flex-1 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-serif text-xl font-semibold mb-1">{booking.hotel_name}</h3>
                                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                                    <Bed className="w-4 h-4" />
                                    {booking.room_type}
                                  </p>
                                </div>
                                <Badge 
                                  className={booking.status === 'confirmed' 
                                    ? 'bg-primary/20 text-primary border-primary/30' 
                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                  }
                                >
                                  {booking.status === 'confirmed' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</>
                                  ) : booking.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                <div className="bg-secondary/50 rounded-xl p-3">
                                  <p className="text-muted-foreground text-xs mb-1">Check-in</p>
                                  <p className="font-semibold">{format(new Date(booking.check_in), 'EEE, MMM d')}</p>
                                </div>
                                <div className="bg-secondary/50 rounded-xl p-3">
                                  <p className="text-muted-foreground text-xs mb-1">Check-out</p>
                                  <p className="font-semibold">{format(new Date(booking.check_out), 'EEE, MMM d')}</p>
                                </div>
                                <div className="bg-secondary/50 rounded-xl p-3">
                                  <p className="text-muted-foreground text-xs mb-1">Guests</p>
                                  <p className="font-semibold flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {booking.adults}{booking.children > 0 ? ` + ${booking.children}` : ''}
                                  </p>
                                </div>
                                <div className="bg-primary/10 rounded-xl p-3">
                                  <p className="text-muted-foreground text-xs mb-1">Total Paid</p>
                                  <p className="font-bold text-primary text-lg">€{booking.final_price?.toFixed(2)}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Ref: <span className="font-mono">{booking.booking_id?.slice(-8)}</span></span>
                                  {booking.confirmation_number && (
                                    <span>Conf: <span className="font-mono">{booking.confirmation_number}</span></span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {booking.discount_amount > 0 && (
                                    <Badge className="bg-accent/20 text-accent-foreground">
                                      <Gift className="w-3 h-3 mr-1" />
                                      Saved €{booking.discount_amount.toFixed(2)}
                                    </Badge>
                                  )}
                                  {/* Social Share Buttons */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button size="sm" variant="outline" className="rounded-full h-8 px-3">
                                        <Share2 className="w-4 h-4 mr-1" />
                                        Share
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" align="end">
                                      <p className="text-xs text-muted-foreground mb-2 px-2">Share your trip</p>
                                      <div className="space-y-1">
                                        <button 
                                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`I'm going to ${booking.hotel_name} on ${format(new Date(booking.check_in), 'MMM d, yyyy')}! Booked with FreeStays - Room was FREE! 🎉`)}`, '_blank')}
                                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-green-50 transition-colors"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                            <MessageCircle className="w-4 h-4 text-white" />
                                          </div>
                                          WhatsApp
                                        </button>
                                        <button 
                                          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(`I'm going to ${booking.hotel_name}! Booked with FreeStays - Room was FREE!`)}`, '_blank')}
                                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                            <Globe className="w-4 h-4 text-white" />
                                          </div>
                                          Facebook
                                        </button>
                                        <button 
                                          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm going to ${booking.hotel_name}! Booked with @FreeStays - Room was FREE! 🎉`)}`, '_blank')}
                                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-sky-50 transition-colors"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
                                            <Twitter className="w-4 h-4 text-white" />
                                          </div>
                                          Twitter / X
                                        </button>
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(`I'm going to ${booking.hotel_name} on ${format(new Date(booking.check_in), 'MMM d, yyyy')}! Booked with FreeStays - Room was FREE!`);
                                            toast.success("Copied to clipboard!");
                                          }}
                                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                            <Copy className="w-4 h-4 text-muted-foreground" />
                                          </div>
                                          Copy Text
                                        </button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <Button 
                                    size="sm" 
                                    className="rounded-full h-8 px-3"
                                    onClick={() => openBookingDetails(booking)}
                                    data-testid={`view-details-${booking.booking_id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                  <div>
                    <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      Past Stays
                    </h2>
                    <div className="space-y-3">
                      {pastBookings.map((booking) => (
                        <Card 
                          key={booking.booking_id} 
                          className="p-5 rounded-2xl bg-secondary/30 border-0 cursor-pointer hover:bg-secondary/50 transition-colors"
                          data-testid={`booking-past-${booking.booking_id}`}
                          onClick={() => openBookingDetails(booking)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{booking.hotel_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(booking.check_in), 'MMM d')} - {format(new Date(booking.check_out), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold">€{booking.final_price?.toFixed(2)}</p>
                                {booking.discount_amount > 0 && (
                                  <p className="text-xs text-primary">Saved €{booking.discount_amount.toFixed(2)}</p>
                                )}
                              </div>
                              <Eye className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-16 text-center rounded-3xl border-0 shadow-lg bg-gradient-to-br from-secondary/50 to-background">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Ticket className="w-12 h-12 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-3">No bookings yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Start exploring hotels and book your first FREE room stay!
                </p>
                <Button onClick={() => navigate('/search')} className="rounded-full px-8 h-12" data-testid="find-hotels-btn">
                  <Search className="w-5 h-5 mr-2" />
                  Find Hotels
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            {favoritesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="rounded-2xl overflow-hidden">
                    <div className="h-48 skeleton" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 w-3/4 skeleton rounded" />
                      <div className="h-4 w-1/2 skeleton rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : favoritesData?.favorites?.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritesData.favorites.map((fav, idx) => (
                  <Card 
                    key={fav.hotel_id} 
                    className="rounded-2xl overflow-hidden shadow-lg border-0 group card-hover animate-fadeInUp"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    data-testid={`favorite-${fav.hotel_id}`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={fav.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
                        alt={fav.hotel_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeFavorite(fav.hotel_id)}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                        data-testid={`remove-fav-${fav.hotel_id}`}
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>

                      {/* Star Rating */}
                      {fav.star_rating && (
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-0.5">
                          {Array.from({ length: Math.floor(fav.star_rating) }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}

                      {/* Price Badge */}
                      {fav.min_price && (
                        <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                          From €{fav.min_price?.toFixed(0)}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg line-clamp-1 mb-1">{fav.hotel_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                        <MapPin className="w-3.5 h-3.5" />
                        {fav.location}
                      </p>
                      <Button 
                        className="w-full rounded-full"
                        onClick={() => navigate(`/hotel/${fav.hotel_id}?adults=2&children=0`)}
                      >
                        View Hotel
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-16 text-center rounded-3xl border-0 shadow-lg bg-gradient-to-br from-secondary/50 to-background">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-red-300" />
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-3">No favorites yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Click the heart icon on any hotel to save it to your favorites!
                </p>
                <Button onClick={() => navigate('/search')} className="rounded-full px-8 h-12">
                  <Search className="w-5 h-5 mr-2" />
                  Explore Hotels
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* My Price Comparisons Tab */}
          <TabsContent value="comparisons">
            {comparisonsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6 rounded-2xl">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 skeleton rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <div className="h-6 w-48 skeleton rounded" />
                        <div className="h-4 w-32 skeleton rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : comparisonsData?.comparisons?.length > 0 ? (
              <div className="space-y-4">
                {comparisonsData.comparisons.map((comparison, idx) => (
                  <Card 
                    key={comparison.comparison_id} 
                    className="p-0 rounded-2xl overflow-hidden shadow-lg border-0 card-hover animate-fadeInUp cursor-pointer"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                    onClick={() => {
                      // Navigate to search with these parameters
                      navigate(`/search?destination=${encodeURIComponent(comparison.destination)}&destinationId=${comparison.destination_id}&checkIn=${comparison.check_in}&checkOut=${comparison.check_out}&adults=${comparison.adults || 2}&children=${comparison.children || 0}`);
                    }}
                    data-testid={`comparison-${comparison.comparison_id}`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Icon Section */}
                      <div className="md:w-24 h-24 md:h-auto bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-10 h-10 text-primary/50" />
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-serif text-lg font-semibold mb-1 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              {comparison.destination}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {comparison.check_in} → {comparison.check_out} • {comparison.guests}
                            </p>
                          </div>
                          {comparison.total_savings > 0 && (
                            <Badge className="bg-accent/20 text-accent-foreground font-semibold">
                              Save €{comparison.total_savings?.toFixed(0)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {comparison.hotels_count} {t('search.results', 'hotels found').replace('{{count}}', '')}
                          </span>
                          <span className="text-primary font-medium">
                            {comparison.hotels_with_savings} {t('dashboard.hotelsSaved', '{{count}} hotels with savings').replace('{{count}}', '')}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {t('dashboard.searchedOn')}: {new Date(comparison.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <div className="hidden md:flex items-center px-4">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-16 text-center rounded-3xl border-0 shadow-lg bg-gradient-to-br from-secondary/50 to-background">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-12 h-12 text-primary/30" />
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-3">{t('dashboard.noComparisons')}</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t('dashboard.noComparisonsDesc')}
                </p>
                <Button onClick={() => navigate('/')} className="rounded-full px-8 h-12">
                  <Search className="w-5 h-5 mr-2" />
                  {t('dashboard.searchHotels')}
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="passcode">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Pass Card */}
              <Card className={`p-8 rounded-3xl border-0 shadow-xl overflow-hidden relative ${hasActivePass ? 'bg-gradient-to-br from-primary to-primary/90' : 'bg-card'}`}>
                {hasActivePass && (
                  <>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                  </>
                )}
                
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${hasActivePass ? 'bg-white/20' : 'bg-secondary'}`}>
                    {hasActivePass ? (
                      <Crown className="w-8 h-8 text-primary-foreground" />
                    ) : (
                      <Tag className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <h2 className={`font-serif text-2xl font-semibold mb-2 ${hasActivePass ? 'text-primary-foreground' : ''}`}>
                    {hasActivePass ? 'Your FreeStays Pass' : 'Get FreeStays Pass'}
                  </h2>
                  <p className={`mb-6 ${hasActivePass ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {hasActivePass 
                      ? 'Your room is FREE on every booking!'
                      : 'Unlock free rooms and exclusive savings'}
                  </p>

                  {hasActivePass && (
                    <>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                        <p className="text-sm text-primary-foreground/70 mb-2">Your Pass Code</p>
                        <p className="font-mono text-3xl font-bold tracking-wider text-primary-foreground mb-4" data-testid="user-passcode">
                          {user.pass_code}
                        </p>
                        <Button 
                          variant="secondary" 
                          onClick={copyPassCode} 
                          className="rounded-full bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                          data-testid="copy-passcode"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-primary-foreground/70">Pass Type</span>
                        <Badge className="bg-accent text-accent-foreground">
                          {user.pass_type === 'annual' ? 'Annual Pass' : 'One-Time Pass'}
                        </Badge>
                      </div>
                      {user.pass_type === 'annual' && user.pass_expires_at && (
                        <div className="flex items-center justify-between text-sm mt-3">
                          <span className="text-primary-foreground/70">Valid Until</span>
                          <span className="text-primary-foreground font-medium">
                            {format(new Date(user.pass_expires_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {!hasActivePass && (
                    <div className="space-y-4">
                      <Card 
                        className="p-5 border-2 hover:border-primary cursor-pointer transition-all rounded-2xl group"
                        onClick={() => navigate('/booking/new?passPurchase=one_time')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold group-hover:text-primary transition-colors">One-Time Pass</p>
                            <p className="text-sm text-muted-foreground">FREE room on your next booking</p>
                          </div>
                          <span className="text-2xl font-bold text-primary">€35</span>
                        </div>
                      </Card>
                      <Card 
                        className="p-5 border-2 border-primary bg-primary/5 cursor-pointer transition-all rounded-2xl group"
                        onClick={() => navigate('/booking/new?passPurchase=annual')}
                      >
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-accent text-accent-foreground text-xs">BEST VALUE</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-primary">Annual Pass</p>
                            <p className="text-sm text-muted-foreground">Unlimited FREE rooms for 1 year</p>
                          </div>
                          <span className="text-2xl font-bold text-primary">€129</span>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </Card>

              {/* Referral Card */}
              <Card className="p-8 rounded-3xl border-0 shadow-xl bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <Gift className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold">Refer Friends & Earn</h3>
                    <p className="text-sm text-muted-foreground">Share your code and help friends save.</p>
                    <p className="text-sm text-muted-foreground">At your next booking, booking costs (€15) will be covered</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-bold text-primary tracking-wider">{user?.referral_code || 'Loading...'}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(user?.referral_code || '');
                          toast.success("Referral code copied!");
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white rounded-xl text-center">
                      <p className="text-2xl font-bold text-primary">{user?.referral_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Friends Referred</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl text-center">
                      <p className="text-2xl font-bold text-accent">€15</p>
                      <p className="text-xs text-muted-foreground">Per Referral</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 rounded-full"
                      onClick={() => {
                        const text = `Join FreeStays and get €15 off your first booking! Use my code: ${user?.referral_code}. Your room is FREE - you only pay for meals! 🏨✨`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Share on WhatsApp
                    </Button>
                    <Button 
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        const text = `Join FreeStays and get €15 off! Use my referral code: ${user?.referral_code}`;
                        navigator.clipboard.writeText(text);
                        toast.success("Share message copied!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Benefits Card */}
              <Card className="p-8 rounded-3xl border-0 shadow-xl">
                <h3 className="font-serif text-xl font-semibold mb-6">Get your FreeStays Benefits With the</h3>
                <p className="text-sm text-muted-foreground mb-6 -mt-4">€35 One-Time Pass or €129 Annual Pass</p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-accent/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Room = FREE</p>
                      <p className="text-sm text-muted-foreground">We give our commission back to you — that's your room price!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Percent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">No Booking Fee</p>
                      <p className="text-sm text-muted-foreground">Skip the €15 booking fee with your pass</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">450,000+ Hotels</p>
                      <p className="text-sm text-muted-foreground">Access to hotels worldwide with no commission</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Best Price Guarantee</p>
                      <p className="text-sm text-muted-foreground">Hotels save 30% vs Booking.com — we pass it to you</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Booking Details Dialog */}
      <BookingDetailsDialog 
        booking={selectedBooking} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
    </div>
  );
};

// ==================== ABOUT PAGE ====================
const AboutPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-20 pb-16" data-testid="about-page">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-secondary/50 to-background">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 md:px-8 relative text-center">
          <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
            <Sparkles className="w-4 h-4 mr-1" /> {t('howItWorks.badge', 'The Freestays Way')}
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6">{t('howItWorks.title', 'How Freestays Works')}</h1>
          <p className="text-xl md:text-2xl font-medium text-primary mb-4">{t('howItWorks.subtitle', 'Booking as it should be in this day and age')}</p>
          <div className="text-muted-foreground text-lg max-w-3xl mx-auto space-y-4">
            <p>{t('howItWorks.intro1', 'We live fast. We book online. We want clarity, fair prices, and real benefits.')}</p>
            <p>{t('howItWorks.intro2', 'Freestays is made for how we travel now — smart, transparent, and without unnecessary costs.')}</p>
            <p className="text-primary font-semibold text-xl mt-6">{t('howItWorks.readyCta', 'Ready to experience travel differently?')}</p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">1</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{t('howItWorks.step1.title', 'Discover Hotels Worldwide')}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t('howItWorks.step1.subtitle', 'From a weekend getaway to the trip of a lifetime.')}</p>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>{t('howItWorks.step1.text1', 'Search directly among more than 450,000 hotels worldwide, with real-time availability and current prices.')}</p>
                  <p className="font-medium text-foreground">{t('howItWorks.step1.text2', 'No waiting. No outdated info.')}</p>
                  <p>{t('howItWorks.step1.text3', 'Just see what\'s available — where and when you want.')}</p>
                </div>
                <p className="text-primary font-medium mt-4 text-sm">{t('howItWorks.step1.cta', '👉 Where will you go next?')}</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-card rounded-3xl p-8 shadow-lg border border-border/50 h-full card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">2</span>
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3">{t('howItWorks.step2.title', 'Activate Your Freestays Pass')}</h3>
                <p className="text-muted-foreground text-sm mb-4">{t('howItWorks.step2.subtitle', 'Want to book smarter than the rest?')}</p>
                <div className="text-muted-foreground text-sm space-y-3">
                  <p>{t('howItWorks.step2.text1', 'With a One-Time Pass (€35) or Annual Pass (€129), you unlock all Freestays benefits — with every booking, anywhere in the world.')}</p>
                  <ul className="space-y-2 mt-3">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {t('howItWorks.step2.benefit1', 'Activate once')}</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {t('howItWorks.step2.benefit2', 'Instant access')}</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> {t('howItWorks.step2.benefit3', 'Always save')}</li>
                  </ul>
                </div>
                <p className="text-primary font-medium mt-4 text-sm">{t('howItWorks.step2.cta', 'Why overpay when you can book fairly?')}</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-accent to-blue-400 rounded-3xl p-8 shadow-xl h-full card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full" />
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg">
                  <Gift className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-3 text-accent-foreground">{t('howItWorks.step3.title', 'Save Every Time')}</h3>
                <p className="text-accent-foreground/80 text-sm mb-4">{t('howItWorks.step3.subtitle', 'With your Freestays Pass you pay:')}</p>
                <div className="text-accent-foreground/90 text-sm space-y-3">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white" /> {t('howItWorks.step3.benefit2', 'Only one time booking costs')}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white" /> {t('howItWorks.step3.benefit3', 'Full transparency on every price')}</li>
                  </ul>
                  <p className="font-medium text-white pt-2">{t('howItWorks.step3.text1', 'No surprises afterwards.')}</p>
                  <p className="text-white/90">{t('howItWorks.step3.text2', 'No fine print.')}</p>
                  <p className="text-white/90">{t('howItWorks.step3.text3', 'Only smart choices that keep paying off.')}</p>
                </div>
                <p className="text-white font-semibold mt-4 text-sm">{t('howItWorks.step3.cta', '💡 The more you book, the more you win.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-xl border border-border/50 text-center">
            <h2 className="font-serif text-2xl md:text-4xl font-bold mb-4">{t('howItWorks.cta.title', 'This Is Not A Deal.')}</h2>
            <p className="text-xl md:text-2xl text-primary font-semibold mb-8">{t('howItWorks.cta.subtitle', 'This Is A New Way Of Traveling.')}</p>
            
            <p className="text-muted-foreground mb-6">{t('howItWorks.cta.forWho', 'Freestays is for:')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-secondary/50 rounded-xl p-4">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">{t('howItWorks.cta.persona1', 'The fast online booker')}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">{t('howItWorks.cta.persona2', 'The conscious traveler')}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <Plane className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">{t('howItWorks.cta.persona3', 'The young explorer')}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <Star className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">{t('howItWorks.cta.persona4', 'The experienced bon vivant')}</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">{t('howItWorks.cta.statement', 'For everyone who feels the old system no longer fits this era.')}</p>
            
            <div className="space-y-3">
              <p className="text-lg font-semibold">{t('howItWorks.cta.question', 'Why would you book any other way?')}</p>
              <p className="text-primary text-xl font-bold">{t('howItWorks.cta.action', 'Join us. Book fairly. Travel smarter.')}</p>
              <p className="text-3xl font-serif font-bold text-primary mt-6">{t('howItWorks.cta.welcome', 'Welcome to Freestays.')}</p>
            </div>

            <div className="mt-10">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full px-10 text-lg h-14">
                    {t('about.ctaButton', 'Create Free Account')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </DialogTrigger>
                <AuthDialog defaultTab="register" />
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ==================== REFER A FRIEND PAGE ====================
const ReferFriendPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  
  const referralCode = user?.referral_code || 'LOGIN-TO-GET-CODE';
  const referralLink = `https://freestays.eu/?ref=${referralCode}`;
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const benefits = [
    { icon: Gift, title: "Your Friend Saves", desc: "Your friend gets €15 off their booking fee when they use your referral code." },
    { icon: Euro, title: "You Earn Rewards", desc: "When your friend completes their first booking, your next booking fee (€15) is covered!" },
    { icon: Users, title: "Unlimited Referrals", desc: "There's no limit! Refer as many friends as you want and keep earning rewards." },
    { icon: Heart, title: "Share the Joy", desc: "Help your friends discover the magic of free hotel stays with FreeStays." },
  ];

  const steps = [
    { num: "1", title: "Share Your Code", desc: "Copy your unique referral code or link and share it with friends via email, social media, or messaging." },
    { num: "2", title: "Friend Signs Up", desc: "Your friend creates a FreeStays account using your referral code during registration." },
    { num: "3", title: "Friend Books", desc: "When your friend completes their first hotel booking, you both get rewarded!" },
    { num: "4", title: "You Save €15", desc: "Your next booking fee is automatically waived. It's that simple!" },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16" data-testid="refer-page">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center">
          <Badge className="mb-6 bg-accent text-accent-foreground border-0 px-6 py-2 text-sm font-bold">
            <Gift className="w-4 h-4 mr-2" />
            Earn €15 Per Referral!
          </Badge>
          
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Refer Friends,
            <span className="block text-accent">Earn Rewards!</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            Share the gift of free hotel stays with your friends and family. 
            When they book, <span className="font-bold text-accent">you both save!</span>
          </p>
        </div>
      </section>

      {/* Referral Code Box */}
      <section className="py-12 -mt-16 relative z-10">
        <div className="max-w-2xl mx-auto px-4 md:px-8">
          <Card className="p-8 rounded-3xl shadow-2xl border-0 bg-card">
            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl font-semibold mb-2">Your Referral Code</h2>
              <p className="text-muted-foreground">Share this code with friends to start earning</p>
            </div>
            
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary rounded-xl p-4 font-mono text-xl text-center font-bold tracking-wider">
                    {referralCode}
                  </div>
                  <Button 
                    size="lg"
                    className="rounded-xl h-14 px-6"
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    value={referralLink}
                    readOnly
                    className="flex-1 h-12 rounded-xl bg-secondary/50"
                  />
                  <Button 
                    variant="outline"
                    size="lg"
                    className="rounded-xl h-12 px-6"
                    onClick={() => copyToClipboard(referralLink)}
                  >
                    Copy Link
                  </Button>
                </div>
                
                <div className="flex justify-center gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => window.open(`https://wa.me/?text=Get free hotel stays with FreeStays! Use my referral code: ${referralCode} - ${referralLink}`, '_blank')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=Get free hotel stays with @FreeStays! Use my referral code: ${referralCode}&url=${referralLink}`, '_blank')}
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => window.open(`mailto:?subject=Free Hotel Stays with FreeStays!&body=Hey! I've been using FreeStays to get free hotel rooms. Use my referral code ${referralCode} to save €15 on your first booking! ${referralLink}`, '_blank')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Login to get your unique referral code</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="rounded-full px-8">
                      Login to Get Your Code
                    </Button>
                  </DialogTrigger>
                  <AuthDialog />
                </Dialog>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Simple Process
            </Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Four easy steps to start earning rewards</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="p-6 rounded-2xl border-0 shadow-lg h-full text-center hover:shadow-xl transition-all">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </Card>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-accent rounded-full z-10 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">Why Refer Friends?</h2>
            <p className="text-muted-foreground text-lg">Everyone wins with our referral program</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                  <benefit.icon className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary/90">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">
            Start Sharing Today!
          </h2>
          <p className="text-white/80 text-lg mb-8">
            The more friends you refer, the more you save on your travels.
          </p>
          {!user && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full px-10 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Get Started Now
                </Button>
              </DialogTrigger>
              <AuthDialog defaultTab="register" />
            </Dialog>
          )}
        </div>
      </section>
    </div>
  );
};

// ==================== CONTACT PAGE ====================
const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    page_title: 'Get in Touch',
    page_subtitle: 'Have questions? We\'re here to help. Reach out to our team and we\'ll get back to you as soon as possible.',
    email: 'hello@freestays.eu',
    email_note: 'We respond within 24 hours',
    phone: '+31 (0) 123 456 789',
    phone_hours: 'Mon-Fri, 9:00 - 17:00 CET',
    company_name: 'Euro Hotel Cards GmbH',
    address: 'Barneveld, Netherlands',
    support_text: 'Our booking support team is available around the clock for urgent travel assistance.'
  });

  useEffect(() => {
    const fetchContactSettings = async () => {
      try {
        const response = await axios.get(`${API}/contact-settings`);
        setContactInfo(response.data);
      } catch (error) {
        console.log('Using default contact settings');
      }
    };
    fetchContactSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/contact`, formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16" data-testid="contact-page">
      {/* Hero Section */}
      <section className="text-center mb-16 px-4">
        <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
          <Phone className="w-4 h-4 mr-1" /> {t('contact.badge', 'Contact Us')}
        </Badge>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">{contactInfo.page_title}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {contactInfo.page_subtitle}
        </p>
      </section>

      {/* Contact Cards */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Email Card */}
          <Card className="text-center p-8 rounded-2xl card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('contact.emailTitle', 'Email Us')}</h3>
            <a href={`mailto:${contactInfo.email}`} className="text-primary hover:underline text-lg">
              {contactInfo.email}
            </a>
            <p className="text-sm text-muted-foreground mt-2">{contactInfo.email_note}</p>
          </Card>

          {/* Phone Card */}
          <Card className="text-center p-8 rounded-2xl card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Phone className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('contact.phoneTitle', 'Call Us')}</h3>
            <a href={`tel:${contactInfo.phone?.replace(/\s/g, '')}`} className="text-primary hover:underline text-lg">
              {contactInfo.phone}
            </a>
            <p className="text-sm text-muted-foreground mt-2">{contactInfo.phone_hours}</p>
          </Card>

          {/* Address Card */}
          <Card className="text-center p-8 rounded-2xl card-hover">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
              <MapPin className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('contact.officeTitle', 'Visit Us')}</h3>
            <p className="text-muted-foreground">{contactInfo.company_name}</p>
            <p className="text-muted-foreground">{contactInfo.address}</p>
          </Card>
        </div>
      </section>

      {/* Contact Form & Support Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="p-8 rounded-2xl">
            <h2 className="font-serif text-2xl font-semibold mb-6">{t('contact.formTitle', 'Send us a message')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('contact.name', 'Your Name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="email">{t('contact.email', 'Email Address')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="subject">{t('contact.subject', 'Subject')}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="message">{t('contact.message', 'Message')}</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  className="rounded-xl"
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full rounded-xl h-12">
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('contact.sending', 'Sending...')}</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> {t('contact.send', 'Send Message')}</>
                )}
              </Button>
            </form>
          </Card>

          {/* Support Info */}
          <div className="space-y-8">
            <Card className="p-8 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('contact.support247', '24/7 Support')}</h3>
                  <p className="text-primary-foreground/80 text-sm">{t('contact.alwaysHere', 'We\'re always here for you')}</p>
                </div>
              </div>
              <p className="text-primary-foreground/90">
                {contactInfo.support_text}
              </p>
            </Card>

            <Card className="p-8 rounded-2xl">
              <h3 className="font-semibold text-lg mb-4">{t('contact.faqTitle', 'Frequently Asked Questions')}</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{t('contact.faq1q', 'How does FreeStays work?')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('contact.faq1a', 'FreeStays partners directly with hotels, eliminating commissions. When you book with a meal package, your room becomes free!')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">{t('contact.faq2q', 'What is the FreeStays Pass?')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('contact.faq2a', 'The Pass unlocks our best rates. Choose a One-Time Pass (€35) or Annual Pass (€129) for unlimited savings.')}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">{t('contact.faq3q', 'Can I cancel my booking?')}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('contact.faq3a', 'Cancellation policies vary by hotel. Check the specific terms during booking for free cancellation deadlines.')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

// ==================== WHO WE ARE PAGE ====================
const WhoWeArePage = () => {
  const { t } = useTranslation();
  
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
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" className="rounded-full px-10 h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-xl hover:scale-105 transition-all">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Yes! I Want This!
                </Button>
              </DialogTrigger>
              <AuthDialog defaultTab="register" />
            </Dialog>
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
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3">
              Before Using Freestays Vouchers
            </h2>
            <p className="text-muted-foreground">Consider these key factors to make the most of your experience:</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {considerations.map((item, index) => (
              <Card key={index} className="p-6 rounded-2xl border-amber-200 bg-white shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-amber-600" />
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full px-12 h-14 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                    <Sparkles className="mr-2 w-5 h-5" />
                    Start My Free Journey
                  </Button>
                </DialogTrigger>
                <AuthDialog defaultTab="register" />
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ==================== ADMIN PAGES ====================

// Admin Login Page
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/admin/login`, { email, password });
      
      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_email', response.data.email);
        toast.success('Admin login successful!');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error('Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4" data-testid="admin-login-page">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 p-2 shadow-sm border">
            <img 
              src="/assets/logo.png" 
              alt="FreeStays" 
              className="h-full w-auto object-contain"
            />
          </div>
          <CardTitle className="font-serif text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter your admin credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@freestays.eu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="admin-email-input"
              />
            </div>
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="admin-password-input"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="admin-login-btn">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {loading ? 'Logging in...' : 'Login to Admin Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard Page
const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [passCodes, setPassCodes] = useState([]);
  const [passCodeStats, setPassCodeStats] = useState({ active: 0, used: 0 });
  const [passCodeSearch, setPassCodeSearch] = useState('');
  const [testimonials, setTestimonials] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [contactSettings, setContactSettings] = useState({
    contact_page_title: 'Get in Touch',
    contact_page_subtitle: 'Have questions? We\'re here to help. Reach out to our team and we\'ll get back to you as soon as possible.',
    contact_email: 'hello@freestays.eu',
    contact_email_note: 'We respond within 24 hours',
    contact_phone: '+31 (0) 123 456 789',
    contact_phone_hours: 'Mon-Fri, 9:00 - 17:00 CET',
    contact_company_name: 'Euro Hotel Cards GmbH',
    contact_address: 'Barneveld, Netherlands',
    contact_support_text: 'Our booking support team is available around the clock for urgent travel assistance.'
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [generateQuantity, setGenerateQuantity] = useState(1);
  const [generateType, setGenerateType] = useState('one_time');
  const [validateCode, setValidateCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  
  // User management state
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', pass_type: 'free', referral_discount: 0 });
  
  // Price comparisons state
  const [priceComparisons, setPriceComparisons] = useState([]);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [showComparisonDetail, setShowComparisonDetail] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState('');
  const [followUpStats, setFollowUpStats] = useState({ pending_follow_ups: 0, sent_follow_ups: 0, total_with_email: 0 });
  const [sendingFollowUps, setSendingFollowUps] = useState(false);
  
  const adminToken = localStorage.getItem('admin_token');
  const adminEmail = localStorage.getItem('admin_email');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [adminToken, navigate]);

  const loadData = async () => {
    const headers = { Authorization: `Bearer ${adminToken}` };
    
    try {
      const [settingsRes, statsRes, bookingsRes, usersRes, passCodesRes, testimonialsRes, referralsRes, referralStatsRes, comparisonsRes, followUpStatsRes] = await Promise.all([
        axios.get(`${API}/admin/settings`, { headers }),
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/bookings`, { headers }),
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/pass-codes`, { headers }).catch(() => ({ data: { codes: [], stats: { active: 0, used: 0 } } })),
        axios.get(`${API}/admin/testimonials`, { headers }).catch(() => ({ data: { testimonials: [] } })),
        axios.get(`${API}/admin/referrals`, { headers }).catch(() => ({ data: { referrals: [] } })),
        axios.get(`${API}/admin/referral-stats`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/admin/price-comparisons`, { headers }).catch(() => ({ data: { comparisons: [] } })),
        axios.get(`${API}/admin/follow-up-emails/stats`, { headers }).catch(() => ({ data: { pending_follow_ups: 0, sent_follow_ups: 0, total_with_email: 0 } }))
      ]);
      
      setSettings(settingsRes.data);
      setStats(statsRes.data);
      setBookings(bookingsRes.data.bookings || []);
      setUsers(usersRes.data.users || []);
      setPassCodes(passCodesRes.data.codes || []);
      setPassCodeStats(passCodesRes.data.stats || { active: 0, used: 0 });
      setTestimonials(testimonialsRes.data.testimonials || []);
      setReferrals(referralsRes.data.referrals || []);
      setReferralStats(referralStatsRes.data);
      setPriceComparisons(comparisonsRes.data.comparisons || []);
      setFollowUpStats(followUpStatsRes.data || { pending_follow_ups: 0, sent_follow_ups: 0, total_with_email: 0 });
      
      // Load contact settings from main settings
      const contactData = {
        contact_page_title: settingsRes.data.contact_page_title || 'Get in Touch',
        contact_page_subtitle: settingsRes.data.contact_page_subtitle || 'Have questions? We\'re here to help. Reach out to our team and we\'ll get back to you as soon as possible.',
        contact_email: settingsRes.data.contact_email || 'hello@freestays.eu',
        contact_email_note: settingsRes.data.contact_email_note || 'We respond within 24 hours',
        contact_phone: settingsRes.data.contact_phone || '+31 (0) 123 456 789',
        contact_phone_hours: settingsRes.data.contact_phone_hours || 'Mon-Fri, 9:00 - 17:00 CET',
        contact_company_name: settingsRes.data.contact_company_name || 'Euro Hotel Cards GmbH',
        contact_address: settingsRes.data.contact_address || 'Barneveld, Netherlands',
        contact_support_text: settingsRes.data.contact_support_text || 'Our booking support team is available around the clock for urgent travel assistance.'
      };
      setContactSettings(contactData);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
      }
    }
  };

  const updateTestimonialStatus = async (testimonialId, status) => {
    try {
      await axios.put(`${API}/admin/testimonials/${testimonialId}?status=${status}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`Testimonial ${status}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update testimonial');
    }
  };

  const generatePassCodes = async () => {
    try {
      const response = await axios.post(`${API}/admin/pass-codes/generate`, {
        pass_type: generateType,
        quantity: generateQuantity
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(response.data.message);
      loadData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate codes');
    }
  };

  const validatePassCode = async () => {
    if (!validateCode.trim()) return;
    try {
      const response = await axios.post(`${API}/admin/pass-codes/validate?code=${validateCode}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setValidationResult(response.data);
    } catch (error) {
      setValidationResult({ valid: false, message: error.response?.data?.detail || 'Validation failed' });
    }
  };

  const deletePassCode = async (code) => {
    if (!confirm(`Delete pass code ${code}?`)) return;
    try {
      await axios.delete(`${API}/admin/pass-codes/${code}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Pass code deleted');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete code');
    }
  };

  const searchPassCodes = async (searchTerm) => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await axios.get(`${API}/admin/pass-codes${params}`, { headers });
      setPassCodes(response.data.codes || []);
      setPassCodeStats(response.data.stats || { active: 0, used: 0 });
    } catch (error) {
      console.error('Error searching pass codes:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const switchMode = async (mode) => {
    try {
      await axios.put(
        `${API}/admin/settings`,
        { sunhotels_mode: mode },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(`Switched to ${mode.toUpperCase()} mode`);
      loadData();
    } catch (error) {
      toast.error('Failed to switch mode');
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await axios.put(
        `${API}/admin/settings`,
        { [key]: value },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success('Setting updated successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to update setting');
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10" data-testid="admin-dashboard">
      {/* Admin Header */}
      <div className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo.png" 
                alt="FreeStays" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="font-serif text-lg font-semibold">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">{adminEmail}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.total_users || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Ticket className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.total_bookings || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Bookings</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">€{stats.total_revenue?.toFixed(0) || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Revenue</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.active_passes || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Passes</p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex flex-wrap gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="comparison">Price Compare</TabsTrigger>
            <TabsTrigger value="lastminute">Last Minute</TabsTrigger>
            <TabsTrigger value="passcodes">Pass Codes</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="contact">Contact Page</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sunhotels API Status</CardTitle>
                <CardDescription>Current connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Current Mode</p>
                    <p className="text-sm text-muted-foreground">Active credentials</p>
                  </div>
                  <Badge className={settings.sunhotels_mode === 'live' ? 'bg-primary/100' : 'bg-orange-500'}>
                    {settings.sunhotels_mode?.toUpperCase() || 'LIVE'}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="flex-1"
                    variant={settings.sunhotels_mode === 'live' ? 'default' : 'outline'}
                    onClick={() => switchMode('live')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Switch to LIVE
                  </Button>
                  <Button 
                    className="flex-1"
                    variant={settings.sunhotels_mode === 'test' ? 'default' : 'outline'}
                    onClick={() => switchMode('test')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Switch to TEST
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-medium">{settings.sunhotels_username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-medium">{settings.sunhotels_password_masked}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(booking => (
                    <div key={booking.booking_id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{booking.hotel_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                      </div>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Static Database Connection</CardTitle>
                <CardDescription>Configure MySQL database with Sunhotels hotel details (room images, amenities, themes, distances)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-semibold mb-1">Required Tables</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><code>ghwk_hotel_room_types</code> - Room images</li>
                        <li><code>ghwk_room_note_types</code> - Room descriptions</li>
                        <li><code>ghwk_themes</code> + <code>ghwk_hotel_themes</code> - Hotel themes for filtering</li>
                        <li><code>ghwk_bravo_hotels</code> - Distance info (distance_types_json)</li>
                        <li><code>ghwk_room_facilities</code> - Room size (m²) and amenities</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Database Host</Label>
                    <Input 
                      placeholder="e.g., static-db.example.com" 
                      value={settings.static_db_host || ''}
                      onChange={(e) => updateSetting('static_db_host', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Database Port</Label>
                    <Input 
                      placeholder="3306" 
                      value={settings.static_db_port || '3306'}
                      onChange={(e) => updateSetting('static_db_port', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Database Name</Label>
                    <Input 
                      placeholder="e.g., sunhotels_static" 
                      value={settings.static_db_name || ''}
                      onChange={(e) => updateSetting('static_db_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Database User</Label>
                    <Input 
                      placeholder="Database username" 
                      value={settings.static_db_user || ''}
                      onChange={(e) => updateSetting('static_db_user', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Database Password</Label>
                    <Input 
                      type="password"
                      placeholder="Database password" 
                      value={settings.static_db_password || ''}
                      onChange={(e) => updateSetting('static_db_password', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Pricing Settings</CardTitle>
                <CardDescription>Manage pass prices and fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>One-Time Pass Price (€)</Label>
                    <Input 
                      type="number" 
                      value={settings.pass_one_time_price}
                      onChange={(e) => updateSetting('pass_one_time_price', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Annual Pass Price (€)</Label>
                    <Input 
                      type="number" 
                      value={settings.pass_annual_price}
                      onChange={(e) => updateSetting('pass_annual_price', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Booking Fee (€)</Label>
                    <Input 
                      type="number" 
                      value={settings.booking_fee}
                      onChange={(e) => updateSetting('booking_fee', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Discount Rate (%)</Label>
                    <Input 
                      type="number" 
                      value={settings.discount_rate * 100}
                      onChange={(e) => updateSetting('discount_rate', parseFloat(e.target.value) / 100)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Credentials</CardTitle>
                <CardDescription>Sunhotels API settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sunhotels Username</Label>
                  <Input value={settings.sunhotels_username} readOnly />
                </div>
                <div>
                  <Label>Mode</Label>
                  <Select value={settings.sunhotels_mode} onValueChange={(value) => switchMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">LIVE - Freestays</SelectItem>
                      <SelectItem value="test">TEST - FreestaysTEST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Settings (Stripe)
                </CardTitle>
                <CardDescription>Configure Stripe API keys for payment processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Stripe Mode</p>
                    <p className="text-sm text-muted-foreground">Switch between test and live environments</p>
                  </div>
                  <Badge className={settings.stripe_mode === 'live' ? 'bg-primary/100' : 'bg-orange-500'}>
                    {settings.stripe_mode?.toUpperCase() || 'TEST'}
                  </Badge>
                </div>
                
                <div>
                  <Label>Stripe Mode</Label>
                  <Select value={settings.stripe_mode || 'test'} onValueChange={(value) => updateSetting('stripe_mode', value)}>
                    <SelectTrigger data-testid="stripe-mode-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">TEST Mode (Sandbox)</SelectItem>
                      <SelectItem value="live">LIVE Mode (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Test Keys Section */}
                <div className="space-y-3 p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-orange-500">TEST</Badge>
                    <span className="font-semibold text-sm">Test Environment Keys</span>
                  </div>
                  
                  <div>
                    <Label>Test Secret Key</Label>
                    <Input 
                      type="password"
                      placeholder="sk_test_..." 
                      value={settings.stripe_test_secret_key || ''}
                      onChange={(e) => updateSetting('stripe_test_secret_key', e.target.value)}
                      data-testid="stripe-test-secret-key-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Backend API key for test mode</p>
                  </div>
                  
                  <div>
                    <Label>Test Publishable Key</Label>
                    <Input 
                      placeholder="pk_test_..." 
                      value={settings.stripe_test_publishable_key || ''}
                      onChange={(e) => updateSetting('stripe_test_publishable_key', e.target.value)}
                      data-testid="stripe-test-publishable-key-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Frontend key for test mode (safe to expose)</p>
                  </div>
                </div>

                <Separator />

                {/* Live Keys Section */}
                <div className="space-y-3 p-4 border border-primary/30 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary">LIVE</Badge>
                    <span className="font-semibold text-sm">Live Environment Keys</span>
                  </div>
                  
                  <div>
                    <Label>Live Secret Key</Label>
                    <Input 
                      type="password"
                      placeholder="sk_live_..." 
                      value={settings.stripe_live_secret_key || ''}
                      onChange={(e) => updateSetting('stripe_live_secret_key', e.target.value)}
                      data-testid="stripe-live-secret-key-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Backend API key for live mode</p>
                  </div>
                  
                  <div>
                    <Label>Live Publishable Key</Label>
                    <Input 
                      placeholder="pk_live_..." 
                      value={settings.stripe_live_publishable_key || ''}
                      onChange={(e) => updateSetting('stripe_live_publishable_key', e.target.value)}
                      data-testid="stripe-live-publishable-key-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Frontend key for live mode (safe to expose)</p>
                  </div>
                </div>

                {(settings.stripe_live_secret_key || settings.stripe_test_secret_key) && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {settings.stripe_mode === 'live' 
                          ? (settings.stripe_live_secret_key ? 'Live keys configured' : 'Live keys not configured')
                          : (settings.stripe_test_secret_key ? 'Test keys configured' : 'Test keys not configured')
                        }
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Important Security Notice</p>
                      <p>Never share your Stripe secret keys. Live keys will process real payments. Test with TEST mode first.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email/SMTP Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Settings (SMTP)
                </CardTitle>
                <CardDescription>Configure email notifications for booking confirmations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Send branded confirmation emails to guests</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={settings.smtp_enabled ? 'bg-primary/100' : 'bg-gray-400'}>
                      {settings.smtp_enabled ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                    <Switch
                      checked={settings.smtp_enabled || false}
                      onCheckedChange={(checked) => updateSetting('smtp_enabled', checked)}
                      data-testid="smtp-enabled-toggle"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SMTP Host</Label>
                    <Input 
                      placeholder="smtp.strato.de" 
                      value={settings.smtp_host || ''}
                      onChange={(e) => updateSetting('smtp_host', e.target.value)}
                      data-testid="smtp-host-input"
                    />
                  </div>
                  <div>
                    <Label>SMTP Port</Label>
                    <Input 
                      type="number"
                      placeholder="587" 
                      value={settings.smtp_port || 587}
                      onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                      data-testid="smtp-port-input"
                    />
                  </div>
                </div>

                <div>
                  <Label>SMTP Username</Label>
                  <Input 
                    placeholder="your-email@domain.com" 
                    value={settings.smtp_username || ''}
                    onChange={(e) => updateSetting('smtp_username', e.target.value)}
                    data-testid="smtp-username-input"
                  />
                </div>

                <div>
                  <Label>SMTP Password</Label>
                  <Input 
                    type="password"
                    placeholder="••••••••" 
                    value={settings.smtp_password || ''}
                    onChange={(e) => updateSetting('smtp_password', e.target.value)}
                    data-testid="smtp-password-input"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From Email</Label>
                    <Input 
                      placeholder="booking@freestays.eu" 
                      value={settings.smtp_from_email || ''}
                      onChange={(e) => updateSetting('smtp_from_email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>From Name</Label>
                    <Input 
                      placeholder="FreeStays" 
                      value={settings.smtp_from_name || ''}
                      onChange={(e) => updateSetting('smtp_from_name', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Company Logo (for emails)</Label>
                  {settings.company_logo_url ? (
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                      <img 
                        src={settings.company_logo_url} 
                        alt="Company Logo" 
                        className="h-12 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Logo uploaded</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">{settings.company_logo_url}</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={async () => {
                          try {
                            await axios.delete(`${API}/admin/delete-logo`, {
                              headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                            });
                            toast.success('Logo deleted');
                            loadData();
                          } catch (error) {
                            toast.error('Failed to delete logo');
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        id="logo-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          try {
                            toast.loading('Uploading logo...');
                            const response = await axios.post(`${API}/admin/upload-logo`, formData, {
                              headers: { 
                                Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                                'Content-Type': 'multipart/form-data'
                              }
                            });
                            toast.dismiss();
                            toast.success('Logo uploaded successfully');
                            loadData();
                          } catch (error) {
                            toast.dismiss();
                            toast.error(error.response?.data?.detail || 'Failed to upload logo');
                          }
                        }}
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium">Upload Logo</p>
                          <p className="text-xs text-muted-foreground">PNG, JPEG, GIF or WebP</p>
                        </div>
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Logo appears in email headers alongside "Commission-free bookings" slogan</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Support Email</Label>
                    <Input 
                      placeholder="info@freestays.eu" 
                      value={settings.company_support_email || ''}
                      onChange={(e) => updateSetting('company_support_email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Company Website</Label>
                    <Input 
                      placeholder="https://freestays.eu" 
                      value={settings.company_website || ''}
                      onChange={(e) => updateSetting('company_website', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Test Email Section */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span className="font-medium">Send Test Email</span>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="test@example.com" 
                      id="test-email-input"
                      defaultValue={settings.company_support_email || ''}
                    />
                    <Button 
                      variant="outline"
                      onClick={async () => {
                        const email = document.getElementById('test-email-input').value;
                        if (!email) return;
                        try {
                          const response = await axios.post(`${API}/admin/email/test`, { email }, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                          });
                          toast.success('Test email sent successfully!');
                        } catch (error) {
                          toast.error(error.response?.data?.detail || 'Failed to send test email');
                        }
                      }}
                      data-testid="send-test-email-btn"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Make sure to save settings before testing</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Email Flow</p>
                      <p>Confirmation emails are automatically sent to guests after successful payment. You can also manually resend emails from the Bookings tab.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* UI Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5" />
                  UI Settings
                </CardTitle>
                <CardDescription>Configure user interface options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Allow users to switch between light and dark themes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={settings.darkMode_enabled !== false ? 'bg-primary/100' : 'bg-gray-400'}>
                      {settings.darkMode_enabled !== false ? 'ENABLED' : 'DISABLED'}
                    </Badge>
                    <Switch
                      checked={settings.darkMode_enabled !== false}
                      onCheckedChange={(checked) => updateSetting('darkMode_enabled', checked)}
                      data-testid="dark-mode-toggle-admin"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Dark Mode Setting</p>
                      <p>When disabled, all users will see the light theme only. The theme toggle button will be hidden from the navigation.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>{bookings.length} total bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {bookings.map(booking => (
                      <Card key={booking.booking_id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{booking.hotel_name}</p>
                              <p className="text-sm text-muted-foreground">{booking.room_type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                {booking.status}
                              </Badge>
                              {booking.status === 'confirmed' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await axios.post(`${API}/admin/email/resend/${booking.booking_id}`, {}, {
                                          headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                                        });
                                        toast.success('Confirmation email resent!');
                                      } catch (error) {
                                        toast.error(error.response?.data?.detail || 'Failed to send email');
                                      }
                                    }}
                                    title="Resend confirmation email"
                                    data-testid={`resend-email-${booking.booking_id}`}
                                  >
                                    <Mail className="w-4 h-4" />
                                  </Button>
                                  {(booking.voucher_url || booking.voucher) && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className={booking.voucher_sent ? "text-green-600" : "text-primary"}
                                      onClick={async () => {
                                        try {
                                          await axios.post(`${API}/admin/bookings/${booking.booking_id}/send-voucher`, {}, {
                                            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                                          });
                                          toast.success('Travel voucher sent to customer!');
                                          loadData();
                                        } catch (error) {
                                          toast.error(error.response?.data?.detail || 'Failed to send voucher');
                                        }
                                      }}
                                      title={booking.voucher_sent ? "Voucher already sent - click to resend" : "Send travel voucher to customer"}
                                      data-testid={`send-voucher-${booking.booking_id}`}
                                    >
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Guest:</span>
                              <p className="font-medium">{booking.guest_first_name} {booking.guest_last_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <p className="font-medium truncate">{booking.guest_email}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Check-in:</span>
                              <p className="font-medium">{booking.check_in}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <p className="font-medium">€{booking.total_price}</p>
                            </div>
                            {booking.voucher_sent && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Voucher:</span>
                                <p className="font-medium text-green-600 text-xs">✓ Sent {booking.voucher_sent_at ? new Date(booking.voucher_sent_at).toLocaleDateString() : ''}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          {/* Last Minute Configuration Tab */}
          <TabsContent value="lastminute" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  Last Minute Offers Configuration
                </CardTitle>
                <CardDescription>Configure how last minute deals are displayed on the homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Offers to Show</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="12"
                      value={settings.last_minute_count || 6}
                      onChange={(e) => updateSetting('last_minute_count', parseInt(e.target.value))}
                      data-testid="lastminute-count-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum 12 offers</p>
                  </div>
                  <div>
                    <Label>Badge Text</Label>
                    <Input 
                      placeholder="Hot Deals"
                      value={settings.last_minute_badge_text || ''}
                      onChange={(e) => updateSetting('last_minute_badge_text', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Text shown on the badge</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Section Title</Label>
                  <Input 
                    placeholder="Last Minute Offers"
                    value={settings.last_minute_title || ''}
                    onChange={(e) => updateSetting('last_minute_title', e.target.value)}
                    data-testid="lastminute-title-input"
                  />
                </div>

                <div>
                  <Label>Section Subtitle/Description</Label>
                  <Input 
                    placeholder="Book now and save up to 30% on selected hotels"
                    value={settings.last_minute_subtitle || ''}
                    onChange={(e) => updateSetting('last_minute_subtitle', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Describes when/where the offers are valid</p>
                </div>

                <Separator />

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">Custom Dates (Optional)</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-4">Leave empty to automatically use tomorrow's date. Set custom dates for specific promotions.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Check-in Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="lastminute-checkin-input">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {settings.last_minute_check_in ? format(new Date(settings.last_minute_check_in), 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={settings.last_minute_check_in ? new Date(settings.last_minute_check_in) : undefined}
                            onSelect={(date) => updateSetting('last_minute_check_in', date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Check-out Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="lastminute-checkout-input">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {settings.last_minute_check_out ? format(new Date(settings.last_minute_check_out), 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={settings.last_minute_check_out ? new Date(settings.last_minute_check_out) : undefined}
                            onSelect={(date) => updateSetting('last_minute_check_out', date ? format(date, 'yyyy-MM-dd') : '')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      updateSetting('last_minute_check_in', '');
                      updateSetting('last_minute_check_out', '');
                    }}
                  >
                    Clear Dates (Use Auto)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Price Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Price Comparison Settings
                </CardTitle>
                <CardDescription>
                  Configure how FreeStays prices are compared with other booking platforms. 
                  We show comparison only when FreeStays is at least 10% cheaper.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Enable Price Comparison</Label>
                    <p className="text-sm text-muted-foreground">Show price comparison badges on hotel cards</p>
                  </div>
                  <Switch 
                    checked={settings?.price_comparison_enabled ?? true}
                    onCheckedChange={(checked) => updateSetting('price_comparison_enabled', checked)}
                    data-testid="comparison-enabled-switch"
                  />
                </div>

                <Separator />

                {/* OTA Markup Percentage */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Other Platforms Markup (%)</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input 
                        type="number"
                        min="5"
                        max="50"
                        value={settings?.ota_markup_percentage || 20}
                        onChange={(e) => updateSetting('ota_markup_percentage', parseInt(e.target.value))}
                        className="w-24"
                        data-testid="ota-markup-input"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Estimated commission other platforms charge hotels (default: 20%).
                      This is used to calculate comparison prices.
                    </p>
                  </div>
                  
                  <div>
                    <Label>Minimum Savings to Show (%)</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input 
                        type="number"
                        min="5"
                        max="30"
                        value={settings?.comparison_min_savings_percent || 10}
                        onChange={(e) => updateSetting('comparison_min_savings_percent', parseInt(e.target.value))}
                        className="w-24"
                        data-testid="min-savings-input"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Only show comparison when we're at least this much cheaper (default: 10%)
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Campaign Email Settings */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Campaign Email Notifications</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    Receive reports about hotels where FreeStays offers better prices than competitors.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Frequency</Label>
                      <Select 
                        value={settings?.comparison_email_frequency || 'search'}
                        onValueChange={(value) => updateSetting('comparison_email_frequency', value)}
                      >
                        <SelectTrigger data-testid="email-frequency-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="search">On Every Search</SelectItem>
                          <SelectItem value="daily">Daily Summary</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Campaign Email Address</Label>
                      <Input 
                        type="email"
                        placeholder="campain@freestays.eu"
                        value={settings?.comparison_email_address || 'campain@freestays.eu'}
                        onChange={(e) => updateSetting('comparison_email_address', e.target.value)}
                        data-testid="campaign-email-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-secondary/30 rounded-lg p-4">
                  <Label className="text-sm font-semibold mb-3 block">Preview: How it appears on hotel cards</Label>
                  <div className="bg-white rounded-lg p-4 border max-w-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold">
                        <Check className="w-3 h-3 mr-1" />
                        PRICE CHECK
                      </Badge>
                      <span className="text-xs text-primary font-medium">
                        €47 less than other platforms*
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground line-through">€236</span>
                      <span className="text-2xl font-bold text-primary">€189</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">2 nights, 2 guests (total price)</p>
                    <p className="text-[10px] text-muted-foreground mt-3 italic">
                      * Estimated based on typical commission rates charged by other booking platforms
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Why this comparison is fair:</p>
                      <ul className="list-disc list-inside space-y-1 text-amber-700">
                        <li>Other platforms show misleading per-person prices</li>
                        <li>They charge hotels 15-30% commission (forbidden parity since 2024)</li>
                        <li>FreeStays shows <strong>total price</strong> for all guests upfront</li>
                        <li>Hotels save commission = we pass savings to you</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Comparison History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                      Comparison History
                    </CardTitle>
                    <CardDescription>View and manage stored price comparison searches</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadData}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {priceComparisons.length > 0 ? (
                  <div className="space-y-3">
                    {priceComparisons.map((comp) => (
                      <div 
                        key={comp.comparison_id} 
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold">{comp.destination}</span>
                            {comp.visitor_email && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                {comp.visitor_email}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {comp.check_in} → {comp.check_out} • {comp.guests}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs">
                            <span className="text-muted-foreground">{comp.hotels_count} hotels</span>
                            <span className="text-primary font-medium">{comp.hotels_with_savings} with savings</span>
                            <span className="text-accent font-semibold">€{comp.total_savings?.toFixed(0)} potential savings</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedComparison(comp);
                              setShowComparisonDetail(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await axios.get(
                                  `${API}/admin/price-comparisons/${comp.comparison_id}/download`,
                                  { 
                                    headers: { Authorization: `Bearer ${adminToken}` },
                                    responseType: 'blob'
                                  }
                                );
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `comparison_${comp.comparison_id}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                toast.success('CSV downloaded!');
                              } catch (error) {
                                toast.error('Failed to download CSV');
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No price comparisons recorded yet</p>
                    <p className="text-sm">Comparisons will appear here when users search with savings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Follow-up Emails */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary" />
                      Automatic Follow-up Emails
                    </CardTitle>
                    <CardDescription>Remind visitors who searched but didn't book (sent 24-48h after search)</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          await axios.post(
                            `${API}/admin/follow-up-emails/test`,
                            {},
                            { headers: { Authorization: `Bearer ${adminToken}` } }
                          );
                          toast.success('Test follow-up email sent to campaign email!');
                        } catch (error) {
                          toast.error('Failed to send test email');
                        }
                      }}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Test
                    </Button>
                    <Button 
                      size="sm"
                      disabled={sendingFollowUps || followUpStats.pending_follow_ups === 0}
                      onClick={async () => {
                        setSendingFollowUps(true);
                        try {
                          await axios.post(
                            `${API}/admin/follow-up-emails/trigger`,
                            {},
                            { headers: { Authorization: `Bearer ${adminToken}` } }
                          );
                          toast.success('Follow-up email processing started!');
                          setTimeout(loadData, 3000); // Refresh after 3s
                        } catch (error) {
                          toast.error('Failed to trigger follow-up emails');
                        } finally {
                          setSendingFollowUps(false);
                        }
                      }}
                    >
                      {sendingFollowUps ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Send Pending ({followUpStats.pending_follow_ups})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary/30 rounded-lg">
                    <p className="text-3xl font-bold text-muted-foreground">{followUpStats.total_with_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Email Captures</p>
                  </div>
                  <div className="text-center p-4 bg-amber-100/50 rounded-lg border border-amber-200">
                    <p className="text-3xl font-bold text-amber-600">{followUpStats.pending_follow_ups}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending Follow-ups</p>
                  </div>
                  <div className="text-center p-4 bg-green-100/50 rounded-lg border border-green-200">
                    <p className="text-3xl font-bold text-green-600">{followUpStats.sent_follow_ups}</p>
                    <p className="text-xs text-muted-foreground mt-1">Follow-ups Sent</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-secondary/20 rounded-lg text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span><strong>Automatic:</strong> Follow-up emails are sent automatically at 8 AM and 8 PM UTC</span>
                  </p>
                  <p className="flex items-center gap-2 mt-2">
                    <Info className="w-4 h-4" />
                    <span>Emails are only sent to visitors who captured their email 24-48 hours ago and haven't registered</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Send Marketing Email Dialog */}
            <Dialog open={showComparisonDetail} onOpenChange={setShowComparisonDetail}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Comparison Details - {selectedComparison?.destination}</DialogTitle>
                  <DialogDescription>
                    {selectedComparison?.check_in} → {selectedComparison?.check_out} • {selectedComparison?.guests}
                  </DialogDescription>
                </DialogHeader>
                
                {selectedComparison && (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-secondary/30 rounded-lg">
                        <p className="text-2xl font-bold">{selectedComparison.hotels_count}</p>
                        <p className="text-xs text-muted-foreground">Hotels Found</p>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{selectedComparison.hotels_with_savings}</p>
                        <p className="text-xs text-muted-foreground">With Savings</p>
                      </div>
                      <div className="text-center p-4 bg-accent/10 rounded-lg">
                        <p className="text-2xl font-bold text-accent">€{selectedComparison.total_savings?.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Total Savings</p>
                      </div>
                    </div>
                    
                    {/* Hotels List */}
                    {selectedComparison.hotels?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Top Hotels with Savings</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {selectedComparison.hotels.map((hotel, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-secondary/20 rounded text-sm">
                              <div>
                                <span className="font-medium">{hotel.name}</span>
                                <span className="text-muted-foreground ml-2">{"★".repeat(hotel.stars || 3)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-primary font-semibold">€{hotel.freestays_price?.toFixed(0)}</span>
                                <span className="text-muted-foreground line-through text-xs">€{hotel.estimated_ota_price?.toFixed(0)}</span>
                                <Badge className="bg-accent/20 text-accent-foreground text-xs">
                                  -{hotel.savings_percent?.toFixed(0)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Send Marketing Email */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Marketing Email
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Send this price comparison offer to selected customers
                      </p>
                      <Textarea 
                        placeholder="Enter email addresses (comma separated)"
                        value={marketingEmails}
                        onChange={(e) => setMarketingEmails(e.target.value)}
                        className="mb-3"
                      />
                      <Button 
                        onClick={async () => {
                          if (!marketingEmails.trim()) {
                            toast.error('Please enter at least one email');
                            return;
                          }
                          try {
                            const emails = marketingEmails.split(',').map(e => e.trim()).filter(e => e);
                            await axios.post(
                              `${API}/admin/price-comparisons/send-marketing`,
                              { comparison_id: selectedComparison.comparison_id, recipient_emails: emails },
                              { headers: { Authorization: `Bearer ${adminToken}` } }
                            );
                            toast.success(`Marketing emails queued for ${emails.length} recipients!`);
                            setMarketingEmails('');
                          } catch (error) {
                            toast.error('Failed to send emails');
                          }
                        }}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send to {marketingEmails.split(',').filter(e => e.trim()).length || 0} Recipients
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Pass Codes Tab */}
          <TabsContent value="passcodes" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Generate Codes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Generate Pass Codes
                  </CardTitle>
                  <CardDescription>Create new one-time or annual pass codes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Pass Type</Label>
                    <Select value={generateType} onValueChange={setGenerateType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-Time Pass (€35)</SelectItem>
                        <SelectItem value="annual">Annual Pass (€129)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="100"
                      value={generateQuantity}
                      onChange={(e) => setGenerateQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button className="w-full" onClick={generatePassCodes}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate {generateQuantity} Code{generateQuantity > 1 ? 's' : ''}
                  </Button>
                  
                  <Separator className="my-4" />
                  
                  {/* Bulk Generation */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Bulk Generate</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setGenerateType('one_time');
                          setGenerateQuantity(10);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        10x One-Time
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setGenerateType('annual');
                          setGenerateQuantity(10);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        10x Annual
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setGenerateType('one_time');
                          setGenerateQuantity(50);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        50x One-Time
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setGenerateType('annual');
                          setGenerateQuantity(50);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        50x Annual
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Import Codes */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Import Codes</Label>
                    <p className="text-xs text-muted-foreground">
                      Upload a CSV file with codes. Format: code,type (one_time or annual)
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        type="file" 
                        accept=".csv,.txt"
                        className="flex-1"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const text = event.target?.result;
                              const lines = text.split('\n').filter(line => line.trim());
                              const codes = lines.map(line => {
                                const [code, type] = line.split(',').map(s => s.trim());
                                return { code, pass_type: type || 'one_time' };
                              });
                              
                              const response = await axios.post(`${API}/admin/pass-codes/import`, { codes }, {
                                headers: { Authorization: `Bearer ${adminToken}` }
                              });
                              
                              toast.success(`Imported ${response.data.imported} codes successfully`);
                              loadData();
                            } catch (error) {
                              toast.error(error.response?.data?.detail || 'Import failed');
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Example: FS-CUSTOM-12345,one_time
                    </p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* Export Codes */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Export Codes</Label>
                    <p className="text-xs text-muted-foreground">
                      Download pass codes as CSV file
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={async () => {
                          try {
                            const response = await axios.get(`${API}/admin/pass-codes/export?status=active`, {
                              headers: { Authorization: `Bearer ${adminToken}` }
                            });
                            const blob = new Blob([response.data.csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `freestays_active_codes_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            toast.success(`Exported ${response.data.count} active codes`);
                          } catch (error) {
                            toast.error('Export failed');
                          }
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-1 rotate-90" />
                        Active Codes
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={async () => {
                          try {
                            const response = await axios.get(`${API}/admin/pass-codes/export?status=used`, {
                              headers: { Authorization: `Bearer ${adminToken}` }
                            });
                            const blob = new Blob([response.data.csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `freestays_used_codes_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            toast.success(`Exported ${response.data.count} used codes`);
                          } catch (error) {
                            toast.error('Export failed');
                          }
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-1 rotate-90" />
                        Used Codes
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full col-span-2"
                        onClick={async () => {
                          try {
                            const response = await axios.get(`${API}/admin/pass-codes/export`, {
                              headers: { Authorization: `Bearer ${adminToken}` }
                            });
                            const blob = new Blob([response.data.csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `freestays_all_codes_${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            toast.success(`Exported ${response.data.count} codes`);
                          } catch (error) {
                            toast.error('Export failed');
                          }
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-1 rotate-90" />
                        Export All Codes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validate Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Validate Pass Code
                  </CardTitle>
                  <CardDescription>Check if a pass code is valid</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Enter Code</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="FS-XXXXX-XXXXX"
                        value={validateCode}
                        onChange={(e) => setValidateCode(e.target.value.toUpperCase())}
                      />
                      <Button onClick={validatePassCode}>Validate</Button>
                    </div>
                  </div>
                  {validationResult && (
                    <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-primary/10 border-primary/30' : 'bg-red-50 border-red-200'} border`}>
                      <div className="flex items-center gap-2 mb-2">
                        {validationResult.valid ? (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-semibold ${validationResult.valid ? 'text-primary' : 'text-red-700'}`}>
                          {validationResult.valid ? 'Valid Code' : 'Invalid Code'}
                        </span>
                      </div>
                      {validationResult.valid ? (
                        <div className="text-sm text-primary space-y-1">
                          <p>Type: {validationResult.pass_type?.replace('_', ' ').toUpperCase()}</p>
                          <p>Price: €{validationResult.price}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-700">{validationResult.message}</p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{passCodeStats.active}</p>
                      <p className="text-sm text-primary">Active Codes</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{passCodeStats.used}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Used Codes</p>
                    </div>
                  </div>
                  
                  {/* Sales Statistics */}
                  {passCodeStats.purchased && (
                    <>
                      <Separator />
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Pass Sales
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-green-600 dark:text-green-400">One-Time Passes</p>
                            <p className="font-bold text-lg">{passCodeStats.purchased.one_time || 0}</p>
                          </div>
                          <div>
                            <p className="text-green-600 dark:text-green-400">Annual Passes</p>
                            <p className="font-bold text-lg">{passCodeStats.purchased.annual || 0}</p>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="text-center">
                          <p className="text-green-600 dark:text-green-400">Total Revenue</p>
                          <p className="font-bold text-2xl text-green-700 dark:text-green-300">€{(passCodeStats.purchased.revenue || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* All Codes List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Pass Codes</CardTitle>
                    <CardDescription>{passCodes.length} total codes</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search code, email, name..."
                        value={passCodeSearch}
                        onChange={(e) => setPassCodeSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchPassCodes(passCodeSearch)}
                        className="pl-9 w-[250px]"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => searchPassCodes(passCodeSearch)}
                    >
                      Search
                    </Button>
                    {passCodeSearch && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setPassCodeSearch('');
                          searchPassCodes('');
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {passCodes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{passCodeSearch ? 'No matching pass codes found' : 'No pass codes generated yet'}</p>
                      </div>
                    ) : (
                      passCodes.map((code, idx) => (
                        <div key={idx} className="p-4 bg-secondary/30 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <code className="font-mono text-sm font-bold bg-card px-3 py-1.5 rounded border">{code.code}</code>
                              <Badge variant={code.pass_type === 'annual' ? 'default' : 'secondary'}>
                                {code.pass_type === 'annual' ? 'Annual €129' : 'One-Time €35'}
                              </Badge>
                              <Badge variant={code.status === 'active' ? 'outline' : 'destructive'}>
                                {code.status}
                              </Badge>
                              {code.source === 'purchase' && (
                                <Badge className="bg-green-500 hover:bg-green-600">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  SOLD
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {code.status === 'active' && !code.source && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deletePassCode(code.code)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs">User</p>
                                <p className="font-medium">{code.user_name || code.purchased_by || code.used_by || '-'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs">Email</p>
                                <p className="font-medium truncate max-w-[150px]" title={code.purchased_by || code.used_by || '-'}>
                                  {code.purchased_by || code.used_by || '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs">{code.source === 'purchase' ? 'Purchased' : 'Created'}</p>
                                <p className="font-medium">
                                  {code.created_at ? new Date(code.created_at).toLocaleDateString() : '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground text-xs">Expires</p>
                                <p className="font-medium">
                                  {code.expires_at 
                                    ? new Date(code.expires_at).toLocaleDateString() 
                                    : (code.pass_type === 'one_time' ? 'Single use' : '-')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Page Settings Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Page Settings
                </CardTitle>
                <CardDescription>Manage the content displayed on the "Get in Touch" page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Page Header */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Page Header
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="contact_page_title">Page Title</Label>
                      <Input
                        id="contact_page_title"
                        value={contactSettings.contact_page_title || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_page_title: e.target.value})}
                        placeholder="Get in Touch"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_page_subtitle">Page Subtitle</Label>
                      <Textarea
                        id="contact_page_subtitle"
                        value={contactSettings.contact_page_subtitle || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_page_subtitle: e.target.value})}
                        placeholder="Have questions? We're here to help..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_email">Email Address</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={contactSettings.contact_email || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_email: e.target.value})}
                        placeholder="hello@freestays.eu"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email_note">Email Note</Label>
                      <Input
                        id="contact_email_note"
                        value={contactSettings.contact_email_note || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_email_note: e.target.value})}
                        placeholder="We respond within 24 hours"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Phone Number</Label>
                      <Input
                        id="contact_phone"
                        value={contactSettings.contact_phone || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_phone: e.target.value})}
                        placeholder="+31 (0) 123 456 789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone_hours">Phone Hours</Label>
                      <Input
                        id="contact_phone_hours"
                        value={contactSettings.contact_phone_hours || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_phone_hours: e.target.value})}
                        placeholder="Mon-Fri, 9:00 - 17:00 CET"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Company Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_company_name">Company Name</Label>
                      <Input
                        id="contact_company_name"
                        value={contactSettings.contact_company_name || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_company_name: e.target.value})}
                        placeholder="Euro Hotel Cards GmbH"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_address">Address</Label>
                      <Input
                        id="contact_address"
                        value={contactSettings.contact_address || ''}
                        onChange={(e) => setContactSettings({...contactSettings, contact_address: e.target.value})}
                        placeholder="Barneveld, Netherlands"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Support Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Support Text
                  </h3>
                  <div>
                    <Label htmlFor="contact_support_text">24/7 Support Text</Label>
                    <Textarea
                      id="contact_support_text"
                      value={contactSettings.contact_support_text || ''}
                      onChange={(e) => setContactSettings({...contactSettings, contact_support_text: e.target.value})}
                      placeholder="Our booking support team is available around the clock..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={async () => {
                      try {
                        await axios.put(`${API}/admin/settings`, contactSettings, {
                          headers: { Authorization: `Bearer ${adminToken}` }
                        });
                        toast.success('Contact page settings saved!');
                      } catch (error) {
                        toast.error('Failed to save settings');
                      }
                    }}
                    className="w-full md:w-auto"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Contact Settings
                  </Button>
                </div>

                {/* Preview */}
                <div className="mt-6 p-6 bg-secondary/30 rounded-xl">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </h3>
                  <div className="bg-card rounded-xl p-6 border">
                    <h4 className="font-serif text-2xl font-bold mb-2">{contactSettings.contact_page_title || 'Get in Touch'}</h4>
                    <p className="text-muted-foreground mb-4">{contactSettings.contact_page_subtitle || 'Have questions?...'}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{contactSettings.contact_email || 'hello@freestays.eu'}</p>
                        <p className="text-xs text-muted-foreground">{contactSettings.contact_email_note}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{contactSettings.contact_phone || '+31...'}</p>
                        <p className="text-xs text-muted-foreground">{contactSettings.contact_phone_hours}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>{users.length} registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {users.map(user => (
                      <Card key={user.user_id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar>
                              <AvatarImage src={user.picture} />
                              <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{user.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {user.email_verified ? (
                                  <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Email Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Unverified
                                  </Badge>
                                )}
                                {user.referral_discount > 0 && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                                    <Gift className="w-3 h-3 mr-1" />
                                    €{user.referral_discount} Credit
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge variant={user.pass_type === 'annual' ? 'default' : user.pass_type === 'one_time' ? 'secondary' : 'outline'}>
                                {user.pass_type === 'annual' ? 'Annual' : user.pass_type === 'one_time' ? 'One-Time' : 'Free'}
                              </Badge>
                              {user.pass_code && (
                                <p className="text-xs text-muted-foreground mt-1">{user.pass_code}</p>
                              )}
                              {user.referral_code && (
                                <p className="text-xs text-primary mt-1">Ref: {user.referral_code}</p>
                              )}
                              {user.referral_count > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className={`text-xs ${user.referral_count >= 10 ? 'text-amber-600 border-amber-400 bg-amber-50' : 'text-purple-600 border-purple-300'}`}>
                                    <Users className="w-3 h-3 mr-1" />
                                    {user.referral_count} referral{user.referral_count !== 1 ? 's' : ''}
                                    {user.referral_count >= 10 && ' 🏆'}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setEditingUser(user);
                                  setEditUserForm({
                                    name: user.name,
                                    email: user.email,
                                    pass_type: user.pass_type || 'free',
                                    referral_discount: user.referral_discount || 0
                                  });
                                  setShowEditUserDialog(true);
                                }}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                {!user.email_verified && (
                                  <DropdownMenuItem onClick={async () => {
                                    try {
                                      await axios.post(`${API}/admin/users/${user.user_id}/verify-email`, {}, {
                                        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                                      });
                                      toast.success('Email verified successfully');
                                      loadData();
                                    } catch (error) {
                                      toast.error('Failed to verify email');
                                    }
                                  }}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify Email
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setShowDeleteUserDialog(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Edit User Dialog */}
            <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>Update user details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input 
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Pass Type</Label>
                    <Select value={editUserForm.pass_type} onValueChange={(v) => setEditUserForm({...editUserForm, pass_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="one_time">One-Time Pass</SelectItem>
                        <SelectItem value="annual">Annual Pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Referral Credit (€)</Label>
                    <Input 
                      type="number"
                      value={editUserForm.referral_discount}
                      onChange={(e) => setEditUserForm({...editUserForm, referral_discount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      await axios.put(`${API}/admin/users/${editingUser.user_id}`, editUserForm, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                      });
                      toast.success('User updated successfully');
                      setShowEditUserDialog(false);
                      loadData();
                    } catch (error) {
                      toast.error(error.response?.data?.detail || 'Failed to update user');
                    }
                  }}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Delete User Confirmation Dialog */}
            <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {userToDelete?.name} ({userToDelete?.email})? 
                    This action cannot be undone and will remove all their data including bookings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={async () => {
                      try {
                        await axios.delete(`${API}/admin/users/${userToDelete.user_id}`, {
                          headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
                        });
                        toast.success('User deleted successfully');
                        setShowDeleteUserDialog(false);
                        loadData();
                      } catch (error) {
                        toast.error(error.response?.data?.detail || 'Failed to delete user');
                      }
                    }}
                  >
                    Delete User
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Testimonial Management</CardTitle>
                <CardDescription>Approve or reject user testimonials to display on the homepage</CardDescription>
              </CardHeader>
              <CardContent>
                {testimonials.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No testimonials submitted yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Sample testimonials will be shown on the homepage until real ones are approved</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {testimonials.map(testimonial => (
                        <Card key={testimonial.testimonial_id} className={`p-4 ${testimonial.status === 'approved' ? 'border-green-200 bg-green-50/50' : testimonial.status === 'rejected' ? 'border-red-200 bg-red-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                                  ))}
                                </div>
                                <Badge className={testimonial.status === 'approved' ? 'bg-green-100 text-green-700' : testimonial.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {testimonial.status}
                                </Badge>
                              </div>
                              <h4 className="font-semibold">{testimonial.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">"{testimonial.content}"</p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>By: {testimonial.user_name}</span>
                                {testimonial.hotel_name && <span>Hotel: {testimonial.hotel_name}</span>}
                                <span>{format(new Date(testimonial.created_at), 'MMM d, yyyy')}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {testimonial.status !== 'approved' && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateTestimonialStatus(testimonial.testimonial_id, 'approved')}>
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {testimonial.status !== 'rejected' && (
                                <Button size="sm" variant="destructive" onClick={() => updateTestimonialStatus(testimonial.testimonial_id, 'rejected')}>
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <div className="space-y-6">
              {/* Referral Stats */}
              {referralStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Gift className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{referralStats.total_referrals || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{referralStats.pending_referrals || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold">{referralStats.used_referrals || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Used</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Euro className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">€{referralStats.total_discount_given?.toFixed(0) || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Discounts Given</p>
                  </Card>
                </div>
              )}

              {/* Referral Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Referral Program Settings</CardTitle>
                  <CardDescription>Configure referral discount amount and rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Referral Discount Amount (€)</Label>
                      <Input
                        type="number"
                        value={settings?.referral_discount_amount || 15}
                        onChange={(e) => setSettings({...settings, referral_discount_amount: parseFloat(e.target.value)})}
                        step="0.01"
                      />
                      <p className="text-xs text-muted-foreground">Amount new users receive when using a referral code</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-semibold">Referral Program</p>
                        <p className="text-sm text-muted-foreground">Enable/disable referral system</p>
                      </div>
                      <Button
                        variant={settings?.referral_enabled !== false ? 'default' : 'outline'}
                        onClick={async () => {
                          try {
                            await axios.put(`${API}/admin/settings`, { referral_enabled: !settings?.referral_enabled }, {
                              headers: { Authorization: `Bearer ${adminToken}` }
                            });
                            setSettings({...settings, referral_enabled: !settings?.referral_enabled});
                            toast.success(`Referral program ${!settings?.referral_enabled ? 'enabled' : 'disabled'}`);
                          } catch (error) {
                            toast.error('Failed to update setting');
                          }
                        }}
                      >
                        {settings?.referral_enabled !== false ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        await axios.put(`${API}/admin/settings`, { referral_discount_amount: settings?.referral_discount_amount }, {
                          headers: { Authorization: `Bearer ${adminToken}` }
                        });
                        toast.success('Referral discount updated');
                      } catch (error) {
                        toast.error('Failed to update setting');
                      }
                    }}
                  >
                    Save Referral Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Top Referrers */}
              {referralStats?.top_referrers?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Referrers</CardTitle>
                    <CardDescription>Users with the most referrals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {referralStats.top_referrers.map((referrer, idx) => (
                        <div key={referrer.email} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'}`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{referrer.name}</p>
                              <p className="text-xs text-muted-foreground">{referrer.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{referrer.referral_count}</p>
                            <p className="text-xs text-muted-foreground">referrals</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                  <CardDescription>{referrals.length} total referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <div className="text-center py-12">
                      <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No referrals yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {referrals.map(referral => (
                          <Card key={`${referral.referrer_id}-${referral.referee_id}`} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-semibold">{referral.referrer_name}</span>
                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-semibold">{referral.referee_name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{referral.referrer_email} → {referral.referee_email}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={referral.status === 'used' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {referral.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">€{referral.discount_amount}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ==================== APP ====================
function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/last-minute" element={<LastMinutePage />} />
      <Route path="/hotel/:hotelId" element={<HotelDetailPage />} />
      <Route path="/booking/new" element={<BookingPage />} />
      <Route path="/booking/success" element={<BookingSuccessPage />} />
      <Route path="/pass/success" element={<PassSuccessPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/who-we-are" element={<WhoWeArePage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/refer-a-friend" element={<ReferFriendPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="App min-h-screen bg-background text-foreground transition-colors duration-300">
              <Header />
              <AppRouter />
              <InstallAppPrompt />
              <Toaster position="top-center" richColors />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
