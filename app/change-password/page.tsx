"use client";

import { useActionState, useEffect, useState } from "react";
import { firstLoginChangePassword } from "./actions";
import { Eye, EyeOff, ShieldCheck, Lock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8)            score++;
  if (pw.length >= 12)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;

  if (score <= 1) return { score, label: "Too weak",   color: "#ef4444" };
  if (score === 2) return { score, label: "Weak",      color: "#f97316" };
  if (score === 3) return { score, label: "Fair",      color: "#eab308" };
  if (score === 4) return { score, label: "Good",      color: "#3b82f6" };
  return                { score, label: "Strong 💪",   color: "#10b981" };
}

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(firstLoginChangePassword, undefined);
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);

  const strength = getStrength(password);
  const matches  = password.length > 0 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;

  const requirements = [
    { met: password.length >= 8,          label: "At least 8 characters" },
    { met: /[A-Z]/.test(password),         label: "One uppercase letter" },
    { met: /[0-9]/.test(password),         label: "One number" },
    { met: /[^A-Za-z0-9]/.test(password),  label: "One special character (recommended)" },
  ];

  const done = state?.ok === true;

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        window.location.href = "/api/auth/signout?callbackUrl=/login";
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [done]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 45%,#4c1d95 100%)" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "none" }} className="lg:flex flex-col justify-center items-center relative overflow-hidden px-12">
        {/* Bubbles */}
        {[
          { w:280, h:280, t:-60,  l:-60,  bg:"radial-gradient(circle,#818cf8,#6366f1)", delay:"0s" },
          { w:200, h:200, b:80,   r:-20,  bg:"radial-gradient(circle,#f472b6,#ec4899)", delay:"-3s" },
          { w:140, h:140, b:280,  l:30,   bg:"radial-gradient(circle,#34d399,#0d9488)", delay:"-5.5s" },
        ].map((b, i) => (
          <div key={i} aria-hidden="true" style={{
            position:"absolute", width:b.w, height:b.h, borderRadius:"50%",
            background: b.bg, filter:"blur(40px)", opacity:0.25,
            top: b.t, left: b.l, bottom: b.b, right: b.r,
            animation:`float 8s ease-in-out infinite`, animationDelay: b.delay,
          }} />
        ))}

        <div style={{ position:"relative", textAlign:"center", maxWidth:"360px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:80, height:80, borderRadius:24, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", marginBottom:24 }}>
            <ShieldCheck style={{ width:40, height:40, color:"#a5b4fc" }} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontWeight:800, fontSize:"1.875rem", color:"white", margin:"0 0 12px", lineHeight:1.2 }}>
            Secure your account
          </h1>
          <p style={{ color:"#a5b4fc", fontSize:"1rem", lineHeight:1.6, margin:"0 0 32px" }}>
            You&apos;re signing in for the first time. Choose a strong personal
            password — this replaces the temporary one your school sent you.
          </p>
          <div style={{ textAlign:"left", display:"flex", flexDirection:"column", gap:12 }}>
            {[
              "Use a mix of letters, numbers & symbols",
              "Make it at least 8 characters long",
              "Don't reuse a password from another site",
            ].map((tip) => (
              <div key={tip} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ width:20, height:20, borderRadius:"50%", background:"rgba(165,180,252,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                  <Lock style={{ width:10, height:10, color:"#a5b4fc" }} />
                </span>
                <span style={{ fontSize:"0.875rem", color:"rgba(165,180,252,0.8)" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex:1, maxWidth:420, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:360 }}>
          <div style={{ background:"white", borderRadius:24, boxShadow:"0 25px 50px rgba(0,0,0,0.25)", padding:32 }}>
            {done ? (
              <div style={{ textAlign:"center", padding:"1rem 0" }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:"#d1fae5", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                  <CheckCircle2 style={{ width:40, height:40, color:"#059669" }} />
                </div>
                <h2 style={{ fontWeight:800, fontSize:"1.5rem", color:"#1a1635", margin:"0 0 8px" }}>All set! 🎉</h2>
                <p style={{ fontSize:"0.875rem", color:"#6b6b8a", margin:"0 0 4px" }}>Your password has been updated.</p>
                <p style={{ fontSize:"0.75rem", color:"#9ca3af" }}>Signing you in now…</p>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:"#4f46e5", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <ShieldCheck style={{ width:16, height:16, color:"white" }} />
                  </div>
                  <span style={{ fontWeight:700, color:"#1a1635", fontSize:"0.875rem" }}>First time sign-in</span>
                </div>

                <h2 style={{ fontWeight:800, fontSize:"1.375rem", color:"#1a1635", margin:"0 0 6px", lineHeight:1.3 }}>
                  Choose a new password
                </h2>
                <p style={{ fontSize:"0.8rem", color:"#6b6b8a", margin:"0 0 24px" }}>
                  Your temporary password must be replaced before you continue.
                </p>

                <form action={formAction} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {/* New password */}
                  <div>
                    <label htmlFor="password" style={{ display:"block", fontSize:"0.8rem", fontWeight:600, color:"#374151", marginBottom:6 }}>
                      New password
                    </label>
                    <div style={{ position:"relative" }}>
                      <input
                        id="password"
                        name="password"
                        type={showPw ? "text" : "password"}
                        required
                        autoFocus
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a strong password"
                        style={{ width:"100%", boxSizing:"border-box", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#f9fafb", padding:"10px 40px 10px 14px", fontSize:"0.875rem", outline:"none" }}
                        onFocus={(e) => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.15)"; }}
                        onBlur={(e)  => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide" : "Show"}
                        style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:0 }}>
                        {showPw ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ height:5, borderRadius:99, background:"#f3f4f6", overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:99, background: strength.color, width:`${(strength.score / 5) * 100}%`, transition:"all 0.3s" }} />
                        </div>
                        <p style={{ fontSize:"0.7rem", fontWeight:600, color: strength.color, marginTop:4 }}>{strength.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label htmlFor="confirm" style={{ display:"block", fontSize:"0.8rem", fontWeight:600, color:"#374151", marginBottom:6 }}>
                      Confirm password
                    </label>
                    <div style={{ position:"relative" }}>
                      <input
                        id="confirm"
                        name="confirm"
                        type={showCf ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter your password"
                        style={{
                          width:"100%", boxSizing:"border-box", borderRadius:12,
                          border: `1.5px solid ${mismatch ? "#fca5a5" : matches ? "#6ee7b7" : "#e5e7eb"}`,
                          background:"#f9fafb", padding:"10px 40px 10px 14px", fontSize:"0.875rem", outline:"none"
                        }}
                      />
                      <button type="button" onClick={() => setShowCf(v => !v)} aria-label={showCf ? "Hide" : "Show"}
                        style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:0 }}>
                        {showCf ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
                      </button>
                      {matches && (
                        <CheckCircle2 style={{ position:"absolute", right:36, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"#10b981" }} />
                      )}
                    </div>
                    {mismatch && <p style={{ fontSize:"0.7rem", color:"#ef4444", marginTop:4 }}>Passwords don&apos;t match.</p>}
                  </div>

                  {/* Requirements */}
                  {password.length > 0 && (
                    <div style={{ background:"#f9fafb", borderRadius:10, padding:"10px 14px", display:"flex", flexDirection:"column", gap:6 }}>
                      {requirements.map((r) => (
                        <div key={r.label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.75rem", color: r.met ? "#059669" : "#9ca3af" }}>
                          <span style={{ width:16, height:16, borderRadius:"50%", background: r.met ? "#d1fae5" : "#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"0.6rem" }}>
                            {r.met ? "✓" : "·"}
                          </span>
                          {r.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Server error */}
                  {state?.error && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", borderRadius:10, padding:"10px 14px", fontSize:"0.8rem" }} role="alert">
                      <AlertTriangle style={{ width:16, height:16, flexShrink:0 }} />
                      {state.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pending || !!mismatch || !matches}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                      borderRadius:12, padding:"12px", fontSize:"0.875rem", fontWeight:700,
                      color:"white", border:"none", cursor: (pending || mismatch || !matches) ? "not-allowed" : "pointer",
                      opacity: (pending || mismatch || !matches) ? 0.55 : 1,
                      background:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
                      boxShadow:"0 4px 15px rgba(79,70,229,0.4)",
                      transition:"opacity 0.2s",
                    }}
                  >
                    {pending ? "Updating…" : <><span>Set new password</span><ArrowRight style={{ width:16, height:16 }} /></>}
                  </button>
                </form>
              </>
            )}
          </div>

          {!done && (
            <p style={{ textAlign:"center", fontSize:"0.7rem", color:"rgba(165,180,252,0.5)", marginTop:16 }}>
              You won&apos;t be able to access the portal until you complete this step.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0) scale(1); }
          33%      { transform: translateY(-14px) scale(1.04); }
          66%      { transform: translateY(7px) scale(0.97); }
        }
        .lg\\:flex { display: flex !important; }
      `}</style>
    </div>
  );
}
