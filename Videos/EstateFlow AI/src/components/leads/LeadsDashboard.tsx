import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  MessageSquare,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Contacted': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Qualified': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Closed': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Lost': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function LeadsDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [automationEnabled, setAutomationEnabled] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const q = query(
      collection(db, 'leads'),
      where('user_id', '==', user.id),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leads:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    try {
      await updateDoc(doc(db, 'leads', selectedLead.id), { notes: noteText });
      setIsEditingNotes(false);
      toast.success("Notes saved");
    } catch (error) {
      toast.error("Failed to save notes");
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'All' || lead.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Lead Dashboard</h1>
          <p className="text-white/60">Manage and track your potential buyers and sellers.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all w-64"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-orange-500 transition-all appearance-none pr-10 relative cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Closed">Closed</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Leads List */}
        <div className="xl:col-span-2 space-y-8">
          {/* Automation Rules Banner */}
          <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-[32px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold">Lead Automation Active</h3>
                <p className="text-xs text-white/40">New leads from landing pages receive an instant AI follow-up.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-white/60">{automationEnabled ? 'ON' : 'OFF'}</span>
              <button 
                onClick={() => setAutomationEnabled(!automationEnabled)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  automationEnabled ? "bg-orange-500" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  automationEnabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <div className="col-span-4">Lead Info</div>
              <div className="col-span-3">Source</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            <div className="divide-y divide-white/5">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <motion.div 
                    layout
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setNoteText(lead.notes || '');
                    }}
                    className={cn(
                      "grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-colors cursor-pointer group",
                      selectedLead?.id === lead.id && "bg-white/5"
                    )}
                  >
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 font-bold">
                        {lead.name?.charAt(0) || 'L'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{lead.name || 'Anonymous'}</h4>
                        <p className="text-xs text-white/40">{lead.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className="text-xs text-white/60 flex items-center gap-2">
                        <Tag className="w-3 h-3" /> {lead.source || 'Direct'}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
                        STATUS_COLORS[lead.status] || STATUS_COLORS['New']
                      )}>
                        {lead.status || 'New'}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center space-y-4">
                  <Users className="w-12 h-12 text-white/10 mx-auto" />
                  <p className="text-white/40">No leads found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lead Details Sidebar */}
        <div className="xl:col-span-1">
          <AnimatePresence mode="wait">
            {selectedLead ? (
              <motion.div 
                key={selectedLead.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-8 sticky top-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-black text-2xl font-black italic">
                      {selectedLead.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedLead.name}</h3>
                      <p className="text-white/40 text-sm">Lead ID: {selectedLead.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href={`tel:${selectedLead.phone}`}
                    className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                  >
                    <Phone className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Call</span>
                  </a>
                  <a 
                    href={`mailto:${selectedLead.email}`}
                    className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group"
                  >
                    <Mail className="w-5 h-5 text-purple-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Email</span>
                  </a>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(STATUS_COLORS).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateLeadStatus(selectedLead.id, status)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            selectedLead.status === status 
                              ? STATUS_COLORS[status]
                              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Notes</label>
                      <button 
                        onClick={() => setIsEditingNotes(!isEditingNotes)}
                        className="text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:underline"
                      >
                        {isEditingNotes ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <textarea 
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500 transition-all min-h-[120px] resize-none"
                          placeholder="Add notes about this lead..."
                        />
                        <button 
                          onClick={saveNotes}
                          className="w-full bg-orange-500 text-black py-3 rounded-xl font-bold text-sm hover:bg-orange-400 transition-all"
                        >
                          Save Notes
                        </button>
                      </div>
                    ) : (
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-4 min-h-[120px]">
                        <p className="text-sm text-white/60 italic leading-relaxed">
                          {selectedLead.notes || 'No notes added yet.'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-2"><Calendar className="w-3 h-3" /> Captured</span>
                      <span className="font-bold">{selectedLead.created_at?.toDate ? selectedLead.created_at.toDate().toLocaleDateString() : 'Just now'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-2"><Tag className="w-3 h-3" /> Source</span>
                      <span className="font-bold text-orange-500">{selectedLead.source || 'Direct'}</span>
                    </div>
                    {selectedLead.listing_id && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40 flex items-center gap-2"><ExternalLink className="w-3 h-3" /> Listing</span>
                        <Link to={`/property/${selectedLead.listing_id}`} className="font-bold text-blue-500 hover:underline">View Property</Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 text-center space-y-4 sticky top-8">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-10 h-10 text-white/10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">No Lead Selected</h3>
                  <p className="text-white/40 text-sm">Select a lead from the list to view details and manage status.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
