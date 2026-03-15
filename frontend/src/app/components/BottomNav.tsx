import { Home, Search, PlusCircle, MessageSquare, User, Calendar } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";

export default function BottomNav() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const profilePath = user?.id ? `/profile/${user.id}` : '/signup';

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: PlusCircle, label: "Post", path: "/post" },
    { icon: MessageSquare, label: "Inbox", path: "/inbox" },
    { icon: Calendar, label: "Bookings", path: "/bookings" },
    { icon: User, label: "Profile", path: profilePath }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.label === "Profile" && location.pathname.startsWith("/profile"));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "text-[#2D6BE4]" : "text-[#4B5563]"
                }`}
              />
              <span
                className={`text-xs mt-1 ${
                  isActive ? "text-[#2D6BE4]" : "text-[#4B5563]"
                }`}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
