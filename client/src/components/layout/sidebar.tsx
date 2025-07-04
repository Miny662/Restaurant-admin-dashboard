import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Heart, BarChart3, Receipt, Star, Calendar, ChartLine, Settings } from "lucide-react";
import logo from "../../assets/logo.png";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Receipt Analysis", href: "/admin/receipt-analysis", icon: Receipt },
  { name: "Review Management", href: "/admin/review-management", icon: Star },
  { name: "Reservations", href: "/admin/reservations", icon: Calendar },
  { name: "Analytics", href: "/admin/analytics", icon: ChartLine },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="logo" className="w-[50px] h-[50px]"/>
          <span className="text-xl font-bold text-gray-900">Albert Restaurant</span>
        </div>
      </div>
      
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("mr-3 w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 w-[200px]">
          <div className="flex items-center space-x-3">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"
              alt="User avatar"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Sarah Chen</p>
              <p className="text-xs text-gray-500">Bella Vista Restaurant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
