import type { Locale } from "../i18n/translations";

export function pickLocalized(
  item: object | null | undefined,
  field: string,
  locale: Locale,
): string {
  if (!item) return "";
  const record = item as Record<string, unknown>;

  const selected = record[`${field}_${locale}`];
  if (typeof selected === "string" && selected.trim()) return selected;

  const ru = record[`${field}_ru`];
  if (typeof ru === "string" && ru.trim()) return ru;

  const legacy = record[field];
  if (typeof legacy === "string" && legacy.trim()) return legacy;

  const uz = record[`${field}_uz`];
  if (typeof uz === "string" && uz.trim()) return uz;

  const en = record[`${field}_en`];
  if (typeof en === "string" && en.trim()) return en;

  return "";
}
