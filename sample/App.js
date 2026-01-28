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

// Drag and Drop
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Stripe
import { loadStripe } from "@stripe/stripe-js";

// Extracted Pages (Refactored from monolith)
import ContactPage from "@/pages/ContactPage";
import WhoWeArePage from "@/pages/WhoWeArePage";
import AboutPage from "@/pages/AboutPage";
import ReferFriendPage from "@/pages/ReferFriendPage";
import SurveyPage from "@/pages/SurveyPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import CookieConsent from "@/components/CookieConsent";

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
  Eye, FileText, Download, Printer, UserPlus, Moon, Sun, Database, Camera, Image, Play,
  ArrowUpDown, Bell, Smartphone, Activity, History, TrendingUp, Trophy, Save, ExternalLink,
  MessageSquare, ThumbsUp, Home, CircleSlash, GripVertical
} from "lucide-react";

// ==================== BREADCRUMBS COMPONENT ====================
const Breadcrumbs = ({ items }) => {
  const { t } = useTranslation();
  
  if (!items || items.length === 0) return null;
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground mb-4">
      <ol className="flex items-center flex-wrap gap-1">
        <li className="flex items-center">
          <Link 
            to="/" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('common.home', 'Home')}</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/50" />
            {item.href ? (
              <Link 
                to={item.href} 
                className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                title={item.label}
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-[250px]" title={item.label}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

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
// PWA Install Context for sharing install functionality
const PWAInstallContext = createContext();

const usePWAInstall = () => useContext(PWAInstallContext);

const PWAInstallProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installId, setInstallId] = useState(() => localStorage.getItem('pwa-install-id'));

  // Track PWA install to backend
  const trackInstall = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // Detect platform and browser
      const ua = navigator.userAgent;
      let platform = 'unknown';
      let browser = 'unknown';
      
      if (/Android/i.test(ua)) platform = 'Android';
      else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS';
      else if (/Windows/i.test(ua)) platform = 'Windows';
      else if (/Mac/i.test(ua)) platform = 'macOS';
      else if (/Linux/i.test(ua)) platform = 'Linux';
      
      if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browser = 'Chrome';
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
      else if (/Firefox/i.test(ua)) browser = 'Firefox';
      else if (/Edge|Edg/i.test(ua)) browser = 'Edge';
      
      const response = await axios.post(`${API}/pwa/track-install`, {
        platform,
        browser,
        device_info: {
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          standalone: window.matchMedia('(display-mode: standalone)').matches
        },
        app_version: '1.0.0'
      }, { headers });
      
      if (response.data.install_id) {
        localStorage.setItem('pwa-install-id', response.data.install_id);
        setInstallId(response.data.install_id);
      }
    } catch (error) {
      console.error('Failed to track PWA install:', error);
    }
  };

  // Track activity heartbeat
  const trackActivity = async () => {
    const storedInstallId = localStorage.getItem('pwa-install-id');
    if (!storedInstallId) return;
    
    try {
      await axios.post(`${API}/pwa/track-activity`, { install_id: storedInstallId });
    } catch (error) {
      // Silent fail for activity tracking
    }
  };

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
      // Track activity for installed apps
      trackActivity();
      // Periodic activity tracking every 10 minutes
      const activityInterval = setInterval(trackActivity, 10 * 60 * 1000);
      return () => clearInterval(activityInterval);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      
      // Check if dismissed recently for banner
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
      // Show banner after 10 seconds
      setTimeout(() => setShowInstallBanner(true), 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setCanInstall(false);
      // Track the install to backend
      trackInstall();
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('App updated to version:', event.data.version);
          // Optionally reload to get the latest version
          // window.location.reload();
        }
      });

      // Check for updates periodically (every 30 minutes)
      const checkForUpdates = () => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update();
        });
      };
      
      // Initial check after 5 seconds
      setTimeout(checkForUpdates, 5000);
      
      // Periodic check
      const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        clearInterval(updateInterval);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setCanInstall(false);
      // Track install immediately
      trackInstall();
    }
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <PWAInstallContext.Provider value={{ 
      canInstall, 
      isInstalled, 
      showInstallBanner,
      handleInstall, 
      dismissBanner,
      installId
    }}>
      {children}
    </PWAInstallContext.Provider>
  );
};

const InstallAppPrompt = () => {
  const { showInstallBanner, handleInstall, dismissBanner, isInstalled } = usePWAInstall();
  const { t } = useTranslation();

  if (isInstalled || !showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideInRight">
      <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <img 
              src="/assets/logo.png" 
              alt="FreeStays" 
              className="w-14 h-14 rounded-xl object-contain flex-shrink-0"
            />
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
                <Button size="sm" variant="ghost" onClick={dismissBanner} className="rounded-full">
                  {t('pwa.notNow', 'Not Now')}
                </Button>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 flex-shrink-0" 
              onClick={dismissBanner}
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
  const { canInstall, isInstalled, handleInstall } = usePWAInstall();
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
                  
                  {/* Install App Link */}
                  {canInstall && !isInstalled && (
                    <button 
                      className="text-lg font-medium flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                      onClick={async () => {
                        await handleInstall();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Download className="w-5 h-5" /> {t('pwa.installApp', 'Install App')}
                    </button>
                  )}
                  
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
  const { canInstall, isInstalled, handleInstall } = usePWAInstall();
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
          
          {/* PWA Install Prompt */}
          {canInstall && !isInstalled && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              {tab === "register" ? (
                // Register tab - Download to start
                <button 
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('pwa.downloadToStart', 'Download our FreeStays app to get started!')}</span>
                </button>
              ) : (
                // Login tab - Already downloaded?
                <button 
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('pwa.alreadyDownloaded', 'Did you download our FreeStays app already?')}</span>
                </button>
              )}
            </div>
          )}
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
const DestinationAutocomplete = ({ value, onChange, onSelect, placeholder = "City, region, or hotel name" }) => {
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

  // Separate destinations and hotels for better display
  const destinationResults = destinations.filter(d => d.type !== 'hotel');
  const hotelResults = destinations.filter(d => d.type === 'hotel');

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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-card rounded-xl shadow-lg border z-50 max-h-80 overflow-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : destinations.length > 0 ? (
            <>
              {/* Destinations Section */}
              {destinationResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0">
                    Destinations
                  </div>
                  {destinationResults.map((dest) => (
                    <button
                      key={`dest-${dest.id}`}
                      className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center gap-3 transition-colors"
                      onClick={() => handleSelect(dest)}
                      data-testid={`dest-option-${dest.id}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{dest.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{dest.country} • {dest.hotel_count || 0} hotels</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Hotels Section */}
              {hotelResults.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0">
                    Hotels
                  </div>
                  {hotelResults.map((dest) => (
                    <button
                      key={`hotel-${dest.hotel_id}`}
                      className="w-full px-4 py-3 text-left hover:bg-secondary flex items-center gap-3 transition-colors"
                      onClick={() => handleSelect(dest)}
                      data-testid={`hotel-option-${dest.hotel_id}`}
                    >
                      {dest.thumbnail ? (
                        <img 
                          src={dest.thumbnail} 
                          alt={dest.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-secondary"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 rounded-lg bg-accent/20 items-center justify-center flex-shrink-0 ${dest.thumbnail ? 'hidden' : 'flex'}`}
                      >
                        <Building2 className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{dest.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{dest.country}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No destinations or hotels found
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
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lastMinuteDeals'],
    queryFn: async () => {
      const response = await axios.get(`${API}/hotels/last-minute`);
      return response.data;
    }
  });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setSubscribing(true);
    try {
      await axios.post(`${API}/newsletter/subscribe`, { email });
      setSubscribed(true);
      toast.success('Successfully subscribed to our newsletter!');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

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

  // Show "no offers" card when no real last minute deals are available
  if (hotels.length === 0) {
    return (
      <Card className="overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10 border-accent/30">
        <div className="p-8 md:p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
            <Clock className="w-10 h-10 text-accent" />
          </div>
          <h3 className="text-2xl font-serif font-semibold mb-3">
            Here we will show you our Last Minute deals
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Check later for our exclusive offers with up to 30% off selected hotels!
          </p>
          
          {!subscribed ? (
            <div className="max-w-sm mx-auto">
              <p className="text-sm font-medium mb-3">
                Subscribe to get Last Minute deals in your inbox
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" disabled={subscribing} className="shrink-0">
                  {subscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-1" />
                      Subscribe
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">You're subscribed! We'll notify you of new deals.</span>
            </div>
          )}
        </div>
      </Card>
    );
  }

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

// How It Works Tabbed Component
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
  const [selectedHotel, setSelectedHotel] = useState(null); // For direct hotel selection

  const handleSearch = () => {
    // If a specific hotel is selected, go directly to hotel page
    if (selectedHotel) {
      const checkInStr = format(checkIn, 'yyyy-MM-dd');
      const checkOutStr = format(checkOut, 'yyyy-MM-dd');
      const destIdParam = selectedHotel.dest_id ? `&destinationId=${selectedHotel.dest_id}` : '';
      const resortIdParam = selectedHotel.resort_id ? `&resortId=${selectedHotel.resort_id}` : '';
      navigate(`/hotel/${selectedHotel.hotel_id}?checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${guests.adults}&children=${guests.children}${destIdParam}${resortIdParam}`);
      return;
    }
    
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
    // If it's a hotel, store hotel info and let user pick dates
    if (dest.type === 'hotel' && dest.hotel_id) {
      setSelectedHotel({
        hotel_id: dest.hotel_id,
        name: dest.name,
        dest_id: dest.id,
        resort_id: dest.resort_id || '',
        thumbnail: dest.thumbnail
      });
      setDestination(dest.name);
      setDestinationId(dest.id);
      return;
    }
    // Otherwise, set destination for search
    setSelectedHotel(null); // Clear any selected hotel
    setDestination(dest.name);
    setDestinationId(dest.id);
    setResortId(dest.resort_id || '');
  };

  const clearSelectedHotel = () => {
    setSelectedHotel(null);
    setDestination('');
    setDestinationId('');
  };

  const [featuredDestinations, setFeaturedDestinations] = useState([
    { name: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600", hotels: "1,240+", destination_id: "16330" },
    { name: "Barcelona", country: "Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600", hotels: "2,100+", destination_id: "17429" },
    { name: "Vienna", country: "Austria", image: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600", hotels: "890+", destination_id: "18180" },
    { name: "Amalfi", country: "Italy", image: "https://images.unsplash.com/photo-1612698093158-e07ac200d44e?w=600", hotels: "450+", destination_id: "10515" }
  ]);
  const [destinationsCount, setDestinationsCount] = useState(4);

  // Fetch popular destinations from API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await axios.get(`${API}/destinations`);
        if (response.data?.destinations?.length > 0) {
          setFeaturedDestinations(response.data.destinations);
          setDestinationsCount(response.data.display_count || 4);
        }
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
      }
    };
    fetchDestinations();
  }, []);

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

        {/* Floating Elements - Blue theme */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float hidden lg:block" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-float hidden md:block" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="animate-fadeInUp text-center md:text-left">
              {/* Revolutionary Badge - Blue theme */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-500 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold mb-6 md:mb-8 shadow-lg animate-pulse-glow" data-testid="hero-badge">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                {t('hero.badge')}
              </div>
              
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-[1.1] mb-4 md:mb-6">
                <span className="block">{t('hero.title1')}</span>
                <span className="block text-primary">{t('hero.title2')}</span>
              </h1>
              
              {/* Sub-headline */}
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-4 md:mb-6 max-w-xl mx-auto md:mx-0 leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Animated rotating text */}
              <div className="text-base md:text-lg text-primary font-semibold mb-6 md:mb-8 h-8">
                <div className="animate-pulse">
                  {t('hero.animatedText')}
                </div>
              </div>

              {/* 3 Value Pillars - Blue theme */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-8 md:mb-10">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary/30">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{t('hero.pillar1Title')}</p>
                    <p className="text-white/70 text-xs">{t('hero.pillar1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary/30">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CircleSlash className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{t('hero.pillar2Title')}</p>
                    <p className="text-white/70 text-xs">{t('hero.pillar2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary/30">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{t('hero.pillar3Title')}</p>
                    <p className="text-white/70 text-xs">{t('hero.pillar3Desc')}</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons - Blue theme */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center md:items-start mb-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 md:h-14 text-base md:text-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                      <Search className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                      {t('hero.primaryCta')}
                    </Button>
                  </DialogTrigger>
                  <AuthDialog defaultTab="register" />
                </Dialog>
                <Link to="/about" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 h-12 md:h-14 text-base md:text-lg bg-white/10 border-primary/50 text-white hover:bg-primary/20 backdrop-blur-sm">
                    {t('hero.secondaryCta')}
                    <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start text-xs md:text-sm text-white/70">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> {t('hero.trust1')}</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> {t('hero.trust2')}</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> {t('hero.trust3')}</span>
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
                  {selectedHotel ? (
                    /* Selected Hotel Card */
                    <div className="relative p-3 rounded-xl bg-primary/10 border-2 border-primary/30">
                      <div className="flex items-center gap-3">
                        {selectedHotel.thumbnail && (
                          <img 
                            src={selectedHotel.thumbnail} 
                            alt={selectedHotel.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{selectedHotel.name}</p>
                          <p className="text-xs text-primary flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {t('search.hotelSelected', 'Hotel selected - pick your dates')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={clearSelectedHotel}
                        >
                          <XCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DestinationAutocomplete 
                      value={destination}
                      onChange={setDestination}
                      onSelect={handleDestinationSelect}
                    />
                  )}
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
                  {selectedHotel ? (
                    <>
                      <Building2 className="mr-2 w-5 h-5" />
                      {t('search.viewHotel', 'View Hotel')}
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 w-5 h-5" />
                      {t('search.searchButton')}
                    </>
                  )}
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

      {/* How It Works - Tabbed Design */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-secondary/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent-foreground border-accent/30">
              <Sparkles className="w-4 h-4 mr-1" /> {t('howItWorks.badge', 'The FreeStays Concept')}
            </Badge>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6">{t('howItWorks.title', 'How Freestays Makes Travel Smarter — and Rooms FREE')}</h2>
          </div>

          {/* 4-Tab Navigation */}
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

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Link to="/how-it-works">
              <Button size="lg" className="rounded-full px-8 bg-accent hover:bg-accent/90">
                {t('common.learnMore', 'Learn More')}
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
              <Badge className="mb-3 bg-secondary text-secondary-foreground">{t('destinations.badge', 'Popular Destinations')}</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-2">{t('destinations.title', 'Where Will Your Free Room Be?')}</h2>
              <p className="text-muted-foreground">{t('destinations.subtitle', 'Discover stunning destinations with commission-free stays')}</p>
            </div>
            <Link to="/search" className="hidden md:flex items-center text-sm font-medium text-primary hover:underline">
              {t('destinations.viewAll', 'View all')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {featuredDestinations.slice(0, destinationsCount).map((dest, idx) => {
              // Default dates: tomorrow to 3 days later
              const defaultCheckIn = format(addDays(new Date(), 1), 'yyyy-MM-dd');
              const defaultCheckOut = format(addDays(new Date(), 4), 'yyyy-MM-dd');
              return (
              <Link 
                key={dest.name} 
                to={`/search?destination=${encodeURIComponent(dest.name)}&destinationId=${dest.destination_id}&checkIn=${defaultCheckIn}&checkOut=${defaultCheckOut}&adults=2&children=0&rooms=1`}
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
                    {dest.hotels} {t('destinations.hotels', 'hotels')}
                  </Badge>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-serif text-2xl text-white font-semibold mb-1">{dest.name}</h3>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {dest.country}
                  </p>
                </div>
              </Link>
            );
            })}
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
  const [selectedHotel, setSelectedHotel] = useState(null); // For direct hotel selection
  
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
    enabled: destination.length > 0 || destinationId.length > 0 || resortId.length > 0
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
    // If a specific hotel is selected, go directly to hotel page
    if (selectedHotel) {
      const checkInStr = format(checkIn, 'yyyy-MM-dd');
      const checkOutStr = format(checkOut, 'yyyy-MM-dd');
      const destIdParam = selectedHotel.dest_id ? `&destinationId=${selectedHotel.dest_id}` : '';
      const resortIdParam = selectedHotel.resort_id ? `&resortId=${selectedHotel.resort_id}` : '';
      navigate(`/hotel/${selectedHotel.hotel_id}?checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${guests.adults}&children=${guests.children}${destIdParam}${resortIdParam}`);
      return;
    }
    
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
    // If it's a hotel, store hotel info and let user pick dates
    if (dest.type === 'hotel' && dest.hotel_id) {
      setSelectedHotel({
        hotel_id: dest.hotel_id,
        name: dest.name,
        dest_id: dest.id,
        resort_id: dest.resort_id || '',
        thumbnail: dest.thumbnail
      });
      setDestination(dest.name);
      setDestinationId(dest.id);
      return;
    }
    // Otherwise, set destination for search
    setSelectedHotel(null);
    setDestination(dest.name);
    setDestinationId(dest.id);
    setResortId(dest.resort_id || '');
  };
  
  const clearSelectedHotel = () => {
    setSelectedHotel(null);
    setDestination('');
    setDestinationId('');
  };

  return (
    <div className="min-h-screen pt-20" data-testid="search-page">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
        <Breadcrumbs items={[
          { label: t('search.searchTitle', 'Search Results'), href: null }
        ]} />
      </div>
      
      {/* Compact Search Bar */}
      <div className="bg-secondary/50 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              {selectedHotel ? (
                /* Selected Hotel Card */
                <div className="relative p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2">
                    {selectedHotel.thumbnail && (
                      <img 
                        src={selectedHotel.thumbnail} 
                        alt={selectedHotel.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedHotel.name}</p>
                      <p className="text-xs text-primary">{t('search.hotelSelected', 'Hotel selected')}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={clearSelectedHotel}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <DestinationAutocomplete 
                  value={destination}
                  onChange={setDestination}
                  onSelect={handleDestinationSelect}
                  placeholder="Where to?"
                />
              )}
            </div>
            
            <Button onClick={handleSearch} className="h-11 rounded-lg" data-testid="search-submit">
              {selectedHotel ? (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  {t('search.viewHotel', 'View Hotel')}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
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

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
        {/* Mobile Compact Filter Bar */}
        <div className="md:hidden mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Price Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant={priceRange[0] > 0 || priceRange[1] < 1000 ? "default" : "outline"} 
                  size="sm" 
                  className="flex-shrink-0 h-9 rounded-full gap-1"
                >
                  <Euro className="w-3.5 h-3.5" />
                  {priceRange[0] > 0 || priceRange[1] < 1000 
                    ? `€${priceRange[0]}-${priceRange[1] === 1000 ? '1000+' : priceRange[1]}`
                    : t('search.price', 'Price')
                  }
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('search.price', 'Price')}</span>
                    <span className="font-medium">€{priceRange[0]} - €{priceRange[1] === 1000 ? '1000+' : priceRange[1]}</span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    step={25}
                  />
                  <div className="grid grid-cols-4 gap-1">
                    {[100, 200, 300, 500].map(price => (
                      <Button
                        key={price}
                        variant={priceRange[1] === price ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => setPriceRange([0, price])}
                      >
                        &lt;€{price}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Stars Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant={starFilter.length > 0 ? "default" : "outline"} 
                  size="sm" 
                  className="flex-shrink-0 h-9 rounded-full gap-1"
                >
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {starFilter.length > 0 
                    ? `${starFilter.length} ${t('search.selected', 'selected')}`
                    : t('search.stars', 'Stars')
                  }
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3" align="start">
                <div className="space-y-2">
                  {[5, 4, 3, 2].map(star => (
                    <Button
                      key={star}
                      variant={starFilter.includes(star) ? "default" : "outline"}
                      size="sm"
                      className="w-full h-9 justify-start gap-2"
                      onClick={() => {
                        if (starFilter.includes(star)) {
                          setStarFilter(starFilter.filter(s => s !== star));
                        } else {
                          setStarFilter([...starFilter, star]);
                        }
                      }}
                    >
                      {Array.from({ length: star }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${starFilter.includes(star) ? 'fill-white text-white' : 'fill-yellow-400 text-yellow-400'}`} />
                      ))}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Hotel Type Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant={themeFilter.length > 0 ? "default" : "outline"} 
                  size="sm" 
                  className="flex-shrink-0 h-9 rounded-full gap-1"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {themeFilter.length > 0 
                    ? `${themeFilter.length} types`
                    : t('search.hotelType', 'Type')
                  }
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="start">
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {[
                      { id: 'family', icon: '👨‍👩‍👧‍👦', label: t('themes.family', 'Family') },
                      { id: 'romantic', icon: '💑', label: t('themes.romantic', 'Romantic') },
                      { id: 'business', icon: '💼', label: t('themes.business', 'Business') },
                      { id: 'beach', icon: '🏖️', label: t('themes.beach', 'Beach') },
                      { id: 'spa', icon: '🧖', label: t('themes.spa', 'Spa & Wellness') },
                      { id: 'budget', icon: '💰', label: t('themes.budget', 'Budget') }
                    ].map(theme => (
                      <Button
                        key={theme.id}
                        variant={themeFilter.includes(theme.id) ? "default" : "ghost"}
                        size="sm"
                        className="w-full h-8 justify-start gap-2 text-sm"
                        onClick={() => {
                          if (themeFilter.includes(theme.id)) {
                            setThemeFilter(themeFilter.filter(t => t !== theme.id));
                          } else {
                            setThemeFilter([...themeFilter, theme.id]);
                          }
                        }}
                      >
                        <span>{theme.icon}</span>
                        {theme.label}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Sort Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0 h-9 rounded-full gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {t('search.sort', 'Sort')}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2" align="start">
                {[
                  { value: 'recommended', label: t('search.recommended', 'Recommended') },
                  { value: 'price_asc', label: t('search.priceAsc', 'Price: Low to High') },
                  { value: 'price_desc', label: t('search.priceDesc', 'Price: High to Low') },
                  { value: 'rating', label: t('search.rating', 'Rating') }
                ].map(option => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? "default" : "ghost"}
                    size="sm"
                    className="w-full h-8 justify-start text-sm"
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Clear Filters - Only show if filters active */}
            {(starFilter.length > 0 || themeFilter.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000) && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-shrink-0 h-9 text-xs text-muted-foreground"
                onClick={() => {
                  setStarFilter([]);
                  setThemeFilter([]);
                  setAmenityFilter([]);
                  setPriceRange([0, 1000]);
                }}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                {t('search.clear', 'Clear')}
              </Button>
            )}
          </div>
          
          {/* Results count for mobile */}
          <div className="text-sm text-muted-foreground">
            {filteredHotels.length} {t('search.hotelsFound', 'hotels found')}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Enhanced Filter Sidebar - Hidden on Mobile */}
          <aside className="hidden md:block w-80 flex-shrink-0">
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
        <div className="relative w-full lg:w-80 h-56 lg:h-auto flex-shrink-0 overflow-hidden bg-secondary">
          <img 
            src={hotel.image_url || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'} 
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
            }}
            loading="lazy"
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

// ==================== NO ROOMS AVAILABLE COMPONENT ====================
const NoRoomsAvailable = ({ hotelId, hotelName, checkIn, checkOut, adults, children, destinationId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));

  const findAlternatives = async () => {
    setLoading(true);
    setShowAlternatives(true);
    try {
      const response = await axios.get(`${API}/hotels/${hotelId}/alternatives`, {
        params: {
          check_in: checkIn,
          check_out: checkOut,
          adults: adults,
          children: children,
          destination_id: destinationId
        }
      });
      setAlternatives(response.data.alternatives || []);
    } catch (error) {
      console.error('Error finding alternatives:', error);
      setAlternatives([]);
    } finally {
      setLoading(false);
    }
  };

  const tryDifferentDates = () => {
    // Navigate to search page with destination to find availability
    if (destinationId) {
      navigate(`/search?destinationId=${destinationId}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`);
    } else {
      navigate('/');
    }
  };

  return (
    <Card className="p-8 text-center bg-secondary/30 border-dashed" data-testid="no-rooms-available">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <CalendarX className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h3 className="font-semibold text-lg mb-2">
          {t('hotel.noRoomsAvailable', 'No Rooms Available')}
        </h3>
        
        <p className="text-muted-foreground mb-6 text-sm">
          {t('hotel.noRoomsMessage', `Unfortunately, ${hotelName || 'this hotel'} has no availability for your selected dates. Try different dates or check out similar hotels nearby.`).replace('${hotelName}', hotelName || 'this hotel')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={tryDifferentDates}
            className="rounded-full"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {t('hotel.tryDifferentDates', 'Try Different Dates')}
          </Button>
          
          <Button
            onClick={findAlternatives}
            disabled={loading}
            className="rounded-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {t('hotel.findNearbyHotels', 'Find Hotels Nearby')}
          </Button>
        </div>

        {/* Alternative Hotels Section */}
        {showAlternatives && (
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="font-medium mb-4 flex items-center justify-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {t('hotel.alternativeHotels', 'Available Hotels Nearby')}
            </h4>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : alternatives.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {alternatives.slice(0, 4).map(hotel => (
                  <Card 
                    key={hotel.hotel_id} 
                    className="p-4 cursor-pointer hover:shadow-md transition-all text-left"
                    onClick={() => navigate(`/hotel/${hotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}&destinationId=${destinationId || ''}`)}
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                        <img 
                          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm line-clamp-2">{hotel.name}</h5>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {hotel.city}
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {Array.from({ length: Math.floor(hotel.star_rating || 0) }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-primary font-semibold text-sm mt-1">
                          €{hotel.min_price?.toFixed(0) || '---'} <span className="text-xs text-muted-foreground font-normal">/ night</span>
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4">
                {t('hotel.noAlternativesFound', 'No alternative hotels found for your dates. Try adjusting your search dates.')}
              </p>
            )}
            
            {alternatives.length > 4 && (
              <Button 
                variant="link" 
                className="mt-4"
                onClick={tryDifferentDates}
              >
                {t('hotel.viewMoreHotels', 'View all available hotels')} →
              </Button>
            )}
          </div>
        )}
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  const checkIn = searchParams.get('checkIn') || format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const checkOut = searchParams.get('checkOut') || format(addDays(new Date(), 10), 'yyyy-MM-dd');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  const b2c = parseInt(searchParams.get('b2c') || '0');  // 1 for last minute deals
  const destinationId = searchParams.get('destinationId') || '';  // City context for room search
  const resortId = searchParams.get('resortId') || '';  // Resort/area context
  
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  const validPass = hasValidPass?.() || false;

  const { data: hotel, isLoading } = useQuery({
    queryKey: ['hotel', hotelId, checkIn, checkOut, adults, children, b2c, destinationId, resortId],
    queryFn: async () => {
      const response = await axios.get(`${API}/hotels/${hotelId}`, {
        params: {
          check_in: checkIn,
          check_out: checkOut,
          adults: adults,
          children: children,
          b2c: b2c,  // Pass b2c flag for last minute availability
          destination_id: destinationId || undefined,  // City context for room search
          resort_id: resortId || undefined  // Resort/area context
        }
      });
      return response.data;
    }
  });

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!galleryOpen || !hotel?.images) return;
    
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          setGalleryOpen(false);
          break;
        case 'ArrowLeft':
          setGalleryIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1));
          break;
        case 'ArrowRight':
          setGalleryIndex((prev) => (prev === hotel.images.length - 1 ? 0 : prev + 1));
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when gallery is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [galleryOpen, hotel?.images]);

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
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-2">
        <Breadcrumbs items={[
          { label: t('search.searchTitle', 'Search'), href: '/search' },
          { label: hotel.name }
        ]} />
      </div>
      
      {/* Hotel Image Gallery - 2/3 Main + 1/3 Thumbnails */}
      <div className="relative h-[40vh] md:h-[50vh] bg-secondary">
        <div className="h-full max-w-7xl mx-auto flex">
          {/* Main Image - 2/3 width */}
          <div 
            className="w-full md:w-2/3 h-full relative overflow-hidden cursor-pointer group"
            onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
          >
            <img 
              src={hotel.image_url || hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'} 
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <Image className="w-4 h-4" />
              View all photos
            </div>
          </div>
          
          {/* Thumbnail Gallery - 1/3 width (desktop only) */}
          {hotel.images && hotel.images.length > 1 && (
            <div className="hidden md:flex w-1/3 h-full flex-col gap-1 pl-1 relative">
              <div 
                className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {hotel.images.slice(1, 4).map((img, idx) => (
                  <div 
                    key={idx} 
                    className="flex-1 min-h-[80px] relative overflow-hidden cursor-pointer group"
                    onClick={() => { setGalleryIndex(idx + 1); setGalleryOpen(true); }}
                  >
                    <img 
                      src={img} 
                      alt={`${hotel.name} - ${idx + 2}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
              {/* Show more photos button */}
              {hotel.images.length > 4 && (
                <button 
                  className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/70 text-foreground dark:text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white dark:hover:bg-black/80 transition-colors shadow-lg"
                  onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
                >
                  <Camera className="w-4 h-4" />
                  +{hotel.images.length - 4} photos
                </button>
              )}
            </div>
          )}
          
          {/* Mobile: View photos button */}
          {hotel.images && hotel.images.length > 1 && (
            <button 
              className="md:hidden absolute bottom-20 right-4 bg-white/90 dark:bg-black/70 text-foreground dark:text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg"
              onClick={() => { setGalleryIndex(0); setGalleryOpen(true); }}
            >
              <Camera className="w-4 h-4" />
              {hotel.images.length} photos
            </button>
          )}
        </div>
        
        {/* Hotel Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pointer-events-none">
          <div className="max-w-7xl mx-auto">
            <div className="md:w-2/3">
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
      </div>

      {/* Fullscreen Gallery Modal */}
      {galleryOpen && hotel.images && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
            onClick={() => setGalleryOpen(false)}
            title="Close (ESC)"
          >
            <XCircle className="w-8 h-8" />
          </button>
          
          {/* Image counter and keyboard hint */}
          <div className="absolute top-4 left-4 text-white/80 text-sm z-10 flex items-center gap-4">
            <span>{galleryIndex + 1} / {hotel.images.length}</span>
            <span className="hidden md:flex items-center gap-2 text-white/50 text-xs">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">→</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">ESC</kbd>
              <span>close</span>
            </span>
          </div>
          
          {/* Previous button */}
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
            onClick={() => setGalleryIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1))}
            title="Previous (←)"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          {/* Main image */}
          <img 
            src={hotel.images[galleryIndex]} 
            alt={`${hotel.name} - ${galleryIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain"
          />
          
          {/* Next button */}
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 p-2 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
            onClick={() => setGalleryIndex((prev) => (prev === hotel.images.length - 1 ? 0 : prev + 1))}
            title="Next (→)"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto p-2 bg-black/50 rounded-lg">
            {hotel.images.map((img, idx) => (
              <button
                key={idx}
                className={`w-16 h-12 rounded overflow-hidden flex-shrink-0 transition-all ${idx === galleryIndex ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                onClick={() => setGalleryIndex(idx)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

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
              <h2 className="font-serif text-xl font-semibold mb-4">
                {(!hotel.rooms || hotel.rooms.length === 0) 
                  ? t('hotel.noRoomsAvailable', 'No Rooms Available')
                  : t('hotel.roomsAvailable', 'Available Rooms')
                }
              </h2>
              
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
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                {hotel.rooms && hotel.rooms.length > 0 ? (
                  hotel.rooms.map(room => {
                  const pricing = calculatePricing(room.price * nights, validPass);
                  const roomImages = room.images && room.images.length > 0 ? room.images : (room.image_url ? [room.image_url] : []);

                  return (
                    <Card key={room.room_id} className="p-6" data-testid={`room-${room.room_id}`}>
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Room Images Carousel */}
                        {roomImages.length > 0 && (
                          <div className="w-full md:w-56 flex-shrink-0">
                            <div className="relative group">
                              {/* Main scrollable image container */}
                              <div 
                                className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-lg"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              >
                                {roomImages.map((img, imgIdx) => {
                                  // Handle different image formats (URL string or object with id)
                                  let imgUrl = img;
                                  if (typeof img === 'object' && img.id) {
                                    imgUrl = img.id.startsWith('http') 
                                      ? img.id 
                                      : `https://hotelimages.sunhotels.net/HotelInfo/hotelImage.aspx?id=${img.id}`;
                                  } else if (typeof img === 'string' && !img.startsWith('http')) {
                                    imgUrl = `https://hotelimages.sunhotels.net/HotelInfo/hotelImage.aspx?id=${img}`;
                                  }
                                  
                                  return (
                                    <div 
                                      key={imgIdx} 
                                      className="w-full md:w-56 h-36 flex-shrink-0 snap-center rounded-lg overflow-hidden bg-secondary"
                                    >
                                      <img 
                                        src={imgUrl} 
                                        alt={`${room.room_type} - ${imgIdx + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                                        loading="lazy"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Image counter badge */}
                              {roomImages.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  {roomImages.length}
                                </div>
                              )}
                              {/* Scroll hint for multiple images */}
                              {roomImages.length > 1 && (
                                <div className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-white/80 dark:bg-black/60 rounded-full p-1">
                                    <ChevronRight className="w-4 h-4" />
                                  </div>
                                </div>
                              )}
                            </div>
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
                              {t('common.saveMoney', 'Save')} €{pricing.discountAmount.toFixed(0)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="mb-2">
                              {t('common.saveMoney', 'Save')} €{pricing.potentialSavings.toFixed(0)} {t('booking.discount', 'with pass')}
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
                })
                ) : (
                  <NoRoomsAvailable 
                    hotelId={hotelId}
                    hotelName={hotel.name}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    adults={adults}
                    children={children}
                    destinationId={destinationId}
                  />
                )}
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
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: t('search.searchTitle', 'Search'), href: '/search' },
          hotel ? { label: hotel.name, href: `/hotel/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}` } : null,
          { label: t('booking.title', 'Booking') }
        ].filter(Boolean)} />
        
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
                    {t('booking.passTitle', 'FreeStays Pass - No commissions')}
                  </h2>

                  {/* Existing Pass Code */}
                  <div className="mb-6">
                    <Label className="mb-2 block">{t('booking.havePassCode', 'Have a pass code?')}</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t('booking.passCodePlaceholder', 'Enter pass code (e.g., GOLD-XXXXXXXX)')}
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

// ==================== CHECKOUT PAGE REMOVED ====================
// Dead code removed - application uses Stripe Hosted Checkout instead of Embedded Checkout
// Original code: ~157 lines (CheckoutPage component)
// Removal date: December 2025

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
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: t('dashboard.title', 'My Dashboard') }
        ]} />
        
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
                {/* Trip Statistics Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 dark:from-primary/20 dark:via-accent/15 dark:to-primary/10 p-8 border border-primary/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">Your Travel Journey</h2>
                    <p className="text-muted-foreground mb-6">Every stay is a story waiting to be told</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 dark:border-border/50">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Plane className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-primary">{bookingsData.bookings.length}</p>
                        <p className="text-xs text-muted-foreground">Total Trips</p>
                      </div>
                      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 dark:border-border/50">
                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <CalendarIcon className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <p className="text-2xl font-bold text-accent-foreground">{upcomingBookings.length}</p>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                      </div>
                      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 dark:border-border/50">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Euro className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          €{bookingsData.bookings.reduce((acc, b) => acc + (b.discount_amount || 0), 0).toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Saved</p>
                      </div>
                      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/50 dark:border-border/50">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {bookingsData.bookings.reduce((acc, b) => acc + differenceInDays(new Date(b.check_out), new Date(b.check_in)), 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Nights Booked</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Bookings - Premium Design */}
                {upcomingBookings.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        Upcoming Adventures
                      </h2>
                      <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">
                        {upcomingBookings.length} {upcomingBookings.length === 1 ? 'trip' : 'trips'} ahead
                      </Badge>
                    </div>
                    <div className="space-y-6">
                      {upcomingBookings.map((booking, idx) => {
                        const daysUntil = differenceInDays(new Date(booking.check_in), new Date());
                        const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in));
                        return (
                        <Card 
                          key={booking.booking_id} 
                          className="group relative overflow-hidden rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fadeInUp bg-gradient-to-br from-card to-card/80"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                          data-testid={`booking-${booking.booking_id}`}
                        >
                          {/* Decorative Elements */}
                          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                          
                          <div className="relative flex flex-col lg:flex-row">
                            {/* Image/Visual Section */}
                            <div className="lg:w-72 h-56 lg:h-auto relative flex-shrink-0 overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent">
                                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
                              </div>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                                <div className="text-center">
                                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-sm font-medium">Confirmed</span>
                                  </div>
                                  <div className="text-6xl font-bold mb-1">{daysUntil}</div>
                                  <div className="text-white/80 text-sm">{daysUntil === 1 ? 'day' : 'days'} to go!</div>
                                </div>
                              </div>
                              {/* Corner Badge */}
                              <div className="absolute top-4 left-4">
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
                                  <span className="text-xs font-semibold text-primary">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Content Section */}
                            <div className="flex-1 p-6 lg:p-8">
                              <div className="flex items-start justify-between mb-5">
                                <div>
                                  <h3 className="font-serif text-xl lg:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{booking.hotel_name}</h3>
                                  <div className="flex items-center gap-3 text-muted-foreground">
                                    <span className="flex items-center gap-1.5 text-sm">
                                      <Bed className="w-4 h-4" />
                                      {booking.room_type}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                    <span className="flex items-center gap-1.5 text-sm">
                                      <Users className="w-4 h-4" />
                                      {booking.adults} {booking.adults === 1 ? 'Adult' : 'Adults'}{booking.children > 0 ? `, ${booking.children} ${booking.children === 1 ? 'Child' : 'Children'}` : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Date Timeline */}
                              <div className="relative bg-gradient-to-r from-secondary/80 via-secondary/50 to-secondary/80 dark:from-secondary/50 dark:via-secondary/30 dark:to-secondary/50 rounded-2xl p-5 mb-5">
                                <div className="flex items-center justify-between relative">
                                  <div className="flex-1 text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Check-in</p>
                                    <p className="text-lg font-bold">{format(new Date(booking.check_in), 'EEE, MMM d')}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(booking.check_in), 'yyyy')}</p>
                                  </div>
                                  <div className="flex-shrink-0 px-4">
                                    <div className="w-20 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 relative">
                                      <Plane className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary dark:bg-card rounded-full p-0.5" />
                                    </div>
                                  </div>
                                  <div className="flex-1 text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Check-out</p>
                                    <p className="text-lg font-bold">{format(new Date(booking.check_out), 'EEE, MMM d')}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(booking.check_out), 'yyyy')}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Price & Savings */}
                              <div className="flex items-center justify-between pt-5 border-t border-border/50">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Paid</p>
                                    <p className="text-2xl font-bold text-primary">€{booking.final_price?.toFixed(2)}</p>
                                  </div>
                                  {booking.discount_amount > 0 && (
                                    <div className="bg-green-100 dark:bg-green-900/30 rounded-xl px-3 py-2">
                                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                        <Gift className="w-4 h-4" />
                                        <span className="font-semibold">Saved €{booking.discount_amount.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {/* Reference Info */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button size="sm" variant="ghost" className="rounded-full h-9 px-3">
                                        <Info className="w-4 h-4 mr-1" />
                                        Ref
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4" align="end">
                                      <p className="text-sm font-semibold mb-3">Booking References</p>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Booking ID:</span>
                                          <span className="font-mono text-xs">{booking.booking_id?.slice(-8)}</span>
                                        </div>
                                        {booking.confirmation_number && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Confirmation:</span>
                                            <span className="font-mono text-xs">{booking.confirmation_number}</span>
                                          </div>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  
                                  {/* Share Button */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button size="sm" variant="outline" className="rounded-full h-9 px-4">
                                        <Share2 className="w-4 h-4 mr-1.5" />
                                        Share
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2" align="end">
                                      <p className="text-xs text-muted-foreground mb-2 px-2">Share your upcoming trip</p>
                                      <div className="space-y-1">
                                        <button 
                                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`I'm going to ${booking.hotel_name} on ${format(new Date(booking.check_in), 'MMM d, yyyy')}! Booked with FreeStays - Room was FREE! 🎉`)}`, '_blank')}
                                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                            <MessageCircle className="w-4 h-4 text-white" />
                                          </div>
                                          WhatsApp
                                        </button>
                                        <button 
                                          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm going to ${booking.hotel_name}! Booked with @FreeStays - Room was FREE! 🎉`)}`, '_blank')}
                                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
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
                                  
                                  {/* Details Button */}
                                  <Button 
                                    size="sm" 
                                    className="rounded-full h-9 px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                                    onClick={() => openBookingDetails(booking)}
                                    data-testid={`view-details-${booking.booking_id}`}
                                  >
                                    View Details
                                    <ArrowRight className="w-4 h-4 ml-1.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )})}
                    </div>
                  </div>
                )}

                {/* Past Bookings - Memory Lane Style */}
                {pastBookings.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        </div>
                        Travel Memories
                      </h2>
                      <span className="text-sm text-muted-foreground">{pastBookings.length} past {pastBookings.length === 1 ? 'trip' : 'trips'}</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {pastBookings.map((booking, idx) => {
                        const nights = differenceInDays(new Date(booking.check_out), new Date(booking.check_in));
                        return (
                        <Card 
                          key={booking.booking_id} 
                          className="group relative overflow-hidden rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fadeInUp"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                          data-testid={`booking-past-${booking.booking_id}`}
                          onClick={() => openBookingDetails(booking)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative p-5">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Building2 className="w-7 h-7 text-primary/60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{booking.hotel_name}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {format(new Date(booking.check_in), 'MMM d')} - {format(new Date(booking.check_out), 'MMM d, yyyy')}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {nights} {nights === 1 ? 'night' : 'nights'}
                                  </Badge>
                                  {booking.discount_amount > 0 && (
                                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs border-0">
                                      Saved €{booking.discount_amount.toFixed(0)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">€{booking.final_price?.toFixed(0)}</p>
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ArrowRight className="w-5 h-5 text-primary" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )})}
                    </div>
                  </div>
                )}

                {/* Book Another Trip CTA */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary to-accent p-8 text-white">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="1" fill-rule="evenodd"/%3E%3C/svg%3E")'}} />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Ready for your next adventure?</h3>
                      <p className="text-white/80">Discover amazing hotels with FREE rooms waiting for you</p>
                    </div>
                    <Button 
                      onClick={() => navigate('/')} 
                      className="bg-white text-primary hover:bg-white/90 rounded-full px-8 h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Find Your Next Stay
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State - Inspiring Design */
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 p-12 text-center">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <Plane className="w-14 h-14 text-white" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold mb-4">Your Journey Begins Here</h3>
                  <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                    Imagine waking up in a beautiful hotel room that cost you nothing. 
                    With FreeStays, your room is FREE — you only pay for meals.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button 
                      onClick={() => navigate('/')} 
                      className="rounded-full px-8 h-14 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-xl hover:shadow-2xl transition-all" 
                      data-testid="find-hotels-btn"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Explore Hotels
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/about')} 
                      className="rounded-full px-8 h-14 text-lg border-2"
                    >
                      <Info className="w-5 h-5 mr-2" />
                      How It Works
                    </Button>
                  </div>
                  <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>450,000+ Hotels</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Room is FREE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Instant Booking</span>
                    </div>
                  </div>
                </div>
              </div>
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

// ==================== ABOUT PAGE REMOVED ====================
// Dead code removed - using imported AboutPage from @/pages/AboutPage instead
// Original code: ~147 lines (local AboutPage component)
// Removal date: January 2026

// ==================== REFER A FRIEND PAGE REMOVED ====================
// Dead code removed - using imported ReferFriendPage from @/pages/ReferFriendPage instead
// Original code: ~218 lines (local ReferFriendPage component)
// Removal date: January 2026

// ==================== CONTACT PAGE REMOVED ====================
// Dead code removed - using imported ContactPage from @/pages/ContactPage instead
// Original code: ~207 lines (local ContactPage component)
// Removal date: December 2025

// ==================== WHO WE ARE PAGE REMOVED ====================
// Dead code removed - using imported WhoWeArePage from @/pages/WhoWeArePage instead
// Original code: ~208 lines (local WhoWeArePage component)
// Removal date: December 2025

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

// Sortable Destination Item for drag-and-drop reordering
const SortableDestinationItem = ({ id, dest, index, updateDestination, removeDestination, handleDestImageUpload, uploadingDestImage, t }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-4 p-4 border rounded-lg bg-card ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-secondary rounded-md transition-colors"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      {/* Image Preview */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
        {dest.image ? (
          <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Image className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {/* Form Fields */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">{t('admin.cityName', 'City Name')}</Label>
          <Input 
            value={dest.name} 
            onChange={(e) => updateDestination(index, 'name', e.target.value)}
            placeholder="e.g. Barcelona"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t('admin.country', 'Country')}</Label>
          <Input 
            value={dest.country} 
            onChange={(e) => updateDestination(index, 'country', e.target.value)}
            placeholder="e.g. Spain"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t('admin.destinationId', 'Destination ID')}</Label>
          <Input 
            value={dest.destination_id} 
            onChange={(e) => updateDestination(index, 'destination_id', e.target.value)}
            placeholder="e.g. 17429"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t('admin.hotelCount', 'Hotel Count')}</Label>
          <Input 
            value={dest.hotels} 
            onChange={(e) => updateDestination(index, 'hotels', e.target.value)}
            placeholder="e.g. 2,100+"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">{t('admin.image', 'Image')}</Label>
          <div className="flex gap-2">
            <Input 
              value={dest.image} 
              onChange={(e) => updateDestination(index, 'image', e.target.value)}
              placeholder="URL or upload"
              className="flex-1"
            />
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleDestImageUpload(e, index)}
              />
              <Button type="button" size="sm" variant="outline" disabled={uploadingDestImage}>
                {uploadingDestImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </Button>
            </label>
          </div>
        </div>
      </div>
      
      {/* Delete Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-destructive hover:bg-destructive/10"
        onClick={() => removeDestination(index)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

// Admin Dashboard Page
const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Helper to safely extract error message from API responses (handles Pydantic validation errors)
  const getErrorMessage = (error, fallback = 'An error occurred') => {
    try {
      const detail = error?.response?.data?.detail;
      if (typeof detail === 'string') return String(detail);
      if (Array.isArray(detail)) {
        return detail.map(e => {
          if (typeof e === 'string') return e;
          if (e && typeof e.msg === 'string') return e.msg;
          return String(fallback);
        }).join(', ');
      }
      return String(fallback);
    } catch (e) {
      return String(fallback);
    }
  };
  
  // Safe toast wrapper to ensure we never pass objects to toast
  const safeToast = {
    error: (msg) => toast.error(typeof msg === 'string' ? msg : 'An error occurred'),
    success: (msg) => toast.success(typeof msg === 'string' ? msg : 'Success'),
    info: (msg) => toast.info(typeof msg === 'string' ? msg : 'Info'),
  };
  
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
  const [cacheStats, setCacheStats] = useState(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState(null);
  const [syncingDb, setSyncingDb] = useState(false);
  const [syncResults, setSyncResults] = useState(null);
  const [autoSyncSettings, setAutoSyncSettings] = useState(null);
  const [triggeringAutoSync, setTriggeringAutoSync] = useState(false);
  const [testingSunhotels, setTestingSunhotels] = useState(false);
  const [testingMysql, setTestingMysql] = useState(false);
  const [sunhotelsTestResult, setSunhotelsTestResult] = useState(null);
  const [mysqlTestResult, setMysqlTestResult] = useState(null);
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  
  // PWA Analytics state
  const [pwaAnalytics, setPwaAnalytics] = useState(null);
  const [pwaUpdates, setPwaUpdates] = useState([]);
  const [loadingPwaAnalytics, setLoadingPwaAnalytics] = useState(false);
  const [pushingUpdate, setPushingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('A new version of FreeStays is available! Please refresh the app to get the latest features.');
  
  // Email Forwarding state
  const [emailForwardingStatus, setEmailForwardingStatus] = useState(null);
  const [forwardedVouchers, setForwardedVouchers] = useState([]);
  const [loadingEmailForwarding, setLoadingEmailForwarding] = useState(false);
  const [triggeringForwarding, setTriggeringForwarding] = useState(false);
  
  // Referral Tiers Management state
  const [referralTiers, setReferralTiers] = useState([
    { name: "Starter", min: 0, max: 2, extraDiscount: 0 },
    { name: "Bronze", min: 3, max: 5, extraDiscount: 5 },
    { name: "Silver", min: 6, max: 9, extraDiscount: 10 },
    { name: "Gold", min: 10, max: 19, extraDiscount: 15 },
    { name: "Diamond", min: 20, max: 999, extraDiscount: 20 }
  ]);
  const [savingTiers, setSavingTiers] = useState(false);
  
  // Check-in Reminders state
  const [checkinReminderStatus, setCheckinReminderStatus] = useState(null);
  const [upcomingCheckins, setUpcomingCheckins] = useState([]);
  const [loadingCheckinReminders, setLoadingCheckinReminders] = useState(false);
  const [triggeringReminders, setTriggeringReminders] = useState(false);
  
  // Guest Feedback & Surveys state
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [updatingFeedbackStatus, setUpdatingFeedbackStatus] = useState(null);
  
  // Newsletter state
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [subscribedUsers, setSubscribedUsers] = useState([]);

  // Destinations state
  const [destinations, setDestinations] = useState([]);
  const [destinationsCount, setDestinationsCount] = useState(4);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [savingDestinations, setSavingDestinations] = useState(false);
  const [newDestination, setNewDestination] = useState({ name: '', country: '', image: '', hotels: '', destination_id: '' });
  const [uploadingDestImage, setUploadingDestImage] = useState(false);
  
  // Drag and drop sensors for destinations
  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [newsletterLogs, setNewsletterLogs] = useState([]);
  const [loadingNewsletter, setLoadingNewsletter] = useState(false);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [newsletterImageUrl, setNewsletterImageUrl] = useState('');
  const [uploadingNewsletterImage, setUploadingNewsletterImage] = useState(false);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [includeLastMinute, setIncludeLastMinute] = useState(true);
  
  // Last Minute b2c=1 state
  const [lastMinuteFetched, setLastMinuteFetched] = useState([]);
  const [lastMinuteStored, setLastMinuteStored] = useState([]);
  const [fetchingLastMinute, setFetchingLastMinute] = useState(false);
  const [savingLastMinute, setSavingLastMinute] = useState(false);
  const [lastMinuteDestination, setLastMinuteDestination] = useState('');
  const [lastMinuteCheckIn, setLastMinuteCheckIn] = useState('');
  const [lastMinuteCheckOut, setLastMinuteCheckOut] = useState('');
  const [lastMinuteFetchDone, setLastMinuteFetchDone] = useState(false);
  const [lastMinuteFetchInfo, setLastMinuteFetchInfo] = useState(null);
  
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
      const [settingsRes, statsRes, bookingsRes, usersRes, passCodesRes, testimonialsRes, referralsRes, referralStatsRes, comparisonsRes, followUpStatsRes, cacheStatsRes] = await Promise.all([
        axios.get(`${API}/admin/settings`, { headers }),
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/bookings`, { headers }),
        axios.get(`${API}/admin/users`, { headers }),
        axios.get(`${API}/admin/pass-codes`, { headers }).catch(() => ({ data: { codes: [], stats: { active: 0, used: 0 } } })),
        axios.get(`${API}/admin/testimonials`, { headers }).catch(() => ({ data: { testimonials: [] } })),
        axios.get(`${API}/admin/referrals`, { headers }).catch(() => ({ data: { referrals: [] } })),
        axios.get(`${API}/admin/referral-stats`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/admin/price-comparisons`, { headers }).catch(() => ({ data: { comparisons: [] } })),
        axios.get(`${API}/admin/follow-up-emails/stats`, { headers }).catch(() => ({ data: { pending_follow_ups: 0, sent_follow_ups: 0, total_with_email: 0 } })),
        axios.get(`${API}/admin/cache/stats`, { headers }).catch(() => ({ data: { autocomplete_cache: null } }))
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
      setCacheStats(cacheStatsRes.data?.autocomplete_cache || null);
      
      // Load DB sync status separately (non-blocking) as it's a heavy query
      axios.get(`${API}/admin/db-sync/status`, { headers, timeout: 30000 })
        .then(res => setDbSyncStatus(res.data))
        .catch(() => setDbSyncStatus({ error: "Failed to load sync status" }));
      
      // Load auto-sync settings
      axios.get(`${API}/admin/db-sync/auto-sync-settings`, { headers })
        .then(res => setAutoSyncSettings(res.data))
        .catch(() => setAutoSyncSettings(null));
      
      // Load PWA analytics (non-blocking)
      axios.get(`${API}/admin/pwa/analytics`, { headers })
        .then(res => setPwaAnalytics(res.data))
        .catch(() => setPwaAnalytics(null));
      
      // Load PWA update history
      axios.get(`${API}/admin/pwa/updates`, { headers })
        .then(res => setPwaUpdates(res.data.updates || []))
        .catch(() => setPwaUpdates([]));
      
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
  
  // PWA Analytics functions
  const loadPwaAnalytics = async () => {
    setLoadingPwaAnalytics(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [analyticsRes, updatesRes] = await Promise.all([
        axios.get(`${API}/admin/pwa/analytics`, { headers }),
        axios.get(`${API}/admin/pwa/updates`, { headers })
      ]);
      setPwaAnalytics(analyticsRes.data);
      setPwaUpdates(updatesRes.data.updates || []);
    } catch (error) {
      toast.error('Failed to load PWA analytics');
    } finally {
      setLoadingPwaAnalytics(false);
    }
  };
  
  const pushUpdateToAll = async () => {
    if (!updateMessage.trim()) {
      toast.error('Please enter an update message');
      return;
    }
    setPushingUpdate(true);
    try {
      const response = await axios.post(`${API}/admin/pwa/push-update`, {
        message: updateMessage,
        title: 'FreeStays Update Available'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(response.data.message || 'Update notification sent');
      loadPwaAnalytics(); // Refresh data
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to push update'));
    } finally {
      setPushingUpdate(false);
    }
  };
  
  // Email Forwarding functions
  const loadEmailForwardingData = async () => {
    setLoadingEmailForwarding(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [statusRes, historyRes] = await Promise.all([
        axios.get(`${API}/admin/email-forwarding/status`, { headers }),
        axios.get(`${API}/admin/email-forwarding/history?limit=20`, { headers })
      ]);
      setEmailForwardingStatus(statusRes.data);
      setForwardedVouchers(historyRes.data.vouchers || []);
    } catch (error) {
      toast.error('Failed to load email forwarding data');
    } finally {
      setLoadingEmailForwarding(false);
    }
  };
  
  const triggerEmailForwarding = async () => {
    setTriggeringForwarding(true);
    try {
      await axios.post(`${API}/admin/email-forwarding/trigger`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Email forwarding check started');
      // Refresh after a few seconds
      setTimeout(() => loadEmailForwardingData(), 5000);
    } catch (error) {
      toast.error('Failed to trigger email forwarding');
    } finally {
      setTriggeringForwarding(false);
    }
  };
  
  // Referral Tiers functions
  const loadReferralTiers = async () => {
    try {
      const response = await axios.get(`${API}/admin/referral-tiers`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (response.data.tiers && response.data.tiers.length > 0) {
        setReferralTiers(response.data.tiers);
      }
    } catch (error) {
      // Use default tiers if not found
      console.log('Using default referral tiers');
    }
  };
  
  const updateReferralTier = (index, field, value) => {
    const newTiers = [...referralTiers];
    newTiers[index] = { ...newTiers[index], [field]: parseInt(value) || 0 };
    setReferralTiers(newTiers);
  };
  
  const saveReferralTiers = async () => {
    setSavingTiers(true);
    try {
      await axios.post(`${API}/admin/referral-tiers`, { tiers: referralTiers }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Referral tiers saved successfully');
    } catch (error) {
      toast.error('Failed to save referral tiers');
    } finally {
      setSavingTiers(false);
    }
  };

  // Check-in Reminders functions
  const loadCheckinRemindersData = async () => {
    setLoadingCheckinReminders(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [statusRes, upcomingRes] = await Promise.all([
        axios.get(`${API}/admin/checkin-reminders/status`, { headers }),
        axios.get(`${API}/admin/checkin-reminders/upcoming?days=7`, { headers })
      ]);
      setCheckinReminderStatus(statusRes.data);
      setUpcomingCheckins(upcomingRes.data.bookings || []);
    } catch (error) {
      toast.error('Failed to load check-in reminders data');
    } finally {
      setLoadingCheckinReminders(false);
    }
  };
  
  const triggerCheckinReminders = async () => {
    setTriggeringReminders(true);
    try {
      await axios.post(`${API}/admin/checkin-reminders/trigger`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Check-in reminder check started');
      setTimeout(() => loadCheckinRemindersData(), 5000);
    } catch (error) {
      toast.error('Failed to trigger check-in reminders');
    } finally {
      setTriggeringReminders(false);
    }
  };

  // Guest Feedback functions
  const loadFeedbackData = async () => {
    setLoadingFeedback(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [feedbackRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/feedback${feedbackFilter !== 'all' ? `?status=${feedbackFilter}` : ''}`, { headers }),
        axios.get(`${API}/admin/feedback/stats`, { headers })
      ]);
      setFeedbackList(feedbackRes.data.feedback || []);
      setFeedbackStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load feedback data');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const updateFeedbackStatus = async (feedbackId, status, makePublic = false) => {
    setUpdatingFeedbackStatus(feedbackId);
    try {
      await axios.put(
        `${API}/admin/feedback/${feedbackId}/status?status=${status}&make_public=${makePublic}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(`Feedback ${status}${makePublic ? ' and published' : ''}`);
      loadFeedbackData();
    } catch (error) {
      toast.error('Failed to update feedback status');
    } finally {
      setUpdatingFeedbackStatus(null);
    }
  };

  const triggerFeedbackRequests = async () => {
    try {
      await axios.get(`${API}/admin/feedback/trigger-test`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Feedback request check triggered');
    } catch (error) {
      toast.error('Failed to trigger feedback requests');
    }
  };

  // Newsletter functions
  const loadNewsletterData = async () => {
    setLoadingNewsletter(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [subscribersRes, logsRes] = await Promise.all([
        axios.get(`${API}/admin/newsletter/subscribers`, { headers }),
        axios.get(`${API}/admin/newsletter/logs`, { headers })
      ]);
      setNewsletterSubscribers(subscribersRes.data.subscribers || []);
      setSubscribedUsers(subscribersRes.data.subscribed_users || []);
      setNewsletterLogs(logsRes.data.logs || []);
    } catch (error) {
      toast.error('Failed to load newsletter data');
    } finally {
      setLoadingNewsletter(false);
    }
  };

  const toggleUserNewsletterSubscription = async (userId, subscribed) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/newsletter?subscribed=${subscribed}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`User ${subscribed ? 'subscribed to' : 'unsubscribed from'} newsletter`);
      loadNewsletterData();
      loadData();
    } catch (error) {
      toast.error('Failed to update user subscription');
    }
  };

  const handleNewsletterImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingNewsletterImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/admin/newsletter/upload-image`, formData, {
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setNewsletterImageUrl(res.data.image_url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingNewsletterImage(false);
    }
  };

  const sendTestNewsletter = async () => {
    if (!newsletterSubject || !newsletterContent) {
      toast.error('Please fill in subject and content');
      return;
    }
    
    setSendingNewsletter(true);
    try {
      await axios.post(`${API}/admin/newsletter/test`, {
        subject: newsletterSubject,
        content: newsletterContent,
        image_url: newsletterImageUrl,
        include_last_minute: includeLastMinute
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Test newsletter sent to info@freestays.eu');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send test newsletter'));
    } finally {
      setSendingNewsletter(false);
    }
  };

  const sendNewsletter = async () => {
    if (!newsletterSubject || !newsletterContent) {
      toast.error('Please fill in subject and content');
      return;
    }
    
    const confirmed = window.confirm(`Send newsletter to all subscribers? This cannot be undone.`);
    if (!confirmed) return;
    
    setSendingNewsletter(true);
    try {
      const res = await axios.post(`${API}/admin/newsletter/send`, {
        subject: newsletterSubject,
        content: newsletterContent,
        image_url: newsletterImageUrl,
        include_last_minute: includeLastMinute,
        send_to_all: true
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`Newsletter sent! ${res.data.sent_count} delivered, ${res.data.failed_count} failed`);
      loadNewsletterData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to send newsletter'));
    } finally {
      setSendingNewsletter(false);
    }
  };

  // Last Minute b2c=1 functions (ISOLATED from b2c=0)
  const loadStoredLastMinute = async () => {
    try {
      const res = await axios.get(`${API}/admin/lastminute/stored`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setLastMinuteStored(res.data.offers || []);
    } catch (error) {
      console.error('Failed to load stored last minute offers');
    }
  };

  // Destinations functions
  const loadDestinations = async () => {
    setLoadingDestinations(true);
    try {
      const res = await axios.get(`${API}/admin/destinations`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setDestinations(res.data.destinations || []);
      setDestinationsCount(res.data.display_count || 4);
    } catch (error) {
      toast.error('Failed to load destinations');
    } finally {
      setLoadingDestinations(false);
    }
  };

  const saveDestinations = async () => {
    setSavingDestinations(true);
    try {
      await axios.put(`${API}/admin/destinations`, {
        destinations: destinations,
        display_count: destinationsCount
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(t('admin.destinationsSaved', 'Destinations saved successfully'));
    } catch (error) {
      toast.error('Failed to save destinations');
    } finally {
      setSavingDestinations(false);
    }
  };

  const addDestination = () => {
    if (!newDestination.name || !newDestination.country || !newDestination.destination_id) {
      toast.error(t('admin.fillRequiredFields', 'Please fill in name, country, and destination ID'));
      return;
    }
    setDestinations([...destinations, { ...newDestination }]);
    setNewDestination({ name: '', country: '', image: '', hotels: '', destination_id: '' });
    toast.success(t('admin.destinationAdded', 'Destination added'));
  };

  const removeDestination = (index) => {
    const newDest = [...destinations];
    newDest.splice(index, 1);
    setDestinations(newDest);
  };

  const updateDestination = (index, field, value) => {
    const newDest = [...destinations];
    newDest[index] = { ...newDest[index], [field]: value };
    setDestinations(newDest);
  };

  const handleDestImageUpload = async (e, index = null) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingDestImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/admin/destinations/upload-image`, formData, {
        headers: { 
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const imageUrl = `${API}${res.data.image_url}`;
      if (index !== null) {
        updateDestination(index, 'image', imageUrl);
      } else {
        setNewDestination({ ...newDestination, image: imageUrl });
      }
      toast.success(t('admin.imageUploaded', 'Image uploaded successfully'));
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingDestImage(false);
    }
  };

  const fetchLastMinuteOffers = async () => {
    // Validate dates are selected
    if (!lastMinuteCheckIn || !lastMinuteCheckOut) {
      safeToast.error('Please select check-in and check-out dates first');
      return;
    }
    
    setFetchingLastMinute(true);
    setLastMinuteDestination(''); // Reset city filter
    setLastMinuteFetchDone(false);
    setLastMinuteFetchInfo(null);
    try {
      const res = await axios.post(`${API}/admin/lastminute/fetch`, {
        check_in: lastMinuteCheckIn,
        check_out: lastMinuteCheckOut
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setLastMinuteFetched(res.data.hotels || []);
      setLastMinuteFetchInfo({
        total: res.data.total || 0,
        destinations_checked: res.data.destinations_checked || 0,
        cities_found: res.data.cities || {},
        check_in: lastMinuteCheckIn,
        check_out: lastMinuteCheckOut
      });
      setLastMinuteFetchDone(true);
      if (res.data.total > 0) {
        safeToast.success(`Downloaded ${res.data.total} b2c=1 offers from ${res.data.destinations_checked} worldwide destinations`);
      } else {
        safeToast.info(`No b2c=1 offers found for ${lastMinuteCheckIn} to ${lastMinuteCheckOut} (checked ${res.data.destinations_checked} destinations)`);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to download b2c=1 offers');
      safeToast.error(errorMessage);
      setLastMinuteFetchDone(true);
      setLastMinuteFetchInfo({
        total: 0,
        destinations_checked: 0,
        cities_found: {},
        check_in: lastMinuteCheckIn,
        check_out: lastMinuteCheckOut,
        error: true
      });
    } finally {
      setFetchingLastMinute(false);
    }
  };

  const saveLastMinuteOffers = async () => {
    // Filter by city if selected
    const hotelsToSave = lastMinuteDestination 
      ? lastMinuteFetched.filter(h => h.city === lastMinuteDestination)
      : lastMinuteFetched;
    
    if (hotelsToSave.length === 0) {
      toast.error('No offers to save');
      return;
    }
    
    setSavingLastMinute(true);
    try {
      await axios.post(`${API}/admin/lastminute/save`, {
        hotels: hotelsToSave,
        check_in: lastMinuteCheckIn || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        check_out: lastMinuteCheckOut || format(addDays(new Date(), 3), 'yyyy-MM-dd')
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success(`Saved ${hotelsToSave.length} offers to frontend`);
      loadStoredLastMinute();
      setLastMinuteFetched([]);
      setLastMinuteDestination('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save offers'));
    } finally {
      setSavingLastMinute(false);
    }
  };

  const clearLastMinuteOffers = async () => {
    if (!window.confirm('Clear all stored Last Minute offers?')) return;
    
    try {
      await axios.delete(`${API}/admin/lastminute/clear`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Cleared all Last Minute offers');
      setLastMinuteStored([]);
    } catch (error) {
      toast.error('Failed to clear offers');
    }
  };

  const toggleLastMinuteOffer = async (hotelId, isActive) => {
    try {
      await axios.put(`${API}/admin/lastminute/toggle/${hotelId}?is_active=${isActive}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      loadStoredLastMinute();
    } catch (error) {
      toast.error('Failed to toggle offer');
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
      toast.error(getErrorMessage(error, 'Failed to update testimonial'));
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
      toast.error(getErrorMessage(error, 'Failed to generate codes'));
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
      setValidationResult({ valid: false, message: getErrorMessage(error, 'Validation failed') });
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
      toast.error(getErrorMessage(error, 'Failed to delete code'));
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

  const runBatchSync = async (limit = 10) => {
    setSyncingDb(true);
    setSyncResults(null);
    try {
      const response = await axios.post(
        `${API}/admin/db-sync/batch?limit=${limit}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setSyncResults(response.data);
      toast.success(`Synced ${response.data.synced} hotels`);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Sync failed'));
    } finally {
      setSyncingDb(false);
    }
  };

  const syncSingleHotel = async (hotelId) => {
    try {
      const response = await axios.post(
        `${API}/admin/db-sync/sync-hotel/${hotelId}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success(response.data.message);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Sync failed'));
    }
  };

  const updateAutoSyncSettings = async (key, value) => {
    try {
      await axios.put(
        `${API}/admin/db-sync/auto-sync-settings`,
        { [key]: value },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success('Auto-sync settings updated');
      // Refresh auto-sync settings
      const res = await axios.get(`${API}/admin/db-sync/auto-sync-settings`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setAutoSyncSettings(res.data);
    } catch (error) {
      toast.error('Failed to update auto-sync settings');
    }
  };

  const triggerAutoSync = async () => {
    setTriggeringAutoSync(true);
    try {
      await axios.post(
        `${API}/admin/db-sync/trigger-auto-sync`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      toast.success('Auto-sync job triggered! Check back in a few minutes.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to trigger auto-sync'));
    } finally {
      setTriggeringAutoSync(false);
    }
  };

  const clearCache = async () => {
    setClearingCache(true);
    try {
      await axios.post(`${API}/admin/cache/clear`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      toast.success('Search cache cleared successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };

  const testSunhotelsConnection = async () => {
    setTestingSunhotels(true);
    setSunhotelsTestResult(null);
    try {
      const response = await axios.post(
        `${API}/admin/db-sync/test-sunhotels`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setSunhotelsTestResult(response.data);
      if (response.data.success) {
        toast.success('Sunhotels API connection successful');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      setSunhotelsTestResult({ success: false, message: error.response?.data?.detail || 'Connection test failed' });
      toast.error('Connection test failed');
    } finally {
      setTestingSunhotels(false);
    }
  };

  const testMysqlConnection = async () => {
    setTestingMysql(true);
    setMysqlTestResult(null);
    try {
      const response = await axios.post(
        `${API}/admin/db-sync/test-mysql`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setMysqlTestResult(response.data);
      if (response.data.success) {
        toast.success('MySQL connection successful');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      setMysqlTestResult({ success: false, message: error.response?.data?.detail || 'Connection test failed' });
      toast.error('Connection test failed');
    } finally {
      setTestingMysql(false);
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
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: 'Admin Dashboard' }
        ]} />
        
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
            <TabsTrigger value="destinations" onClick={() => loadDestinations()}>{t('admin.destinations', 'Destinations')}</TabsTrigger>
            <TabsTrigger value="comparison">Price Compare</TabsTrigger>
            <TabsTrigger value="lastminute" onClick={() => loadStoredLastMinute()}>Last Minute</TabsTrigger>
            <TabsTrigger value="passcodes">Pass Codes</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="referral-tiers" onClick={() => loadReferralTiers()}>Referral Tiers</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="feedback" onClick={() => loadFeedbackData()}>Surveys & Feedback</TabsTrigger>
            <TabsTrigger value="newsletter" onClick={() => loadNewsletterData()}>Newsletter</TabsTrigger>
            <TabsTrigger value="contact">Contact Page</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="email-forwarding" onClick={() => loadEmailForwardingData()}>Email Forwarding</TabsTrigger>
            <TabsTrigger value="checkin-reminders" onClick={() => loadCheckinRemindersData()}>Check-in Reminders</TabsTrigger>
            <TabsTrigger value="pwa" onClick={() => loadPwaAnalytics()}>PWA Analytics</TabsTrigger>
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

            {/* Search Cache Performance Widget */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Search Cache Performance
                    </CardTitle>
                    <CardDescription>Autocomplete search optimization stats</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearCache}
                    disabled={clearingCache}
                  >
                    {clearingCache ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Clear Cache
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cacheStats ? (
                  <div className="space-y-4">
                    {/* Hit Rate Gauge */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-secondary"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${parseFloat(cacheStats.hit_rate) * 3.51} 351`}
                            className="text-green-500"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold">{cacheStats.hit_rate}</span>
                          <span className="text-xs text-muted-foreground">Hit Rate</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{cacheStats.hits}</p>
                        <p className="text-xs text-muted-foreground">Cache Hits</p>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{cacheStats.misses}</p>
                        <p className="text-xs text-muted-foreground">Cache Misses</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cacheStats.size}</p>
                        <p className="text-xs text-muted-foreground">Cached Items</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{cacheStats.max_size}</p>
                        <p className="text-xs text-muted-foreground">Max Capacity</p>
                      </div>
                    </div>

                    {/* Info Bar */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        TTL: {Math.floor(cacheStats.ttl_seconds / 60)} minutes
                      </span>
                      <span className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        {((cacheStats.size / cacheStats.max_size) * 100).toFixed(0)}% used
                      </span>
                    </div>

                    {/* Performance Tip */}
                    {parseFloat(cacheStats.hit_rate) > 50 && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">Cache is performing well!</p>
                          <p className="text-xs text-green-600 dark:text-green-400">Most searches are being served from cache (40x faster)</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(cacheStats.hit_rate) <= 50 && cacheStats.hits + cacheStats.misses > 10 && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Cache warming up</p>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">Hit rate will improve as users perform more searches</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Cache statistics unavailable</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Database Sync Widget */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" />
                      Hotel Images Database Sync
                    </CardTitle>
                    <CardDescription>Sync missing hotel images from Sunhotels API to local database</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSyncSettings(!showSyncSettings)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {showSyncSettings ? 'Hide Settings' : 'Settings'}
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => runBatchSync(10)}
                      disabled={syncingDb}
                    >
                      {syncingDb ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Sync 10 Hotels
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Connection Test Section - Always Visible */}
                {showSyncSettings && (
                  <div className="p-4 bg-secondary/30 rounded-lg space-y-4">
                    <p className="font-semibold text-sm">Connection Tests</p>
                    
                    {/* Sunhotels API Test */}
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">Sunhotels API</p>
                          <p className="text-xs text-muted-foreground">xml.sunhotels.net/15</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sunhotelsTestResult && (
                          <Badge variant={sunhotelsTestResult.success ? "default" : "destructive"} className="text-xs">
                            {sunhotelsTestResult.success ? "Connected" : "Failed"}
                          </Badge>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={testSunhotelsConnection}
                          disabled={testingSunhotels}
                        >
                          {testingSunhotels ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Sunhotels Test Result Details */}
                    {sunhotelsTestResult?.details && (
                      <div className="ml-8 p-2 bg-secondary/50 rounded text-xs space-y-1">
                        <p><span className="text-muted-foreground">Endpoint:</span> {sunhotelsTestResult.details.api_endpoint}</p>
                        <p><span className="text-muted-foreground">Username:</span> {sunhotelsTestResult.details.username}</p>
                        {sunhotelsTestResult.details.test_hotel && (
                          <p><span className="text-muted-foreground">Test Hotel:</span> {sunhotelsTestResult.details.test_hotel} ({sunhotelsTestResult.details.images_found} images)</p>
                        )}
                      </div>
                    )}

                    {/* MySQL Database Test */}
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">MySQL Database</p>
                          <p className="text-xs text-muted-foreground">Static hotel data</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {mysqlTestResult && (
                          <Badge variant={mysqlTestResult.success ? "default" : "destructive"} className="text-xs">
                            {mysqlTestResult.success ? "Connected" : mysqlTestResult.details?.configured === false ? "Not Configured" : "Failed"}
                          </Badge>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={testMysqlConnection}
                          disabled={testingMysql}
                        >
                          {testingMysql ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* MySQL Test Result Details */}
                    {mysqlTestResult?.details && mysqlTestResult.success && (
                      <div className="ml-8 p-2 bg-secondary/50 rounded text-xs space-y-1">
                        <p><span className="text-muted-foreground">Host:</span> {mysqlTestResult.details.host}</p>
                        <p><span className="text-muted-foreground">Database:</span> {mysqlTestResult.details.database}</p>
                        <p><span className="text-muted-foreground">Hotels in Lookup:</span> {mysqlTestResult.details.hotels_in_lookup?.toLocaleString()}</p>
                        <p><span className="text-muted-foreground">Hotels with Images:</span> {mysqlTestResult.details.hotels_with_images?.toLocaleString()}</p>
                      </div>
                    )}
                    
                    {/* Configure MySQL Link */}
                    {mysqlTestResult?.details?.configured === false && (
                      <div className="ml-8 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                        <p className="text-yellow-700 dark:text-yellow-400">
                          MySQL database not configured. Go to <strong>Settings</strong> tab → <strong>Static Database Connection</strong> to configure.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {dbSyncStatus && !dbSyncStatus.error ? (
                  <div className="space-y-4">
                    {/* Coverage Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Image Coverage</span>
                        <span className="font-semibold">{dbSyncStatus.coverage_percent}%</span>
                      </div>
                      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${dbSyncStatus.coverage_percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dbSyncStatus.total_hotels_in_lookup?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Hotels</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{dbSyncStatus.lookup_hotels_with_images?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">With Images</p>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{dbSyncStatus.lookup_hotels_missing_images?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Missing Images</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dbSyncStatus.hotels_with_images_in_bravo?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">In Bravo Table</p>
                      </div>
                    </div>

                    {/* Batch Sync Options */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => runBatchSync(5)} disabled={syncingDb}>
                        Sync 5
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => runBatchSync(20)} disabled={syncingDb}>
                        Sync 20
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => runBatchSync(50)} disabled={syncingDb}>
                        Sync 50
                      </Button>
                    </div>

                    {/* Sync Results */}
                    {syncResults && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <p className="text-sm font-semibold mb-2">Last Sync Results</p>
                        <div className="flex flex-wrap gap-3 text-sm mb-2">
                          <span className="text-green-600 dark:text-green-400">✓ {syncResults.synced} with images</span>
                          {syncResults.no_images > 0 && (
                            <span className="text-yellow-600 dark:text-yellow-400">○ {syncResults.no_images} no images in API</span>
                          )}
                          {syncResults.failed > 0 && (
                            <span className="text-red-600 dark:text-red-400">✗ {syncResults.failed} errors</span>
                          )}
                        </div>
                        {syncResults.message && (
                          <p className="text-xs text-muted-foreground mb-2">{syncResults.message}</p>
                        )}
                        {syncResults.results && syncResults.results.length > 0 && (
                          <ScrollArea className="h-32 mt-2">
                            <div className="space-y-1 text-xs">
                              {syncResults.results.map((r, i) => (
                                <div key={i} className="flex items-center justify-between py-1 border-b border-border/30">
                                  <span className="truncate max-w-[200px]">{r.name}</span>
                                  <Badge 
                                    variant={r.status === 'synced' ? 'default' : r.status === 'no_images_in_api' ? 'outline' : 'secondary'} 
                                    className={`text-xs ${r.status === 'no_images_in_api' ? 'text-yellow-600 border-yellow-400' : ''}`}
                                  >
                                    {r.status === 'synced' ? `${r.images} imgs` : r.status === 'no_images_in_api' ? 'no images' : r.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    )}

                    {/* Sample Missing Hotels */}
                    {dbSyncStatus.sample_missing && dbSyncStatus.sample_missing.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-muted-foreground">Hotels Missing Images (sample)</p>
                        <ScrollArea className="h-40">
                          <div className="space-y-1">
                            {dbSyncStatus.sample_missing.map((hotel, i) => (
                              <div key={i} className="flex items-center justify-between py-2 px-3 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{hotel.name}</p>
                                  <p className="text-xs text-muted-foreground">{hotel.country} • ID: {hotel.hotel_id}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => syncSingleHotel(hotel.hotel_id)}
                                  className="h-7 px-2"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                ) : dbSyncStatus?.error ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-red-500" />
                    <p className="text-red-500">{dbSyncStatus.error}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Database sync status unavailable</p>
                    <p className="text-xs mt-1">Configure static database connection in Settings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto-Sync Settings Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-500" />
                      Scheduled Auto-Sync
                    </CardTitle>
                    <CardDescription>Automatically sync hotel images daily at 3:00 AM UTC</CardDescription>
                  </div>
                  {autoSyncSettings && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {autoSyncSettings.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <Switch
                        checked={autoSyncSettings.enabled}
                        onCheckedChange={(checked) => updateAutoSyncSettings('enabled', checked)}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {autoSyncSettings ? (
                  <div className="space-y-4">
                    {/* Batch Size Setting */}
                    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">Batch Size</p>
                        <p className="text-xs text-muted-foreground">Hotels to sync per run (10-200)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="10"
                          max="200"
                          value={autoSyncSettings.batch_size}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 10 && val <= 200) {
                              updateAutoSyncSettings('batch_size', val);
                            }
                          }}
                          className="w-20 h-8"
                        />
                      </div>
                    </div>

                    {/* Last Run Info */}
                    {autoSyncSettings.last_run && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <p className="text-sm font-medium mb-2">Last Auto-Sync</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(autoSyncSettings.last_run).toLocaleString()}
                        </p>
                        {autoSyncSettings.last_result && (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="text-green-600 dark:text-green-400">
                                ✓ {autoSyncSettings.last_result.synced} with images
                              </span>
                              {autoSyncSettings.last_result.no_images > 0 && (
                                <span className="text-yellow-600 dark:text-yellow-400">
                                  ○ {autoSyncSettings.last_result.no_images} no images in API
                                </span>
                              )}
                              {autoSyncSettings.last_result.failed > 0 && (
                                <span className="text-red-600 dark:text-red-400">
                                  ✗ {autoSyncSettings.last_result.failed} errors
                                </span>
                              )}
                            </div>
                            {autoSyncSettings.last_result.message && (
                              <p className="text-xs text-muted-foreground">
                                {autoSyncSettings.last_result.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Trigger Button */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={triggerAutoSync}
                        disabled={triggeringAutoSync || !autoSyncSettings.enabled}
                      >
                        {triggeringAutoSync ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        Run Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadData}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Status
                      </Button>
                    </div>

                    {/* Schedule Info */}
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Next run: Daily at 3:00 AM UTC
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Loading auto-sync settings...</p>
                  </div>
                )}
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
                            toast.error(getErrorMessage(error, 'Failed to upload logo'));
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
                          toast.error(getErrorMessage(error, 'Failed to send test email'));
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
                                        toast.error(getErrorMessage(error, 'Failed to send email'));
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
                                          toast.error(getErrorMessage(error, 'Failed to send voucher'));
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
            {/* B2C=1 Fetch Section */}
            <Card className="border-2 border-red-200 bg-red-50/30 dark:bg-red-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  Download B2C=1 Last Minute Offers
                </CardTitle>
                <CardDescription>
                  Download available last minute deals from Sunhotels API (b2c=1) for your selected dates. This is <strong>completely isolated</strong> from normal search (b2c=0).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Selection - REQUIRED before fetch */}
                <div className="flex flex-wrap items-end gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Check-in Date *</Label>
                    <Input
                      type="date"
                      value={lastMinuteCheckIn}
                      onChange={(e) => setLastMinuteCheckIn(e.target.value)}
                      className="w-40"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium">Check-out Date *</Label>
                    <Input
                      type="date"
                      value={lastMinuteCheckOut}
                      onChange={(e) => setLastMinuteCheckOut(e.target.value)}
                      className="w-40"
                      min={lastMinuteCheckIn || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <Button 
                    onClick={fetchLastMinuteOffers} 
                    disabled={fetchingLastMinute || !lastMinuteCheckIn || !lastMinuteCheckOut} 
                    size="lg" 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {fetchingLastMinute ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Downloading from 67 destinations...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Download B2C=1 Offers
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Select dates and click download. This will fetch last minute offers from <strong>67 worldwide destinations</strong> (Europe, Asia, Americas, Africa, Oceania) using the b2c=1 API.
                </p>

                {/* Fetched Results - Show after fetch is done */}
                {lastMinuteFetchDone && (
                  <div className="mt-6 space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        {lastMinuteFetched.length > 0 ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Found {lastMinuteFetched.length} B2C=1 Offers for {lastMinuteFetchInfo?.check_in} to {lastMinuteFetchInfo?.check_out}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            No B2C=1 Offers Found for {lastMinuteFetchInfo?.check_in} to {lastMinuteFetchInfo?.check_out}
                          </>
                        )}
                      </h4>
                      {lastMinuteFetched.length > 0 && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Filter by City:</Label>
                            <select
                              value={lastMinuteDestination}
                              onChange={(e) => setLastMinuteDestination(e.target.value)}
                              className="h-9 px-3 border rounded-md bg-background text-sm min-w-[180px]"
                            >
                              <option value="">All Cities ({lastMinuteFetched.length})</option>
                              {[...new Set(lastMinuteFetched.map(h => h.city))].filter(Boolean).sort().map(city => (
                                <option key={city} value={city}>{city} ({lastMinuteFetched.filter(h => h.city === city).length})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Summary Info */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                      <p>Checked <strong>{lastMinuteFetchInfo?.destinations_checked || 0}</strong> destinations worldwide</p>
                      {lastMinuteFetchInfo?.cities_found && typeof lastMinuteFetchInfo.cities_found === 'object' && !Array.isArray(lastMinuteFetchInfo.cities_found) && Object.keys(lastMinuteFetchInfo.cities_found).length > 0 && (
                        <p className="mt-1">Cities with offers: {Object.keys(lastMinuteFetchInfo.cities_found).join(', ')}</p>
                      )}
                      {lastMinuteFetched.length === 0 && (
                        <p className="mt-2 text-orange-600 dark:text-orange-400">
                          No last minute (b2c=1) availability for these dates. Try different dates or check back later - last minute deals update frequently.
                        </p>
                      )}
                    </div>
                    
                    {/* Hotel Grid */}
                    {lastMinuteFetched.length > 0 && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-2">
                          {lastMinuteFetched
                            .filter(h => !lastMinuteDestination || h.city === lastMinuteDestination)
                            .map(hotel => (
                            <Card key={hotel.hotel_id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                              <img 
                                src={hotel.image_url || 'https://via.placeholder.com/200x100?text=No+Image'} 
                                alt={hotel.name}
                                className="w-full h-20 object-cover"
                              />
                              <div className="p-2">
                                <p className="font-medium text-xs truncate" title={hotel.name}>{hotel.name}</p>
                                <p className="text-xs text-muted-foreground">{hotel.city}, {hotel.country}</p>
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-sm font-bold text-green-600">€{hotel.min_price}</p>
                                  {hotel.star_rating && <Badge variant="outline" className="text-xs">{hotel.star_rating}★</Badge>}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {lastMinuteFetched.filter(h => !lastMinuteDestination || h.city === lastMinuteDestination).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No offers match the current filter</p>
                          </div>
                        )}
                        
                        <div className="flex gap-3 pt-4 border-t">
                          <Button onClick={saveLastMinuteOffers} disabled={savingLastMinute} className="bg-green-600 hover:bg-green-700">
                            {savingLastMinute ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save {lastMinuteDestination ? lastMinuteFetched.filter(h => h.city === lastMinuteDestination).length : lastMinuteFetched.length} Offers to Frontend
                          </Button>
                          <Button variant="outline" onClick={() => { setLastMinuteFetched([]); setLastMinuteFetchDone(false); setLastMinuteFetchInfo(null); }}>
                            Clear Results
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Currently Stored Offers */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Stored Last Minute Offers (Showing on Frontend)
                    </CardTitle>
                    <CardDescription>These offers are currently displayed in the Last Minute section on the homepage</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadStoredLastMinute}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                    {lastMinuteStored.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={clearLastMinuteOffers}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {lastMinuteStored.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No Last Minute offers stored</p>
                    <p className="text-sm mt-1">Download b2c=1 offers above and save them to display on frontend</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lastMinuteStored.map(offer => (
                      <div key={offer.hotel_id} className={`flex items-center gap-4 p-3 border rounded-lg ${offer.is_active ? 'bg-green-50 dark:bg-green-950/20' : 'bg-gray-100 dark:bg-gray-800 opacity-60'}`}>
                        <img 
                          src={offer.image_url || 'https://via.placeholder.com/80x60'} 
                          alt={offer.name}
                          className="w-20 h-14 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{offer.name}</p>
                          <p className="text-sm text-muted-foreground">{offer.city}, {offer.country}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">€{offer.min_price}</p>
                          <Badge variant={offer.is_active ? 'default' : 'secondary'}>
                            {offer.is_active ? 'Active' : 'Hidden'}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={offer.is_active ? 'destructive' : 'default'}
                          onClick={() => toggleLastMinuteOffer(offer.hotel_id, !offer.is_active)}
                        >
                          {offer.is_active ? 'Hide' : 'Show'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Display Settings
                </CardTitle>
                <CardDescription>Configure how last minute deals appear on the homepage</CardDescription>
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
                  </div>
                </div>

                <div>
                  <Label>Section Title</Label>
                  <Input 
                    placeholder="Last Minute Offers"
                    value={settings.last_minute_title || ''}
                    onChange={(e) => updateSetting('last_minute_title', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Section Subtitle</Label>
                  <Input 
                    placeholder="Book now and save up to 30% on selected hotels"
                    value={settings.last_minute_subtitle || ''}
                    onChange={(e) => updateSetting('last_minute_subtitle', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">How B2C=1 Works</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1">
                      <li>• <strong>b2c=1</strong> is Sunhotels' dedicated Last Minute API - completely separate from normal search (b2c=0)</li>
                      <li>• Select check-in and check-out dates, then click "Download B2C=1 Offers"</li>
                      <li>• Fetches from <strong>67 worldwide destinations</strong> (Europe, Asia, Americas, Africa, Oceania)</li>
                      <li>• Filter results by city, then save selected offers to frontend</li>
                      <li>• Stored offers are shown in the "Last Minute" section on the homepage</li>
                      <li>• If no offers are stored, visitors will see a "subscribe to newsletter" message</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Destinations Tab */}
          <TabsContent value="destinations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {t('admin.popularDestinations', 'Popular Destinations')}
                </CardTitle>
                <CardDescription>
                  {t('admin.destinationsDesc', 'Configure the featured destinations shown on the homepage. Add cities with images and Sunhotels destination IDs.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Display Count Setting */}
                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                  <Label className="font-medium">{t('admin.displayCount', 'Number of destinations to display:')}</Label>
                  <Select value={String(destinationsCount)} onValueChange={(v) => setDestinationsCount(parseInt(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Existing Destinations */}
                {loadingDestinations ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{t('admin.currentDestinations', 'Current Destinations')} ({destinations.length})</h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <GripVertical className="w-3 h-3" /> {t('admin.dragToReorder', 'Drag to reorder')}
                      </span>
                    </div>
                    <DndContext 
                      sensors={dndSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (active.id !== over?.id) {
                          const oldIndex = destinations.findIndex((_, i) => `dest-${i}` === active.id);
                          const newIndex = destinations.findIndex((_, i) => `dest-${i}` === over?.id);
                          setDestinations(arrayMove(destinations, oldIndex, newIndex));
                        }
                      }}
                    >
                      <SortableContext items={destinations.map((_, i) => `dest-${i}`)} strategy={verticalListSortingStrategy}>
                        {destinations.map((dest, index) => (
                          <SortableDestinationItem
                            key={`dest-${index}`}
                            id={`dest-${index}`}
                            dest={dest}
                            index={index}
                            updateDestination={updateDestination}
                            removeDestination={removeDestination}
                            handleDestImageUpload={handleDestImageUpload}
                            uploadingDestImage={uploadingDestImage}
                            t={t}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}

                {/* Add New Destination */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">{t('admin.addNewDestination', 'Add New Destination')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('admin.cityName', 'City Name')}</Label>
                      <Input 
                        value={newDestination.name} 
                        onChange={(e) => setNewDestination({...newDestination, name: e.target.value})}
                        placeholder="e.g. Paris"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('admin.country', 'Country')}</Label>
                      <Input 
                        value={newDestination.country} 
                        onChange={(e) => setNewDestination({...newDestination, country: e.target.value})}
                        placeholder="e.g. France"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('admin.destinationId', 'Destination ID')}</Label>
                      <Input 
                        value={newDestination.destination_id} 
                        onChange={(e) => setNewDestination({...newDestination, destination_id: e.target.value})}
                        placeholder="Sunhotels ID"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('admin.hotelCount', 'Hotel Count')}</Label>
                      <Input 
                        value={newDestination.hotels} 
                        onChange={(e) => setNewDestination({...newDestination, hotels: e.target.value})}
                        placeholder="e.g. 1,500+"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('admin.imageUrl', 'Image URL')}</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={newDestination.image} 
                          onChange={(e) => setNewDestination({...newDestination, image: e.target.value})}
                          placeholder="URL or upload"
                          className="flex-1"
                        />
                        <label className="cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleDestImageUpload(e, null)}
                          />
                          <Button type="button" size="sm" variant="outline" disabled={uploadingDestImage}>
                            {uploadingDestImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                          </Button>
                        </label>
                      </div>
                    </div>
                    <Button onClick={addDestination} className="h-10">
                      <Plus className="w-4 h-4 mr-2" />
                      {t('admin.add', 'Add')}
                    </Button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={loadDestinations}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('common.reload', 'Reload')}
                  </Button>
                  <Button onClick={saveDestinations} disabled={savingDestinations}>
                    {savingDestinations ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {t('admin.saveDestinations', 'Save Destinations')}
                  </Button>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('admin.howToFindDestId', 'How to find Destination IDs')}</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc pl-4">
                    <li>{t('admin.destIdTip1', 'Search for a city on the search page')}</li>
                    <li>{t('admin.destIdTip2', 'The destination ID appears in the URL after clicking a city suggestion')}</li>
                    <li>{t('admin.destIdTip3', 'Example: /search?destination=Barcelona&destinationId=17429 → ID is 17429')}</li>
                  </ul>
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
                              toast.error(getErrorMessage(error, 'Import failed'));
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
                    {passCodes.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Generate CSV from current filtered results
                          const headers = ['Code', 'Type', 'Status', 'Source', 'User Name', 'Email', 'Created/Purchased', 'Expires', 'Price'];
                          const csvRows = [headers.join(',')];
                          
                          passCodes.forEach(code => {
                            const row = [
                              code.code,
                              code.pass_type === 'annual' ? 'Annual' : 'One-Time',
                              code.status,
                              code.source === 'purchase' ? 'Purchased' : 'Admin Generated',
                              code.user_name || '-',
                              code.purchased_by || code.used_by || '-',
                              code.created_at ? new Date(code.created_at).toLocaleDateString() : '-',
                              code.expires_at ? new Date(code.expires_at).toLocaleDateString() : (code.pass_type === 'one_time' ? 'Single use' : '-'),
                              code.price || (code.pass_type === 'annual' ? '129' : '35')
                            ];
                            csvRows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
                          });
                          
                          const csvContent = csvRows.join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.setAttribute('href', url);
                          link.setAttribute('download', `pass_codes_${passCodeSearch ? 'filtered_' + passCodeSearch : 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          toast.success(`Exported ${passCodes.length} pass codes to CSV`);
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export {passCodeSearch ? 'Filtered' : 'All'} ({passCodes.length})
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

          {/* Newsletter Tab */}
          <TabsContent value="newsletter">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{newsletterSubscribers.length}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Newsletter Subscribers</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <User className="w-5 h-5 text-accent" />
                    <span className="text-2xl font-bold">{subscribedUsers.length}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">User Subscribers</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Send className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold">{newsletterLogs.length}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Campaigns Sent</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold">
                      {newsletterLogs.reduce((sum, log) => sum + (log.sent_count || 0), 0)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Emails Sent</p>
                </Card>
              </div>

              {/* Compose Newsletter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="w-5 h-5" />
                    Compose Newsletter
                  </CardTitle>
                  <CardDescription>Create and send newsletters to your subscribers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      value={newsletterSubject}
                      onChange={(e) => setNewsletterSubject(e.target.value)}
                      placeholder="Newsletter subject line..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={newsletterContent}
                      onChange={(e) => setNewsletterContent(e.target.value)}
                      placeholder="Write your newsletter content here... HTML is supported."
                      className="min-h-[200px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Newsletter Image (optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleNewsletterImageUpload}
                        disabled={uploadingNewsletterImage}
                      />
                      {uploadingNewsletterImage && <Loader2 className="w-5 h-5 animate-spin" />}
                    </div>
                    {newsletterImageUrl && (
                      <div className="mt-2">
                        <img src={newsletterImageUrl} alt="Newsletter" className="max-w-xs rounded-lg" />
                        <Button variant="ghost" size="sm" onClick={() => setNewsletterImageUrl('')} className="mt-1">
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeLastMinute"
                      checked={includeLastMinute}
                      onChange={(e) => setIncludeLastMinute(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="includeLastMinute">Include Last Minute deals in newsletter</Label>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={sendTestNewsletter}
                      disabled={sendingNewsletter || !newsletterSubject || !newsletterContent}
                    >
                      {sendingNewsletter ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Send Test to info@freestays.eu
                    </Button>
                    <Button 
                      onClick={sendNewsletter}
                      disabled={sendingNewsletter || !newsletterSubject || !newsletterContent}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {sendingNewsletter ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      Send to All Subscribers
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subscribers List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Newsletter Subscribers</CardTitle>
                      <CardDescription>Manage your newsletter mailing list</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadNewsletterData} disabled={loadingNewsletter}>
                      {loadingNewsletter ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {newsletterSubscribers.length === 0 && subscribedUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No subscribers yet</p>
                      ) : (
                        <>
                          {newsletterSubscribers.map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                              <div>
                                <p className="font-medium">{sub.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  Subscribed: {sub.subscribed_at ? format(new Date(sub.subscribed_at), 'MMM d, yyyy') : 'N/A'}
                                </p>
                              </div>
                              <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                                {sub.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          ))}
                          {subscribedUsers.map((user, idx) => (
                            <div key={`user-${idx}`} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <div>
                                <p className="font-medium">{user.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.first_name} {user.last_name} (Registered User)
                                </p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-700">User</Badge>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* User Newsletter Management */}
              <Card>
                <CardHeader>
                  <CardTitle>User Newsletter Subscriptions</CardTitle>
                  <CardDescription>Toggle newsletter subscription for registered users</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {users?.filter(u => u.email).map(user => (
                        <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.first_name} {user.last_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={user.newsletter_subscribed ? 'default' : 'outline'}>
                              {user.newsletter_subscribed ? 'Subscribed' : 'Not Subscribed'}
                            </Badge>
                            <Button
                              size="sm"
                              variant={user.newsletter_subscribed ? 'destructive' : 'default'}
                              onClick={() => toggleUserNewsletterSubscription(user.user_id, !user.newsletter_subscribed)}
                            >
                              {user.newsletter_subscribed ? 'Unsubscribe' : 'Subscribe'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Newsletter History */}
              <Card>
                <CardHeader>
                  <CardTitle>Send History</CardTitle>
                  <CardDescription>Recent newsletter campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  {newsletterLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No newsletters sent yet</p>
                  ) : (
                    <div className="space-y-3">
                      {newsletterLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                          <div>
                            <p className="font-medium">{log.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.sent_at ? format(new Date(log.sent_at), 'MMM d, yyyy HH:mm') : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="text-green-600 font-medium">{log.sent_count}</span> delivered
                            </p>
                            {log.failed_count > 0 && (
                              <p className="text-xs text-red-500">{log.failed_count} failed</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
                      toast.error(getErrorMessage(error, 'Failed to update user'));
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
                        toast.error(getErrorMessage(error, 'Failed to delete user'));
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

          {/* Surveys & Feedback Tab */}
          <TabsContent value="feedback">
            <div className="space-y-6">
              {/* Feedback Stats Overview */}
              {feedbackStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{feedbackStats.counts?.total || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Total Feedback</p>
                  </Card>
                  <Card className="p-4 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{feedbackStats.counts?.pending || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                  </Card>
                  <Card className="p-4 border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold">{feedbackStats.counts?.approved || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </Card>
                  <Card className="p-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <span className="text-2xl font-bold">{feedbackStats.counts?.public_reviews || 0}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-2xl font-bold">{feedbackStats.average_ratings?.overall || '-'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </Card>
                </div>
              )}

              {/* Analytics Charts */}
              {feedbackStats && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Rating Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Rating Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = feedbackStats.rating_distribution?.[rating] || 0;
                          const total = Object.values(feedbackStats.rating_distribution || {}).reduce((a, b) => a + b, 0);
                          const percent = total > 0 ? (count / total * 100) : 0;
                          return (
                            <div key={rating} className="flex items-center gap-3">
                              <div className="flex items-center gap-1 w-12">
                                <span className="font-medium">{rating}</span>
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              </div>
                              <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-400 transition-all"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-12">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Response Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Response Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                        <span>Feedback Requests Sent</span>
                        <span className="font-bold">{feedbackStats.response_stats?.requests_sent || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                        <span>Responses Received</span>
                        <span className="font-bold">{feedbackStats.response_stats?.responses_received || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                        <span className="font-medium">Response Rate</span>
                        <span className="font-bold text-green-600">{feedbackStats.response_stats?.response_rate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                        <span className="font-medium">Would Recommend</span>
                        <span className="font-bold text-blue-600">{feedbackStats.recommend_rate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                        <span>Reviews (Last 30 Days)</span>
                        <span className="font-bold">{feedbackStats.recent_30_days || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detailed Ratings Breakdown */}
              {feedbackStats?.average_ratings && Object.keys(feedbackStats.average_ratings).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category Ratings</CardTitle>
                    <CardDescription>Average scores by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Object.entries(feedbackStats.average_ratings).map(([key, value]) => (
                        <div key={key} className="text-center p-4 bg-secondary/30 rounded-xl">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <span className="text-2xl font-bold">{value}</span>
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{key}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Travel Type Breakdown */}
              {feedbackStats?.travel_breakdown?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Traveler Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {feedbackStats.travel_breakdown.map(item => (
                        <Badge key={item.type} variant="secondary" className="px-4 py-2 text-sm">
                          <span className="capitalize">{item.type}</span>
                          <span className="ml-2 text-muted-foreground">({item.count})</span>
                          <span className="ml-2 flex items-center">
                            {item.avg_rating} <Star className="w-3 h-3 ml-0.5 fill-yellow-400 text-yellow-400" />
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feedback List */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Guest Feedback</CardTitle>
                      <CardDescription>Review and manage guest submissions</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={feedbackFilter}
                        onChange={(e) => {
                          setFeedbackFilter(e.target.value);
                          setTimeout(() => loadFeedbackData(), 100);
                        }}
                        className="h-9 px-3 border rounded-md bg-background"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <Button variant="outline" size="sm" onClick={loadFeedbackData} disabled={loadingFeedback}>
                        {loadingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={triggerFeedbackRequests}>
                        <Mail className="w-4 h-4 mr-1" />
                        Send Requests
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {feedbackList.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No feedback submissions yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Feedback requests are sent automatically 3 days after checkout
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4">
                        {feedbackList.map(feedback => (
                          <Card key={feedback.feedback_id} className={`p-4 ${
                            feedback.status === 'approved' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' : 
                            feedback.status === 'rejected' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' : 
                            'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20'
                          }`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                {/* Header with rating and status */}
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-4 h-4 ${i < feedback.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                                    ))}
                                  </div>
                                  <Badge className={
                                    feedback.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                    feedback.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                    'bg-yellow-100 text-yellow-700'
                                  }>
                                    {feedback.status}
                                  </Badge>
                                  {feedback.is_public && (
                                    <Badge className="bg-blue-100 text-blue-700">
                                      <Globe className="w-3 h-3 mr-1" />
                                      Published
                                    </Badge>
                                  )}
                                  {feedback.would_recommend && (
                                    <Badge variant="outline" className="text-green-600">
                                      <ThumbsUp className="w-3 h-3 mr-1" />
                                      Recommends
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Title and content */}
                                <h4 className="font-semibold">{feedback.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">"{feedback.review_text}"</p>
                                
                                {/* Category ratings */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {feedback.cleanliness_rating && (
                                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                                      Cleanliness: {feedback.cleanliness_rating}/5
                                    </span>
                                  )}
                                  {feedback.service_rating && (
                                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                                      Service: {feedback.service_rating}/5
                                    </span>
                                  )}
                                  {feedback.value_rating && (
                                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                                      Value: {feedback.value_rating}/5
                                    </span>
                                  )}
                                </div>
                                
                                {/* Meta info */}
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <span>Hotel: {feedback.hotel_name || 'N/A'}</span>
                                  {feedback.travel_type && (
                                    <span className="capitalize">Type: {feedback.travel_type}</span>
                                  )}
                                  <span>{feedback.submitted_at ? format(new Date(feedback.submitted_at), 'MMM d, yyyy HH:mm') : ''}</span>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex flex-col gap-2">
                                {feedback.status !== 'approved' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700" 
                                      onClick={() => updateFeedbackStatus(feedback.feedback_id, 'approved', false)}
                                      disabled={updatingFeedbackStatus === feedback.feedback_id}
                                    >
                                      {updatingFeedbackStatus === feedback.feedback_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4 mr-1" />
                                          Approve
                                        </>
                                      )}
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="bg-blue-600 hover:bg-blue-700" 
                                      onClick={() => updateFeedbackStatus(feedback.feedback_id, 'approved', true)}
                                      disabled={updatingFeedbackStatus === feedback.feedback_id}
                                    >
                                      <Globe className="w-4 h-4 mr-1" />
                                      Publish
                                    </Button>
                                  </>
                                )}
                                {feedback.status === 'approved' && !feedback.is_public && (
                                  <Button 
                                    size="sm" 
                                    className="bg-blue-600 hover:bg-blue-700" 
                                    onClick={() => updateFeedbackStatus(feedback.feedback_id, 'approved', true)}
                                    disabled={updatingFeedbackStatus === feedback.feedback_id}
                                  >
                                    <Globe className="w-4 h-4 mr-1" />
                                    Publish
                                  </Button>
                                )}
                                {feedback.status !== 'rejected' && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => updateFeedbackStatus(feedback.feedback_id, 'rejected', false)}
                                    disabled={updatingFeedbackStatus === feedback.feedback_id}
                                  >
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

              {/* Info Card */}
              <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">How Feedback Works</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1">
                        <li>• Feedback requests are sent automatically 3 days after checkout (10 AM UTC)</li>
                        <li>• Guests can rate cleanliness, service, value, location, and amenities</li>
                        <li>• Approved feedback can be published as public reviews on hotel pages</li>
                        <li>• Click "Send Requests" to manually trigger the feedback email job</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

          {/* Email Forwarding Tab */}
          <TabsContent value="email-forwarding">
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Sunhotels Email Forwarding
                      </CardTitle>
                      <CardDescription>Automatically forward voucher emails with FreeStays branding</CardDescription>
                    </div>
                    <Button 
                      onClick={triggerEmailForwarding}
                      disabled={triggeringForwarding}
                      className="rounded-full"
                    >
                      {triggeringForwarding ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4 mr-2" /> Check Now</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingEmailForwarding ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : emailForwardingStatus ? (
                    <div className="space-y-6">
                      {/* Status Overview */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="bg-secondary/30 rounded-xl p-4 text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${emailForwardingStatus.configured ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {emailForwardingStatus.configured ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                          </div>
                          <p className="font-semibold">{emailForwardingStatus.configured ? 'Configured' : 'Not Configured'}</p>
                          <p className="text-xs text-muted-foreground">IMAP Status</p>
                        </div>
                        <div className="bg-secondary/30 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-primary">{emailForwardingStatus.total_forwarded || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Forwarded</p>
                        </div>
                        <div className="bg-secondary/30 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-green-600">{emailForwardingStatus.forwarded_today || 0}</p>
                          <p className="text-sm text-muted-foreground">Forwarded Today</p>
                        </div>
                        <div className="bg-secondary/30 rounded-xl p-4 text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${emailForwardingStatus.scheduler_running ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {emailForwardingStatus.scheduler_running ? <Activity className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <p className="font-semibold">{emailForwardingStatus.scheduler_running ? 'Running' : 'Stopped'}</p>
                          <p className="text-xs text-muted-foreground">{emailForwardingStatus.next_check}</p>
                        </div>
                      </div>
                      
                      {/* Configuration Details */}
                      <div className="bg-muted/30 rounded-xl p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Settings className="w-4 h-4" /> Configuration
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">IMAP Server:</span>
                            <span className="ml-2 font-mono">{emailForwardingStatus.imap_server || 'Not set'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <span className="ml-2 font-mono">{emailForwardingStatus.imap_email || 'Not set'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Click "Check Now" to load status</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Forwarded Vouchers History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recent Forwarded Vouchers
                  </CardTitle>
                  <CardDescription>History of voucher emails forwarded to customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {forwardedVouchers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No forwarded vouchers yet</p>
                      <p className="text-sm">Vouchers will appear here when emails are forwarded</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {forwardedVouchers.map((voucher, index) => (
                          <Card key={index} className="p-4 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-primary border-primary">
                                    {voucher.sunhotels_ref}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(voucher.forwarded_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="font-medium">{voucher.voucher_info?.hotel_name || 'Hotel'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {voucher.voucher_info?.client_name} • {voucher.voucher_info?.check_in} to {voucher.voucher_info?.check_out}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {voucher.voucher_info?.voucher_link && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={voucher.voucher_info.voucher_link} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
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
            </div>
          </TabsContent>

          {/* Referral Tiers Management Tab */}
          <TabsContent value="referral-tiers">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Referral Reward Tiers
                      </CardTitle>
                      <CardDescription>Configure the referral program tiers and their extra discount percentages</CardDescription>
                    </div>
                    <Button 
                      onClick={saveReferralTiers}
                      disabled={savingTiers}
                      className="rounded-full"
                    >
                      {savingTiers ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Tier Cards */}
                    <div className="grid md:grid-cols-5 gap-4">
                      {referralTiers.map((tier, index) => {
                        const tierColors = [
                          { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300', icon: '⭐' },
                          { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-400', icon: '🥉' },
                          { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-400', icon: '🥈' },
                          { bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-400', icon: '🥇' },
                          { bg: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-400', icon: '💎' }
                        ];
                        const color = tierColors[index] || tierColors[0];
                        
                        return (
                          <Card key={tier.name} className={`p-4 ${color.bg} border-2 ${color.border}`}>
                            <div className="text-center mb-4">
                              <span className="text-3xl">{color.icon}</span>
                              <h3 className="font-bold text-lg mt-2">{tier.name}</h3>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Min Referrals</Label>
                                <Input 
                                  type="number"
                                  value={tier.min}
                                  onChange={(e) => updateReferralTier(index, 'min', e.target.value)}
                                  className="h-9 text-center"
                                  min={0}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Max Referrals</Label>
                                <Input 
                                  type="number"
                                  value={tier.max}
                                  onChange={(e) => updateReferralTier(index, 'max', e.target.value)}
                                  className="h-9 text-center"
                                  min={tier.min}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Extra Discount %</Label>
                                <div className="relative">
                                  <Input 
                                    type="number"
                                    value={tier.extraDiscount}
                                    onChange={(e) => updateReferralTier(index, 'extraDiscount', e.target.value)}
                                    className="h-9 text-center pr-8"
                                    min={0}
                                    max={100}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-dashed text-center">
                              <p className="text-xs text-muted-foreground">Reward:</p>
                              <p className="font-semibold text-sm text-primary">
                                €15 {tier.extraDiscount > 0 ? `+ ${tier.extraDiscount}%` : ''}
                              </p>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    
                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" /> How Referral Tiers Work
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Each user earns <strong>€15</strong> base reward per successful referral</li>
                        <li>• <strong>Extra Discount %</strong> is applied to their next booking on top of the base reward</li>
                        <li>• Gold tier users automatically receive a <strong>FREE Annual Pass</strong></li>
                        <li>• Diamond tier users get <strong>VIP status</strong> and lifetime benefits</li>
                      </ul>
                    </div>
                    
                    {/* Preview Section */}
                    <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Tier Preview (as shown to users)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {referralTiers.map((tier, index) => (
                          <Badge 
                            key={tier.name} 
                            variant={index === 0 ? "outline" : "default"}
                            className={index === 3 ? "bg-yellow-500" : index === 4 ? "bg-gradient-to-r from-cyan-500 to-blue-500" : ""}
                          >
                            {tier.name}: {tier.min}-{tier.max === 999 ? '∞' : tier.max} refs → +{tier.extraDiscount}%
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Check-in Reminders Tab */}
          <TabsContent value="checkin-reminders">
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-green-500" />
                        Check-in Reminder Emails
                      </CardTitle>
                      <CardDescription>Automatic reminder emails sent 3 days before check-in</CardDescription>
                    </div>
                    <Button 
                      onClick={triggerCheckinReminders}
                      disabled={triggeringReminders}
                      className="rounded-full"
                    >
                      {triggeringReminders ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" /> Send Now</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingCheckinReminders ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : checkinReminderStatus ? (
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                          <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{checkinReminderStatus.total_sent || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Sent</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                          <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{checkinReminderStatus.sent_today || 0}</p>
                        <p className="text-sm text-muted-foreground">Sent Today</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{checkinReminderStatus.pending_3days || 0}</p>
                        <p className="text-sm text-muted-foreground">Pending (3 days)</p>
                      </div>
                      <div className="bg-secondary/50 rounded-xl p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                          <Activity className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">{checkinReminderStatus.next_check}</p>
                        <p className="text-xs text-muted-foreground">Next Check</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Click tab to load status</p>
                  )}
                  
                  {checkinReminderStatus?.last_reminder && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                      <h4 className="font-semibold text-sm mb-2">Last Reminder Sent</h4>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">To:</span> {checkinReminderStatus.last_reminder.guest_email}
                          <span className="text-muted-foreground ml-4">Hotel:</span> {checkinReminderStatus.last_reminder.hotel_name}
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(checkinReminderStatus.last_reminder.checkin_reminder_sent_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Upcoming Check-ins */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Upcoming Check-ins (Next 7 Days)
                  </CardTitle>
                  <CardDescription>Guests arriving soon - reminders will be sent 3 days before</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingCheckins.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No upcoming check-ins in the next 7 days</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {upcomingCheckins.map((booking, index) => {
                          const checkInDate = new Date(booking.check_in);
                          const today = new Date();
                          const daysUntil = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <Card key={index} className={`p-4 ${daysUntil <= 3 ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={daysUntil <= 3 ? "default" : "outline"} className={daysUntil <= 3 ? "bg-amber-500" : ""}>
                                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                                    </Badge>
                                    {booking.checkin_reminder_sent && (
                                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Reminder Sent
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-semibold">{booking.guest_first_name} {booking.guest_last_name}</p>
                                  <p className="text-sm text-muted-foreground">{booking.hotel_name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {booking.check_in} → {booking.check_out} • {booking.guest_email}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-primary">{new Date(booking.check_in).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
              
              {/* Info Box */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How Check-in Reminders Work</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Reminders are sent automatically at <strong>9:00 AM UTC</strong> daily</li>
                        <li>• Guests receive an email <strong>3 days before</strong> their check-in date</li>
                        <li>• Email includes booking details, voucher link, and a pre-trip checklist</li>
                        <li>• Each booking only receives <strong>one reminder</strong> (tracked in database)</li>
                        <li>• Click "Send Now" to manually check and send pending reminders</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PWA Analytics Tab */}
          <TabsContent value="pwa">
            <div className="space-y-6">
              {/* PWA Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Download className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{pwaAnalytics?.total_installs || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Installs</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <User className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold">{pwaAnalytics?.registered_users || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Registered Users</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl font-bold">{pwaAnalytics?.anonymous_users || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Anonymous Users</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <span className="text-2xl font-bold">{pwaAnalytics?.active_last_7_days || 0}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Active (7 days)</p>
                </Card>
              </div>

              {/* Push Update Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Push Update to All Devices
                  </CardTitle>
                  <CardDescription>
                    Send update notification to all users who have installed the app. This will prompt them to refresh.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Update Message</Label>
                    <Textarea 
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      placeholder="Enter the update message to send to users..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={pushUpdateToAll}
                      disabled={pushingUpdate || !pwaAnalytics?.total_installs}
                      className="bg-primary"
                    >
                      {pushingUpdate ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Push Update to {pwaAnalytics?.total_installs || 0} Devices
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={loadPwaAnalytics} disabled={loadingPwaAnalytics}>
                      {loadingPwaAnalytics ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      <span className="ml-2">Refresh Data</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Push updates use Service Worker cache invalidation. Users will see a refresh prompt on their next visit.
                  </p>
                </CardContent>
              </Card>

              {/* Platform & Browser Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Platform Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pwaAnalytics?.platforms && Object.keys(pwaAnalytics.platforms).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(pwaAnalytics.platforms).map(([platform, count]) => (
                          <div key={platform} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-muted-foreground" />
                              <span className="capitalize">{platform}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{count}</span>
                              <span className="text-xs text-muted-foreground">
                                ({pwaAnalytics.total_installs ? Math.round(count / pwaAnalytics.total_installs * 100) : 0}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Browser Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pwaAnalytics?.browsers && Object.keys(pwaAnalytics.browsers).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(pwaAnalytics.browsers).map(([browser, count]) => (
                          <div key={browser} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <span className="capitalize">{browser}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{count}</span>
                              <span className="text-xs text-muted-foreground">
                                ({pwaAnalytics.total_installs ? Math.round(count / pwaAnalytics.total_installs * 100) : 0}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Installs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Installs
                  </CardTitle>
                  <CardDescription>
                    Last 10 app installations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pwaAnalytics?.recent_installs?.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Browser</TableHead>
                            <TableHead>Installed</TableHead>
                            <TableHead>Last Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pwaAnalytics.recent_installs.map((install) => (
                            <TableRow key={install.install_id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {install.is_registered_user ? (
                                    <Badge className="bg-green-100 text-green-700">Registered</Badge>
                                  ) : (
                                    <Badge variant="outline">Anonymous</Badge>
                                  )}
                                  {install.user_email && (
                                    <span className="text-xs text-muted-foreground">{install.user_email}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="capitalize">{install.platform || 'Unknown'}</span>
                              </TableCell>
                              <TableCell>
                                <span className="capitalize">{install.browser || 'Unknown'}</span>
                              </TableCell>
                              <TableCell>
                                {install.installed_at ? format(new Date(install.installed_at), 'MMM d, HH:mm') : '-'}
                              </TableCell>
                              <TableCell>
                                {install.last_active ? format(new Date(install.last_active), 'MMM d, HH:mm') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No app installs yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        When users install the FreeStays app, they will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Update History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Update Push History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pwaUpdates?.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        {pwaUpdates.map((update) => (
                          <div key={update.update_id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{update.title || 'Update Notification'}</p>
                                <p className="text-sm text-muted-foreground">{update.message}</p>
                              </div>
                              <Badge variant="outline">{update.target_installs} devices</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {update.created_at ? format(new Date(update.created_at), 'MMM d, yyyy HH:mm') : '-'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No updates pushed yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Additional Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pwaAnalytics?.active_last_30_days || 0}</p>
                      <p className="text-sm text-muted-foreground">Active (30 days)</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pwaAnalytics?.push_enabled || 0}</p>
                      <p className="text-sm text-muted-foreground">Push Enabled</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {pwaAnalytics?.total_installs && pwaAnalytics?.active_last_7_days 
                          ? Math.round(pwaAnalytics.active_last_7_days / pwaAnalytics.total_installs * 100)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Retention Rate</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ==================== APP ====================

// Email Verification Reminder Banner
const EmailVerificationReminder = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Don't show if no user, already verified, or dismissed this session
  if (!user || user.email_verified || dismissed) return null;
  
  const handleResendVerification = async () => {
    setResending(true);
    try {
      const token = localStorage.getItem('freestays_token');
      await axios.post(`${API}/auth/resend-verification`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };
  
  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800" data-testid="email-verification-banner">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>
              Please verify your email address to unlock all features.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800 text-xs px-3 h-7"
              onClick={handleResendVerification}
              disabled={resending}
            >
              {resending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
              Resend Email
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-6 h-6 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper for ReferFriendPage to pass user from App.js's internal useAuth
const ReferFriendPageWrapper = () => {
  const { user } = useAuth();
  return <ReferFriendPage user={user} />;
};

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
      {/* CheckoutPage removed - dead code, using Stripe Hosted Checkout instead */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/who-we-are" element={<WhoWeArePage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/refer-a-friend" element={<ReferFriendPageWrapper />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/survey" element={<SurveyPage />} />
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
          <PWAInstallProvider>
            <BrowserRouter>
              <div className="App min-h-screen bg-background text-foreground transition-colors duration-300">
                <Header />
                <EmailVerificationReminder />
                <AppRouter />
                <InstallAppPrompt />
                <CookieConsent />
                <Toaster position="top-center" richColors />
              </div>
            </BrowserRouter>
          </PWAInstallProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
