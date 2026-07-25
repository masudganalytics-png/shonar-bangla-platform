// Data model + presets for the CV Builder. All strings in Bangla for UI,
// but keys stay in English for maintainability.

export type CVTemplate = "government" | "ngo" | "ats" | "corporate" | "executive";

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  board: string;
  group: string;
  passing_year: string;
  result: string;
}

export interface ExperienceEntry {
  id: string;
  organization: string;
  position: string;
  duration: string;
  responsibilities: string;
  achievements: string;
}

export interface TrainingEntry {
  id: string;
  name: string;
  institute: string;
  year: string;
  duration: string;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  designation: string;
  organization: string;
  phone: string;
  email: string;
}

export interface CVData {
  id: string;
  name: string; // internal label for the CV file
  template: CVTemplate;
  updated_at: number;
  personal: {
    full_name: string;
    father_name: string;
    mother_name: string;
    dob: string;
    gender: string;
    marital_status: string;
    nationality: string;
    religion: string;
    blood_group: string;
    nid: string;
    passport: string;
    mobile: string;
    email: string;
    present_address: string;
    permanent_address: string;
    photo: string; // data URL
  };
  objective: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  training: TrainingEntry[];
  skills: {
    computer: string;
    communication: string;
    leadership: string;
    languages: string;
    driving_license: string;
    typing_speed: string;
    technical: string;
  };
  references: ReferenceEntry[];
  additional: {
    expected_salary: string;
    notice_period: string;
    hobbies: string;
    extra_activities: string;
  };
}

export const TEMPLATES: { id: CVTemplate; label: string; desc: string }[] = [
  { id: "government", label: "সরকারি স্ট্যান্ডার্ড", desc: "সরকারি চাকরির জন্য প্রথাগত ফরম্যাট" },
  { id: "ngo", label: "এনজিও প্রফেশনাল", desc: "এনজিও/উন্নয়ন সংস্থার উপযোগী" },
  { id: "ats", label: "ATS মডার্ন", desc: "ATS-friendly, সহজ ও পরিষ্কার" },
  { id: "corporate", label: "কর্পোরেট", desc: "প্রাইভেট কোম্পানির জন্য" },
  { id: "executive", label: "এক্সিকিউটিভ", desc: "সিনিয়র/ম্যানেজমেন্ট পদের জন্য" },
];

export const OBJECTIVE_PRESETS: { id: string; label: string; text: string }[] = [
  {
    id: "government",
    label: "সরকারি চাকরি",
    text: "একটি সম্মানজনক সরকারি প্রতিষ্ঠানে সততা, নিষ্ঠা ও দক্ষতার সাথে দায়িত্ব পালন করে জনগণের সেবায় নিয়োজিত থাকতে চাই এবং প্রতিষ্ঠানের উন্নয়নে গঠনমূলক ভূমিকা রাখতে চাই।",
  },
  {
    id: "ngo",
    label: "এনজিও চাকরি",
    text: "একটি প্রগতিশীল উন্নয়ন সংস্থায় যোগদান করে সামাজিক পরিবর্তন, মানব উন্নয়ন ও টেকসই কার্যক্রমে অবদান রাখতে চাই এবং প্রান্তিক জনগোষ্ঠীর জীবনমান উন্নয়নে কাজ করতে চাই।",
  },
  {
    id: "private",
    label: "প্রাইভেট কোম্পানি",
    text: "একটি গতিশীল ও পেশাদার প্রতিষ্ঠানে যোগদান করে আমার দক্ষতা কাজে লাগিয়ে প্রতিষ্ঠানের লক্ষ্য অর্জনে অবদান রাখতে চাই এবং একইসাথে নিজের ক্যারিয়ার বিকাশের সুযোগ পেতে চাই।",
  },
  {
    id: "bank",
    label: "ব্যাংক চাকরি",
    text: "একটি স্বনামধন্য ব্যাংকিং প্রতিষ্ঠানে যোগদান করে গ্রাহকসেবা, আর্থিক ব্যবস্থাপনা ও প্রাতিষ্ঠানিক নীতিমালার প্রতি অঙ্গীকারবদ্ধ থেকে দক্ষতার সাথে দায়িত্ব পালন করতে আগ্রহী।",
  },
  {
    id: "fresh",
    label: "ফ্রেশ গ্র্যাজুয়েট",
    text: "একজন উদ্যমী নবীন গ্র্যাজুয়েট হিসেবে চ্যালেঞ্জিং কর্মপরিবেশে যোগদান করে প্রাতিষ্ঠানিক জ্ঞান ব্যবহারিক কাজে প্রয়োগ করতে চাই এবং শেখার মানসিকতা নিয়ে প্রতিষ্ঠানের সাফল্যে অবদান রাখতে চাই।",
  },
  {
    id: "experienced",
    label: "অভিজ্ঞ পেশাজীবী",
    text: "বহুবছরের প্রাসঙ্গিক অভিজ্ঞতা কাজে লাগিয়ে দায়িত্বশীল পদে যোগদান করে টিম পরিচালনা, কৌশলগত পরিকল্পনা ও ফলাফলভিত্তিক কার্যক্রমের মাধ্যমে প্রতিষ্ঠানের অগ্রযাত্রায় ভূমিকা রাখতে চাই।",
  },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export function emptyCV(name = "আমার সিভি"): CVData {
  return {
    id: uid(),
    name,
    template: "government",
    updated_at: Date.now(),
    personal: {
      full_name: "",
      father_name: "",
      mother_name: "",
      dob: "",
      gender: "",
      marital_status: "",
      nationality: "বাংলাদেশী",
      religion: "",
      blood_group: "",
      nid: "",
      passport: "",
      mobile: "",
      email: "",
      present_address: "",
      permanent_address: "",
      photo: "",
    },
    objective: "",
    education: [],
    experience: [],
    training: [],
    skills: {
      computer: "",
      communication: "",
      leadership: "",
      languages: "বাংলা, ইংরেজি",
      driving_license: "",
      typing_speed: "",
      technical: "",
    },
    references: [],
    additional: {
      expected_salary: "",
      notice_period: "",
      hobbies: "",
      extra_activities: "",
    },
  };
}

export const newId = uid;
