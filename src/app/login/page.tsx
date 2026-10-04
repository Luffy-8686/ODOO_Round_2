"use client";

import React, { useState, Suspense, useEffect } from "react";
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
  UserPlus,
  User,
  Phone,
} from "lucide-react";
import { Role } from "@/lib/roles";

const DEMO_PERSONAS = [
  {
    role: "OWNER" as Role,
    name: "Vikram Malhotra",
    email: "owner@championsclub.in",
    title: "Club Owner & Executive",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
   
  },
  {
    role: "MANAGER" as Role,
    name: "Ananya Sharma",
    email: "manager@championsclub.in",
    title: "Operations Manager",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  
  },
  {
    role: "FRONT_DESK" as Role,
    name: "Rahul Verma",
    email: "frontdesk@championsclub.in",
    title: "Front Desk Officer",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
   
  },
  {
    role: "BAR_STAFF" as Role,
    name: "Sanjay Kumar",
    email: "bar@championsclub.in",
    title: "Bar & F&B Staff",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
  
  },
  {
    role: "SHOP_STAFF" as Role,
    name: "Pooja Patel",
    email: "shop@championsclub.in",
    title: "Pro Shop Staff",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
  
  },
  {
    role: "COACH" as Role,
    name: "Rohan Bopanna",
    email: "coach@championsclub.in",
    title: "Head Tennis Coach",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300",
   
  },
  {
    role: "MEMBER" as Role,
    name: "Arjun Reddy",
    email: "arjun.gold@gmail.com",
    title: "Gold Tier Member (VIP)",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
    
  },
  {
    role: "MEMBER" as Role,
    name: "Priya Nair",
    email: "priya.silver@gmail.com",
    title: "Silver Tier Member",
    badgeColor: "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
  
  },
  {
    role: "MEMBER" as Role,
    name: "Rohan Kapoor",
    email: "rohan.junior@gmail.com",
    title: "Junior Tier Member (Under 18)",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300",
  
  },
  {
    role: "MEMBER" as Role,
    name: "Kabir Mehta",
    email: "kabir.expiring@gmail.com",
    title: "Gold Tier (Expires in 3 Days)",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
  
  },
  {
    role: "MEMBER" as Role,
    name: "Tara Sharma",
    email: "tara.expiring@gmail.com",
    title: "Silver Tier (Expires Tomorrow)",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300",
   
  },
  {
    role: "MEMBER" as Role,
    name: "Sneha Rao",
    email: "sneha.silver@gmail.com",
    title: "Silver Tier (Expired Member)",
    badgeColor: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",

  },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const initialTab = searchParams.get("tab");

  const [authMode, setAuthMode] = useState<"password" | "otp" | "signup">(
    initialTab === "signup" ? "signup" : "password"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [quickLoginRole, setQuickLoginRole] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab === "signup") {
      setAuthMode("signup");
    }
  }, [initialTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (authMode === "signup") {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password: password.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create account.");
        }

        setSuccessMsg("Welcome! Free Tier account activated. Logging you in...");

        // Automatically sign the new user in
        const signInRes = await signIn("credentials", {
          redirect: false,
          email: email.trim(),
          password: password.trim(),
          callbackUrl: callbackUrl || "/portal",
        });

        if (signInRes?.ok) {
          router.push(callbackUrl || "/portal");
          router.refresh();
        } else {
          setAuthMode("password");
          setErrorMsg("Account created! Please sign in with your credentials.");
          setLoading(false);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Registration failed. Please try again.");
        setLoading(false);
      }
      return;
    }

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

  const handleQuickLogin = async (personaEmail: string, role: string) => {
    setQuickLoginRole(role);
    setLoading(true);
    setErrorMsg("");

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
    <div className="min-h-[92vh] py-14 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5] dark:bg-[#080D14] flex flex-col justify-center items-center transition-colors">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sign In / Sign Up Card */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0E1522] rounded-lg shadow-sm border border-[#E5DFD5] dark:border-[#222D3E] p-8 sm:p-10">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 rounded-lg bg-[#921111] text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center shadow-sm">
              <Trophy className="w-6 h-6 text-[#C5A059]" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8C6D23] dark:text-[#DFCA9B] block">
                {authMode === "signup" ? "New Guest Registration" : "Members & Staff Entrance"}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B1320] dark:text-white tracking-tight">
                The Champions Club
              </h1>
            </div>
          </div>

          {/* Mode Switcher: Password vs OTP vs Sign Up */}
          <div className="flex bg-[#FAF8F5] dark:bg-[#121A28] border border-[#E5DFD5] dark:border-[#222D3E] p-1 rounded-md mb-6 gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold tracking-wider uppercase rounded transition-all ${
                authMode === "password"
                  ? "bg-white dark:bg-[#1A2538] text-[#921111] dark:text-[#DFCA9B] shadow-sm font-bold"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" /> Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold tracking-wider uppercase rounded transition-all ${
                authMode === "otp"
                  ? "bg-white dark:bg-[#1A2538] text-[#921111] dark:text-[#DFCA9B] shadow-sm font-bold"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" /> OTP Pass
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold tracking-wider uppercase rounded transition-all ${
                authMode === "signup"
                  ? "bg-[#921111] text-white shadow-sm font-bold"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0B1320] dark:hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C5A059]" /> Join Free
            </button>
          </div>

          {authMode === "signup" && (
            <div className="mb-6 p-3.5 rounded-md bg-[#FAF7EE] dark:bg-[#1C1608] border border-[#DFCA9B] dark:border-[#4B3C18] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#8C6D23] dark:text-[#DFCA9B] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#5C4511] dark:text-[#E3CEA4] leading-relaxed">
                <strong className="font-serif">Instant Free Community Tier:</strong> Register to immediately access court reservations, digital member pass, cafe orders, and 1-click tier upgrades.
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-md bg-[#FDF4F4] dark:bg-[#1E0E10] border border-[#F8CCCC] dark:border-[#581A1D] flex items-start gap-3 text-[#921111] dark:text-[#F87171] text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-serif font-bold text-sm">Notice</p>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-md bg-[#F0FDF4] dark:bg-[#0E2014] border border-[#BBF7D0] dark:border-[#1E3A24] flex items-start gap-3 text-[#15803D] dark:text-[#4ADE80] text-xs">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-serif font-bold text-sm">Account Activated</p>
                <p className="mt-0.5 leading-relaxed">{successMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === "signup" && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sameer Kashyap"
                      className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-[#0B1320] dark:text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#C5A059] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-[#0B1320] dark:text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#C5A059] text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider mb-1.5">
                {authMode === "signup" ? "Email Address" : "Official Club Email Address"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={authMode === "signup" ? "name@example.com" : "e.g. owner@championsclub.in or member email"}
                  className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-[#0B1320] dark:text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#C5A059] text-xs"
                />
              </div>
            </div>

            {authMode !== "otp" ? (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider">
                    Password
                  </label>
                  {authMode === "password" && (
                    <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-mono">Demo: Demo@1234</span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === "signup" ? "Create a secure password" : "Enter account password"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-[#0B1320] dark:text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#C5A059] text-xs"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-[#4B5563] dark:text-[#9CA3AF] uppercase tracking-wider">
                    OTP Verification Passcode
                  </label>
                  <span className="text-[10px] text-[#8C6D23] dark:text-[#DFCA9B] font-mono">Demo Code: 123456</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] bg-[#FAF8F5] dark:bg-[#121A28] text-[#0B1320] dark:text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#C5A059] text-xs tracking-widest font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-md bg-[#921111] hover:bg-[#720C0C] text-white font-bold text-xs tracking-widest uppercase shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading && !quickLoginRole ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === "signup" ? "Create Free Account & Enter" : "Verify Credentials"}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-[#E5DFD5] dark:border-[#222D3E] text-center">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              Server-Enforced RBAC • HTTP-Only JWT Session • Rate-Limited
            </p>
          </div>
        </div>

        {/* Right Column: Instant Demo Switcher / Quick Login */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0E1522] rounded-lg shadow-sm border border-[#E5DFD5] dark:border-[#222D3E] p-6 sm:p-7">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E5DFD5] dark:border-[#222D3E]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h2 className="font-serif font-bold text-base text-[#0B1320] dark:text-white">
                Roster Quick Switcher
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#FAF7EE] text-[#8C6D23] border border-[#DFCA9B] dark:bg-[#1C1608] dark:text-[#E3CEA4] dark:border-[#4B3C18]">
              Evaluator Pass
            </span>
          </div>

          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-4 leading-relaxed">
            Select any official persona below to authenticate into its guarded club portal:
          </p>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {DEMO_PERSONAS.map((persona) => {
              const isLoggingIn = loading && quickLoginRole === persona.role;
              return (
                <button
                  key={persona.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(persona.email, persona.role)}
                  className="w-full text-left p-3 rounded-md border border-[#E5DFD5] dark:border-[#222D3E] hover:border-[#C5A059] bg-[#FAF8F5]/60 dark:bg-[#121A28]/60 hover:bg-white dark:hover:bg-[#162032] transition-all flex items-center justify-between group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{persona.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-serif font-bold text-[#0B1320] dark:text-white group-hover:text-[#921111] dark:group-hover:text-[#DFCA9B]">
                          {persona.name}
                        </p>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${persona.badgeColor}`}
                        >
                          {persona.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                        {persona.title}
                      </p>
                    </div>
                  </div>

                  <div className="text-[#9CA3AF] group-hover:text-[#C5A059] transition-colors">
                    {isLoggingIn ? (
                      <div className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#E5DFD5] dark:border-[#222D3E]">
            <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
              Default password: <code className="text-[#8C6D23] dark:text-[#DFCA9B] font-mono font-bold">Demo@1234</code>. 
              Server validates role invariants strictly upon session minting.
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
