import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye, EyeOff, Mail, Lock, Loader2,
  ArrowRight, Users, GraduationCap, BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toast = useToast();
  const isLoading = useSelector((state: RootState) => state.apiAuth.loading);
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);

  const {
    register, handleSubmit, formState: { errors }, reset, setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {

    dispatch({
      type: authActions.LOGIN,
      method: "POST",
      endPoint: "/api/auth/login/",
      body: { email: data.email, password: data.password },
      auth: false,
      setLoading: (val: boolean) => dispatch(setAuthLoading(val)),
      getResponse: (res: LoginResponse) => {
        // Store complete auth session data professionally
        localStorage.setItem("Insight_Login_Data", JSON.stringify(res));

        dispatch(setCredentials({
          user: res.user,
          accessToken: res.access,
          refreshToken: res.refresh,
        }));
        toast.success(`Welcome back, ${res.user.name}! 🤝`);

        const accessibleModules = res.user.accessible_modules || ROLES[res.user.role as keyof typeof ROLES]?.modules || [];
        
        // Always redirect to dashboard for all roles
        navigate("/dashboard");
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

  return (
    <InsightFormLayout>
      <div className={`${shake ? "animate-shake" : ""}`}>
        <div className="rounded-2xl bg-card shadow-2xl border border-white/10 p-7 sm:p-9">
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
                  onClick={() => toast.info("Please contact your branch administrator.")}
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
    </InsightFormLayout>
  );
}
