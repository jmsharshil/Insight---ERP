import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { dropdownActions } from "@/redux/actions";
import { AppDispatch } from "@/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { SheetSkeleton } from "@/components/common/Skeletons";

interface SessionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
}

export default function SessionDetailSheet({
  open,
  onOpenChange,
  sessionId,
}: SessionDetailSheetProps) {
  const dispatch = useDispatch<AppDispatch>();
  const toast = useToast();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sessionId) {
      setLoading(true);
      dispatch({
        type: dropdownActions.GET_DROPDOWN,
        method: "GET",
        endPoint: `/api/v1/faculty/sessions/${sessionId}/`,
        auth: true,
        getResponse: (res: any) => {
          const data = res?.data || res;
          if (data) {
            setSession(data);
          }
          setLoading(false);
        },
        getError: () => {
          toast.error("Failed to load session details");
          setLoading(false);
        },
      } as any);
    }
    if (!open) {
      setSession(null);
    }
  }, [open, sessionId, dispatch, toast]);

  const DetailRow = ({ label, value, className = "" }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={`flex justify-between py-2.5 border-b border-border/50 last:border-0 gap-4 ${className}`}>
      <span className="text-muted-foreground text-sm shrink-0 mt-0.5">{label}</span>
      <div className="text-sm font-medium text-right max-w-[75%] break-words">{value || "—"}</div>
    </div>
  );

  const renderTopics = (topics: any) => {
    if (!topics) return null;
    
    let topicsList: string[] = [];
    if (Array.isArray(topics)) {
      topicsList = topics.map(t => typeof t === 'string' ? t : t?.name || t?.title || String(t));
    } else if (typeof topics === 'string') {
      topicsList = topics.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean);
    }

    if (topicsList.length > 0) {
      return (
        <div className="flex flex-wrap gap-1.5 justify-end">
          {topicsList.map((topic, idx) => (
            <Badge key={idx} variant="secondary" className="font-normal bg-secondary/60 text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      );
    }
    
    return String(topics);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between mt-2">
          <SheetTitle>
            {loading ? "Loading..." : "Session Details"}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <SheetSkeleton />
        ) : session ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <div className="text-base font-semibold">{session.subject_name || "—"}</div>
                <div className="text-xs text-muted-foreground">{session.batch_name || "—"}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant={session.status === "completed" ? "default" : "secondary"} className="capitalize">
                    {session.status_display || session.status}
                  </Badge>
                  <Badge variant="outline">
                    {session.completion_percentage}% Completed
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                Session Information
              </h4>
              <div className="rounded-lg border border-border bg-card p-3">
                <DetailRow label="Date" value={session.session_date} />
                <DetailRow label="Time" value={`${session.start_time} - ${session.end_time}`} />
                <DetailRow label="Duration" value={`${session.duration_minutes} mins`} />
                <DetailRow label="Faculty" value={session.faculty_name} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                Content Covered
              </h4>
              <div className="rounded-lg border border-border bg-card p-3">
                <DetailRow label="Chapter" value={session.chapter_covered} />
                <DetailRow 
                  label="Topics" 
                  value={renderTopics(session.topics_covered)} 
                  className={session.topics_covered ? "items-start" : ""}
                />
              </div>
            </div>

            {session.notes && (
              <div>
                <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                  Notes
                </h4>
                <div className="rounded-lg border border-border bg-card p-3 text-sm text-foreground">
                  {session.notes}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
                System Info
              </h4>
              <div className="rounded-lg border border-border bg-card p-3">
                <DetailRow label="Created At" value={session.created_at} />
                <DetailRow label="Updated At" value={session.updated_at} />
              </div>
            </div>

          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            No session selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
