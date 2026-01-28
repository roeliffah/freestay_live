import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Star, 
  Hotel, 
  Calendar, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Heart
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const RatingStars = ({ value, onChange, label, description }) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star 
              className={`w-8 h-8 transition-colors ${
                star <= (hover || value) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-200'
              }`} 
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const TravelTypeSelector = ({ value, onChange }) => {
  const types = [
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'leisure', label: 'Leisure', icon: '🌴' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 'couple', label: 'Couple', icon: '💑' },
    { id: 'solo', label: 'Solo', icon: '🧳' }
  ];
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">How did you travel?</Label>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`px-4 py-2 rounded-full border transition-all ${
              value === type.id 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-background hover:bg-secondary/50 border-border'
            }`}
          >
            <span className="mr-1">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SurveyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [bookingInfo, setBookingInfo] = useState(null);
  
  // Form state
  const [ratings, setRatings] = useState({
    overall: 0,
    cleanliness: 0,
    service: 0,
    value: 0,
    location: 0,
    amenities: 0
  });
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [travelType, setTravelType] = useState('');
  
  useEffect(() => {
    if (!token) {
      setError('No survey token provided');
      setLoading(false);
      return;
    }
    
    validateToken();
  }, [token]);
  
  const validateToken = async () => {
    try {
      const res = await fetch(`${API_URL}/api/survey/validate/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Invalid or expired survey link');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBookingInfo(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to validate survey link');
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (ratings.overall === 0) {
      toast.error('Please provide an overall rating');
      return;
    }
    if (ratings.cleanliness === 0 || ratings.service === 0 || ratings.value === 0) {
      toast.error('Please rate cleanliness, service, and value');
      return;
    }
    if (!title.trim()) {
      toast.error('Please add a title for your review');
      return;
    }
    if (!reviewText.trim() || reviewText.length < 20) {
      toast.error('Please write at least 20 characters in your review');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/survey/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingInfo.booking_id,
          survey_token: token,
          overall_rating: ratings.overall,
          cleanliness_rating: ratings.cleanliness,
          service_rating: ratings.service,
          value_rating: ratings.value,
          location_rating: ratings.location || null,
          amenities_rating: ratings.amenities || null,
          title: title.trim(),
          review_text: reviewText.trim(),
          would_recommend: wouldRecommend,
          travel_type: travelType || null,
          photos: []
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to submit survey');
      }
      
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Survey Unavailable</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold">Thank You!</h2>
          </div>
          <CardContent className="pt-6 text-center">
            <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Your feedback has been submitted</h3>
            <p className="text-muted-foreground mb-6">
              We truly appreciate you taking the time to share your experience. 
              Your review helps other travelers and helps us improve!
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full">
                <Heart className="w-4 h-4 mr-2" />
                Book Your Next Stay
              </Button>
              <p className="text-xs text-muted-foreground">
                Use your FreeStays Pass for commission-free bookings!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/assets/logo.png" 
            alt="FreeStays" 
            className="h-10 mx-auto mb-4"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1 className="text-3xl font-bold mb-2">How Was Your Stay?</h1>
          <p className="text-muted-foreground">
            Share your experience to help other travelers
          </p>
        </div>
        
        {/* Booking Info Card */}
        {bookingInfo && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Hotel className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{bookingInfo.hotel_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Checked out: {bookingInfo.check_out}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Survey Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Rate Your Experience
            </CardTitle>
            <CardDescription>
              Your honest feedback helps us improve and assists other travelers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Overall Rating */}
              <div className="p-4 bg-secondary/30 rounded-xl">
                <RatingStars 
                  value={ratings.overall}
                  onChange={(v) => setRatings(prev => ({ ...prev, overall: v }))}
                  label="Overall Experience *"
                  description="How would you rate your overall stay?"
                />
              </div>
              
              {/* Detailed Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RatingStars 
                  value={ratings.cleanliness}
                  onChange={(v) => setRatings(prev => ({ ...prev, cleanliness: v }))}
                  label="Cleanliness *"
                />
                <RatingStars 
                  value={ratings.service}
                  onChange={(v) => setRatings(prev => ({ ...prev, service: v }))}
                  label="Service *"
                />
                <RatingStars 
                  value={ratings.value}
                  onChange={(v) => setRatings(prev => ({ ...prev, value: v }))}
                  label="Value for Money *"
                />
                <RatingStars 
                  value={ratings.location}
                  onChange={(v) => setRatings(prev => ({ ...prev, location: v }))}
                  label="Location"
                />
                <RatingStars 
                  value={ratings.amenities}
                  onChange={(v) => setRatings(prev => ({ ...prev, amenities: v }))}
                  label="Amenities"
                />
              </div>
              
              {/* Would Recommend */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Would you recommend this hotel?</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={wouldRecommend ? 'default' : 'outline'}
                    onClick={() => setWouldRecommend(true)}
                    className="flex-1"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Yes, definitely!
                  </Button>
                  <Button
                    type="button"
                    variant={!wouldRecommend ? 'destructive' : 'outline'}
                    onClick={() => setWouldRecommend(false)}
                    className="flex-1"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Not really
                  </Button>
                </div>
              </div>
              
              {/* Travel Type */}
              <TravelTypeSelector value={travelType} onChange={setTravelType} />
              
              {/* Review Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Review Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience in a few words"
                  maxLength={100}
                />
              </div>
              
              {/* Review Text */}
              <div className="space-y-2">
                <Label htmlFor="review">Your Review *</Label>
                <Textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about your stay. What did you enjoy? What could be improved?"
                  className="min-h-[150px]"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {reviewText.length}/2000 characters
                </p>
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Submit My Review
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                By submitting, you agree that your review may be published on our platform 
                to help other travelers. We may contact you for clarification if needed.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SurveyPage;
