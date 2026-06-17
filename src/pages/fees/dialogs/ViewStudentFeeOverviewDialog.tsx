import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type FeesStructure } from "@/redux/slices/feesSlice";

const toNumber = (value: any) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

interface ViewStudentFeeOverviewDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string | null;
  students: any[];
  feeStructures: FeesStructure[];
  overviewData: any;
  loading: boolean;
}

export function ViewStudentFeeOverviewDialog({
  open,
  onClose,
  studentId,
  students,
  feeStructures,
  overviewData,
  loading,
}: ViewStudentFeeOverviewDialogProps) {
  const student = students.find((s) => s.id === studentId);
  const displayName = student?.full_name || overviewData?.student_name || "—";
  const displayAdmission = student?.admission_number || "—";

  const firstFee = overviewData?.fees?.[0];
  const displayCourseBatch = student
    ? `${student.batch_name || student.course || "—"}`
    : firstFee
      ? `${firstFee.batch_name || ""} ${firstFee.course_name ? `/ ${firstFee.course_name}` : ""}`.trim() ||
        "—"
      : "—";

  const displayStatus = student?.status || "—";

  const summary = overviewData?.summary;
  const totalAllocated = summary?.total_billed ?? 0;
  const totalDiscount = summary?.total_discount ?? 0;
  const totalPaid = summary?.total_paid ?? 0;
  const totalDue = summary?.total_due ?? 0;

  const fees = overviewData?.fees || [];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-lg">Student Fee Overview</SheetTitle>
          <SheetDescription>
            Detailed billing history, outstanding amounts, and discounts for the student.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Retrieving fee details...</p>
          </div>
        ) : (
          <div className="space-y-6 py-3">
            <div className="bg-muted/40 border rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Student Name</span>
                <span className="font-semibold text-foreground">{displayName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Admission Number</span>
                <span className="font-semibold font-mono text-foreground">{displayAdmission}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Batch / Course</span>
                <span className="font-semibold text-foreground">{displayCourseBatch}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Status</span>
                <span className="capitalize font-semibold text-foreground">{displayStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Total Allocated</span>
                <span className="text-lg font-bold font-heading">
                  {formatCurrency(totalAllocated)}
                </span>
              </div>
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Total Discount</span>
                <span className="text-lg font-bold font-heading text-green-600">
                  {formatCurrency(totalDiscount)}
                </span>
              </div>
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Total Paid</span>
                <span className="text-lg font-bold font-heading text-primary">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="border border-border bg-card rounded-xl p-3 text-center">
                <span className="text-xs text-muted-foreground block">Net Due</span>
                <span className="text-lg font-bold font-heading text-destructive">
                  {formatCurrency(totalDue)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-heading font-semibold text-sm">Linked Fee Structures</h4>
              {fees.length === 0 ? (
                <div className="border border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground">
                  No fee structures assigned to this student.
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden bg-card text-xs sm:text-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border font-medium text-muted-foreground">
                        <th className="p-3">Fee Structure</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Paid</th>
                        <th className="p-3">Due</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fees.map((item: any) => {
                        const fs = feeStructures.find((x) => x.id === item.fee_structure);
                        const statusColors: Record<string, string> = {
                          paid: "bg-green-500/10 text-green-500 border-green-500/20",
                          partially_paid: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                          unpaid: "bg-red-500/10 text-red-500 border-red-500/20",
                          approval_pending: "bg-orange-500/10 text-orange-500 border-orange-500/20",
                        };
                        return (
                          <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3 font-medium">{fs?.name || item.fee_name || "—"}</td>
                            <td className="p-3">{formatCurrency(toNumber(item.total_amount))}</td>
                            <td className="p-3">
                              {Number(item.discount) > 0 ? (
                                <div>
                                  <div className="text-green-600 font-medium">
                                    -{formatCurrency(toNumber(item.discount))}
                                  </div>
                                  {item.discount_reason && (
                                    <div className="text-[10px] text-muted-foreground italic">
                                      {item.discount_reason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="p-3">{formatCurrency(toNumber(item.amount_paid))}</td>
                            <td className="p-3 font-semibold text-destructive">
                              {formatCurrency(toNumber(item.amount_due))}
                            </td>
                            <td className="p-3">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize whitespace-nowrap",
                                  statusColors[item.status] ||
                                    "bg-muted text-muted-foreground border-muted-foreground/20",
                                )}
                              >
                                {item.status?.replace("_", " ") || "unpaid"}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {formatDate(item.due_date)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
