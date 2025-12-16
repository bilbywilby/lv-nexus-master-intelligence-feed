import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useState } from 'react';
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium transition-all relative",
        isActive
          ? "text-amber-400"
          : "text-slate-300 hover:bg-slate-800/60 hover:text-amber-300"
      )}
    >
      {children}
      {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-400 rounded-full"></div>}
    </Link>
  );
};
export function NavHeader() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/index?q=${searchTerm}`);
    }
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-950/80 backdrop-blur-lg border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-900 shadow-glow shadow-amber-500/20">
              LV
            </div>
            <span className="text-xl font-bold text-amber-400 tracking-wider hidden sm:inline">LV-NEXUS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/index">Index</NavLink>
            <NavLink to="/config">Config</NavLink>
          </nav>
        </div>
        <div className="flex-1 max-w-xs mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search Index..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-slate-800/50 border-slate-700 pl-9 placeholder:text-slate-500 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 hidden sm:inline">NOMINAL</span>
          </div>
          <ThemeToggle className="relative top-0 right-0 text-slate-400 hover:text-amber-400" />
        </div>
      </div>
    </header>
  );
}