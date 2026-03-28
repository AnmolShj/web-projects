import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  property_interest: string;
  status: string;
  created_at: string;
}

export const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchLeads = async () => {
      if (!token) return;
      try {
        const response = await fetch('/api/leads', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLeads(data);
        }
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, [token]);

  const filteredLeads = leads.filter(lead => 
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.property_interest?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Leads & Inquiries</h1>
          <p className="text-white/60 mt-1">Manage and follow up with your potential clients.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-orange-500 transition-all w-64"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : filteredLeads.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Lead</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Contact</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Interest</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 font-bold">
                        {lead.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <div className="font-bold text-white">{lead.name || 'Anonymous'}</div>
                        <div className="text-xs text-white/40">ID: #{lead.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Mail className="w-3 h-3" /> {lead.email || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Phone className="w-3 h-3" /> {lead.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                      <Building2 className="w-4 h-4 text-orange-500" />
                      {lead.property_interest || 'General Inquiry'}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      lead.status === 'new' ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                    )}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm text-white/40">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-5 h-5 text-white/40" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-white/20" />
          </div>
          <div>
            <h3 className="text-xl font-bold">No leads found</h3>
            <p className="text-white/40 max-w-xs mx-auto mt-2">
              {searchTerm ? "Try adjusting your search terms." : "Leads captured by your AI bot will appear here."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
