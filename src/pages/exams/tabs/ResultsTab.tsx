import { useState } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { examActions } from "@/redux/actions";
import { API } from "@/service/api";
import type { Exam } from "@/redux/slices/examSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Key, BookOpen, Smartphone, Clock } from "lucide-react";
import { motion } from "framer-motion";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface ResultsTabProps {
  exam: Exam;
}

export default function ResultsTab({ exam }: ResultsTabProps) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  const [distributeLoading, setDistributeLoading] = useState(false);
  const [distributeConfirm, setDistributeConfirm] = useState(false);

  const isAdmin   = user && ["super_admin", "branch_manager", "admin"].includes(user.role ?? "");
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";
  const isParent  = user?.role === "parent";

  const canDistribute = isAdmin || isFaculty;

  const handleDistributeAnswerKey = () => {
    dispatch({
      type: examActions.DISTRIBUTE_ANSWER_KEY,
      method: "POST",
      endPoint: API.EXAMS.DISTRIBUTE_ANSWER_KEY(exam.id),
      auth: true,
      setLoading: (v: boolean) => setDistributeLoading(v),
      getResponse: () => {
        toast.success("Answer key distributed to paper checkers via email.");
        setDistributeConfirm(false);
      },
      getError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to distribute answer key.");
        setDistributeConfirm(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Exam Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-white p-5 shadow-sm"
      >
        <h3 className="text-sm font-heading font-semibold mb-3">Exam Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Marks",   value: exam.total_marks,          color: "text-foreground" },
            { label: "Pass Marks",    value: exam.pass_marks,           color: "text-foreground" },
            { label: "Exam Type",     value: exam.exam_type,            color: "text-blue-600"   },
            { label: "Result Mode",   value: exam.result_release_mode,  color: exam.result_release_mode === "instant" ? "text-green-600" : "text-yellow-600" },
          ].map(item => (
            <div key={item.label} className="text-center rounded-lg bg-muted/30 p-3">
              <div className={`text-lg font-bold capitalize ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {exam.instructions && (
          <div className="mt-4 rounded-lg bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Instructions</p>
            <p className="text-sm text-foreground leading-relaxed">{exam.instructions}</p>
          </div>
        )}
      </motion.div>

      {/* Answer Key Distribution — admin/faculty only */}
      {canDistribute && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 shrink-0">
                <Key className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-heading font-semibold text-purple-900">Distribute Answer Key</h4>
                <p className="text-xs text-purple-700/80 mt-0.5">
                  Sends a secure email link to all assigned paper checkers.
                  They can view the answer key without logging in.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setDistributeConfirm(true)}
              disabled={distributeLoading}
              className="h-9 bg-purple-600 hover:bg-purple-700 text-white text-sm gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              {distributeLoading ? "Sending…" : "Distribute"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Student / Parent view — exam-taking info */}
      {(isStudent || isParent) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-heading font-semibold text-blue-900">Exam Information</h4>
            </div>
          </div>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>This exam is taken on the mobile app. Open the mobile application to start.</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Results will be released <strong className="capitalize">{exam.result_release_mode}</strong> after submission.</span>
            </div>
            {isParent && (
              <div className="flex items-center gap-2 text-blue-600">
                <span>👤 You are viewing this exam as a parent/guardian.</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="text-center rounded-lg bg-white/60 p-3 border border-blue-100">
              <div className="text-lg font-bold text-foreground">{exam.total_marks}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Marks</div>
            </div>
            <div className="text-center rounded-lg bg-white/60 p-3 border border-blue-100">
              <div className="text-lg font-bold text-foreground">{exam.pass_marks}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Pass Marks</div>
            </div>
          </div>
        </motion.div>
      )}

      <ConfirmDialog
        open={distributeConfirm}
        onOpenChange={o => setDistributeConfirm(o)}
        title="Distribute Answer Key?"
        description="This will send a secure email with the answer key to all assigned paper checkers. This action cannot be undone."
        confirmLabel="Send Now"
        onConfirm={handleDistributeAnswerKey}
      />
    </div>
  );
}
