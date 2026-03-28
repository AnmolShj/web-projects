import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Mail, 
  Instagram, 
  Facebook, 
  Globe,
  Loader2,
  ChevronRight,
  Building2,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ListingData {
  address: string;
  price: string;
  beds: string;
  baths: string;
  sqft: string;
  features: string;
  neighborhood: string;
  propertyType: string;
}

export function ListingGenerator() {
  const { user } = useAuth();
  const [data, setData] = useState<ListingData>({
    address: '',
    price: '',
    beds: '',
    baths: '',
    sqft: '',
    features: '',
    neighborhood: '',
    propertyType: 'Single Family',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedListingId, setSavedListingId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<{
    mls: string;
    instagram: string;
    facebook: string;
    email: string | { subject: string; body: string };
    website: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'mls' | 'instagram' | 'facebook' | 'email' | 'website'>('mls');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const generateListings = async () => {
    if (!data.address) {
      toast.error("Please enter a property address");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate professional real estate marketing content for the following property:
      Address: ${data.address}
      Price: ${data.price}
      Beds: ${data.beds}, Baths: ${data.baths}, Sqft: ${data.sqft}
      Type: ${data.propertyType}
      Features: ${data.features}
      Neighborhood: ${data.neighborhood}

      Generate 5 distinct pieces of content:
      1. MLS Description: Professional, detailed, and SEO-optimized.
      2. Instagram Caption: High-energy, emoji-rich, with hashtags.
      3. Facebook Post: Engaging, community-focused.
      4. Email Newsletter: Compelling subject line and body for potential buyers.
      5. Website Listing: Comprehensive, structured for a property page.

      Format the output as a JSON object with keys: mls, instagram, facebook, email, website.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setOutputs(result);
      toast.success("Marketing content generated successfully!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveListing = async () => {
    if (!outputs || !user?.id) return;
    setIsSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'listings'), {
        user_id: user.id,
        type: 'listing',
        input_data: data,
        output_data: outputs,
        view_count: 0,
        created_at: serverTimestamp()
      });
      setSavedListingId(docRef.id);
      toast.success("Listing saved to your dashboard!");
    } catch (error) {
      console.error('Failed to save listing:', error);
      toast.error("Failed to save listing");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, tab: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-left space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">AI Listing Generator</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Generate SEO-optimized MLS listings, social media captions, and email campaigns in seconds.
          </p>
        </div>
        {outputs && (
          <button 
            onClick={saveListing}
            disabled={isSaving}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shrink-0"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Listing
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Input Section */}
        <div className="space-y-8 bg-white/5 border border-white/10 p-8 rounded-[32px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Property Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  name="address"
                  value={data.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street, Kitchener, ON"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="price"
                    value={data.price}
                    onChange={handleInputChange}
                    placeholder="$799,000"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Property Type</label>
                <select 
                  name="propertyType"
                  value={data.propertyType}
                  onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-orange-500 transition-all appearance-none"
                >
                  <option>Single Family</option>
                  <option>Condo</option>
                  <option>Townhouse</option>
                  <option>Multi-Family</option>
                  <option>Land</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Beds</label>
                <div className="relative">
                  <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="beds"
                    value={data.beds}
                    onChange={handleInputChange}
                    placeholder="3"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Baths</label>
                <div className="relative">
                  <Bath className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="baths"
                    value={data.baths}
                    onChange={handleInputChange}
                    placeholder="2.5"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Sqft</label>
                <div className="relative">
                  <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="sqft"
                    value={data.sqft}
                    onChange={handleInputChange}
                    placeholder="2,500"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Key Features</label>
              <textarea 
                name="features"
                value={data.features}
                onChange={handleInputChange}
                rows={4}
                placeholder="e.g. Open concept, quartz counters, hardwood floors..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-orange-500 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Neighborhood Details</label>
              <input 
                name="neighborhood"
                value={data.neighborhood}
                onChange={handleInputChange}
                placeholder="e.g. Family-friendly, near schools and parks"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <button 
            onClick={generateListings}
            disabled={isGenerating}
            className="w-full bg-orange-500 text-black py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-orange-400 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate Marketing Suite
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          {savedListingId && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[32px] space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Globe className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold">Landing Page Ready</h3>
                    <p className="text-xs text-white/40">Share this link to capture leads automatically.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/property/${savedListingId}`);
                    toast.success("Link copied!");
                  }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-2">
            {(['mls', 'instagram', 'facebook', 'email', 'website'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                  activeTab === tab 
                    ? "bg-white text-black" 
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
              {outputs ? (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                        {activeTab === 'mls' && <FileText className="w-5 h-5 text-orange-500" />}
                        {activeTab === 'instagram' && <Instagram className="w-5 h-5 text-orange-500" />}
                        {activeTab === 'facebook' && <Facebook className="w-5 h-5 text-orange-500" />}
                        {activeTab === 'email' && <Mail className="w-5 h-5 text-orange-500" />}
                        {activeTab === 'website' && <Globe className="w-5 h-5 text-orange-500" />}
                      </div>
                      <h3 className="font-bold text-xl capitalize">{activeTab} Content</h3>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(outputs[activeTab], activeTab)}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                    >
                      {copiedTab === activeTab ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-white/40 group-hover:text-white" />}
                    </button>
                  </div>
                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 text-white/80 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                    {typeof outputs[activeTab] === 'string' ? (
                      outputs[activeTab]
                    ) : activeTab === 'email' && typeof outputs[activeTab] === 'object' ? (
                      <>
                        <div className="font-bold text-orange-500 mb-2">Subject: {(outputs[activeTab] as any).subject}</div>
                        <div>{(outputs[activeTab] as any).body}</div>
                      </>
                    ) : (
                      JSON.stringify(outputs[activeTab], null, 2)
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white/20" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">No Content Generated</h3>
                    <p className="text-white/40 text-sm">Fill in the property details and click generate to see the magic.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
