import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2, Loader2, Layers, AlertTriangle, Clock, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { RootState, AppDispatch } from "@/store";
import { levelActions } from "@/redux/actions";
import { API } from "@/service/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

import {
  setLevels,
  setLevelsLoading,
  setLevelsError,
  addLevelToList,
  updateLevelInList,
  removeLevelFromList,
  LevelRecord,
} from "@/redux/slices/levelsSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function LevelsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  // Redux Selectors
  const { courses, loading: coursesLoading } = useSelector((state: RootState) => state.courses);
  const {
    levels,
    loading: levelsLoading,
    error: levelsError,
  } = useSelector((state: RootState) => state.levels);

  // Component States
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelRecord | null>(null);

  // Level Form Fields
  const [levelForm, setLevelForm] = useState({
    name: "",
    order: 1,
    description: "",
    course_type: "standard",
    duration_months: 0,
    fee_amount: "0.00",
    is_active: true,
  });

  // Delete Dialog States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<LevelRecord | null>(null);

  // Can Edit Permission Check
  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_executive"].includes(user.role);
  
  const canDelete =
    user && ["super_admin", "branch_manager"].includes(user.role);

  // Auto-select first course when courses load
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(String(courses[0].id));
    }
  }, [courses, selectedCourseId]);

  // Fetch levels when selected course changes
  const fetchLevels = (courseId: string) => {
    if (!courseId) return;

    dispatch({
      type: levelActions.GET_LEVELS,
      method: "GET",
      endPoint: API.COURSES.LEVELS.LIST(courseId),
      auth: true,
      setLoading: (val: boolean) => dispatch(setLevelsLoading(val)),
      getResponse: (res: any) => {
        const fetchedLevels = res?.data ?? res;
        if (Array.isArray(fetchedLevels)) {
          dispatch(setLevels(fetchedLevels));
        } else {
          dispatch(setLevels([]));
        }
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch levels";
        dispatch(setLevelsError(msg));
        toast.error(msg);
      },
    });
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchLevels(selectedCourseId);
    } else {
      dispatch(setLevels([]));
    }
  }, [selectedCourseId, dispatch]);

  const handleOpenAdd = () => {
    // Determine the next order number based on existing levels
    const nextOrder =
      levels.length > 0 ? Math.max(...levels.map((l) => Number(l.order || 0))) + 1 : 1;

    setEditingLevel(null);
    setLevelForm({
      name: "",
      order: nextOrder,
      description: "",
      course_type: "standard",
      duration_months: 0,
      fee_amount: "0.00",
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (level: LevelRecord) => {
    if (!selectedCourseId) return;

    setEditingLevel(level);
    
    dispatch({
      type: levelActions.GET_LEVEL_DETAILS,
      method: "GET",
      endPoint: API.COURSES.LEVELS.DETAIL(selectedCourseId, level.id),
      auth: true,
      setLoading: (val: boolean) => setIsSubmitting(val),
      getResponse: (res: any) => {
        const data = res?.data ?? res;
        setLevelForm({
          name: data.name || "",
          order: Number(data.order || 0),
          description: data.description || "",
          course_type: data.course_type || "standard",
          duration_months: Number(data.duration_months || 0),
          fee_amount: String(data.fee_amount || "0.00"),
          is_active: data.is_active !== false,
        });
        setIsFormOpen(true);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to fetch level details";
        toast.error(msg);
        setLevelForm({
          name: level.name || "",
          order: Number(level.order || 0),
          description: level.description || "",
          course_type: level.course_type || "standard",
          duration_months: Number(level.duration_months || 0),
          fee_amount: String(level.fee_amount || "0.00"),
          is_active: level.is_active !== false,
        });
        setIsFormOpen(true);
      },
    });
  };

  const handleOpenDelete = (level: LevelRecord) => {
    setLevelToDelete(level);
    setIsDeleteOpen(true);
  };

  const handleSaveLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error("Please select a course first.");
      return;
    }
    if (!levelForm.name.trim()) {
      toast.error("Level name is required.");
      return;
    }

    const payload = {
      name: levelForm.name.trim(),
      order: Number(levelForm.order),
      description: levelForm.description.trim(),
      duration_months: Number(levelForm.duration_months),
      fee_amount: levelForm.fee_amount,
      is_active: levelForm.is_active,
    };

    if (editingLevel) {
      // Edit Level Request
      dispatch({
        type: levelActions.UPDATE_LEVEL,
        method: "PATCH",
        endPoint: API.COURSES.LEVELS.UPDATE(selectedCourseId, editingLevel.id),
        body: payload,
        auth: true,
        setLoading: (val: boolean) => setIsSubmitting(val),
        getResponse: (res: any) => {
          const updated = res?.data ?? res;
          dispatch(updateLevelInList(updated));
          toast.success("Level updated successfully.");
          setIsFormOpen(false);
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to update level";
          toast.error(msg);
        },
      });
    } else {
      // Create Level Request
      dispatch({
        type: levelActions.CREATE_LEVEL,
        method: "POST",
        endPoint: API.COURSES.LEVELS.CREATE(selectedCourseId),
        body: payload,
        auth: true,
        setLoading: (val: boolean) => setIsSubmitting(val),
        getResponse: (res: any) => {
          const created = res?.data ?? res;
          dispatch(addLevelToList(created));
          toast.success("Level created successfully.");
          setIsFormOpen(false);
        },
        getError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to create level";
          toast.error(msg);
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!levelToDelete || !selectedCourseId) return;

    dispatch({
      type: levelActions.DELETE_LEVEL,
      method: "DELETE",
      endPoint: API.COURSES.LEVELS.DELETE(selectedCourseId, levelToDelete.id),
      auth: true,
      getResponse: () => {
        dispatch(removeLevelFromList(levelToDelete.id));
        toast.success("Level deleted successfully.");
        setIsDeleteOpen(false);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete level";
        toast.error(msg);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Course Selection & Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Layers className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 sm:w-64">
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={coursesLoading}
            >
              <SelectTrigger className="bg-muted/20">
                <SelectValue
                  placeholder={coursesLoading ? "Loading courses..." : "Select a Course"}
                />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.name} ({course.code || "No Code"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCourseId && canEdit && (
          <Button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Level
          </Button>
        )}
      </div>

      {/* Levels Table/List */}
      {!selectedCourseId ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 flex flex-col items-center justify-center text-center">
          <Layers className="w-12 h-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="font-semibold text-lg text-text-primary">No Course Selected</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Select a course from the dropdown above to manage its academic levels.
          </p>
        </div>
      ) : levelsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-4 h-[210px] flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
                <Skeleton className="w-16 h-5 rounded-full shrink-0" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="grid grid-cols-2 gap-3 pt-3 mt-auto border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3.5 h-3.5 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3.5 h-3.5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : levelsError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 shadow-sm p-8 min-h-[250px] flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-destructive font-medium">{levelsError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchLevels(selectedCourseId)}
          >
            Retry
          </Button>
        </div>
      ) : levels.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {levels.map((level) => (
            <motion.div
              key={level.id}
              className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
              onClick={() => navigate(`/courses-batches/${selectedCourseId}/level/${level.id}`)}
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className="font-semibold text-base text-text-primary group-hover:text-primary transition-colors"
                      >
                        {level.name}
                      </h4>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0",
                      level.is_active !== false
                        ? "bg-green-500/10 text-green-600"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {level.is_active !== false ? "Active" : "Inactive"}
                  </span>
                </div>

                {level.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {level.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground border-t border-border/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{level.duration_months ?? 0} Months</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Wallet className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate font-medium text-text-primary">
                      Fee: ₹{Number(level.fee_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="bg-muted/30 px-5 py-3 border-t border-border flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 hover:bg-muted/80 text-muted-foreground hover:text-text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(level);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDelete(level);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 flex flex-col items-center justify-center text-center">
          <Layers className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
          <h3 className="font-semibold text-lg text-text-primary">No Levels Defined</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            This course does not have any levels configured. Click "Add Level" to start adding
            stages like Foundation, Intermediate, etc.
          </p>
        </div>
      )}

      {/* Add / Edit Level Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveLevel} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingLevel ? "Edit Level Details" : "Add New Academic Level"}
              </DialogTitle>
              <DialogDescription>
                Configure the step or milestone within this course structure.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Level Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. CSEET"
                    value={levelForm.name}
                    onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Sequence Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    value={levelForm.order}
                    onChange={(e) => setLevelForm({ ...levelForm, order: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_months">Duration (Months)</Label>
                <Input
                  id="duration_months"
                  type="number"
                  min="0"
                  placeholder="e.g. 12"
                  value={levelForm.duration_months}
                  onChange={(e) =>
                    setLevelForm({ ...levelForm, duration_months: Number(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee_amount">Fee Amount</Label>
                  <Input
                    id="fee_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 5000.00"
                    value={levelForm.fee_amount}
                    onChange={(e) => setLevelForm({ ...levelForm, fee_amount: e.target.value })}
                    required
                  />
                </div>

                <div className="flex flex-col justify-end pb-1.5">
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30 h-10">
                    <Label
                      htmlFor="level-active"
                      className="text-xs font-semibold text-text-primary cursor-pointer"
                    >
                      Active Status
                    </Label>
                    <Switch
                      id="level-active"
                      checked={levelForm.is_active}
                      onCheckedChange={(checked) =>
                        setLevelForm({ ...levelForm, is_active: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief summary of syllabus or targets for this level"
                  value={levelForm.description}
                  onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                  className="resize-none h-20"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5">
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingLevel ? "Save Changes" : "Create Level"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={`Delete "${levelToDelete?.name}"?`}
        description="This action cannot be undone. Any curriculum structure built on top of this level may also be affected."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
