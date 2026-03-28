import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Video, 
  Layout, 
  BarChart3, 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  Loader2,
  Calendar,
  Building2,
  MapPin,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Listing {
  id: number;
  type: string;
  input_data: any;
  output_data: any;
  created_at: string;
}

export const Listings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { token } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
      if (!token) return;
      try {
        const response = await fetch('/api/listings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setListings(data);
        }
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [token]);

  const filteredListings = listings.filter(l => {
    const matchesSearch = JSON.stringify(l.input_data).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || l.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reel': return <Video className="w-5 h-5" />;
      case 'staging': return <Layout className="w-5 h-5" />;
      case 'market_report': return <BarChart3 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'reel': return 'Reel Script';
      case 'staging': return 'Virtual Staging';
      case 'market_report': return 'Market Report';
      default: return 'Listing Content';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Generated Content</h1>
          <p className="text-white/60 mt-1">Review and manage your AI-generated marketing assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-orange-500 transition-all w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'listing', 'reel', 'staging', 'market_report'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border",
              activeFilter === filter 
                ? "bg-orange-500 border-orange-500 text-black" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 group hover:border-orange-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  l.type === 'reel' ? "bg-blue-500/10 text-blue-500" :
                  l.type === 'staging' ? "bg-purple-500/10 text-purple-500" :
                  l.type === 'market_report' ? "bg-green-500/10 text-green-500" :
                  "bg-orange-500/10 text-orange-500"
                )}>
                  {getTypeIcon(l.type)}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {new Date(l.created_at).toLocaleDateString()}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg line-clamp-1">
                  {l.input_data.address || l.input_data.location || l.input_data.neighborhood || 'Untitled Content'}
                </h3>
                <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">
                  {getTypeName(l.type)}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <button className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                  View Details <ExternalLink className="w-3 h-3" />
                </button>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                    <Download className="w-4 h-4 text-white/40" />
                  </button>
                  <button className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all group/delete">
                    <Trash2 className="w-4 h-4 text-white/20 group-hover/delete:text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
            <FileText className="w-10 h-10 text-white/20" />
          </div>
          <div>
            <h3 className="text-xl font-bold">No content found</h3>
            <p className="text-white/40 max-w-xs mx-auto mt-2">
              Start generating marketing content to see it listed here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
