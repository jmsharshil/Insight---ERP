import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Lock, Loader2, ArrowRight, ShieldCheck, CheckCircle2,
  AlertCircle, AlertTriangle, Check,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "@/redux/actions";
import { setAuthLoading } from "@/redux/slices/authSlice";
import { RootState, AppDispatch } from "@/store";
import InsightFormLayout from "@/components/auth/InsightFormLayout";

/* ─── Validation ────────────────────────────────────────────── */

const schema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

/* ─── Helper ────────────────────────────────────────────────── */

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: "", color: "bg-border", icon: null };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score, label: "Weak", color: "bg-destructive", icon: AlertCircle };
  if (score === 3) return { score, label: "Fair", color: "bg-orange-500", icon: AlertTriangle };
  if (score === 4) return { score, label: "Good", color: "bg-green-500", icon: Check };
  return { score, label: "Strong", color: "bg-emerald-600", icon: ShieldCheck };
};

/* ─── Component ─────────────────────────────────────────────── */

export default function SetPassPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const isLoading = useSelector((state: RootState) => state.apiAuth.loading);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch("password") || "";
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = (data: FormData) => {
    if (!token) {
      toast.error("Invalid or missing token. Please use the link from your email.");
      return;
    }

    dispatch({
      type: authActions.SET_PASSWORD,
      method: "POST",
      endPoint: "/api/auth/set-password/",
      body: {
        password: data.password,
        confirm_password: data.confirm_password,
        token,
      },
      auth: false,
      setLoading: (val: boolean) => dispatch(setAuthLoading(val)),
      getResponse: () => {
        setIsSuccess(true);
        toast.success("Password set successfully! You can now sign in.");
      },
      getError: (err: any) => {
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to set password. The link may have expired.";
        toast.error(errorMsg);
      },
    });
  };

  /* ── No token in URL ── */
  if (!token) {
    return (
      <InsightFormLayout>
        <div className="rounded-2xl bg-card shadow-2xl border border-white/10 p-7 sm:p-9 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldCheck className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="font-heading font-bold text-2xl tracking-tight">
            Invalid Link
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            This password setup link is invalid or has expired. Please contact your administrator for a new invitation.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="mt-6 w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors"
          >
            Go to Sign In
          </Button>
        </div>
      </InsightFormLayout>
    );
  }

  /* ── Success state ── */
  if (isSuccess) {
    return (
      <InsightFormLayout>
        <div className="rounded-2xl bg-card shadow-2xl border border-white/10 p-7 sm:p-9 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-7 w-7 text-green-500" />
          </div>
          <h2 className="font-heading font-bold text-2xl tracking-tight">
            Password Set!
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Your account is ready. You can now sign in with your new password.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="mt-6 w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors group"
          >
            Continue to Sign In
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </InsightFormLayout>
    );
  }

  /* ── Set password form ── */
  return (
    <InsightFormLayout>
      <div className="rounded-2xl bg-card shadow-2xl border border-white/10 p-7 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-medium text-primary-dark mb-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Account Setup
        </div>
        <h2 className="font-heading font-bold text-2xl sm:text-[28px] tracking-tight">
          Set your password
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create a secure password for your Insight account.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 h-11"
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary"
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Strength Indicator */}
            {passwordValue && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full transition-all duration-500 ${strength.color}`}
                    style={{ width: `${Math.min((strength.score / 5) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-medium text-muted-foreground">Strength:</span>
                  <span className={`flex items-center gap-1 font-semibold ${strength.color.replace('bg-', 'text-')}`}>
                    {strength.icon && <strength.icon className="h-3 w-3" />}
                    {strength.label}
                  </span>
                </div>
              </div>
            )}

            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 h-11"
                autoComplete="new-password"
                {...register("confirm_password")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-text-primary"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors group"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting password...</>
            ) : (
              <>Set Password <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" /></>
            )}
          </Button>
        </form>

        {/* Security note */}
        <div className="mt-5 flex items-start gap-2 rounded-lg bg-surface border border-border p-3">
          <ShieldCheck className="h-4 w-4 text-primary-dark mt-0.5 shrink-0" />
          <p className="text-[11px] text-black leading-relaxed">
            Your password is encrypted and stored securely. For maximum security, use a mix of uppercase and lowercase letters, numbers, and special symbols (e.g., @, #, $, %).
          </p>
        </div>
      </div>
    </InsightFormLayout>
  );
}