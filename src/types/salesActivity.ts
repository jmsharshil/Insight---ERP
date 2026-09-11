export type SalesPhotoType =
  | "start_selfie"
  | "start_odometer"
  | "school_interior"
  | "school_exterior"
  | "exhibition"
  | "end_odometer"
  | "end_selfie";

export interface SalesActivityPhoto {
  id: string;
  activity: string;
  photo_type: SalesPhotoType;
  photo_type_display: string;
  photo: string;
  latitude: string;
  longitude: string;
  odometer_kms: string | null;
  captured_at: string;
  created_at: string;
}

export interface SalesDailyActivity {
  id: string;
  user: string;
  user_name: string;
  activity_date: string;
  notes: string;
  photos: SalesActivityPhoto[];
  created_at: string;
  updated_at: string;
}

export const PHOTO_TYPE_LABELS: Record<SalesPhotoType, string> = {
  start_selfie: "Start of Day Selfie",
  start_odometer: "Start of Day Odometer",
  school_interior: "School Interior",
  school_exterior: "School Exterior",
  exhibition: "Exhibition",
  end_odometer: "End of Day Odometer",
  end_selfie: "End of Day Selfie",
};

export interface OdometerReading {
  id: string;
  activity: string;
  activity_date: string;
  user: string;
  user_name: string;
  start_kms: string;
  end_kms: string;
  total_kms: string;
  expense_per_km: string;
  total_expense: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  is_paid: boolean;
  start_odometer_photo?: string;
  end_odometer_photo?: string;
  created_at: string;
  updated_at: string;
}
