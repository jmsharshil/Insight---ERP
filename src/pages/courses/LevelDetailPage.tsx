import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, Save, X, Clock, Wallet, ShieldAlert, Layers } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { levelActions } from "@/redux/actions";
import { API } from "@/service/api";
import { cn } from "@/lib/utils";
import { updateLevelInList, removeLevelFromList } from "@/redux/slices/levelsSlice";

function LevelDetailSkeleton() {
  return (
    <div className="mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton width={180} height={32} className="mb-2" />
          <Skeleton width={250} height={16} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={100} height={36} />
          <Skeleton width={100} height={36} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton width={150} height={24} />
              <Skeleton width={60} height={20} borderRadius={12} />
            </CardHeader>
            <CardContent>
              <Skeleton count={3} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton width={120} height={24} />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton width={80} height={14} />
                  <Skeleton width={120} height={18} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LevelDetailPage() {
  const { courseId, levelId } = useParams<{ courseId: string; levelId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  const [level, setLevel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    order: 1,
    description: "",
    course_type: "standard",
    duration_months: 0,
    fee_amount: "0.00",
    is_active: true,
  });

  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_exec"].includes(user.role);

  // Fetch Level details
  const fetchLevelDetail = () => {
    if (!courseId || !levelId) return;
    dispatch({
      type: levelActions.GET_LEVEL_DETAILS,
      method: "GET",
      endPoint: API.COURSES.LEVELS.DETAIL(courseId, levelId),
      auth: true,
      setLoading: setLoading,
      getResponse: (res: any) => {
        const data = res?.data ?? res;
        if (data?.id) {
          setLevel(data);
          setForm({
            name: data.name || "",
            order: Number(data.order || 1),
            description: data.description || "",
            course_type: data.course_type || "standard",
            duration_months: Number(data.duration_months || 0),
            fee_amount: String(data.fee_amount || "0.00"),
            is_active: data.is_active !== false,
          });
        } else {
          toast.error("Failed to load course level details.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch level details";
        toast.error(msg);
      },
    });
  };

  useEffect(() => {
    fetchLevelDetail();
  }, [courseId, levelId]);

  const handleUpdate = () => {
    if (!courseId || !levelId || !level) return;
    if (!form.name.trim()) {
      toast.error("Level name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      order: Number(form.order),
      description: form.description.trim(),
      course_type: form.course_type,
      duration_months: Number(form.duration_months),
      fee_amount: form.fee_amount,
      is_active: form.is_active,
    };

    dispatch({
      type: levelActions.UPDATE_LEVEL,
      method: "PATCH",
      endPoint: API.COURSES.LEVELS.UPDATE(courseId, levelId),
      body: payload,
      auth: true,
      setLoading: setUpdateLoading,
      getResponse: (res: any) => {
        const updated = res?.data ?? res;
        if (updated?.id) {
          setLevel(updated);
          dispatch(updateLevelInList(updated));
          toast.success("Level details updated successfully.");
          setIsEditing(false);
        } else {
          toast.error("Unexpected response from server.");
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to update level";
        toast.error(msg);
      },
    });
  };

  const handleDelete = () => {
    if (!courseId || !levelId || !level) return;
    dispatch({
      type: levelActions.DELETE_LEVEL,
      method: "DELETE",
      endPoint: API.COURSES.LEVELS.DELETE(courseId, levelId),
      auth: true,
      getResponse: () => {
        dispatch(removeLevelFromList(levelId));
        toast.success("Course level deleted successfully.");
        setDeleteConfirmOpen(false);
        navigate(`/courses-batches`);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete level";
        toast.error(msg);
      },
    });
  };

  if (loading) {
    return <LevelDetailSkeleton />;
  }

  if (!level) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h3 className="text-lg font-semibold">Level Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested course level could not be loaded.</p>
        <Button onClick={() => navigate("/courses-batches")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Courses & Batches
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      <PageHeader
        title={isEditing ? `Edit Level: ${level.name}` : level.name}
        subtitle={isEditing ? "Modify level properties below." : "View and manage course level details."}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/courses-batches`)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {canEdit && !isEditing && (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="level-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level Name</Label>
                    <Input
                      id="level-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. CSEET"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="level-order" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sequence Order</Label>
                    <Input
                      id="level-order"
                      type="number"
                      min="1"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="level-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
                  <Textarea
                    id="level-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe this academic level..."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parameters Edit Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Level Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="course_type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Type</Label>
                  <Select
                    value={form.course_type}
                    onValueChange={(val) => setForm({ ...form, course_type: val })}
                  >
                    <SelectTrigger id="course_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="fast_track">Fast Track</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="level-duration" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration (Months)</Label>
                  <Input
                    id="level-duration"
                    type="number"
                    min="0"
                    value={form.duration_months}
                    onChange={(e) => setForm({ ...form, duration_months: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="level-fees" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fee Amount</Label>
                  <Input
                    id="level-fees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.fee_amount}
                    onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
                  <Label htmlFor="level-active" className="text-xs font-semibold text-text-primary cursor-pointer">
                    Active Status
                  </Label>
                  <Switch
                    id="level-active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)} disabled={updateLoading}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleUpdate} disabled={updateLoading}>
                    <Save className="w-4 h-4 mr-2" /> {updateLoading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Level Overview
                  </CardTitle>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      level.is_active
                        ? "bg-green-500/10 text-green-600"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {level.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base text-text-primary leading-relaxed">
                  {level.description || "No description provided for this course level."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Parameters */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sequence Order</p>
                    <p className="text-sm font-medium">{level.order}</p>
                  </div>

                  {level.course_type_display && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Course Type</p>
                      <p className="text-sm font-medium capitalize">{level.course_type_display}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Duration
                    </p>
                    <p className="text-sm font-medium">{level.duration_months ?? 0} Months</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" /> Fee Amount
                    </p>
                    <p className="text-sm font-medium">₹{Number(level.fee_amount || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${level.name}"?`}
        description="This action cannot be undone. Any curriculum or batch schedules reference under this level might be affected."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
