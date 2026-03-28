import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Video, 
  FileText, 
  ArrowUpRight,
  Clock,
  ChevronRight,
  Layout,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../firebase';

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    { label: 'Total Reels', value: '0', icon: Video, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Active Listings', value: '0', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Leads Generated', value: '0', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Market Reports', value: '0', icon: BarChart3, color: 'text-green-500', bg: 'bg-green-500/10' },
  ]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Listen to all listings for stats
    const allListingsQuery = query(
      collection(db, 'listings'),
      where('user_id', '==', user.id)
    );

    const unsubscribeStats = onSnapshot(allListingsQuery, (snapshot) => {
      const listings = snapshot.docs.map(doc => doc.data());
      
      const reelsCount = listings.filter((l: any) => l.type === 'reel').length;
      const activeListingsCount = listings.filter((l: any) => l.type === 'listing').length;
      const reportsCount = listings.filter((l: any) => l.type === 'Market Report').length;

      setStats(prev => {
        const newStats = [...prev];
        newStats[0].value = reelsCount.toString();
        newStats[1].value = activeListingsCount.toString();
        newStats[3].value = reportsCount.toString();
        return newStats;
      });
    });

    // Listen to recent listings for activity
    const recentListingsQuery = query(
      collection(db, 'listings'),
      where('user_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribeListings = onSnapshot(recentListingsQuery, (snapshot) => {
      const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateActivity(listings, 'Listing');
    });

    // Listen to leads
    const leadsQuery = query(
      collection(db, 'leads'),
      where('user_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribeLeads = onSnapshot(leadsQuery, (snapshot) => {
      const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setStats(prev => {
        const newStats = [...prev];
        newStats[2].value = leads.length.toString();
        return newStats;
      });

      updateActivity(leads, 'Lead');
    });

    const updateActivity = (items: any[], type: string) => {
      setRecentActivity(prev => {
        const otherType = type === 'Listing' ? 'Lead' : 'Listing';
        const others = prev.filter(a => a.type === otherType);
        const current = items.map(item => ({
          title: type === 'Listing' 
            ? (item.type === 'reel' ? `New Reel: ${item.input_data?.address || 'Untitled'}` : (item.input_data?.address || 'New Listing')) 
            : `Lead: ${item.name}`,
          time: item.created_at?.toDate ? item.created_at.toDate().toLocaleDateString() : 'Just now',
          type,
          source: item.source || 'Direct',
          timestamp: item.created_at?.toMillis ? item.created_at.toMillis() : Date.now()
        }));
        
        return [...others, ...current]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
      });
    };

    return () => {
      unsubscribeStats();
      unsubscribeListings();
      unsubscribeLeads();
    };
  }, [user?.id]);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Agent'}</h1>
          <p className="text-white/60">Here's what's happening with your marketing engine today.</p>
        </div>
        <Link 
          to="/listings"
          className="bg-orange-500 text-black px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" /> Create New Listing
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 hover:border-white/20 transition-colors group"
          >
            <div className={stat.bg + " w-12 h-12 rounded-xl flex items-center justify-center " + stat.color}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/40 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-bold">{stat.value}</h3>
                <span className="text-green-400 text-xs font-bold mb-1 flex items-center">
                  +0% <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Tools */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Quick Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/listings" className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
              <FileText className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold mb-1">Listing Generator</h3>
              <p className="text-xs text-white/40">Generate SEO-optimized listing copy in seconds.</p>
            </Link>
            <Link to="/staging" className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
              <Layout className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold mb-1">Virtual Staging</h3>
              <p className="text-xs text-white/40">Transform empty rooms with AI furniture.</p>
            </Link>
            <Link to="/lead-bot" className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
              <MessageSquare className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold mb-1">Lead Follow-Up</h3>
              <p className="text-xs text-white/40">Instant AI responses for your leads.</p>
            </Link>
            <Link to="/market-report" className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
              <BarChart3 className="w-8 h-8 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold mb-1">Market Reports</h3>
              <p className="text-xs text-white/40">Neighborhood insights and price trends.</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer",
                    i !== recentActivity.length - 1 && "border-b border-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white/40" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{activity.title}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-white/40">{activity.time}</p>
                        {activity.type === 'Lead' && (
                          <>
                            <span className="text-white/20">•</span>
                            <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{activity.source}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md text-white/60">
                      {activity.type}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-white/20">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm">No recent activity found.</p>
              </div>
            )}
            {recentActivity.length > 0 && (
              <button className="w-full p-4 text-center text-xs font-bold uppercase tracking-widest text-orange-500 hover:bg-orange-500/5 transition-colors">
                View All Activity
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
