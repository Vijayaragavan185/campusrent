import { Link } from "react-router";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#2D6BE4' }}>
          404
        </div>
        <h1 className="text-3xl text-[#111827] mb-4" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Page Not Found
        </h1>
        <p className="text-[#4B5563] mb-8">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
