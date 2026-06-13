/**
 * Re-export CRM-related types from their source locations.
 * Provides a stable import path: `import { APILead } from "@/types/crm"`
 */

export type { APILead } from "@/redux/slices/crmSlice";
export type { LeadStatus } from "@/constants/dummy/crm";
