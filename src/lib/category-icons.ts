export const CATEGORY_ICON_OPTIONS = [
  { name: "shapes", label: "Geral" },
  { name: "utensils", label: "Alimentação" },
  { name: "shopping-cart", label: "Compras" },
  { name: "house", label: "Moradia" },
  { name: "car", label: "Transporte" },
  { name: "heart-pulse", label: "Saúde" },
  { name: "graduation-cap", label: "Educação" },
  { name: "shirt", label: "Roupas" },
  { name: "gamepad-2", label: "Lazer" },
  { name: "receipt-text", label: "Contas" },
  { name: "circle-dollar-sign", label: "Dinheiro" },
  { name: "briefcase-business", label: "Trabalho" },
  { name: "chart-no-axes-combined", label: "Investimentos" },
  { name: "gift", label: "Presentes" },
  { name: "plane", label: "Viagens" },
  { name: "paw-print", label: "Pets" },
  { name: "wrench", label: "Serviços" },
  { name: "smartphone", label: "Tecnologia" },
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_OPTIONS)[number]["name"];

export const CATEGORY_ICON_NAMES = CATEGORY_ICON_OPTIONS.map(
  ({ name }) => name,
) as [CategoryIconName, ...CategoryIconName[]];

export function isCategoryIconName(value: string): value is CategoryIconName {
  return CATEGORY_ICON_OPTIONS.some((option) => option.name === value);
}
