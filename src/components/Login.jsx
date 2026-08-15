import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import TurnstileWidget from "./TurnstileWidget";
import Logo from "../assets/logo.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  // No cleanup needed — tokens are in memory now
  useEffect(() => { }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setLoading(true);

    try {
      const data = await login(email, password, captchaToken);
      toast.success("Logged in successfully!");

      // Redirect to Samvaad Dashboard
      navigate("/");

    } catch (err) {
      if (err.response?.status === 403) {
        setError("Email not verified. Please verify your email.");
      } else {
        setError(err.response?.data?.message || "Login failed. Invalid credentials.");
      }
      setCaptchaToken("");
      setCaptchaResetKey(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      toast.success("Logged in with Google!");
      navigate("/");
    } catch (err) {
      toast.error("Google login failed.");
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
            <div className="flex justify-center mb-2 items-center gap-2 text-sky-600">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="3em" width="3em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">AICTE Samvaad</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to Secure Meeting OS</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center mb-5">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-3" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
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
            </div>

            <TurnstileWidget key={captchaResetKey} onVerify={setCaptchaToken} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Logging in...
                </span>
              ) : "Login"}
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
            onClick={handleGoogleLogin}
            className="w-full py-2.5 flex items-center justify-center gap-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm shadow-sm"
          >
            <FaGoogle className="text-red-500" />
            Sign in with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-sky-600 hover:text-sky-700 font-semibold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
