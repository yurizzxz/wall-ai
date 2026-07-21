"use client";

import { CategoryIcon } from "@/components/common/category-icon";
import { CATEGORY_ICON_OPTIONS, type CategoryIconName } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

type CategoryIconPickerProps = {
  value?: string;
  onValueChange(value: CategoryIconName): void;
};

export function CategoryIconPicker({ value, onValueChange }: CategoryIconPickerProps) {
  return (
    <div
      className="grid grid-cols-6 gap-1.5 sm:grid-cols-9"
      role="radiogroup"
      aria-label="Ícone da categoria"
    >
      {CATEGORY_ICON_OPTIONS.map((option) => {
        const selected = value === option.name;
        return (
          <button
            key={option.name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            className={cn(
              "flex size-10 items-center justify-center rounded-md border text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-primary bg-primary/10 text-primary",
            )}
            onClick={() => onValueChange(option.name)}
          >
            <CategoryIcon name={option.name} className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
