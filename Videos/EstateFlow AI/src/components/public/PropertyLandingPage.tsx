import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  MapPin, 
  DollarSign, 
  Bed, 
  Bath, 
  Maximize, 
  Phone, 
  Mail, 
  User,
  Calendar,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Video,
  Info,
  MessageSquare,
  X,
  Share2,
  Facebook,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { LeadBot } from '../bot/LeadBot';

export default function PropertyLandingPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: 'I am interested in this property and would like to schedule a showing.'
  });

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() });
          // Increment view count
          await updateDoc(docRef, {
            view_count: increment(1)
          });
        } else {
          toast.error("Property not found");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !listing) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        listing_id: id,
        user_id: listing.user_id,
        source: 'Landing Page',
        created_at: serverTimestamp(),
        status: 'New'
      });
      setSubmitted(true);
      toast.success("Thank you! We'll be in touch soon.");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Property Not Found</h1>
        <p className="text-white/60 mb-8 text-center">The property you're looking for might have been removed or the link is incorrect.</p>
        <a href="/" className="bg-orange-500 text-black px-8 py-3 rounded-2xl font-bold">Back to Home</a>
      </div>
    );
  }

  const propertyData = listing.input_data || {};
  const outputData = listing.output_data || {};

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30">
      {/* Hero Section with Video/Image */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        {outputData.video_url ? (
          <video 
            src={outputData.video_url} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center">
            <Video className="w-24 h-24 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/40" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-block bg-orange-500 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              Featured Listing
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
              {propertyData.address || propertyData.location || 'Luxury Property'}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-xl font-bold">
              <span className="flex items-center gap-2 text-orange-500">
                <DollarSign className="w-6 h-6" /> {propertyData.price || 'Contact for Price'}
              </span>
              <span className="flex items-center gap-2 text-white/60">
                <MapPin className="w-6 h-6" /> {propertyData.location || propertyData.address}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-16">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
              <Bed className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Beds</p>
              <p className="text-2xl font-bold">{propertyData.beds || 'N/A'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
              <Bath className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Baths</p>
              <p className="text-2xl font-bold">{propertyData.baths || 'N/A'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
              <Maximize className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Sqft</p>
              <p className="text-2xl font-bold">{propertyData.sqft || 'N/A'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
              <Info className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Type</p>
              <p className="text-2xl font-bold">{propertyData.propertyType || 'Residential'}</p>
            </div>
          </div>

          {/* Description */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">About this Property</h2>
            <div className="text-lg text-white/70 leading-relaxed space-y-4">
              {outputData.website ? (
                <div className="whitespace-pre-wrap">{outputData.website}</div>
              ) : (
                <p>{propertyData.description || 'No description provided.'}</p>
              )}
            </div>
          </section>

          {/* Map Integration */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Location</h2>
            <div className="w-full h-[400px] rounded-[32px] overflow-hidden border border-white/10 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(propertyData.address || propertyData.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </section>
        </div>

        {/* Sidebar - Lead Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-8">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Inquiry Sent!</h3>
                    <p className="text-white/60">We've received your message and will get back to you within 24 hours.</p>
                  </div>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-orange-500 font-bold text-sm uppercase tracking-widest hover:underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Interested?</h3>
                    <p className="text-white/60 text-sm">Fill out the form below and we'll contact you shortly.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input 
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input 
                          required
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input 
                          required
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="(555) 000-0000"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Message</label>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-orange-500 transition-all resize-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-orange-500 text-black py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-orange-400 transition-all disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                      Schedule Showing
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Agent Info */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Listed By</p>
                <h4 className="text-xl font-bold">{propertyData.agentName || 'Professional Agent'}</h4>
                <p className="text-sm text-white/60">{propertyData.agentPhone || 'Contact for Phone'}</p>
              </div>
            </div>

            {/* Social Sharing */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Share this property</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href={`https://www.instagram.com/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-2xl w-[400px] h-[600px] mb-4 overflow-hidden flex flex-col"
            >
              <div className="bg-orange-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-black font-bold">Property Assistant</h3>
                    <p className="text-black/60 text-xs font-medium">Online • Ask me anything</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <LeadBot isEmbedded={true} listingId={id} agentId={propertyData.user_id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setShowChat(!showChat)}
          className="w-16 h-16 bg-orange-500 text-black rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/20 hover:scale-110 transition-transform"
        >
          {showChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="font-black text-black text-xs">EF</span>
            </div>
            <span className="font-bold tracking-tight">EstateFlow<span className="text-orange-500">AI</span></span>
          </div>
          <p className="text-white/40 text-sm">© 2026 EstateFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
