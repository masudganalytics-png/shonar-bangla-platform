/** Shared ISP constants and types (UI copy is Bangla, keys stay English). */

export const ISP_AREAS = [
  { value: "coxsbazar", label: "কক্সবাজার" },
  { value: "courtbazar", label: "কোর্টবাজার" },
  { value: "ukhiya", label: "উখিয়া" },
  { value: "kutupalong", label: "কুতুপালং" },
] as const;

export type IspAreaKey = (typeof ISP_AREAS)[number]["value"];

export function ispAreaLabel(key: string): string {
  return ISP_AREAS.find((a) => a.value === key)?.label ?? key;
}

export type IspPackage = {
  id: string;
  isp_id: string;
  name: string;
  speed_mbps: number | null;
  price: number | null;
  note: string;
  is_active: boolean;
  sort_order: number;
};

export type IspRecord = {
  id: string;
  name: string;
  note: string;
  phones: string[];
  is_btrc_approved: boolean;
  is_active: boolean;
  sort_order: number;
  areas: string[];
  packages: IspPackage[];
};
