"use client";

import { useActionState } from "react";
import { Check, Loader2, Phone, Send } from "lucide-react";
import { subscribeAction, type SubscribeState } from "@/app/actions";
import { COPY } from "@/lib/i18n";
import type { Lang, SubscriberStats } from "@/lib/types";

const INITIAL: SubscribeState = { status: "idle", message: "" };

export default function SubscribeForm({
  lang,
  stats,
}: {
  lang: Lang;
  stats: SubscriberStats;
}) {
  const t = COPY[lang];
  const [state, formAction, pending] = useActionState(subscribeAction, INITIAL);

  return (
    <section id="subscribe" className="scroll-mt-20">
      <div className="relative overflow-hidden rounded-3xl border border-sand-300/70 bg-[linear-gradient(135deg,#233b2d,#16241c)] p-5 text-sand-50 shadow-lift sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#e6b566]/20 blur-3xl" />
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <Phone className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-sand-400">WhatsApp · SMS</p>
            <h2 className="font-display text-xl text-sand-50 sm:text-2xl">{t.subscribeTitle}</h2>
          </div>
        </div>

        <p className="mt-3 max-w-md text-[12px] leading-relaxed text-sand-300">{t.subscribeSub}</p>

        <form action={formAction} className="mt-4 space-y-2.5">
          <div>
            <label htmlFor="phone" className="text-[10px] uppercase tracking-wider text-sand-400">
              {t.phone}
            </label>
            <input
              id="phone"
              name="phone"
              inputMode="tel"
              required
              placeholder={t.phonePlaceholder}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-sand-50 placeholder:text-sand-400/60 focus:border-[#e6b566]/60 focus:outline-none focus:ring-2 focus:ring-[#e6b566]/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="language" className="text-[10px] uppercase tracking-wider text-sand-400">
                {t.language}
              </label>
              <select
                id="language"
                name="language"
                defaultValue="ha"
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#1b2b22] px-2.5 py-2.5 text-sm text-sand-50 focus:border-[#e6b566]/60 focus:outline-none"
              >
                <option value="ha">{t.hausa}</option>
                <option value="en">{t.english}</option>
                <option value="both">{t.both}</option>
              </select>
            </div>
            <div>
              <label htmlFor="audience" className="text-[10px] uppercase tracking-wider text-sand-400">
                {lang === "ha" ? "Sana'a" : "I am a…"}
              </label>
              <select
                id="audience"
                name="audience"
                defaultValue="general"
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#1b2b22] px-2.5 py-2.5 text-sm text-sand-50 focus:border-[#e6b566]/60 focus:outline-none"
              >
                <option value="general">{lang === "ha" ? "Gama-gari" : "General"}</option>
                <option value="market">{lang === "ha" ? "Mai kasuwa" : "Trader"}</option>
                <option value="school">{lang === "ha" ? "Iyali / makaranta" : "Parent / school"}</option>
                <option value="health">{lang === "ha" ? "Lafiya" : "Health"}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#e6b566] px-4 py-2.5 text-sm font-semibold text-[#1a1408] transition hover:bg-[#f0c67e] disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {pending ? t.joining : t.join}
          </button>
        </form>

        {state.status !== "idle" ? (
          <div
            className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] ${
              state.status === "success"
                ? "border-palm-500/30 bg-palm-500/10 text-[#d7ecd9]"
                : "border-red-400/30 bg-red-500/10 text-red-100"
            }`}
          >
            {state.status === "success" ? <Check className="mt-0.5 h-3.5 w-3.5" /> : null}
            <span>{state.message}</span>
          </div>
        ) : null}

        <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-sand-400">
          <div className="flex items-center justify-between">
            <span>
              <span className="tabular text-sm font-semibold text-sand-50">{stats.total}</span>{" "}
              {t.subscribers}
            </span>
            <span>{lang === "ha" ? "Na gwaji" : "Prototype"}</span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-sand-400/80">{t.privacyNote}</p>
        </div>
      </div>
    </section>
  );
}
