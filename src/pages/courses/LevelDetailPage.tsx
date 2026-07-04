import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, Save, X, Clock, Wallet, ShieldAlert, Layers, BookOpen, Plus, FileText, Download, Upload, Database } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { levelActions, subjectAction, chapterAction, subjectPaperAction } from "@/redux/actions";
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
    duration_months: 0,
    fee_amount: "0.00",
    is_active: true,
  });

  // Modals State
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string>("");
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<any>(null);
  const [deletePaperId, setDeletePaperId] = useState<string | null>(null);

  const [paperForm, setPaperForm] = useState({
    set_name: "",
    file: null as File | null,
    answer_key: null as File | null,
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    total_hours: 0,
    is_active: true,
  });

  const [chapterForm, setChapterForm] = useState({
    name: "",
    description: "",
    order: 1,
    duration_hours: 0,
    is_active: true,
  });

  const canEdit =
    user && ["super_admin", "branch_manager", "admin_senior_executive"].includes(user.role);

  const canDelete =
    user && ["super_admin", "branch_manager"].includes(user.role);

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
        navigate(-1);
      },
      getError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || "Failed to delete level";
        toast.error(msg);
      },
    });
  };

  const openSubjectModal = (subject: any = null) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        name: subject.name || "",
        code: subject.code || "",
        total_hours: subject.total_hours || 0,
        is_active: subject.is_active !== false,
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({ name: "", code: "", total_hours: 0, is_active: true });
    }
    setSubjectModalOpen(true);
  };

  const saveSubject = () => {
    if (!subjectForm.name.trim()) return toast.error("Subject name is required");
    const payload = {
      level: levelId,
      name: subjectForm.name.trim(),
      code: subjectForm.code.trim(),
      total_hours: Number(subjectForm.total_hours),
      is_active: subjectForm.is_active,
    };
    const isEdit = !!editingSubject;
    dispatch({
      type: isEdit ? subjectAction.UPDATE_SUBJECT : subjectAction.CREATE_SUBJECT,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.SUBJECTS.UPDATE(editingSubject.id) : API.SUBJECTS.CREATE,
      body: payload,
      auth: true,
      getResponse: () => {
        toast.success(`Subject ${isEdit ? "updated" : "created"} successfully`);
        setSubjectModalOpen(false);
        fetchLevelDetail();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || err?.message || "Failed to save subject")
    });
  };

  const deleteSubject = () => {
    if (!deleteSubjectId) return;
    dispatch({
      type: subjectAction.DELETE_SUBJECT,
      method: "DELETE",
      endPoint: API.SUBJECTS.DELETE(deleteSubjectId),
      auth: true,
      getResponse: () => {
        toast.success("Subject deleted successfully");
        setDeleteSubjectId(null);
        fetchLevelDetail();
      },
      getError: (err: any) => toast.error("Failed to delete subject")
    });
  };

  const openChapterModal = (subjectId: string, chapter: any = null) => {
    setActiveSubjectId(subjectId);
    if (chapter) {
      setEditingChapter(chapter);
      setChapterForm({
        name: chapter.name || "",
        description: chapter.description || "",
        order: chapter.order || 1,
        duration_hours: chapter.duration_hours || 0,
        is_active: chapter.is_active !== false,
      });
    } else {
      setEditingChapter(null);
      setChapterForm({ name: "", description: "", order: 1, duration_hours: 0, is_active: true });
    }
    setChapterModalOpen(true);
  };

  const saveChapter = () => {
    if (!chapterForm.name.trim()) return toast.error("Chapter name is required");
    const payload = {
      name: chapterForm.name.trim(),
      description: chapterForm.description.trim(),
      order: Number(chapterForm.order),
      duration_hours: Number(chapterForm.duration_hours),
      is_active: chapterForm.is_active,
    };
    const isEdit = !!editingChapter;
    dispatch({
      type: isEdit ? chapterAction.UPDATE_CHAPTER : chapterAction.CREATE_CHAPTER,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.CHAPTERS.UPDATE(activeSubjectId, editingChapter.id) : API.CHAPTERS.CREATE(activeSubjectId),
      body: payload,
      auth: true,
      getResponse: () => {
        toast.success(`Chapter ${isEdit ? "updated" : "created"} successfully`);
        setChapterModalOpen(false);
        fetchLevelDetail();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || err?.message || "Failed to save chapter")
    });
  };

  const deleteChapter = () => {
    if (!deleteChapterId || !activeSubjectId) return;
    dispatch({
      type: chapterAction.DELETE_CHAPTER,
      method: "DELETE",
      endPoint: API.CHAPTERS.DELETE(activeSubjectId, deleteChapterId),
      auth: true,
      getResponse: () => {
        toast.success("Chapter deleted successfully");
        setDeleteChapterId(null);
        fetchLevelDetail();
      },
      getError: (err: any) => toast.error("Failed to delete chapter")
    });
  };

  const openPaperModal = (subjectId: string, paper: any = null) => {
    setActiveSubjectId(subjectId);
    if (paper) {
      setEditingPaper(paper);
      setPaperForm({
        set_name: paper.set_name || "",
        file: null,
        answer_key: null,
      });
    } else {
      setEditingPaper(null);
      setPaperForm({ set_name: "", file: null, answer_key: null });
    }
    setPaperModalOpen(true);
  };

  const savePaper = () => {
    if (!paperForm.set_name.trim()) return toast.error("Set name is required");
    const isEdit = !!editingPaper;
    if (!isEdit && !paperForm.file) return toast.error("Paper file is required");

    const formData = new FormData();
    formData.append("set_name", paperForm.set_name.trim());
    if (paperForm.file) formData.append("file", paperForm.file);
    if (paperForm.answer_key) formData.append("answer_key", paperForm.answer_key);

    dispatch({
      type: isEdit ? subjectPaperAction.UPDATE_SUBJECT_PAPER : subjectPaperAction.CREATE_SUBJECT_PAPER,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit ? API.SUBJECT_PAPERS.UPDATE(activeSubjectId, editingPaper.id) : API.SUBJECT_PAPERS.CREATE(activeSubjectId),
      body: formData,
      isFormData: true,
      auth: true,
      getResponse: () => {
        toast.success(`Paper ${isEdit ? "updated" : "uploaded"} successfully`);
        setPaperModalOpen(false);
        fetchLevelDetail();
      },
      getError: (err: any) => toast.error(err?.response?.data?.message || err?.message || "Failed to save paper")
    });
  };

  const deletePaper = () => {
    if (!deletePaperId || !activeSubjectId) return;
    dispatch({
      type: subjectPaperAction.DELETE_SUBJECT_PAPER,
      method: "DELETE",
      endPoint: API.SUBJECT_PAPERS.DELETE(activeSubjectId, deletePaperId),
      auth: true,
      getResponse: () => {
        toast.success("Paper deleted successfully");
        setDeletePaperId(null);
        fetchLevelDetail();
      },
      getError: (err: any) => toast.error("Failed to delete paper")
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
        <Button onClick={() => navigate(-1)}>
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
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {canEdit && !isEditing && (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                {canDelete && (
                  <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                )}
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

            {/* Subjects List */}
            {level.subjects && level.subjects.length > 0 && (
              <Card className="border-none shadow-sm bg-transparent">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Curriculum Subjects
                  </CardTitle>
                  {canEdit && !isEditing && (
                    <Button onClick={() => openSubjectModal()} className="bg-primary hover:bg-primary-dark">
                      <Plus className="w-4 h-4 mr-1.5" /> Add Subject
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  {level.subjects.map((subject: any) => (
                    <Card key={subject.id} className="overflow-hidden border border-border hover:border-primary/30 transition-all duration-200">
                      <div className="p-5 bg-card">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-lg text-text-primary">{subject.name}</h4>
                              <Badge variant={subject.is_active ? "default" : "secondary"} className={subject.is_active ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" : ""}>
                                {subject.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex gap-4">
                              {subject.code && <span className="font-medium text-primary/80">Code: {subject.code}</span>}
                              {subject.total_hours !== undefined && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {subject.total_hours} Hours</span>}
                            </div>
                          </div>
                          
                          {canEdit && !isEditing && (
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs mr-2 border-primary/20 hover:bg-primary/5 text-primary" 
                                onClick={() => navigate(`/courses-batches/${courseId}/level/${levelId}/subject/${subject.id}/questions`)}
                              >
                                <Database className="w-3.5 h-3.5 mr-1.5" /> Question Bank
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openSubjectModal(subject)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {canDelete && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteSubjectId(subject.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="chapters" className="border-0">
                              <AccordionTrigger className="py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 hover:no-underline text-sm font-semibold text-muted-foreground transition-colors">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4" />
                                  <span>Chapters ({subject.chapters ? subject.chapters.length : 0})</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 pb-0">
                                <div className="flex justify-end mb-3">
                                  {canEdit && !isEditing && (
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-primary/20 hover:bg-primary/5 text-primary" onClick={() => openChapterModal(subject.id)}>
                                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Chapter
                                    </Button>
                                  )}
                                </div>
                                {subject.chapters && subject.chapters.length > 0 ? (
                                  <div className="space-y-3">
                                    {subject.chapters.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((chapter: any) => (
                                      <div key={chapter.id} className="group relative flex items-start justify-between p-4 rounded-xl bg-background border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all">
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2.5">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                              {chapter.order || "-"}
                                            </span>
                                            <span className="font-semibold text-text-primary text-base">
                                              {chapter.name}
                                            </span>
                                            <Badge variant={chapter.is_active ? "outline" : "secondary"} className={cn("text-[10px] px-2 py-0 h-5", chapter.is_active && "border-green-500/30 text-green-600 bg-green-500/5")}>
                                              {chapter.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                          </div>
                                          {chapter.description && (
                                            <p className="text-muted-foreground text-sm pl-8">
                                              {chapter.description}
                                            </p>
                                          )}
                                          {chapter.duration_hours > 0 && (
                                            <p className="text-xs font-medium text-muted-foreground/80 pl-8 flex items-center gap-1">
                                              <Clock className="w-3 h-3" /> {chapter.duration_hours} duration hours
                                            </p>
                                          )}
                                        </div>
                                        {canEdit && !isEditing && (
                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openChapterModal(subject.id, chapter)}>
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                            {canDelete && (
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setActiveSubjectId(subject.id); setDeleteChapterId(chapter.id); }}>
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-sm text-muted-foreground bg-background rounded-xl border border-dashed border-border">
                                    No chapters added yet.
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="papers" className="border-0 mt-2">
                              <AccordionTrigger className="py-2.5 px-4 rounded-lg bg-muted/40 hover:bg-muted/60 hover:no-underline text-sm font-semibold text-muted-foreground transition-colors">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  <span>Papers ({subject.papers ? subject.papers.length : 0})</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 pb-0">
                                <div className="flex justify-end mb-3">
                                  {canEdit && !isEditing && (
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-primary/20 hover:bg-primary/5 text-primary" onClick={() => openPaperModal(subject.id)}>
                                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Paper
                                    </Button>
                                  )}
                                </div>
                                {subject.papers && subject.papers.length > 0 ? (
                                  <div className="space-y-3">
                                    {subject.papers.map((paper: any) => (
                                      <div key={paper.id} className="group relative flex items-start justify-between p-4 rounded-xl bg-background border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all">
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-2.5">
                                            <span className="font-semibold text-text-primary text-base">
                                              {paper.set_name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-2">
                                            {paper.file && (
                                              <a href={paper.file} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                                                <Download className="w-3.5 h-3.5" /> Question Paper
                                              </a>
                                            )}
                                            {paper.answer_key && (
                                              <a href={paper.answer_key} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                                                <Download className="w-3.5 h-3.5" /> Answer Key
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                        {canEdit && !isEditing && (
                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openPaperModal(subject.id, paper)}>
                                              <Pencil className="w-4 h-4" />
                                            </Button>
                                            {canDelete && (
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { setActiveSubjectId(subject.id); setDeletePaperId(paper.id); }}>
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-sm text-muted-foreground bg-background rounded-xl border border-dashed border-border">
                                    No papers uploaded yet.
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Parameters */}
          <div className="space-y-6">
            {level.subjects?.length === 0 && canEdit && !isEditing && (
              <Card className="border-dashed border-2 bg-muted/20 border-border">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-text-primary">No Subjects Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
                      Start building the curriculum for this level.
                    </p>
                  </div>
                  <Button onClick={() => openSubjectModal()} className="mt-2 bg-primary hover:bg-primary-dark">
                    <Plus className="w-4 h-4 mr-2" /> Add First Subject
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm border-border">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Key Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sequence Order</p>
                    <p className="text-base font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{level.order}</span>
                      Level {level.order}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" /> Duration
                    </p>
                    <p className="text-base font-medium">{level.duration_months ?? 0} Months</p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-primary" /> Fee Amount
                    </p>
                    <p className="text-2xl font-bold text-text-primary tracking-tight">₹{Number(level.fee_amount || 0).toLocaleString("en-IN")}</p>
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

      {/* Subject Modal */}
      <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="sub-name">Subject Name <span className="text-destructive">*</span></Label>
              <Input id="sub-name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sub-code">Code</Label>
                <Input id="sub-code" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sub-hours">Total Hours</Label>
                <Input id="sub-hours" type="number" min="0" value={subjectForm.total_hours} onChange={(e) => setSubjectForm({ ...subjectForm, total_hours: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30 mt-2">
              <Label htmlFor="sub-active" className="text-sm font-medium cursor-pointer">Active Status</Label>
              <Switch id="sub-active" checked={subjectForm.is_active} onCheckedChange={(c) => setSubjectForm({ ...subjectForm, is_active: c })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectModalOpen(false)}>Cancel</Button>
            <Button onClick={saveSubject}>Save Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter Modal */}
      <Dialog open={chapterModalOpen} onOpenChange={setChapterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChapter ? "Edit Chapter" : "Add Chapter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="chap-name">Chapter Name <span className="text-destructive">*</span></Label>
              <Input id="chap-name" value={chapterForm.name} onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chap-order">Sequence Order</Label>
              <Input id="chap-order" type="number" min="1" value={chapterForm.order} onChange={(e) => setChapterForm({ ...chapterForm, order: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chap-desc">Description</Label>
              <Textarea id="chap-desc" rows={3} value={chapterForm.description} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chap-hours">Duration Hours</Label>
              <Input id="chap-hours" type="number" min="0" value={chapterForm.duration_hours} onChange={(e) => setChapterForm({ ...chapterForm, duration_hours: Number(e.target.value) })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30 mt-2">
              <Label htmlFor="chap-active" className="text-sm font-medium cursor-pointer">Active Status</Label>
              <Switch id="chap-active" checked={chapterForm.is_active} onCheckedChange={(c) => setChapterForm({ ...chapterForm, is_active: c })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterModalOpen(false)}>Cancel</Button>
            <Button onClick={saveChapter}>Save Chapter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteSubjectId}
        onOpenChange={(op) => !op && setDeleteSubjectId(null)}
        title="Delete Subject?"
        description="Are you sure you want to delete this subject? All chapters inside it will also be deleted."
        confirmLabel="Delete"
        onConfirm={deleteSubject}
      />
      
      <ConfirmDialog
        open={!!deleteChapterId}
        onOpenChange={(op) => !op && setDeleteChapterId(null)}
        title="Delete Chapter?"
        description="Are you sure you want to delete this chapter?"
        confirmLabel="Delete"
        onConfirm={deleteChapter}
      />

      {/* Paper Modal */}
      <Dialog open={paperModalOpen} onOpenChange={setPaperModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPaper ? "Edit Paper" : "Upload Paper"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="paper-name">Set Name <span className="text-destructive">*</span></Label>
              <Input id="paper-name" placeholder="e.g. Set A, Morning Shift" value={paperForm.set_name} onChange={(e) => setPaperForm({ ...paperForm, set_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paper-file">Question Paper (PDF/Doc) {editingPaper ? <span className="text-xs text-muted-foreground ml-2">(Leave blank to keep current)</span> : <span className="text-destructive">*</span>}</Label>
              <Input id="paper-file" type="file" onChange={(e) => setPaperForm({ ...paperForm, file: e.target.files?.[0] || null })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paper-answer-key">Answer Key (Optional) {editingPaper ? <span className="text-xs text-muted-foreground ml-2">(Leave blank to keep current)</span> : ""}</Label>
              <Input id="paper-answer-key" type="file" onChange={(e) => setPaperForm({ ...paperForm, answer_key: e.target.files?.[0] || null })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaperModalOpen(false)}>Cancel</Button>
            <Button onClick={savePaper}>{editingPaper ? "Save Paper" : "Upload Paper"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletePaperId}
        onOpenChange={(op) => !op && setDeletePaperId(null)}
        title="Delete Paper?"
        description="Are you sure you want to delete this paper? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={deletePaper}
      />
    </div>
  );
}
