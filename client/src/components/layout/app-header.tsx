import { Bell, PenTool } from "lucide-react";

export function AppHeader() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <PenTool className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-xl text-slate-900">SEO Writer Pro</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-slate-600 hover:text-slate-900 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-slate-700">JD</span>
          </div>
        </div>
      </div>
    </header>
  );
}
