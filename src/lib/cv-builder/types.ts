// CV Builder data model + presets. Full English UI.

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
  name: string;
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
    photo: string;
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
  { id: "government", label: "Government Standard", desc: "Traditional format for government jobs" },
  { id: "ngo",        label: "NGO Professional",    desc: "Ideal for NGO / development sector" },
  { id: "ats",        label: "ATS Modern",          desc: "ATS-friendly, clean and simple" },
  { id: "corporate",  label: "Corporate",           desc: "For private companies" },
  { id: "executive",  label: "Executive",           desc: "Senior / management positions" },
];

export const OBJECTIVE_PRESETS: { id: string; label: string; text: string }[] = [
  {
    id: "government",
    label: "Government Job",
    text: "To serve in a reputed government organization with integrity, dedication, and efficiency, contributing to public welfare and the institutional development of the nation.",
  },
  {
    id: "ngo",
    label: "NGO Job",
    text: "To join a progressive development organization and contribute meaningfully to social change, human development, and sustainable programs that improve the lives of marginalized communities.",
  },
  {
    id: "private",
    label: "Private Company",
    text: "To join a dynamic and professional organization where I can apply my skills to help achieve organizational goals while continuously developing my career.",
  },
  {
    id: "bank",
    label: "Bank Job",
    text: "To join a leading banking institution and deliver excellence in customer service, financial management, and regulatory compliance with the highest standards of professionalism.",
  },
  {
    id: "fresh",
    label: "Fresh Graduate",
    text: "As an enthusiastic fresh graduate, I seek a challenging role where I can translate academic knowledge into practical results and grow with a learning-oriented mindset.",
  },
  {
    id: "experienced",
    label: "Experienced Professional",
    text: "To leverage years of relevant experience in a responsible role, driving team performance, strategic planning, and result-oriented outcomes for the organization.",
  },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export function emptyCV(name = "My CV"): CVData {
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
      nationality: "Bangladeshi",
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
      languages: "Bangla, English",
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
