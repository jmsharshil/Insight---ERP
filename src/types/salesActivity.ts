export type SalesPhotoType =
  | "start_selfie"
  | "start_odometer"
  | "school_interior"
  | "school_exterior"
  | "exhibition"
  | "end_odometer"
  | "end_selfie"
  | "event_start_selfie"
  | "event_end_selfie"
  | "meeting_interior"
  | "meeting_exterior"
  | "seminar_start_selfie"
  | "seminar_end_selfie";

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

export interface SalesDailyActivityTiming {
  date: string;
  start_time: string;
  end_time: string;
}

export interface EventPhotoSlot {
  slot: number;
  type: SalesPhotoType;
  photo_id: string | null;
  photo_url: string | null;
  is_filled: boolean;
  timing?: string | null;
}

export interface EventPhotoSlotGroup {
  date: string;
  slots: EventPhotoSlot[];
}

export interface SalesDailyActivity {
  id: string;
  user: string;
  user_name: string;
  plan: string;
  name?: string;
  type?: string;
  activity_type?: string;
  activity_date: string;
  from_date?: string;
  to_date?: string;
  timings?: SalesDailyActivityTiming[];
  event_photo_slots?: EventPhotoSlotGroup[];
  students_expected: number | null;
  students_attended: number | null;
  notes: string;
  standard?: string;
  board?: string;
  medium?: string;
  seminar_reference_by?: string;
  seminar_given_by?: string;
  target_name?: string;
  target_number?: string;
  photos: SalesActivityPhoto[];
  allocations?: any[];
  odometer_reading?: OdometerReading;
  status?: string;
  created_at: string;
  updated_at: string;
}

export const PHOTO_TYPE_LABELS: Record<SalesPhotoType, string> = {
  start_selfie: "Start of Day Selfie",
  start_odometer: "Start Odometer",
  school_interior: "School Interior",
  school_exterior: "School Exterior",
  exhibition: "Event",
  end_odometer: "End Odometer",
  end_selfie: "End of Day Selfie",
  event_start_selfie: "Event Start Selfie",
  event_end_selfie: "Event End Selfie",
  meeting_interior: "Meeting Interior",
  meeting_exterior: "Meeting Exterior",
  seminar_start_selfie: "Seminar Start Selfie",
  seminar_end_selfie: "Seminar End Selfie",
};

export type ActivityCategory = "meeting" | "seminar" | "default";

export const  getActivityCategory = (
  act?: SalesDailyActivity | null,
  plan?: SalesDailyPlan | null,
  allPlans?: SalesDailyPlan[]
): ActivityCategory => {
  let targetPlan = plan;
  if (!targetPlan && act && allPlans) {
    targetPlan = allPlans.find(
      (p) => p.id === (act as any).plan || p.activities?.some((a) => a.id === act.id)
    ) || null;
  }

  const typeCandidates = [
    (act as any)?.type,
    (act as any)?.activity_type,
    (act as any)?.plan_type,
    targetPlan?.type,
    (targetPlan as any)?.plan_type,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  for (const t of typeCandidates) {
    if (t.includes("meeting")) return "meeting";
    if (t.includes("seminar")) return "seminar";
  }

  if (act?.seminar_reference_by || act?.seminar_given_by) {
    return "seminar";
  }

  const nameCandidates = [
    act?.name,
    targetPlan?.description,
    (act as any)?.notes,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  for (const n of nameCandidates) {
    if (n.includes("meeting")) return "meeting";
    if (n.includes("seminar")) return "seminar";
  }

  return "default";
};

export const getPhotoLabel = (
  photoType: SalesPhotoType | string,
  category: ActivityCategory = "default"
): string => {
  if (category === "meeting") {
    if (photoType === "event_start_selfie" || photoType === "meeting_interior") return "Meeting Interior";
    if (photoType === "event_end_selfie" || photoType === "meeting_exterior") return "Meeting Exterior";
  } else if (category === "seminar") {
    if (photoType === "event_start_selfie" || photoType === "seminar_start_selfie") return "Seminar Start Selfie";
    if (photoType === "event_end_selfie" || photoType === "seminar_end_selfie") return "Seminar End Selfie";
    if (photoType === "exhibition") return "Seminar";
  }

  if (photoType === "meeting_interior") return "Meeting Interior";
  if (photoType === "meeting_exterior") return "Meeting Exterior";
  if (photoType === "seminar_start_selfie") return "Seminar Start Selfie";
  if (photoType === "seminar_end_selfie") return "Seminar End Selfie";
  if (photoType === "exhibition") return "Event";
  if (photoType === "event_start_selfie") return "Event Start Selfie";
  if (photoType === "event_end_selfie") return "Event End Selfie";

  return (
    PHOTO_TYPE_LABELS[photoType as SalesPhotoType] ||
    photoType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

export const getPhotoDisplayLabel = (
  photo: { photo_type: string; photo_type_display?: string },
  category: ActivityCategory = "default"
): string => {
  const pType = photo.photo_type;
  if (category === "meeting") {
    if (
      pType === "event_start_selfie" ||
      pType === "meeting_interior" ||
      photo.photo_type_display === "Event Start Selfie"
    ) {
      return "Meeting Interior";
    }
    if (
      pType === "event_end_selfie" ||
      pType === "meeting_exterior" ||
      photo.photo_type_display === "Event End Selfie"
    ) {
      return "Meeting Exterior";
    }
  } else if (category === "seminar") {
    if (
      pType === "event_start_selfie" ||
      pType === "seminar_start_selfie" ||
      photo.photo_type_display === "Event Start Selfie"
    ) {
      return "Seminar Start Selfie";
    }
    if (
      pType === "event_end_selfie" ||
      pType === "seminar_end_selfie" ||
      photo.photo_type_display === "Event End Selfie"
    ) {
      return "Seminar End Selfie";
    }
    if (
      pType === "exhibition" ||
      photo.photo_type_display === "Event" ||
      photo.photo_type_display === "Exhibition"
    ) {
      return "Seminar";
    }
  }

  if (photo.photo_type_display) {
    if (photo.photo_type === "exhibition" && photo.photo_type_display === "Exhibition") {
      return "Event";
    }
    return photo.photo_type_display;
  }
  return getPhotoLabel(pType as SalesPhotoType, category);
};

export interface OdometerReading {
  id: string;
  activity: string;
  activity_date: string;
  user: string;
  user_name: string;
  vehicle_type?: '2W' | '4W' | string;
  vehicle_type_display?: string;
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

export interface SalesDailyPlan {
  id: string;
  user: string;
  user_name: string;
  plan_date: string;
  from_date?: string;
  to_date?: string;
  timings?: SalesDailyActivityTiming[];
  type?: string;
  start_time?: string;
  end_time?: string;
  place?: string;
  description: string;
  reminder_sent?: boolean;
  day_of_reminder_sent?: boolean;
  activities: SalesDailyActivity[];
  photos?: SalesActivityPhoto[];
  allocations?: any[];
  status?: string;
  created_at: string;
  updated_at: string;
}
