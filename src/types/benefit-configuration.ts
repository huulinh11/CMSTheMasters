export const BENEFIT_FIELD_TYPES = [
  'status_select',
  'simple_link',
  'complex_news',
  'complex_video'
] as const;

export type BenefitFieldType = typeof BENEFIT_FIELD_TYPES[number];

export const benefitFieldTypeLabels: Record<BenefitFieldType, string> = {
  status_select: 'Trạng thái (Thư mời)',
  simple_link: 'Link đơn giản',
  complex_news: 'Bài báo (Nháp & Final)',
  complex_video: 'Video (Nháp & Final)',
};

export interface BenefitItem {
  id: string;
  name: string;
  field_type: BenefitFieldType;
}