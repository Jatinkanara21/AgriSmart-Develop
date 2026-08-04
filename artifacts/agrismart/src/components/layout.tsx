import { Link, useLocation } from 'wouter';
import { useUser, useClerk } from '@clerk/react';
import { 
  Tractor, 
  Sprout, 
  IndianRupee, 
  Activity, 
  Beaker, 
  TrendingUp, 
  CloudSun, 
  Settings, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Activity },
  { name: 'Farms', path: '/farms', icon: Tractor },
  { name: 'Expenses', path: '/expenses', icon: IndianRupee },
  { name: 'Disease Detection', path: '/disease-detection', icon: Sprout },
  { name: 'Fertilizer', path: '/fertilizer', icon: Beaker },
  { name: 'Market Prices', path: '/market-prices', icon: TrendingUp },
  { name: 'Weather', path: '/weather', icon: CloudSun },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.publicMetadata?.role === 'admin';

  const NavLinks = () => (
    <nav className="space-y-1 mt-6 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path || (item.path !== '/dashboard' && location.startsWith(item.path));
        return (
          <Link
            key={item.name}
            href={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
      
      {isAdmin && (
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            location.startsWith('/admin')
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
          onClick={() => setMobileOpen(false)}
        >
          <Users className="h-5 w-5" />
          Admin
        </Link>
      )}
    </nav>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground group-hover:scale-105 transition-transform">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">AgriSmart</span>
          </Link>
          <button 
            className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-border/50">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors mb-1 ${
              location === '/settings'
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            onClick={() => setMobileOpen(false)}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-card border-b flex items-center px-4 md:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-lg text-foreground ml-2">AgriSmart</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
