import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Mail, Lock, Loader2,
  ArrowRight, Users, GraduationCap, BookOpen,
  Smartphone, Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "@/redux/actions";
import { setCredentials, setAuthLoading } from "@/redux/slices/authSlice";
import { RootState, AppDispatch } from "@/store";
import { LoginResponse } from "@/types/api.auth.types";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { DUMMY_USERS } from "@/constants/dummy/users";
import { ROLES } from "@/constants/roles";
import { NAV_ITEMS } from "@/constants/navigation";
import InsightFormLayout from "@/components/auth/InsightFormLayout";
import { useAuth } from "@/hooks/useAuth";

const TRUST_PILLS = [
  { icon: Users, label: "20+ Skilled Tutors" },
  { icon: GraduationCap, label: "One-to-One Coaching" },
  { icon: BookOpen, label: "Limited Students / Batch" },
];

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormData = z.infer<typeof schema>;

type ViewMode = "login" | "verify-login-otp" | "forgot-password-email" | "forgot-password-reset";


const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.jmsinsight.app&hl=en_IN";
const APP_STORE_URL =
  "https://apps.apple.com/us/app/insight-institute/id6780808050";

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const isLoading = useSelector((state: RootState) => state.apiAuth.loading);
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [fpNewPass, setFpNewPass] = useState("");
  const [fpConfirmPass, setFpConfirmPass] = useState("");
  const [showFpPass, setShowFpPass] = useState(false);

  // Popup box for student & parents mobile app download
  const [showMobileAppPopup, setShowMobileAppPopup] = useState(false);
  const [popupUser, setPopupUser] = useState<any>(null);

  const {
    register, handleSubmit, formState: { errors }, reset, setValue, getValues,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const autoLogoutEmail = sessionStorage.getItem("auto_logout_email");
    if (autoLogoutEmail) {
      setValue("email", autoLogoutEmail);
      sessionStorage.removeItem("auto_logout_email");
    }

    if (searchParams.get("app_required") === "true") {
      setShowMobileAppPopup(true);
    }
  }, [setValue, searchParams]);

  const { isAuthenticated, user, logout } = useAuth();

  if (isAuthenticated) {
    if (user?.role === "student" || user?.role === "parents" || user?.role === "parent") {
      logout();
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const onSubmit = (data: FormData) => {
    dispatch({
      type: authActions.LOGIN,
      method: "POST",
      endPoint: "/api/auth/login/",
      body: { email: data.email, password: data.password },
      auth: false,
      setLoading: (val: boolean) => dispatch(setAuthLoading(val)),
      getResponse: (res: LoginResponse) => {
        console.log(res);
        if (res.otp_required) {
          setViewMode("verify-login-otp");
          setOtpEmail(res.email || data.email);
          toast.success(res.message || "OTP sent successfully.");
        } else {
          const isStudentOrParent =
            res.user?.role === "student" ||
            res.user?.role === "parents" ||
            res.user?.role === "parent";

          if (isStudentOrParent) {
            setPopupUser(res.user);
            setShowMobileAppPopup(true);
            return;
          }

          // Store complete auth session data professionally
          localStorage.setItem("Insight_Login_Data", JSON.stringify(res));

          dispatch(setCredentials({
            user: res.user!,
            accessToken: res.access!,
            refreshToken: res.refresh!,
          }));
          toast.success(`Welcome back, ${res.user!.name}! 🤝`);
          
          navigate("/dashboard");
        }
      },
      getError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Login failed. Please check your credentials.";
        toast.error(errorMsg);
      },
    });
  };

  const fillCredentials = (email: string) => {
    setValue("email", email);
    setValue("password", "111111");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      toast.error("Please enter a valid OTP code.");
      return;
    }

    dispatch({
      type: authActions.LOGIN,
      method: "POST",
      endPoint: "/api/auth/login/verify-otp/",
      body: { email: otpEmail, otp: otpCode },
      auth: false,
      setLoading: (val: boolean) => dispatch(setAuthLoading(val)),
      getResponse: (res: LoginResponse) => {
        const isStudentOrParent =
          res.user?.role === "student" ||
          res.user?.role === "parents" ||
          res.user?.role === "parent";

        if (isStudentOrParent) {
          setPopupUser(res.user);
          setShowMobileAppPopup(true);
          return;
        }

        localStorage.setItem("Insight_Login_Data", JSON.stringify(res));

        dispatch(setCredentials({
          user: res.user!,
          accessToken: res.access!,
          refreshToken: res.refresh!,
        }));
        toast.success(`Welcome back, ${res.user!.name}! 🤝`);
        navigate("/dashboard");
      },
      getError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Invalid OTP. Please try again.";
        toast.error(errorMsg);
      },
    });
  };

  const handleForgotPasswordEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail || !/^\S+@\S+\.\S+$/.test(otpEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    dispatch({
      type: authActions.LOGIN,
      method: "POST",
      endPoint: "/api/auth/forgot-password/",
      body: { email: otpEmail },
      auth: false,
      setLoading: (val: boolean) => dispatch(setAuthLoading(val)),
      getResponse: (res: any) => {
        toast.success(res.message || "Verification code sent to your email.");
        setViewMode("forgot-password-reset");
      },
      getError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to send verification code.";
        toast.error(errorMsg);
      },
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      toast.error("Please enter a valid OTP code.");
      return;
    }
    if (fpNewPass.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (fpNewPass !== fpConfirmPass) {
      toast.error("Passwords do not match.");
      return;
    }

    dispatch({
      type: authActions.LOGIN,
      method: "POST",
      endPoint: "/api/auth/reset-password/",
      body: { email: otpEmail, otp: otpCode, password: fpNewPass, confirm_password: fpConfirmPass },
      auth: false,
      setLoading: (val: boolean) => dispatch(setAuthLoading(val)),
      getResponse: (res: any) => {
        toast.success(res.message || "Password reset successfully. Please log in.");
        setViewMode("login");
        setOtpCode("");
        setFpNewPass("");
        setFpConfirmPass("");
      },
      getError: (err: any) => {
        const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to reset password.";
        toast.error(errorMsg);
      },
    });
  };

  if (viewMode === "verify-login-otp") {
    return (
      <InsightFormLayout>
        <div className="rounded-2xl bg-card shadow-2xl border border-black/5 p-7 sm:p-9">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-text-primary font-heading tracking-tight mb-2">
              Verification Required
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We've sent a one-time password to your email/WhatsApp.
              <br />
              <span className="font-medium text-primary-dark">{otpEmail}</span>
            </p>
          </div>
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-1.5 flex flex-col items-center text-center">
              <Label htmlFor="otpCode" className="self-start text-sm font-medium mb-1">Enter 6-digit Code</Label>
              <InputOTP maxLength={6} value={otpCode} onChange={(val) => setOtpCode(val)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={1} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={2} className="w-10 h-12 text-lg" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={4} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={5} className="w-10 h-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors group"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
              ) : (
                <>Verify OTP <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              type="button"
              className="text-primary-dark font-medium hover:underline"
              onClick={() => {
                setViewMode("login");
                setOtpCode("");
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </InsightFormLayout>
    );
  }

  if (viewMode === "forgot-password-email") {
    return (
      <InsightFormLayout>
        <div className="rounded-2xl bg-card shadow-2xl border border-black/5 p-7 sm:p-9">
          <div className="text-center mb-6">
            <h2 className="font-heading font-bold text-2xl tracking-tight mb-2">
              Forgot Password
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter your registered email address and we'll send you a verification code to reset your password.
            </p>
          </div>
          <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fp-email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="you@insight.edu"
                  className="pl-10 h-11"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors group mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <>Send Code <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <button
              type="button"
              className="text-primary-dark font-medium hover:underline"
              onClick={() => setViewMode("login")}
            >
              Log in
            </button>
          </div>
        </div>
      </InsightFormLayout>
    );
  }

  if (viewMode === "forgot-password-reset") {
    return (
      <InsightFormLayout>
        <div className="rounded-2xl bg-card shadow-2xl border border-black/5 p-7 sm:p-9">
          <div className="text-center mb-6">
            <h2 className="font-heading font-bold text-2xl tracking-tight mb-2">
              Reset Password
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter the verification code sent to
              <br />
              <span className="font-medium text-primary-dark">{otpEmail}</span>
            </p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5 flex flex-col items-center text-center">
              <Label htmlFor="reset-otpCode" className="self-start text-sm font-medium mb-1">Verification Code</Label>
              <InputOTP maxLength={6} value={otpCode} onChange={(val) => setOtpCode(val)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={1} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={2} className="w-10 h-12 text-lg" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={4} className="w-10 h-12 text-lg" />
                  <InputOTPSlot index={5} className="w-10 h-12 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fp-new-password"
                  type={showFpPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11"
                  value={fpNewPass}
                  onChange={(e) => setFpNewPass(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowFpPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary"
                  aria-label="Toggle password"
                >
                  {showFpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fp-confirm-password"
                  type={showFpPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  value={fpConfirmPass}
                  onChange={(e) => setFpConfirmPass(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors group mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</>
              ) : (
                <>Reset Password <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm gap-2">
            <div className="text-muted-foreground">
              Didn't receive the code?{" "}
              <button
                type="button"
                className="text-primary-dark font-medium hover:underline disabled:opacity-50"
                disabled={isLoading}
                onClick={handleForgotPasswordEmail}
              >
                Resend
              </button>
            </div>
            <button
              type="button"
              className="text-primary-dark font-medium hover:underline"
              onClick={() => {
                setViewMode("forgot-password-email");
                setOtpCode("");
              }}
            >
              Change Email
            </button>
          </div>
        </div>
      </InsightFormLayout>
    );
  }

  return (
    <InsightFormLayout>
      <div className={`${shake ? "animate-shake" : ""}`}>
        <div className="rounded-2xl bg-card shadow-2xl border border-black/5 p-7 sm:p-9">
          <div className="flex items-center gap-2 text-xs font-medium text-primary-dark mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Secure Sign-In
          </div>
          <h2 className="font-heading font-bold text-2xl sm:text-[28px] tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to access your Insight registered account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@insight.edu"
                  className="pl-10 h-11"
                  autoComplete="email"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setOtpEmail(getValues("email") || ""); // try to pre-fill email if typed
                    setViewMode("forgot-password-email");
                  }}
                  className="text-xs text-primary-dark hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11"
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary"
                  aria-label="Toggle password"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors group"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          {/* Trust pills */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {TRUST_PILLS.map((p) => (
              <div
                key={p.label}
                className="flex flex-col items-center text-center rounded-lg bg-surface border border-border px-2 py-2.5"
              >
                <p.icon className="h-4 w-4 text-primary-dark mb-1" />
                <p className="text-[10px] font-medium text-text-primary leading-tight">{p.label}</p>
              </div>
            ))}
          </div>

          {/* <Accordion type="single" collapsible className="mt-5">
            <AccordionItem value="demo" className="border border-dashed border-border rounded-lg px-3">
              <AccordionTrigger className="text-xs font-medium text-muted-foreground hover:no-underline">
                🧪 Demo accounts · click to autofill
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-64 overflow-y-auto -mx-1 px-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left pb-1.5">Role</th>
                        <th className="text-left pb-1.5">Email</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {DUMMY_USERS.map((u) => (
                        <tr key={u.id} className="border-t border-border/40">
                          <td className="py-1.5 pr-2 font-sans text-text-primary capitalize">
                            {u.role_display || ROLES[u.role as keyof typeof ROLES]?.label || String(u.role).replace(/_/g, " ")}
                          </td>
                          <td className="py-1.5">
                            <button
                              type="button"
                              onClick={() => fillCredentials(u.email)}
                              className="text-primary-dark hover:underline"
                            >
                              {u.email}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Password for all: <span className="font-mono">111111</span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion> */}
        </div>
      </div>

      {/* ── Simple Popup Box for Student & Parents (Matching Brand Theme) ── */}
      <Dialog open={showMobileAppPopup} onOpenChange={setShowMobileAppPopup}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-primary/25 bg-card shadow-2xl rounded-2xl">
          {/* Header with matching brand theme */}
          <div className="bg-gradient-to-r from-primary via-orange-500 to-amber-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-inner">
              <Smartphone className="h-7 w-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/25 text-[11px] font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>
                {popupUser?.role === "parents" || popupUser?.role === "parent"
                  ? "Parent Notice"
                  : "Student Notice"}
              </span>
            </div>
            <DialogTitle className="text-xl font-heading font-bold text-white tracking-tight">
              Please Download Our Mobile App
            </DialogTitle>
            <DialogDescription className="text-white/90 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
              {popupUser?.name ? `Hello ${popupUser.name}! ` : ""}
              Student and parent access is exclusively available on our official mobile app.
            </DialogDescription>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Please download the Insight Institute mobile app to easily track your daily timetables, live attendance, fee receipts, and exam results.
            </p>

            {/* Store Download Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Google Play Store */}
              <button
                type="button"
                onClick={() => window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer")}
                className="flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white rounded-xl px-4 py-3 border border-zinc-800 transition-all cursor-pointer shadow-md w-full group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="w-7 h-7 mr-3 shrink-0"
                >
                  <path fill="#34A853" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                  <path fill="#4285F4" d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256-256L47 0z" />
                  <path fill="#FBBC04" d="M425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z" />
                  <path fill="#EA4335" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
                </svg>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[9px] leading-none font-medium uppercase text-zinc-300">
                    GET IT ON
                  </span>
                  <span className="text-[16px] font-semibold leading-tight mt-0.5 tracking-tight text-white">
                    Google Play
                  </span>
                </div>
              </button>

              {/* Apple App Store */}
              <button
                type="button"
                onClick={() => window.open(APP_STORE_URL, "_blank", "noopener,noreferrer")}
                className="flex items-center justify-center bg-zinc-950 hover:bg-zinc-900 active:scale-[0.98] text-white rounded-xl px-4 py-3 border border-zinc-800 transition-all cursor-pointer shadow-md w-full group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                  className="w-7 h-7 mr-3 shrink-0 fill-white"
                >
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[9px] leading-none font-medium text-zinc-300">
                    Download on the
                  </span>
                  <span className="text-[16px] font-semibold leading-tight mt-0.5 tracking-tight text-white">
                    App Store
                  </span>
                </div>
              </button>
            </div>

            {/* Close Button with matching primary theme */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={() => setShowMobileAppPopup(false)}
                className="w-full h-10 bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Okay, Got It
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </InsightFormLayout>
  );
}
