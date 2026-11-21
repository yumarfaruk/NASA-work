export function num(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

export function shortDate(iso: string, lang: "en" | "ha" = "en"): string {
  const d = new Date(`${iso}T12:00:00`);
  if (lang === "ha") {
    const months = ["Jan", "Fab", "Mar", "Afu", "May", "Yun", "Yul", "Agu", "Sat", "Okt", "Nuw", "Dis"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function timeAgo(iso: string, lang: "en" | "ha" = "en"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));
  if (mins < 1) return lang === "ha" ? "yanzu" : "just now";
  if (mins < 60) return lang === "ha" ? `mintuna ${mins} da suka wuce` : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return lang === "ha" ? `sa'o'i ${hours} da suka wuce` : `${hours} h ago`;
  const days = Math.round(hours / 24);
  return lang === "ha" ? `kwanaki ${days} da suka wuce` : `${days} d ago`;
}
