import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleNotificationPref } from "@/store/slices/uiSlice";

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

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Name</Label><Input defaultValue={user?.name} /></div>
            <div><Label>Email</Label><Input defaultValue={user?.email} disabled /></div>
            <div><Label>Phone</Label><Input defaultValue={user?.phone} /></div>
            <Button onClick={() => toast.success("Profile updated successfully.")}>Save Profile</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Security</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Current Password</Label><Input type="password" /></div>
            <div><Label>New Password</Label><Input type="password" /></div>
            <div><Label>Confirm Password</Label><Input type="password" /></div>
            <Button onClick={() => toast.success("Password updated.")}>Change Password</Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {NOTIF_PREFS.map((p) => (
              <div key={p.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <Label htmlFor={p.key}>{p.label}</Label>
                <Switch id={p.key} checked={prefs[p.key] ?? true} onCheckedChange={() => dispatch(toggleNotificationPref(p.key))} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Branch</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Branch</div>
            <div className="font-heading font-semibold">{user?.branch}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
