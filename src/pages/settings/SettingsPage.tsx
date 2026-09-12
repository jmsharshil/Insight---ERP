import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleNotificationPref } from "@/store/slices/uiSlice";
import { authActions, settingActions } from "@/redux/actions";
import { setProfile, setSettingsLoading, setSettingsError } from "@/redux/slices/settingsSlice";
import { updateUser } from "@/redux/slices/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RoleBadge from "@/components/common/RoleBadge";
import { CardSkeleton } from "@/components/common/Skeletons";
import {
  Loader2,
  Shield,
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  Key,
  HelpCircle,
  Check,
  Copy,
  AlertCircle,
  Building,
  UserCheck,
} from "lucide-react";

const NOTIF_PREFS: Array<{ key: string; label: string }> = [
  { key: "fee_due", label: "Fee due reminders" },
  { key: "exam_scheduled", label: "Exam scheduled" },
  { key: "leave_approved", label: "Leave approved/rejected" },
  { key: "chat_mention", label: "Chat mentions" },
  { key: "announcement", label: "Institute announcements" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const prefs = useAppSelector((s: any) => s.ui.notificationPrefs || {});
  const { setPageTitle } = useUI();

  // Settings Redux selectors
  const profile = useAppSelector((state: any) => state.settings.profile);
  const loading = useAppSelector((state: any) => state.settings.loading);
  const error = useAppSelector((state: any) => state.settings.error);

  // No editable form states needed

  // Password change states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Clipboard copies
  const [copiedId, setCopiedId] = useState(false);
  const [copiedOrgId, setCopiedOrgId] = useState(false);

  const additionalRolesList: string[] = useMemo(() => {
    const roles = profile?.additional_roles;
    if (!roles) return [];
    if (Array.isArray(roles)) return roles.filter(Boolean);
    if (typeof roles === "string") {
      try {
        const parsed = JSON.parse(roles);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {
        return roles.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [profile?.additional_roles]);

  const fetchSettings = () => {
    dispatch(setSettingsLoading(true));
    dispatch({
      type: settingActions.GET_SETTINGS,
      method: "GET",
      endPoint: "/api/auth/me/",
      auth: true,
      getResponse: (res: any) => {
        dispatch(setProfile(res));
        dispatch(setSettingsLoading(false));

        // Sync API details with auth state to keep header avatar & details in sync
        dispatch(
          updateUser({
            id: res.id,
            username: res.username,
            email: res.email,
            phone: res.phone,
            name: res.name,
            role: res.role,
            additional_roles: res.additional_roles,
            linked_students: res.linked_students,
            branch: res.branch,
            organization: res.organization,
            organization_name: res.organization_name,
            profile_pic: res.profile_pic,
          }),
        );
      },
      getError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Failed to fetch settings";
        dispatch(setSettingsError(errMsg));
        dispatch(setSettingsLoading(false));
      },
    });
  };

  useEffect(() => {
    setPageTitle("Settings");
  }, [setPageTitle]);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removed profile edit functions

  const handleChangePassword = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    dispatch({
      type: authActions.SET_PASSWORD,
      method: "POST",
      endPoint: "/api/auth/change-password/",
      auth: true,
      body: {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_new_password: passwordForm.confirmPassword,
      },
      setLoading: (val: boolean) => setPasswordLoading(val),
      getResponse: (res: any) => {
        console.log(res);
        toast.success("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      },
      getError: (err: any) => {
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to change password.";
        toast.error(errorMsg);
      },
    });
  };

  const handleCopyId = (id: string, type: "user" | "org") => {
    navigator.clipboard.writeText(id);
    if (type === "user") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedOrgId(true);
      setTimeout(() => setCopiedOrgId(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  const avatarUrl = profile?.profile_pic
    ? profile?.profile_pic?.startsWith("http")
      ? profile?.profile_pic
      : import.meta.env.VITE_APP_BASE_URL + profile?.profile_pic
    : undefined;

  const initials =
    profile?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  if (loading && !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Manage your profile and preferences" />
        <div className="grid lg:grid-cols-2 gap-6">
          <CardSkeleton rows={4} hasAvatar={true} />
          <CardSkeleton rows={4} hasAvatar={false} />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Manage your profile and preferences" />
        <Card className="border-destructive/50 bg-destructive/5 max-w-xl mx-auto mt-8">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>Error Loading Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={fetchSettings}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title="Settings"
          subtitle="Manage your profile, system settings, and preferences"
        />

        <div className="-mt-2">
          <span className="inline-flex items-center rounded-lg border border-border bg-red-100 px-4 py-2.5 text-sm text-red-500">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            Profile updates are managed by your administrator. Please contact them if you need to make any changes.
          </span>
        </div>
      </div>

      {/* Premium Profile Header Banner */}
      {profile && (
        <Card className="relative overflow-hidden border border-border shadow-sm bg-gradient-to-r from-card to-background">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                  <AvatarImage src={avatarUrl} alt={profile?.name} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary-dark font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                  <h3 className="text-2xl font-bold text-text-primary">{profile?.name}</h3>
                  <RoleBadge role={profile?.role} />
                  {additionalRolesList.map((r: string) => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {profile?.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {profile?.phone || "No phone added"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> {profile?.organization_name}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Profile info & Security */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                View your personal details and how others see you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Profile Picture Display */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-border">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                    <AvatarImage src={avatarUrl} alt={profile?.name || ""} className="object-cover" />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary-dark font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <Label className="font-semibold text-sm block">Profile Picture</Label>
                  <p className="text-xs text-muted-foreground">Your current profile picture.</p>
                </div>
              </div>

              {/* Profile Details (Read-Only) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                    Full Name
                  </span>
                  <span className="text-sm font-medium text-text-primary block">
                    {profile?.name || "N/A"}
                  </span>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                    Email Address
                  </span>
                  <span className="text-sm font-medium text-text-primary block break-all">
                    {profile?.email || "N/A"}
                  </span>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                    Phone Number
                  </span>
                  <span className="text-sm font-medium text-text-primary block">
                    {profile?.phone || "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-dark" />
                Security & Password
              </CardTitle>
              <CardDescription>
                Update your login credentials to secure your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="curr-pass">Current Password</Label>
                <Input
                  id="curr-pass"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pass">New Password</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass">Confirm Password</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  variant="outline"
                  className="flex items-center gap-1.5"
                >
                  {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Key className="w-4 h-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Read-Only System Details & Notification Preferences */}
        <div className="lg:col-span-5 space-y-6">
          {/* Organization & System Info */}
          {profile && (
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary-dark" />
                  System & Organization Info
                </CardTitle>
                <CardDescription>
                  Official role, organization, and registration details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Name */}
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                    User Name
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary block truncate max-w-[220px] md:max-w-xs">
                      {profile.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyId(profile.username, "user")}
                      className="h-8 w-8 hover:bg-muted"
                      title="Copy User Name"
                    >
                      {copiedId ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Organization details */}
                <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                    Organization
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-text-primary block">
                        {profile.organization_name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyId(profile.organization_name, "org")}
                      className="h-8 w-8 hover:bg-muted"
                      title="Copy Organization Name"
                    >
                      {copiedOrgId ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Role and Branch Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                      System Role
                    </span>
                    <span className="block pt-0.5">
                      <RoleBadge role={profile.role} />
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                      Branch
                    </span>
                    <span className="text-sm font-medium text-text-primary block">
                      {profile.branch_name || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Additional Roles */}
                {additionalRolesList.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                      Additional Roles
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {additionalRolesList.map((r: string) => (
                        <RoleBadge key={r} role={r} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Student */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider block">
                      Linked Student
                    </span>
                    <span className="text-sm font-medium text-text-primary block">
                      {profile.linked_student_names && profile.linked_student_names.length > 0
                        ? profile.linked_student_names.join(", ")
                        : "No linked student profile"}
                    </span>
                  </div>
                  <UserCheck className="w-5 h-5 text-muted-foreground opacity-60" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
