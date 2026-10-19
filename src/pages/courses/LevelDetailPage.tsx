import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Pencil, Trash2, ChevronLeft, Save, X, Clock, Wallet, ShieldAlert, Layers, BookOpen, Plus, FileText, Download, Upload, Database, ChevronDown, FolderOpen, Calendar, FolderPlus } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
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
import { levelActions, subjectAction, chapterAction, subjectPaperAction, userActions, syllabusActions, moduleActions } from "@/redux/actions";
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
  const [syllabusActionLoading, setSyllabusActionLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    order: 1,
    description: "",
    duration_months: 0,
    fee_amount: "0.00",
    is_active: true,
  });

  // Modals State
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<any>(null);
  const [deleteSyllabusId, setDeleteSyllabusId] = useState<string | null>(null);

  const [syllabusForm, setSyllabusForm] = useState({
    name: "",
    year: new Date().getFullYear(),
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    description: "",
    is_active: true,
  });

  // Modules State
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [activeSyllabusId, setActiveSyllabusId] = useState<string>("");
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [moduleActionLoading, setModuleActionLoading] = useState(false);
  const [moduleForm, setModuleForm] = useState({
    name: "",
    order: 1,
    description: "",
    is_active: true,
  });

  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string>("");
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);
  const [deleteChapterInfo, setDeleteChapterInfo] = useState<{
    id: string;
    target: { type: "subject" | "module" | "syllabus"; id: string; syllabusId?: string };
  } | null>(null);

  // Flexible Chapter Target: can be a subject, a module, or directly in a syllabus
  const [chapterTarget, setChapterTarget] = useState<{
    type: "subject" | "module" | "syllabus";
    id: string;
    syllabusId?: string;
    title?: string;
  }>({ type: "subject", id: "" });
  
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<any>(null);
  const [deletePaperId, setDeletePaperId] = useState<string | null>(null);

  const [paperForm, setPaperForm] = useState({
    set_name: "",
    file: null as File | null,
    answer_key: null as File | null,
    no_of_questions: 0,
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    syllabus: "",
    module: "",
    is_active: true,
  });

  const [chapterForm, setChapterForm] = useState({
    name: "",
    description: "",
    duration_hours: 0,
    is_active: true,
    faculties: [] as string[],
  });

  const [facultyOptions, setFacultyOptions] = useState<{ id: string; name: string; levels: string[] }[]>([]);

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
    
    // Fetch faculties for chapter assignment
    dispatch({
      type: userActions.GET_USERS,
      method: "GET",
      endPoint: "/api/auth/users/?role=faculty",
      auth: true,
      getResponse: (res: any) => {
        if (res?.data) {
          setFacultyOptions(res.data.map((u: any) => ({
            id: u.id,
            name: u.name,
            levels: Array.isArray(u.levels) ? u.levels.map((l: any) => typeof l === 'object' ? l.id : l) : (u.level ? [u.level] : [])
          })));
        } else if (Array.isArray(res)) {
          setFacultyOptions(res.map((u: any) => ({
            id: u.id,
            name: u.name,
            levels: Array.isArray(u.levels) ? u.levels.map((l: any) => typeof l === 'object' ? l.id : l) : (u.level ? [u.level] : [])
          })));
        }
      },
    } as any);
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

  const openSyllabusModal = (syllabus: any = null) => {
    if (syllabus) {
      setEditingSyllabus(syllabus);
      setSyllabusForm({
        name: syllabus.name || "",
        year: syllabus.year || new Date().getFullYear(),
        start_date: syllabus.start_date || "",
        end_date: syllabus.end_date || "",
        description: syllabus.description || "",
        is_active: syllabus.is_active !== false,
      });
    } else {
      setEditingSyllabus(null);
      setSyllabusForm({
        name: "",
        year: new Date().getFullYear(),
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        description: "",
        is_active: true,
      });
    }
    setSyllabusModalOpen(true);
  };

  const saveSyllabus = () => {
    if (!syllabusForm.name.trim()) return toast.error("Syllabus name is required");
    if (!syllabusForm.start_date) return toast.error("Start date is required");
    if (syllabusForm.end_date && syllabusForm.end_date < syllabusForm.start_date) {
      return toast.error("End date cannot be earlier than start date.");
    }
    const payload = {
      level: levelId,
      name: syllabusForm.name.trim(),
      year: Number(syllabusForm.year),
      start_date: syllabusForm.start_date,
      end_date: syllabusForm.end_date || null,
      description: syllabusForm.description.trim(),
      is_active: syllabusForm.is_active,
    };
    const isEdit = !!editingSyllabus;
    dispatch({
      type: isEdit ? syllabusActions.UPDATE_SYLLABUS : syllabusActions.CREATE_SYLLABUS,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit
        ? API.COURSES.LEVELS.SYLLABUSES.UPDATE(courseId!, levelId!, editingSyllabus.id)
        : API.COURSES.LEVELS.SYLLABUSES.CREATE(courseId!, levelId!),
      body: payload,
      auth: true,
      setLoading: setSyllabusActionLoading,
      getResponse: () => {
        toast.success(`Syllabus ${isEdit ? "updated" : "created"} successfully`);
        setSyllabusModalOpen(false);
        fetchLevelDetail();
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to save syllabus"),
    });
  };

  const deleteSyllabus = () => {
    if (!deleteSyllabusId) return;
    dispatch({
      type: syllabusActions.DELETE_SYLLABUS,
      method: "DELETE",
      endPoint: API.COURSES.LEVELS.SYLLABUSES.DELETE(courseId!, levelId!, deleteSyllabusId),
      auth: true,
      getResponse: () => {
        toast.success("Syllabus deleted successfully");
        setDeleteSyllabusId(null);
        fetchLevelDetail();
      },
      getError: (err: any) => toast.error("Failed to delete syllabus"),
    });
  };

  /* ── Modules Handlers ────────────────────────────────────────── */
  const openModuleModal = (syllabusId: string, mod: any = null) => {
    setActiveSyllabusId(syllabusId);
    if (mod) {
      setEditingModule(mod);
      setModuleForm({
        name: mod.name || "",
        order: Number(mod.order || 1),
        description: mod.description || "",
        is_active: mod.is_active !== false,
      });
    } else {
      setEditingModule(null);
      const targetSyllabus = level?.syllabuses?.find((s: any) => String(s.id) === String(syllabusId));
      const nextOrder = (targetSyllabus?.modules?.length || 0) + 1;
      setModuleForm({
        name: `Module ${nextOrder}`,
        order: nextOrder,
        description: "",
        is_active: true,
      });
    }
    setModuleModalOpen(true);
  };

  const saveModule = () => {
    if (!moduleForm.name.trim()) return toast.error("Module name is required");
    const payload = {
      name: moduleForm.name.trim(),
      order: Number(moduleForm.order || 1),
      description: moduleForm.description.trim(),
      is_active: moduleForm.is_active,
    };
    const isEdit = !!editingModule;
    dispatch({
      type: isEdit ? moduleActions.UPDATE_MODULE : moduleActions.CREATE_MODULE,
      method: isEdit ? "PATCH" : "POST",
      endPoint: isEdit
        ? API.SYLLABUSES.MODULES.UPDATE(activeSyllabusId, editingModule.id)
        : API.SYLLABUSES.MODULES.CREATE(activeSyllabusId),
      body: payload,
      auth: true,
      setLoading: setModuleActionLoading,
      getResponse: () => {
        toast.success(`Module ${isEdit ? "updated" : "created"} successfully`);
        setModuleModalOpen(false);
        fetchLevelDetail();
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to save module"),
    });
  };

  const deleteModule = () => {
    if (!deleteModuleId || !activeSyllabusId) return;
    dispatch({
      type: moduleActions.DELETE_MODULE,
      method: "DELETE",
      endPoint: API.SYLLABUSES.MODULES.DELETE(activeSyllabusId, deleteModuleId),
      auth: true,
      getResponse: () => {
        toast.success("Module deleted successfully");
        setDeleteModuleId(null);
        fetchLevelDetail();
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete module"),
    });
  };

  /* ── Subjects Handlers ───────────────────────────────────────── */
  const openSubjectModal = (
    subject: any = null,
    defaultSyllabus: string = "",
    defaultModule: string = ""
  ) => {
    if (subject) {
      setEditingSubject(subject);
      setSubjectForm({
        name: subject.name || "",
        syllabus: subject.syllabus?.id || subject.syllabus || defaultSyllabus || "",
        module: subject.module?.id || subject.module || defaultModule || "",
        is_active: subject.is_active !== false,
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        name: "",
        syllabus: defaultSyllabus || (level?.syllabuses?.[0]?.id || ""),
        module: defaultModule || "",
        is_active: true,
      });
    }
    setSubjectModalOpen(true);
  };

  const saveSubject = () => {
    if (!subjectForm.name.trim()) return toast.error("Subject name is required");
    const payload = {
      level: levelId,
      syllabus: subjectForm.syllabus || null,
      module: subjectForm.module || null,
      name: subjectForm.name.trim(),
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
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to save subject"),
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
      getError: (err: any) => toast.error("Failed to delete subject"),
    });
  };

  /* ── Chapters Handlers ───────────────────────────────────────── */
  const openChapterModal = (
    target: { type: "subject" | "module" | "syllabus"; id: string; syllabusId?: string; title?: string },
    chapter: any = null
  ) => {
    setChapterTarget(target);
    if (target.type === "subject") {
      setActiveSubjectId(target.id);
    }
    if (chapter) {
      setEditingChapter(chapter);
      setChapterForm({
        name: chapter.name || "",
        description: chapter.description || "",
        duration_hours: chapter.duration_hours || 0,
        is_active: chapter.is_active !== false,
        faculties: Array.isArray(chapter.faculties)
          ? chapter.faculties.map((f: any) => (typeof f === "object" ? f.id : f))
          : [],
      });
    } else {
      setEditingChapter(null);
      setChapterForm({
        name: "",
        description: "",
        duration_hours: 0,
        is_active: true,
        faculties: [],
      });
    }
    setChapterModalOpen(true);
  };

  const saveChapter = () => {
    if (!chapterForm.name.trim()) return toast.error("Chapter name is required");
    const isEdit = !!editingChapter;
    const payload: any = {
      name: chapterForm.name.trim(),
      description: chapterForm.description.trim(),
      duration_hours: Number(chapterForm.duration_hours),
      is_active: chapterForm.is_active,
      faculties: chapterForm.faculties,
    };

    let method = isEdit ? "PATCH" : "POST";
    let endpoint = "";

    if (chapterTarget.type === "subject") {
      endpoint = isEdit
        ? API.CHAPTERS.UPDATE(chapterTarget.id, editingChapter.id)
        : API.CHAPTERS.CREATE(chapterTarget.id);
    } else if (chapterTarget.type === "module") {
      endpoint = isEdit
        ? API.SYLLABUSES.MODULES.CHAPTERS.UPDATE(chapterTarget.syllabusId!, chapterTarget.id, editingChapter.id)
        : API.SYLLABUSES.MODULES.CHAPTERS.CREATE(chapterTarget.syllabusId!, chapterTarget.id);
    } else if (chapterTarget.type === "syllabus") {
      endpoint = isEdit
        ? API.SYLLABUSES.CHAPTERS.UPDATE(chapterTarget.id, editingChapter.id)
        : API.SYLLABUSES.CHAPTERS.CREATE(chapterTarget.id);
    }

    dispatch({
      type: isEdit ? chapterAction.UPDATE_CHAPTER : chapterAction.CREATE_CHAPTER,
      method: method,
      endPoint: endpoint,
      body: payload,
      auth: true,
      getResponse: () => {
        toast.success(`Chapter ${isEdit ? "updated" : "created"} successfully`);
        setChapterModalOpen(false);
        fetchLevelDetail();
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to save chapter"),
    });
  };

  const deleteChapter = () => {
    if (!deleteChapterInfo) return;
    let endpoint = "";
    if (deleteChapterInfo.target.type === "subject") {
      endpoint = API.CHAPTERS.DELETE(deleteChapterInfo.target.id, deleteChapterInfo.id);
    } else if (deleteChapterInfo.target.type === "module") {
      endpoint = API.SYLLABUSES.MODULES.CHAPTERS.DELETE(
        deleteChapterInfo.target.syllabusId!,
        deleteChapterInfo.target.id,
        deleteChapterInfo.id
      );
    } else if (deleteChapterInfo.target.type === "syllabus") {
      endpoint = API.SYLLABUSES.CHAPTERS.DELETE(
        deleteChapterInfo.target.id,
        deleteChapterInfo.id
      );
    }

    dispatch({
      type: chapterAction.DELETE_CHAPTER,
      method: "DELETE",
      endPoint: endpoint,
      auth: true,
      getResponse: () => {
        toast.success("Chapter deleted successfully");
        setDeleteChapterInfo(null);
        fetchLevelDetail();
      },
      getError: (err: any) =>
        toast.error(err?.response?.data?.message || err?.message || "Failed to delete chapter"),
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
        no_of_questions: paper.no_of_questions || 0,
      });
    } else {
      setEditingPaper(null);
      setPaperForm({ set_name: "", file: null, answer_key: null, no_of_questions: 0 });
    }
    setPaperModalOpen(true);
  };

  const savePaper = () => {
    if (!paperForm.set_name.trim()) return toast.error("Set name is required");
    const isEdit = !!editingPaper;
    if (!isEdit && !paperForm.file) return toast.error("Paper file is required");

    const formData = new FormData();
    formData.append("set_name", paperForm.set_name.trim());
    formData.append("no_of_questions", paperForm.no_of_questions.toString());
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

  /* ── UI Render Helpers ───────────────────────────────────────── */
  const renderChapterItem = (
    chapter: any,
    target: { type: "subject" | "module" | "syllabus"; id: string; syllabusId?: string; title?: string }
  ) => {
    return (
      <div
        key={chapter.id}
        className="group relative flex items-start justify-between p-3.5 rounded-xl bg-background/80 border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all"
      >
        <div className="space-y-1.5 flex-1 pr-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-text-primary text-sm">
              {chapter.name}
            </span>
            <Badge
              variant={chapter.is_active ? "outline" : "secondary"}
              className={cn(
                "text-[10px] px-2 py-0 h-4",
                chapter.is_active && "border-green-500/30 text-green-600 bg-green-500/5"
              )}
            >
              {chapter.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {chapter.description && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {chapter.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/80 flex-wrap pt-0.5">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-primary" />
              {chapter.duration_hours > 0 ? `${chapter.duration_hours} hrs` : "No Duration Defined"}
            </span>
            {chapter.faculties_details && chapter.faculties_details.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Faculties:</span>
                {chapter.faculties_details.map((faculty: any) => (
                  <Badge
                    key={faculty.id || faculty.user_id}
                    variant="secondary"
                    className="text-[10px] py-0 h-4 bg-primary/5 text-primary border border-primary/20"
                  >
                    {faculty.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {canEdit && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={() => openChapterModal(target, chapter)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteChapterInfo({ id: chapter.id, target })}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSubjectCard = (subject: any, syllabusId: string, moduleId: string = "") => {
    const chapters = subject.chapters || [];
    return (
      <Card
        key={subject.id}
        className="overflow-hidden border border-border/80 hover:border-primary/30 transition-all duration-200 bg-card shadow-sm"
      >
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h5 className="font-semibold text-base text-text-primary">{subject.name}</h5>
                <Badge
                  variant={subject.is_active ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] px-2 py-0 h-5",
                    subject.is_active ? "bg-green-500/10 text-green-700 hover:bg-green-500/20" : ""
                  )}
                >
                  {subject.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                {subject.total_hours !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" /> {subject.total_hours} Hours
                  </span>
                )}
              </div>
            </div>

            {canEdit && !isEditing && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={() =>
                    navigate(
                      `/courses-batches/${courseId}/level/${levelId}/subject/${subject.id}/questions`
                    )
                  }
                >
                  <Database className="w-3.5 h-3.5 mr-1.5" /> Question Bank
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => openSubjectModal(subject, syllabusId, moduleId)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteSubjectId(subject.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Chapters Accordion */}
          <div className="pt-1">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="chapters" className="border-0">
                <AccordionTrigger className="py-2 px-3 rounded-lg bg-muted/40 hover:bg-muted/60 hover:no-underline text-xs font-semibold text-muted-foreground transition-colors">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Chapters ({chapters.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-3 pb-0">
                  <div className="flex justify-end mb-2.5">
                    {canEdit && !isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-primary/20 hover:bg-primary/5 text-primary"
                        onClick={() =>
                          openChapterModal({
                            type: "subject",
                            id: subject.id,
                            syllabusId,
                            title: `Subject: ${subject.name}`,
                          })
                        }
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Chapter
                      </Button>
                    )}
                  </div>
                  {chapters.length > 0 ? (
                    <div className="space-y-2.5">
                      {chapters.map((chapter: any) =>
                        renderChapterItem(chapter, {
                          type: "subject",
                          id: subject.id,
                          syllabusId,
                          title: `Subject: ${subject.name}`,
                        })
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground bg-background rounded-lg border border-dashed border-border">
                      No chapters added to this subject yet.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Card>
    );
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
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="level-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level Name</Label>
                    <Input
                      id="level-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. CSEET"
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

            {/* Syllabuses List */}
            {level.syllabuses && level.syllabuses.length > 0 && (
              <div className="space-y-8">
                {level.syllabuses.map((syllabus: any) => {
                  const modules = syllabus.modules || [];
                  const directSubjects = (syllabus.subjects || []).filter(
                    (sub: any) => !sub.module || (typeof sub.module === "object" && !sub.module.id)
                  );
                  const directChapters = syllabus.chapters || [];

                  return (
                    <Card
                      key={syllabus.id}
                      className="border border-border/80 shadow-sm bg-card/60 backdrop-blur-sm overflow-hidden"
                    >
                      {/* Syllabus Header */}
                      <div className="p-5 border-b border-border/60 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <h3 className="text-xl font-bold text-text-primary tracking-tight">
                              {syllabus.name} {syllabus.year ? `(${syllabus.year})` : ""}
                            </h3>
                            <Badge
                              variant={syllabus.is_active ? "default" : "secondary"}
                              className={cn(
                                "text-xs font-medium",
                                syllabus.is_active
                                  ? "bg-green-500/10 text-green-700 border-green-500/30"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {syllabus.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          {/* Dates & Description */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
                            <span className="flex items-center gap-1.5 bg-background/80 px-2.5 py-1 rounded-md border border-border/50">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span>
                                Valid: <strong>{syllabus.start_date || "N/A"}</strong>
                                {" → "}
                                <strong>{syllabus.end_date || "Ongoing"}</strong>
                              </span>
                            </span>
                            {syllabus.description && (
                              <span className="text-muted-foreground italic">
                                {syllabus.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Syllabus Actions */}
                        {canEdit && !isEditing && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs bg-background hover:bg-muted"
                              onClick={() => openModuleModal(syllabus.id)}
                            >
                              <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-primary" /> Add Module
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs bg-background hover:bg-muted"
                              onClick={() => openSubjectModal(null, syllabus.id, "")}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1.5 text-primary" /> Add Subject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs bg-background hover:bg-muted"
                              onClick={() =>
                                openChapterModal({
                                  type: "syllabus",
                                  id: syllabus.id,
                                  syllabusId: syllabus.id,
                                  title: `Syllabus: ${syllabus.name}`,
                                })
                              }
                            >
                              <Plus className="w-3.5 h-3.5 mr-1.5 text-primary" /> Add Direct Chapter
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openSyllabusModal(syllabus)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteSyllabusId(syllabus.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <CardContent className="p-5 space-y-6">
                        {/* 1. Modules Section (if modules exist) */}
                        {modules.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <FolderOpen className="w-3.5 h-3.5 text-primary" />
                                Modules ({modules.length})
                              </h4>
                            </div>

                            <div className="space-y-4">
                              {modules.map((mod: any) => {
                                const modSubjects = mod.subjects || [];
                                const modChapters = mod.chapters || [];

                                return (
                                  <div
                                    key={mod.id}
                                    className="rounded-xl border border-border/80 bg-background/50 overflow-hidden shadow-sm"
                                  >
                                    {/* Module Header */}
                                    <div className="p-4 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                          <span className="font-semibold text-base text-text-primary flex items-center gap-2">
                                            <FolderOpen className="w-4 h-4 text-primary" />
                                            {mod.name}
                                          </span>
                                          <Badge variant="outline" className="text-[11px] px-2 py-0 h-5">
                                            Order #{mod.order}
                                          </Badge>
                                          <Badge
                                            variant={mod.is_active ? "outline" : "secondary"}
                                            className={cn(
                                              "text-[10px] px-2 py-0 h-5",
                                              mod.is_active && "border-green-500/30 text-green-600 bg-green-500/5"
                                            )}
                                          >
                                            {mod.is_active ? "Active" : "Inactive"}
                                          </Badge>
                                        </div>
                                        {mod.description && (
                                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                                        )}
                                      </div>

                                      {/* Module Actions */}
                                      {canEdit && !isEditing && (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs border-primary/30 hover:bg-primary/5 text-primary"
                                            onClick={() => openSubjectModal(null, syllabus.id, mod.id)}
                                          >
                                            <Plus className="w-3 h-3 mr-1" /> Add Subject
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs border-primary/30 hover:bg-primary/5 text-primary"
                                            onClick={() =>
                                              openChapterModal({
                                                type: "module",
                                                id: mod.id,
                                                syllabusId: syllabus.id,
                                                title: `Module: ${mod.name}`,
                                              })
                                            }
                                          >
                                            <Plus className="w-3 h-3 mr-1" /> Add Chapter
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                                            onClick={() => openModuleModal(syllabus.id, mod)}
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                          {canDelete && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                              onClick={() => {
                                                setActiveSyllabusId(syllabus.id);
                                                setDeleteModuleId(mod.id);
                                              }}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Module Content */}
                                    <div className="p-4 space-y-4">
                                      {modSubjects.length > 0 ? (
                                        <div className="space-y-3">
                                          {modSubjects.map((subject: any) =>
                                            renderSubjectCard(subject, syllabus.id, mod.id)
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg">
                                          No subjects added to this module yet.
                                        </div>
                                      )}

                                      {/* Direct Module Chapters */}
                                      {modChapters.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5" /> Direct Module Chapters ({modChapters.length})
                                          </span>
                                          <div className="space-y-2">
                                            {modChapters.map((chapter: any) =>
                                              renderChapterItem(chapter, {
                                                type: "module",
                                                id: mod.id,
                                                syllabusId: syllabus.id,
                                                title: `Module: ${mod.name}`,
                                              })
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 2. Direct Subjects */}
                        {(directSubjects.length > 0 || modules.length === 0) && (
                          <div className="space-y-3">
                            {modules.length > 0 && (
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                Direct Subjects ({directSubjects.length})
                              </h4>
                            )}

                            {directSubjects.length > 0 ? (
                              <div className="space-y-3">
                                {directSubjects.map((subject: any) =>
                                  renderSubjectCard(subject, syllabus.id, "")
                                )}
                              </div>
                            ) : (
                              modules.length === 0 && (
                                <div className="text-center py-6 text-sm text-muted-foreground bg-background rounded-xl border border-dashed border-border">
                                  No subjects added to this syllabus yet.
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* 3. Direct Syllabus Chapters */}
                        {directChapters.length > 0 && (
                          <div className="space-y-3 pt-2 border-t border-border/60">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                Direct Syllabus Chapters ({directChapters.length})
                              </h4>
                              {canEdit && !isEditing && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/5"
                                  onClick={() =>
                                    openChapterModal({
                                      type: "syllabus",
                                      id: syllabus.id,
                                      syllabusId: syllabus.id,
                                      title: `Syllabus: ${syllabus.name}`,
                                    })
                                  }
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add Chapter
                                </Button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {directChapters.map((chapter: any) =>
                                renderChapterItem(chapter, {
                                  type: "syllabus",
                                  id: syllabus.id,
                                  syllabusId: syllabus.id,
                                  title: `Syllabus: ${syllabus.name}`,
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-dashed border-2 bg-muted/20 border-border">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-text-primary">Curriculum Structure</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage syllabuses and subjects for this level.
                  </p>
                </div>
                <Button onClick={() => openSyllabusModal()} className="mt-2 bg-primary hover:bg-primary-dark">
                  <Plus className="w-4 h-4 mr-2" /> Add Syllabus
                </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Syllabus selection */}
            {level?.syllabuses && level.syllabuses.length > 0 && (
              <div className="space-y-1">
                <Label>Syllabus</Label>
                <Select
                  disabled={!editingSubject}
                  value={subjectForm.syllabus}
                  onValueChange={(val) => {
                    setSubjectForm({ ...subjectForm, syllabus: val, module: "" });
                  }}
                >
                  <SelectTrigger className={!editingSubject ? "bg-muted/50 cursor-not-allowed opacity-75" : ""}>
                    <SelectValue placeholder="Select Syllabus" />
                  </SelectTrigger>
                  <SelectContent>
                    {level.syllabuses.map((syl: any) => (
                      <SelectItem key={syl.id} value={syl.id}>
                        {syl.name} {syl.year ? `(${syl.year})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Module selection */}
            {(() => {
              const selectedSyllabus = level?.syllabuses?.find(
                (s: any) => String(s.id) === String(subjectForm.syllabus)
              );
              const sylModules = selectedSyllabus?.modules || [];
              if (sylModules.length === 0) return null;
              return (
                <div className="space-y-1">
                  <Label>Module <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                  <Select
                    disabled={!editingSubject}
                    value={subjectForm.module || "none"}
                    onValueChange={(val) => {
                      setSubjectForm({ ...subjectForm, module: val === "none" ? "" : val });
                    }}
                  >
                    <SelectTrigger className={!editingSubject ? "bg-muted/50 cursor-not-allowed opacity-75" : ""}>
                      <SelectValue placeholder="Direct Subject (No Module)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Direct Subject (No Module)</SelectItem>
                      {sylModules.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}

            <div className="space-y-1">
              <Label htmlFor="sub-name">Subject Name <span className="text-destructive">*</span></Label>
              <Input
                id="sub-name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                placeholder="e.g. Jurisprudence, Interpretation & General Laws"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
              <Label htmlFor="sub-active" className="text-sm font-medium cursor-pointer">Active Status</Label>
              <Switch
                id="sub-active"
                checked={subjectForm.is_active}
                onCheckedChange={(c) => setSubjectForm({ ...subjectForm, is_active: c })}
              />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{editingChapter ? "Edit Chapter" : "Add Chapter"}</span>
              {chapterTarget?.title && (
                <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground mr-4">
                  {chapterTarget.title}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="chap-name">Chapter Name <span className="text-destructive">*</span></Label>
              <Input
                id="chap-name"
                value={chapterForm.name}
                onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                placeholder="e.g. Sources of Law"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chap-desc">Description</Label>
              <Textarea
                id="chap-desc"
                rows={3}
                value={chapterForm.description}
                onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                placeholder="Chapter topics, overview..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chap-hours">Duration Hours</Label>
              <Input
                id="chap-hours"
                type="number"
                min="0"
                value={chapterForm.duration_hours}
                onChange={(e) => setChapterForm({ ...chapterForm, duration_hours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1 flex flex-col">
              <Label className="text-xs font-medium">Assigned Faculties</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal bg-background h-auto min-h-9 py-1.5">
                    <div className="flex gap-1 flex-wrap items-center mr-2">
                      {chapterForm.faculties && chapterForm.faculties.length > 0 ? (
                        chapterForm.faculties.map((fId) => {
                          const fDetail = facultyOptions.find((fo) => fo.id === fId);
                          return (
                            <span
                              key={fId}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/50"
                            >
                              {fDetail ? fDetail.name : "Unknown"}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground text-xs">Select Faculties</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[380px] max-h-60 overflow-y-auto">
                  {facultyOptions
                    .filter((fac) => fac.levels.includes(levelId!))
                    .map((fac) => (
                      <DropdownMenuCheckboxItem
                        key={fac.id}
                        checked={chapterForm.faculties.includes(fac.id)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(checked) => {
                          setChapterForm((f) => {
                            const newFaculties = checked
                              ? [...f.faculties, fac.id]
                              : f.faculties.filter((v) => v !== fac.id);
                            return { ...f, faculties: newFaculties };
                          });
                        }}
                      >
                        {fac.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  {facultyOptions.filter((fac) => fac.levels.includes(levelId!)).length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No faculties assigned to this level
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
              <Label htmlFor="chap-active" className="text-sm font-medium cursor-pointer">Active Status</Label>
              <Switch
                id="chap-active"
                checked={chapterForm.is_active}
                onCheckedChange={(c) => setChapterForm({ ...chapterForm, is_active: c })}
              />
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
        open={!!deleteChapterInfo}
        onOpenChange={(op) => !op && setDeleteChapterInfo(null)}
        title="Delete Chapter?"
        description="Are you sure you want to delete this chapter? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={deleteChapter}
      />

      {/* Module Modal */}
      <Dialog open={moduleModalOpen} onOpenChange={setModuleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Add Module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Module Name <span className="text-destructive">*</span></Label>
              <Input
                value={moduleForm.name}
                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                placeholder="e.g. Module 1"
              />
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input
                type="number"
                min="1"
                value={moduleForm.order}
                onChange={(e) => setModuleForm({ ...moduleForm, order: Number(e.target.value) })}
                placeholder="e.g. 1"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Module description..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
              <Label htmlFor="mod-active" className="text-sm font-medium cursor-pointer">Active Status</Label>
              <Switch
                id="mod-active"
                checked={moduleForm.is_active}
                onCheckedChange={(c) => setModuleForm({ ...moduleForm, is_active: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleModalOpen(false)} disabled={moduleActionLoading}>
              Cancel
            </Button>
            <Button onClick={saveModule} disabled={moduleActionLoading}>
              {moduleActionLoading ? "Saving..." : "Save Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteModuleId}
        onOpenChange={(op) => !op && setDeleteModuleId(null)}
        title="Delete Module?"
        description="Are you sure you want to delete this module? All associated subjects or chapters might be affected."
        confirmLabel="Delete"
        onConfirm={deleteModule}
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
              <Input
                id="paper-name"
                placeholder="e.g. Set A, Morning Shift"
                value={paperForm.set_name}
                onChange={(e) => setPaperForm({ ...paperForm, set_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paper-no-of-questions">No. of Questions</Label>
              <Input
                id="paper-no-of-questions"
                type="number"
                min="0"
                value={paperForm.no_of_questions}
                onChange={(e) => setPaperForm({ ...paperForm, no_of_questions: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paper-file">Question Paper (PDF/Doc) {editingPaper ? <span className="text-xs text-muted-foreground ml-2">(Leave blank to keep current)</span> : <span className="text-destructive">*</span>}</Label>
              <Input
                id="paper-file"
                type="file"
                onChange={(e) => setPaperForm({ ...paperForm, file: e.target.files?.[0] || null })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paper-answer-key">Answer Key (PDF/Doc) {editingPaper ? <span className="text-xs text-muted-foreground ml-2">(Leave blank to keep current)</span> : <span className="text-destructive">*</span>}</Label>
              <Input
                id="paper-answer-key"
                type="file"
                onChange={(e) => setPaperForm({ ...paperForm, answer_key: e.target.files?.[0] || null })}
              />
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

      {/* Syllabus Modal */}
      <Dialog open={syllabusModalOpen} onOpenChange={setSyllabusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSyllabus ? "Edit Syllabus" : "Add Syllabus"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Syllabus Name <span className="text-destructive">*</span></Label>
              <Input
                value={syllabusForm.name}
                onChange={(e) => setSyllabusForm({ ...syllabusForm, name: e.target.value })}
                placeholder="e.g. 2026 New Syllabus"
              />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                value={syllabusForm.year}
                onChange={(e) => setSyllabusForm({ ...syllabusForm, year: Number(e.target.value) })}
                placeholder="e.g. 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={syllabusForm.start_date}
                  onChange={(e) => setSyllabusForm({ ...syllabusForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>End Date <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                <Input
                  type="date"
                  value={syllabusForm.end_date}
                  onChange={(e) => setSyllabusForm({ ...syllabusForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={syllabusForm.description}
                onChange={(e) => setSyllabusForm({ ...syllabusForm, description: e.target.value })}
                placeholder="Brief description of this syllabus..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-muted/30">
              <Label htmlFor="syl-active" className="text-sm font-medium cursor-pointer">Active Status</Label>
              <Switch
                id="syl-active"
                checked={syllabusForm.is_active}
                onCheckedChange={(c) => setSyllabusForm({ ...syllabusForm, is_active: c })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyllabusModalOpen(false)} disabled={syllabusActionLoading}>
              Cancel
            </Button>
            <Button onClick={saveSyllabus} disabled={syllabusActionLoading}>
              {syllabusActionLoading ? "Saving..." : "Save Syllabus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteSyllabusId}
        onOpenChange={(o) => !o && setDeleteSyllabusId(null)}
        title="Delete Syllabus"
        description="Are you sure you want to delete this syllabus? All associated modules, subjects, and chapters will be affected."
        confirmLabel="Delete"
        onConfirm={deleteSyllabus}
      />
    </div>
  );
}
