"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronRight,
  Sparkles,
  User,
  Phone,
  ArrowRight,
  Flame,
  Star,
} from "lucide-react";
import { ROLE_METADATA, Role } from "@/lib/roles";

const DEMO_PERSONAS = [
  {
    role: "OWNER" as Role,
    name: "Vikram Malhotra",
    email: "owner@championsclub.in",
    title: "Club Owner & Executive",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
    icon: "👑",
  },
  {
    role: "MANAGER" as Role,
    name: "Ananya Sharma",
    email: "manager@championsclub.in",
    title: "Operations Manager",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
    icon: "📋",
  },
  {
    role: "FRONT_DESK" as Role,
    name: "Rahul Verma",
    email: "desk@championsclub.in",
    title: "Front Desk Officer",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    icon: "🎟️",
  },
  {
    role: "BAR_STAFF" as Role,
    name: "Sanjay Kumar",
    email: "bar@championsclub.in",
    title: "Bar & F&B Staff",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
    icon: "☕",
  },
  {
    role: "SHOP_STAFF" as Role,
    name: "Pooja Patel",
    email: "shop@championsclub.in",
    title: "Pro Shop Staff",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    icon: "🛍️",
  },
  {
    role: "COACH" as Role,
    name: "Rohan Bopanna",
    email: "coach@championsclub.in",
    title: "Head Tennis Coach",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300",
    icon: "🎾",
  },
  {
    role: "MEMBER" as Role,
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    title: "Gold Tier Member (VIP)",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
    icon: "🥇",
  },
  {
    role: "MEMBER" as Role,
    name: "Rohan Gupta",
    email: "rohan.gupta@example.com",
    title: "Silver Tier Member",
    badgeColor: "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
    icon: "🥈",
  },
  {
    role: "MEMBER" as Role,
    name: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    title: "Junior Tier Member (Under 18)",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300",
    icon: "🧒",
  },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  const [activeMainTab, setActiveMainTab] = useState<"signin" | "signup">(initialTab);
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  // Sign in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("123456");

  // Sign up state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupSport, setSignupSport] = useState("Tennis");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("tab") === "signup") {
      setActiveMainTab("signup");
    }
  }, [searchParams]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: authMode === "password" ? password : "",
        isOtpLogin: authMode === "otp" ? "true" : "false",
        otpCode: authMode === "otp" ? otpCode : "",
        callbackUrl: callbackUrl || undefined,
      });

      if (res?.error) {
        setErrorMsg(res.error);
        setLoading(false);
      } else if (res?.ok) {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/app");
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
          preferredSport: signupSport,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Account created successfully! Logging you into your Free Member Portal...");

      // Automatically sign in the new user
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: signupEmail.trim(),
        password: signupPassword,
        isOtpLogin: "false",
      });

      if (loginRes?.ok) {
        router.push("/portal");
        router.refresh();
      } else {
        // Fallback redirect to sign in tab
        setActiveMainTab("signin");
        setEmail(signupEmail);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during registration.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (personaEmail: string, role: string) => {
    setQuickLoginRole(role);
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: personaEmail,
        password: "Demo@1234",
        isOtpLogin: "false",
        callbackUrl: callbackUrl || undefined,
      });

      if (res?.error) {
        setErrorMsg(res.error);
        setLoading(false);
        setQuickLoginRole(null);
      } else if (res?.ok) {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/app");
        }
        router.refresh();
      }
    } catch {
      setErrorMsg("Failed to authenticate demo user.");
      setLoading(false);
      setQuickLoginRole(null);
    }
  };

  return (
    <div className="min-h-[92vh] py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sign In / Sign Up Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                The Champions Club
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Unified Sports Complex & Member Portal
              </p>
            </div>
          </div>

          {/* Top-Level Tab Switcher: Sign In vs Create Free Account */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab("signin");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeMainTab === "signin"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMainTab("signup");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeMainTab === "signup"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Free Account</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Action Failed</p>
                <p className="text-xs mt-0.5 text-rose-700 dark:text-rose-400">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-semibold">Success</p>
                <p className="text-xs mt-0.5 opacity-90">{successMsg}</p>
              </div>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeMainTab === "signin" && (
            <div>
              {/* Mode Switcher: Password vs OTP */}
              <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mb-6 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("password");
                    setErrorMsg("");
                  }}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition-all ${
                    authMode === "password"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("otp");
                    setErrorMsg("");
                  }}
                  className={`flex-1 py-1.5 font-semibold rounded-lg transition-all ${
                    authMode === "otp"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  Member OTP Sign-in
                </button>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. your.email@example.com or staff ID"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                {authMode === "password" ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Password
                      </label>
                      <span className="text-xs text-slate-400">Demo: Demo@1234</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter account password"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        OTP Verification Code
                      </label>
                      <span className="text-xs text-emerald-600 font-semibold">Demo OTP: 123456</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm tracking-widest font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && !quickLoginRole ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In Securely</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setActiveMainTab("signup")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  New to the club? Create a Free Account &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP (CREATE FREE ACCOUNT) */}
          {activeMainTab === "signup" && (
            <div>
              {/* Free Tier Callout Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/30 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Free Community Account Benefits:</span>
                </div>
                <ul className="space-y-1 text-[11px] opacity-90 list-disc list-inside">
                  <li>Pay-as-you-play court bookings across Tennis, Padel, Badminton & Cricket</li>
                  <li>Full digital pass & Bar/Cafeteria order access</li>
                  <li><strong>Upgrade to Gold or Silver anytime</strong> from your portal for 100% free courts</li>
                </ul>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Primary Sport
                    </label>
                    <select
                      value={signupSport}
                      onChange={(e) => setSignupSport(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                    >
                      <option value="Tennis">🎾 Tennis</option>
                      <option value="Padel">🎾 Padel</option>
                      <option value="Badminton">🏸 Badminton</option>
                      <option value="Cricket">🏏 Cricket</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Activate Free Community Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setActiveMainTab("signin")}
                  className="text-xs text-slate-500 dark:text-slate-400 font-semibold hover:underline"
                >
                  Already have an account? Sign In &rarr;
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Server-Enforced RBAC • Instant Free Tier Activation • Upgrade Anytime
            </p>
          </div>
        </div>

        {/* Right Column: Instant Demo Switcher / Quick Login */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Quick Demo Profiles
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Evaluator Mode
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Click any test profile below to authenticate into its dedicated portal instantly:
          </p>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {DEMO_PERSONAS.map((persona) => {
              const isLoggingIn = loading && quickLoginRole === persona.role;
              return (
                <button
                  key={persona.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(persona.email, persona.role)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{persona.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          {persona.name}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${persona.badgeColor}`}
                        >
                          {persona.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {persona.title}
                      </p>
                    </div>
                  </div>

                  <div className="text-slate-400 group-hover:text-emerald-600 transition-colors">
                    {isLoggingIn ? (
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 leading-tight">
              All accounts seeded with password: <code className="text-emerald-600 font-bold">Demo@1234</code>. 
              Sessions are signed and verified server-side with zero role leakage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 font-mono text-sm">Loading security gate...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
