import { Outlet, useLocation } from "react-router";
import { Toaster } from "sonner";
import BottomNav from "./BottomNav";

export default function Root() {
  const location = useLocation();
  const showBottomNav = !["/", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#F3F4F6]" style={{ fontFamily: 'var(--font-body)' }}>
      <Outlet />
      {showBottomNav && <BottomNav />}
      <Toaster position="top-center" />
    </div>
  );
}
