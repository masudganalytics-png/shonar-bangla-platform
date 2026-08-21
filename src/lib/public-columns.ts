/**
 * Column lists for directory tables whose contact fields (phone / whatsapp /
 * email / address) are only granted to signed-in database roles.
 *
 * Anonymous visitors must request the public list, otherwise PostgREST returns
 * a column permission error. Signed-in visitors may request every column.
 */

export const BLOOD_DONOR_PUBLIC_COLUMNS =
  "id, user_id, full_name, blood_group, gender, age, union_name, village, last_donation_date, available, photo_url, notes, status, is_active, created_at, updated_at";

export const BLOOD_REQUEST_PUBLIC_COLUMNS =
  "id, requester_id, patient_name, blood_group, bags_needed, hospital_name, hospital_location, required_date, required_time, contact_person, notes, status, created_at, updated_at";

export const TEACHER_PUBLIC_COLUMNS =
  "id, submitted_by, full_name, category_id, subjects, qualification, experience_years, district, upazila, area, photo_url, description, is_available, is_verified, status, created_at, updated_at, gender, student_class, bio, slug";

export const WORKER_PUBLIC_COLUMNS =
  "id, submitted_by, full_name, category_id, skills, experience_years, district, upazila, area, photo_url, description, is_available, is_verified, status, created_at, updated_at, slug";

/** Returns "*" for signed-in viewers, otherwise the contact-free column list. */
export function columnsFor(publicColumns: string, isAuthenticated: boolean): string {
  return isAuthenticated ? "*" : publicColumns;
}

/** Shown wherever a contact number is hidden from signed-out visitors. */
export const CONTACT_LOGIN_HINT = "যোগাযোগের নম্বর দেখতে লগইন করুন";
