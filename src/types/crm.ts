/**
 * Re-export CRM-related types from their source locations.
 * Provides a stable import path: `import { APILead } from "@/types/crm"`
 */

/**
 * Re-export CRM-related types from their source locations.
 * Provides a stable import path: `import { APILead } from "@/types/crm"`
 */

export type { APILead } from "@/redux/slices/crmSlice";
export type { LeadStatus } from "@/constants/dummy/crm";

export interface LeadTransferRequest {
  id: string | number;
  lead_id: string | number;
  lead_name?: string;
  requested_by_name?: string;
  requested_by?: string; // name of the telecaller
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}
