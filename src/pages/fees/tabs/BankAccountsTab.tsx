import { Pencil, Trash2 } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { FeeTableSkeleton } from "@/components/common/Skeletons";
import { cn } from "@/lib/utils";

interface BankAccountsTabProps {
  data: any[];
  loading: boolean;
  onEdit: (account: any) => void;
  onDelete: (account: any) => void;
}

export default function BankAccountsTab({
  data,
  loading,
  onEdit,
  onDelete,
}: BankAccountsTabProps) {
  if (loading) {
    return <FeeTableSkeleton columns={5} rows={4} hasFilter={false} />;
  }

  if (data?.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
        No bank accounts configured. Click &quot;Create Bank Account&quot; to add one.
      </div>
    );
  }

  return (
    <BankAccountsTable
      data={data}
      onEdit={onEdit}
      onDelete={onDelete}
      loading={loading}
    />
  );
}

function BankAccountsTable({
  data,
  onEdit,
  onDelete,
  loading,
}: {
  data: any[];
  onEdit: (account: any) => void;
  onDelete: (account: any) => void;
  loading: boolean;
}) {
  const cols: DataTableColumn<any>[] = [
    {
      key: "bank_name",
      header: "Bank Name",
      className: "font-semibold",
    },
    {
      key: "name",
      header: "Account Name",
    },
    {
      key: "account_number",
      header: "Account Number",
      className: "font-mono text-xs",
    },
    {
      key: "ifsc_code",
      header: "IFSC Code",
      className: "font-mono text-xs uppercase",
      render: (r) => r.ifsc_code || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const isActive = r.is_active !== false;
        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium border",
              isActive
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-muted text-muted-foreground border-muted-foreground/20"
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => onEdit(r)}
          >
            <Pencil className="w-3 h-3" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-destructive hover:bg-destructive/10 gap-1"
            onClick={() => onDelete(r)}
          >
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={cols} data={data} />;
}
