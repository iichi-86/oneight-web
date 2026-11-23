export const primaryIndustries = [
  { value: 'restaurant', label: '飲食店' },
  { value: 'hair_salon', label: '美容院' },
  { value: 'retail', label: '小売店' },
  { value: 'nail_salon', label: 'ネイルサロン' },
  { value: 'yoga', label: 'ヨガ教室' },
] as const;

export const industryOptions = [
  ...primaryIndustries,
  { value: 'other', label: 'その他' },
] as const;

// Keep accepting submissions from previously loaded versions of the form.
export const industryLabels: Record<string, string> = {
  ...Object.fromEntries(industryOptions.map(({ value, label }) => [value, label])),
  bakery: 'ベーカリー',
  cafe: 'カフェ・コーヒースタンド',
  sweets: '和菓子・洋菓子',
  beauty: '美容・ネイル等のサロン',
  pet: 'トリミングサロン',
};
