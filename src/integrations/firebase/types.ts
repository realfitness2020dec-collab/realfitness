// Firebase database types matching the Supabase schema

export interface Member {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  weight: number | null;
  height: number | null;
  package_id: string | null;
  package_start_date: string | null;
  package_end_date: string | null;
  photo_url: string | null;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  gym_packages?: GymPackage | null;
}

export interface GymPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  is_active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  check_in_time: string;
  qr_code_used: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
}

export interface TransformationPhoto {
  id: string;
  member_id: string;
  photo_url: string;
  photo_date: string;
  notes: string | null;
  weight: number | null;
  created_at: string;
}
