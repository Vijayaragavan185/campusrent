import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate('/home');
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await authAPI.login({ email, password });
      setAuth(res.data.token, res.data.user);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-[#4B5563] mb-8 hover:text-[#2D6BE4] transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2D6BE4] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl" style={{ fontFamily: 'var(--font-display)' }}>CR</span>
            </div>
            <h1 className="text-3xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Log In
            </h1>
            <p className="text-[#4B5563]">Access your CampusRent dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[#111827] mb-2">University Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#111827] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            {error && <p className="text-[#E74C3C] text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors disabled:bg-gray-300"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-sm text-[#4B5563] mt-6 text-center">
            New here?{' '}
            <Link to="/signup" className="text-[#2D6BE4] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
