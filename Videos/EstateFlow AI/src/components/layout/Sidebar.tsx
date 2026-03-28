import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Video, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  Layout,
  BarChart3,
  MessageSquare,
  Users
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Video, label: 'Reel Generator', path: '/reels' },
  { icon: FileText, label: 'Listing Generator', path: '/listings' },
  { icon: Layout, label: 'Virtual Staging', path: '/staging' },
  { icon: MessageSquare, label: 'Lead Bot', path: '/lead-bot' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: BarChart3, label: 'Market Report', path: '/market-report' },
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-72 bg-[#0A0A0A] border-r border-white/10 z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Building2 className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight">EstateFlow<span className="text-orange-500">AI</span></span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                )} />
                {item.label}
                {item.path === '/' && <ChevronRight className="ml-auto w-4 h-4 opacity-40" />}
              </NavLink>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-white/10 space-y-2">
            <NavLink 
              to="/settings"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings className="w-5 h-5" />
              Settings
            </NavLink>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
