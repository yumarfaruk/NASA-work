"use server";

import { getStats, subscribeToAlerts } from "@/lib/api";

export interface SubscribeState {
  status: "idle" | "success" | "error";
  message: string;
  total?: number;
}

export async function subscribeAction(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const language = String(formData.get("language") ?? "ha");
  const audience = String(formData.get("audience") ?? "") || undefined;

  if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) {
    return { status: "error", message: "Enter a valid phone number, e.g. 0803 000 0000." };
  }

  try {
    const result = await subscribeToAlerts({ phone, language, audience });
    const stats = await getStats();
    return {
      status: "success",
      message: result.duplicate
        ? "This number is already on the demo list."
        : "You're on the demo list. No messages are sent in this prototype.",
      total: stats.total,
    };
  } catch {
    return {
      status: "error",
      message:
        "The subscriber service is not reachable right now. The forecast still works; try again in a moment.",
    };
  }
}
