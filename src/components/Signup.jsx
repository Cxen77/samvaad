import React, { useState, useEffect, useMemo } from "react";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import TurnstileWidget from "./TurnstileWidget";
import Logo from "../assets/logo.png";

const PasswordStrengthMeter = ({ password }) => {
  const checks = useMemo(() => ({
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[\W_]/.test(password),
  }), [password]);

  const score = Object.values(checks).filter(Boolean).length;
  const percent = (score / 5) * 100;
  const color = score <= 1 ? "bg-red-500" : score <= 3 ? "bg-yellow-500" : score === 4 ? "bg-sky-500" : "bg-emerald-500";
  const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Strong" : "Very Strong";

  if (!password) return null;

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs font-medium text-gray-500 min-w-[64px] text-right">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {[
          ["8+ characters", checks.length],
          ["Uppercase", checks.upper],
          ["Lowercase", checks.lower],
          ["Number", checks.number],
          ["Special char", checks.special],
        ].map(([text, ok]) => (
          <span key={text} className={`text-[11px] flex items-center gap-1.5 ${ok ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`inline-block w-1 h-1 rounded-full ${ok ? "bg-emerald-500" : "bg-gray-300"}`} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    course: "",
    year: "",
    bio: "",
    skills: [],
    socials: {}
  });
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();

  // No cleanup needed — tokens are in memory now
  useEffect(() => { }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);

    try {
      await signup(formData, captchaToken);
      toast.success("Account created! Please verify your email.");
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account.");
      setCaptchaToken("");
      setCaptchaResetKey(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await googleLogin();
      toast.success("Signed up with Google!");
      navigate("/");
    } catch (err) {
      toast.error("Google signup failed.");
    }
  };

  return (
    <div className="min-h-screen py-8 flex items-center justify-center bg-gray-50/50 px-4 relative overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Animated Subtle decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-sky-300/40 dark:bg-sky-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[400px] h-[400px] bg-violet-300/40 dark:bg-violet-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
        <div className="absolute -top-[10%] right-[10%] w-[400px] h-[400px] bg-sky-300/30 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-[10%] left-[10%] w-[400px] h-[400px] bg-sky-300/30 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-[6000ms]"></div>
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 w-full flex flex-col justify-center">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3 items-center gap-2 text-sky-600">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="3em" width="3em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">AICTE Samvaad</h1>
            <p className="text-gray-500 text-sm mt-1">Create your Secure Meeting OS account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-5">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-3" onSubmit={handleSignup}>
            {/* Name & Username side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  name="username"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                placeholder="Min 8 chars, mixed case + number"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-[34px] text-gray-400 hover:text-sky-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
              <PasswordStrengthMeter password={formData.password} />
            </div>

            <div className="flex items-start gap-2 pt-1 pb-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-sky-600 bg-gray-50 border-gray-300 rounded flex-shrink-0 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                I agree to the{" "}
                <Link to="/settings" className="text-sky-600 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/settings" className="text-sky-600 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <TurnstileWidget
              key={captchaResetKey}
              onVerify={setCaptchaToken}
              onError={() => setError("Captcha Failed")}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating Account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-gray-400 uppercase tracking-wider">Or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            className="w-full py-2.5 flex items-center justify-center gap-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm shadow-sm"
          >
            <FaGoogle className="text-red-500" />
            Sign up with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-600 hover:text-sky-700 font-semibold transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
