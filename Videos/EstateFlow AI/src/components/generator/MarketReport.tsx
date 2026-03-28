import React, { useState } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Download, 
  Share2, 
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
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

interface MarketData {
  neighborhood: string;
  avgPrice: string;
  priceChange: string;
  daysOnMarket: string;
  inventory: string;
  salesVolume: string;
}

export function MarketReport() {
  const { user } = useAuth();
  const [data, setData] = useState<MarketData>({
    neighborhood: '',
    avgPrice: '',
    priceChange: '',
    daysOnMarket: '',
    inventory: '',
    salesVolume: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const [isResearching, setIsResearching] = useState(false);

  const performResearch = async () => {
    if (!data.neighborhood) {
      toast.error("Please enter a neighborhood name");
      return;
    }

    setIsResearching(true);
    try {
      const prompt = `Research the current real estate market trends for ${data.neighborhood}. 
      Find the following information:
      1. Current average home price
      2. Year-over-year price change percentage
      3. Average days on market
      4. Current inventory levels (active listings)
      5. Recent sales volume or major developments
      
      Return the data in a structured format so I can use it to generate a report.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      // Extract data from AI response (simplified for this demo)
      const text = response.text || "";
      
      // Attempt to parse some values (this is a bit of a heuristic)
      const priceMatch = text.match(/\$\d{1,3}(,\d{3})*(\.\d+)?/);
      const changeMatch = text.match(/[+-]?\d+(\.\d+)?%/);
      const domMatch = text.match(/(\d+)\s*days/i);

      setData(prev => ({
        ...prev,
        avgPrice: priceMatch ? priceMatch[0] : prev.avgPrice,
        priceChange: changeMatch ? changeMatch[0] : prev.priceChange,
        daysOnMarket: domMatch ? domMatch[1] : prev.daysOnMarket,
      }));

      toast.success("Market research completed! Data has been pre-filled.");
    } catch (error) {
      console.error("Research failed:", error);
      toast.error("Failed to perform market research.");
    } finally {
      setIsResearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = async () => {
    if (!data.neighborhood) {
      toast.error("Please enter a neighborhood name");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate a professional real estate market report for the following neighborhood:
      Neighborhood: ${data.neighborhood}
      Average Price: ${data.avgPrice}
      Price Change: ${data.priceChange}
      Days on Market: ${data.daysOnMarket}
      Inventory: ${data.inventory}
      Sales Volume: ${data.salesVolume}

      The report should be structured with:
      1. Executive Summary
      2. Key Market Statistics
      3. Market Analysis
      4. Buyer Activity
      5. 3-Month Forecast
      6. Recommendations for Sellers & Buyers

      Format the output as professional Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setReport(response.text || "Failed to generate report content.");
      toast.success("Market report generated successfully!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReport = async () => {
    if (!report || !user?.id) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'listings'), {
        user_id: user.id,
        type: 'Market Report',
        input_data: data,
        output_data: { report },
        created_at: serverTimestamp()
      });
      toast.success("Market report saved to your dashboard!");
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error("Failed to save report");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-left space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">AI Market Report</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Generate professional neighborhood market updates and insights automatically.
          </p>
        </div>
        {report && (
          <button 
            onClick={saveReport}
            disabled={isSaving}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shrink-0"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Input Section */}
        <div className="space-y-8 bg-white/5 border border-white/10 p-8 rounded-[32px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Neighborhood / Area</label>
                <button 
                  onClick={performResearch}
                  disabled={isResearching || !data.neighborhood}
                  className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 flex items-center gap-1 disabled:opacity-50"
                >
                  {isResearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Auto-Research
                </button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  name="neighborhood"
                  value={data.neighborhood}
                  onChange={handleInputChange}
                  placeholder="e.g. Downtown Kitchener"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Avg. Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="avgPrice"
                    value={data.avgPrice}
                    onChange={handleInputChange}
                    placeholder="e.g. $650,000"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Price Change (%)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="priceChange"
                    value={data.priceChange}
                    onChange={handleInputChange}
                    placeholder="e.g. +4.2%"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Days on Market</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="daysOnMarket"
                    value={data.daysOnMarket}
                    onChange={handleInputChange}
                    placeholder="e.g. 28"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Active Listings</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    name="inventory"
                    value={data.inventory}
                    onChange={handleInputChange}
                    placeholder="e.g. 450"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Monthly Sales Volume</label>
              <div className="relative">
                <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input 
                  name="salesVolume"
                  value={data.salesVolume}
                  onChange={handleInputChange}
                  placeholder="e.g. $125M"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full bg-orange-500 text-black py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-orange-400 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate Market Report
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 min-h-[600px] flex flex-col">
            <AnimatePresence mode="wait">
              {report ? (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{data.neighborhood} Update</h3>
                        <p className="text-sm text-white/40">Generated on {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-8 prose prose-invert max-w-none overflow-y-auto max-h-[500px]">
                    <div className="space-y-6 text-white/80 leading-relaxed whitespace-pre-wrap">
                      {report}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-white/20" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">No Report Generated</h3>
                    <p className="text-white/40 text-sm max-w-xs mx-auto">Enter market data and click generate to create a professional neighborhood update.</p>
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
