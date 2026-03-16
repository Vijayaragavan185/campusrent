import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { authAPI } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

function getAuthErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;

  if (data?.error && typeof data.error === 'string') {
    return data.error;
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0]?.msg || fallback;
  }

  return fallback;
}

export default function SignUp() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/home');
  }, [isAuthenticated, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email.includes("@")) {
      setError("Please use a valid university email");
      return;
    }
    
    try {
      setLoading(true);
      await authAPI.register(email);
      setError("");
      setOtp("");
      setName("");
      setPassword("");
      setStep(2);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      const message = getAuthErrorMessage(err, 'Failed to send verification code');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    setError("");
    if (!otp || !name || !password) {
      setError('Please fill OTP, name, and password');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.verifyOtp({ email, otp, name, password });
      setAuth(res.data.token, res.data.user);
      toast.success('Account verified! Welcome to CampusRent');
      navigate("/home");
    } catch (err: any) {
      const message = getAuthErrorMessage(err, 'Verification failed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      setError("");
      await authAPI.register(email);
      toast.success('Verification code resent');
    } catch (err: any) {
      const message = getAuthErrorMessage(err, 'Failed to resend verification code');
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#2D6BE4] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl" style={{ fontFamily: 'var(--font-display)' }}>CR</span>
            </div>
            <h1 className="text-3xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              Join CampusRent
            </h1>
            <p className="text-[#4B5563]">
              Verify your university email to get started
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-[#2D6BE4]' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-[#2D6BE4]' : 'bg-gray-200'}`} />
          </div>

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-[#111827] mb-2">
                  University Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6BE4] focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                {error && (
                  <p className="text-[#E74C3C] text-sm mt-2">{error}</p>
                )}
                <p className="text-[#4B5563] text-sm mt-2">
                  Must be a valid .edu email address
                </p>
                <p className="text-[#4B5563] text-sm mt-1">
                  Already registered? Use <Link to="/login" className="text-[#2D6BE4] hover:underline">Log in</Link> instead.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
              >
                {loading ? 'Sending...' : 'Continue'}
              </button>

              <p className="text-sm text-[#4B5563] mt-4 text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-[#2D6BE4] hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          ) : (
            <div>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-[#27AE60]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-[#27AE60]" />
                </div>
                <h2 className="text-xl text-[#111827] mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  Verification Email Sent!
                </h2>
                <p className="text-[#4B5563]">
                  We've sent a verification link to:
                </p>
                <p className="text-[#2D6BE4] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                  {email}
                </p>
              </div>

              <div className="bg-[#F3F4F6] rounded-xl p-4 mb-6">
                <p className="text-sm text-[#4B5563] mb-3">
                  Enter the 6-digit code from your email and set your account details.
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 8 chars)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                </div>
                {error && (
                  <p className="text-[#E74C3C] text-sm mt-3">{error}</p>
                )}
                <p className="text-sm text-[#4B5563] mt-3">
                  Didn't receive it? Check your spam folder or{" "}
                  <button
                    onClick={handleResend}
                    className="text-[#2D6BE4] hover:underline"
                    disabled={loading}
                  >
                    resend email
                  </button>
                </p>
                <p className="text-sm text-[#4B5563] mt-2">
                  If email sending is temporarily unavailable, you will see a clear message here.
                </p>
              </div>

              <button
                onClick={handleVerificationComplete}
                disabled={loading}
                className="w-full py-3 bg-[#2D6BE4] text-white rounded-xl hover:bg-[#2557b8] transition-colors"
              >
                {loading ? 'Verifying...' : 'Continue to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
