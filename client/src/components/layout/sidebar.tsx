import { Link, useLocation } from "wouter";
import { Home, Edit, FileText, TrendingUp, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Content Generator", href: "/content-generator", icon: Edit },
  { name: "My Articles", href: "/my-articles", icon: FileText },
  { name: "All Articles", href: "/articles", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-16 overflow-y-auto">
      <div className="p-4">
        <Link href="/content-generator">
          <Button className="w-full bg-brand-500 hover:bg-brand-600 text-white mb-6">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/content-generator" && location.startsWith("/content-generator"));
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "text-brand-600 bg-brand-50" 
                    : "text-slate-700 hover:bg-slate-100"
                }`}>
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
