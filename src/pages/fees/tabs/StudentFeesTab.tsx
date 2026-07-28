import DataTable from "@/components/common/DataTable";
import { FeeTableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type StudentFee, type FeesStructure } from "@/redux/slices/feesSlice";

interface StudentFeesTabProps {
  students: any[];
  filteredStudentFees: StudentFee[];
  feeStructure: FeesStructure[];
  sfStudentName: string;
  setSfStudentName: (val: string) => void;
  sfStatus: string;
  setSfStatus: (val: string) => void;
  sfBatch: string;
  setSfBatch: (val: string) => void;
  sfDateFrom: string;
  setSfDateFrom: (val: string) => void;
  sfDateTo: string;
  setSfDateTo: (val: string) => void;
  batchesList: any[];
  handleViewOverview: (studentId: string) => void;
  loading?: boolean;
}

export default function StudentFeesTab({
  students,
  filteredStudentFees,
  feeStructure,
  sfStudentName,
  setSfStudentName,
  sfStatus,
  setSfStatus,
  sfBatch,
  setSfBatch,
  sfDateFrom,
  setSfDateFrom,
  sfDateTo,
  setSfDateTo,
  batchesList,
  handleViewOverview,
  loading,
}: StudentFeesTabProps) {
  if (loading) {
    return <FeeTableSkeleton columns={8} rows={6} />;
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Search & Filter Fees</h3>
            <p className="text-xs text-muted-foreground">
              Apply filters to find specific student fee records.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            <Input
              placeholder="Search student name..."
              value={sfStudentName}
              onChange={(e) => setSfStudentName(e.target.value)}
              className="w-full sm:w-48 h-9"
            />
            <Select value={sfBatch} onValueChange={setSfBatch}>
              <SelectTrigger className="w-full sm:w-32 h-9">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {(Array.isArray(batchesList) ? batchesList : []).map((batch) => (
                  <SelectItem key={batch.id || batch.value} value={String(batch.id || batch.value)}>
                    {batch.name || batch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 w-full sm:w-auto bg-card rounded-md border shadow-sm p-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-7 px-2 text-xs font-normal justify-start w-[110px]",
                      !sfDateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                    {sfDateFrom ? format(parseISO(sfDateFrom), "dd MMM yyyy") : <span>From Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sfDateFrom ? parseISO(sfDateFrom) : undefined}
                    onSelect={(date) => setSfDateFrom(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground text-[10px] uppercase font-semibold">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-7 px-2 text-xs font-normal justify-start w-[110px]",
                      !sfDateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                    {sfDateTo ? format(parseISO(sfDateTo), "dd MMM yyyy") : <span>To Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={sfDateTo ? parseISO(sfDateTo) : undefined}
                    onSelect={(date) => setSfDateTo(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {(sfDateFrom || sfDateTo) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setSfDateFrom("");
                    setSfDateTo("");
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Select value={sfStatus} onValueChange={setSfStatus}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partially Paid</SelectItem>
                <SelectItem value="overdue">Unpaid</SelectItem>
                <SelectItem value="approval_pending">Approval Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: "student",
            header: "Student",
            render: (item: StudentFee) => {
              const s = students.find((x) => x.id === item.student);
              return (
                <div>
                  <div className="font-semibold">{s?.full_name || "—"}</div>
                </div>
              );
            },
          },
          {
            key: "fee_structure",
            header: "Fee Structure",
            render: (item: StudentFee) => {
              const fs = feeStructure.find((x) => x.name === item.fee_name);
              return fs?.name || "—";
            },
          },
          {
            key: "total_amount",
            header: "Total Amount",
            render: (item: StudentFee) => formatCurrency(Number(item.total_amount)),
          },
          {
            key: "discount",
            header: "Discount",
            render: (item: StudentFee) =>
              Number(item.discount) > 0 ? (
                <div>
                  <div className="font-medium text-green-600">
                    -{formatCurrency(Number(item.discount))}
                  </div>
                  {item.discount_reason && (
                    <div className="text-[10px] text-muted-foreground italic line-clamp-1">
                      {item.discount_reason}
                    </div>
                  )}
                </div>
              ) : (
                "—"
              ),
          },
          {
            key: "amount_paid",
            header: "Paid",
            render: (item: StudentFee) => formatCurrency(Number(item.amount_paid)),
          },
          {
            key: "amount_due",
            header: "Due",
            render: (item: StudentFee) => (
              <span
                className={
                  Number(item.amount_due) > 0 ? "font-semibold text-destructive" : "font-medium"
                }
              >
                {formatCurrency(Number(item.amount_due))}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item: StudentFee) => {
              const statusColors = {
                paid: "bg-green-500/10 text-green-500 border-green-500/20",
                partially_paid: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                unpaid: "bg-red-500/10 text-red-500 border-red-500/20",
              };
              return (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold border capitalize",
                    statusColors[item.status as keyof typeof statusColors] ||
                      "bg-muted text-muted-foreground border-muted-foreground/20"
                  )}
                >
                  {item.status?.replace("_", " ") || "unpaid"}
                </span>
              );
            },
          },
          {
            key: "due_date",
            header: "Due Date",
            render: (item: StudentFee) => formatDate(item.due_date),
          },
          {
            key: "actions",
            header: "",
            render: (item: StudentFee) => (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewOverview(item.student);
                }}
                className="text-primary hover:text-primary-dark hover:bg-primary-light"
              >
                View Overview
              </Button>
            ),
          },
        ]}
        data={filteredStudentFees}
        onRowClick={(row) => handleViewOverview(row.student)}
      />
    </>
  );
}
