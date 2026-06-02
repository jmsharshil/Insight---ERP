import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import {
  Eye, EyeOff, Mail, Lock, Loader2, Award, Users, Sparkles,
  GraduationCap, BookOpen, Trophy, ShieldCheck, ArrowRight,
} from "lucide-react";
import logo from "@/assets/logo.png";
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

import img1 from "@/assets/branding/Insigth-Institute-AIR-Rankers-Factory-Facebook-Cover-page-scaled.jpeg";
import img2 from "@/assets/branding/WhatsApp-Image-2025-12-19-at-7.03.13-PM.jpeg";
import img3 from "@/assets/branding/AIR-1st-Anisha-Keswani-Website-Cover-Page-1.jpeg";
import img4 from "@/assets/branding/Hunny-Manshani-Ahmedabad1st-All-India-Rank-11st-JPG.jpg";
import img5 from "@/assets/branding/cs-ronak-panjwani-company-secretary-scaled.jpg";
import img6 from "@/assets/branding/cs-aashlesha-prajapati-company-secretary-scaled.jpg";
import img7 from "@/assets/branding/Vijay-Menani-Ahmedabad5th-All-India-Rank-21st-JPG.jpg";
import img8 from "@/assets/branding/cs-mahek-sejwani-company-secretary-scaled.jpg";
import img9 from "@/assets/branding/Insights-11_2aa.jpg";

const SLIDES = [
  { src: img1, title: "Rankers Factory", caption: "CS Executive · 3 All India Rankers" },
  { src: img2, title: "4 out of 7 AIRs", caption: "June 2025 — From Insight Institute" },
  { src: img3, title: "Anisha Keshwani", caption: "AIR 1st · CS Executive Dec'25" },
  { src: img4, title: "Hunny Manshani", caption: "Ahmedabad 1st · AIR 11th" },
  { src: img5, title: "Rohan Panjwani", caption: "Ahmedabad 1st · AIR 5th" },
  { src: img6, title: "Aashlesha Prajapati", caption: "Ahmedabad 3rd · AIR 10th" },
  { src: img7, title: "Vijay Menani", caption: "Ahmedabad 5th · AIR 21st" },
  { src: img8, title: "Mahek Sejwani", caption: "India's Youngest CS @ Age 19" },
  { src: img9, title: "Youngest CS of India", caption: "All 3 levels cleared in 1st attempt" },
];

const TRUST_PILLS = [
  { icon: Users, label: "20+ Skilled Tutors" },
  { icon: GraduationCap, label: "One-to-One Coaching" },
  { icon: BookOpen, label: "Limited Students / Batch" },
];

const HIGHLIGHTS = [
  { icon: Award, title: "Experience", text: "10+ years coaching expertise" },
  { icon: ShieldCheck, title: "Expertise", text: "Exclusively CS since 2012" },
  { icon: Trophy, title: "Excellence", text: "All India & Ahmedabad Toppers" },
];

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormData = z.infer<typeof schema>;

function BrandCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", duration: 30 },
    [Autoplay({ delay: 3800, stopOnInteraction: false, stopOnMouseEnter: true })],
  );
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10" ref={emblaRef}>
        <div className="flex">
          {SLIDES.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <div className="aspect-[1280/553] w-full bg-navy">
                <img
                  src={s.src}
                  alt={s.title}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/95 via-navy/60 to-transparent p-4 sm:p-5">
                <p className="font-heading font-semibold text-white text-sm sm:text-base">{s.title}</p>
                <p className="text-white/80 text-xs sm:text-sm">{s.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === selected ? "w-7 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#001428] via-navy to-[#001f3f] relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.15fr_1fr] gap-0">
        {/* LEFT — Branding + Carousel */}
        <div className="hidden lg:flex flex-col px-10 xl:px-16 py-10 text-white">
          {/* Brand header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="rounded-md bg-white p-2 shadow-lg">
              <img src={logo} alt="Insight Institute" className="h-20" />
            </div>
            {/* <div>
              <p className="font-heading font-bold text-xl leading-tight">Insight Institute</p>
              <p className="text-xs text-white/60 tracking-wider uppercase">Of Professional Studies</p>
            </div> */}
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-10 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Gujarat's No.1 CS Institute · Since 2012
            </div>
            <h1 className="mt-4 font-heading font-bold text-4xl xl:text-5xl leading-[1.1] tracking-tight">
              Where <span className="text-primary">Toppers</span> are
              <br /> Built, Not Born.
            </h1>
            <p className="mt-4 text-white/70 text-base max-w-md">
              Exclusively coaching Company Secretary aspirants with live classes,
              one-to-one doubt solving, and a proven record of All India Rankers.
            </p>
          </motion.div>

          {/* Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <BrandCarousel />
          </motion.div>

        </div>

        {/* RIGHT — Login form */}
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-full max-w-md ${shake ? "animate-shake" : ""}`}
          >
            {/* Mobile brand */}
            <div className="lg:hidden mb-6 flex items-center justify-center gap-3 text-white">
              <div className="rounded-xl bg-white p-2 shadow-lg">
                <img src={logo} alt="Insight Institute" className="h-9 w-auto" />
              </div>
              <div>
                <p className="font-heading font-bold text-lg leading-tight">Insight Institute</p>
                <p className="text-[10px] text-white/60 tracking-wider uppercase">Exclusively for CS</p>
              </div>
            </div>

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

            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 text-white"
            >
              {HIGHLIGHTS.map((h) => (
                <div
                  key={h.title}
                  className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-3 sm:p-4"
                >
                  <h.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-1.5 sm:mb-2" />
                  <p className="font-heading font-semibold text-[11px] sm:text-sm">{h.title}</p>
                  <p className="text-[9px] sm:text-xs text-white/60 mt-0.5 leading-snug">{h.text}</p>
                </div>
              ))}
            </motion.div>

            <p className="mt-6 text-center text-xs text-white/50">
              © {new Date().getFullYear()} Insight Institute of Professional Studies · Exclusively for CS since 2012
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
