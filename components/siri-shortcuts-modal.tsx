"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Flame,
  Globe,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Loader2,
  Lock,
  Mic,
  Play,
  Power,
  Smartphone,
  Sparkles,
  Unlock,
  Volume2,
  Watch,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Vehicle } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  initialTab?: "actions" | "guide";
};

type TokenData = {
  ok: boolean;
  token: string;
  vin: string;
  carType: string;
  plate: string;
  origin: string;
  sampleEndpoints: Record<string, string>;
};

type ActionConfig = {
  id: string;
  action: string;
  label: string;
  shortLabel: string;
  icon: typeof Power;
  color: string;
  phrase: string;
  description: string;
  spokenSample: string;
};

export function SiriShortcutsModal({ open, onClose, vehicle, initialTab = "actions" }: Props) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; speech: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"actions" | "guide">(initialTab);
  const [selectedGuideAction, setSelectedGuideAction] = useState<string>("engine_start");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = origOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    async function loadToken() {
      try {
        setLoading(true);
        const res = await fetch("/api/shortcuts/token");
        if (res.ok && active) {
          const data = (await res.json()) as TokenData;
          setTokenData(data);
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    }
    loadToken();
    return () => {
      active = false;
    };
  }, [open, vehicle.vin]);

  if (!open) return null;

  const origin = tokenData?.origin || (typeof window !== "undefined" ? window.location.origin : "");
  const token = tokenData?.token || "";

  const actions: ActionConfig[] = [
    {
      id: "engine_start",
      action: "engine_start",
      label: "Start Engine & Pre-cool A/C",
      shortLabel: "Start Engine",
      icon: Flame,
      color: "from-amber-500/20 to-orange-500/10 text-orange-400 border-orange-500/30",
      phrase: `Hey Siri, Start my ${vehicle.carType || "Proton"}`,
      description: "Starts engine and pre-cools cabin temperature to 22°C for 10 minutes",
      spokenSample: `Engine started for Proton ${vehicle.carType}. Air conditioning is set to 22 degrees for 10 minutes.`,
    },
    {
      id: "lock",
      action: "lock",
      label: "Lock Car Doors",
      shortLabel: "Lock Doors",
      icon: Lock,
      color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
      phrase: `Hey Siri, Lock my car`,
      description: "Secures all 4 doors and flashes hazard confirmation lights",
      spokenSample: `Proton ${vehicle.carType} is now locked. All doors are secure.`,
    },
    {
      id: "unlock",
      action: "unlock",
      label: "Unlock Car Doors",
      shortLabel: "Unlock",
      icon: Unlock,
      color: "from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/30",
      phrase: `Hey Siri, Unlock my car`,
      description: "Unlocks vehicle doors for immediate entry",
      spokenSample: `Proton ${vehicle.carType} has been unlocked.`,
    },
    {
      id: "engine_stop",
      action: "engine_stop",
      label: "Stop Engine",
      shortLabel: "Stop Engine",
      icon: Power,
      color: "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30",
      phrase: `Hey Siri, Stop my car`,
      description: "Powers down remote engine run and cancels climate session",
      spokenSample: `Engine stopped for Proton ${vehicle.carType}.`,
    },
    {
      id: "status",
      action: "status",
      label: "Vehicle Voice Status",
      shortLabel: "Status",
      icon: Zap,
      color: "from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30",
      phrase: `Hey Siri, Car status`,
      description: "Siri announces lock state, engine status, fuel level, and range",
      spokenSample: `Proton ${vehicle.carType} is locked with the engine off. You have 68% fuel and 512 kilometers range.`,
    },
  ];

  const currentGuideConfig = actions.find((a) => a.action === selectedGuideAction) || actions[0];

  const getWebhookUrl = (actionName: string) => {
    return `${origin}/api/shortcuts?action=${encodeURIComponent(actionName)}&token=${encodeURIComponent(token)}`;
  };

  const copyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      /* fallback */
    }
  };

  const runTest = async (item: ActionConfig) => {
    setTestingId(item.id);
    setTestResult(null);
    try {
      const url = getWebhookUrl(item.action);
      const res = await fetch(url, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      const speech = data.speech || data.message || "Command executed successfully.";
      setTestResult({ id: item.id, speech, ok: Boolean(data.ok) });

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(speech);
        utter.rate = 1.05;
        utter.pitch = 1.0;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      setTestResult({
        id: item.id,
        speech: "Could not connect to vehicle gateway.",
        ok: false,
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Siri Voice Shortcuts"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="relative flex flex-col w-full max-w-xl max-h-[92dvh] sm:max-h-[88vh] overflow-hidden rounded-t-[28px] sm:rounded-3xl border border-white/[0.12] bg-[#0c0c0f] shadow-2xl text-zinc-100"
      >
        {/* Mobile pull-down indicator bar */}
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden shrink-0" />

        {/* Header */}
        <div className="relative overflow-hidden px-4 pt-3 pb-3 sm:px-6 sm:py-5 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent shrink-0">
          <div className="absolute top-0 right-1/4 -mt-10 h-32 w-32 rounded-full bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Siri Orb Icon */}
              <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-black border border-white/[0.15] shadow-lg shadow-purple-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 opacity-80" />
                <div className="absolute inset-1 rounded-xl bg-[#09090b] flex items-center justify-center">
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                    Siri Voice Shortcuts
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300 uppercase tracking-wide">
                    iOS · Watch
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
                  &ldquo;Hey Siri&rdquo; commands via Apple Shortcuts app webhooks
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="mt-3 flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setActiveTab("actions")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer text-center ${
                activeTab === "actions"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Voice Actions
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === "guide"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>How-To Guide</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-6 sm:py-5 space-y-3.5 overscroll-contain">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <p className="text-xs">Preparing secure Siri webhook token…</p>
            </div>
          ) : activeTab === "actions" ? (
            <>
              {/* Target Vehicle Tag */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs">
                <span className="text-zinc-400 text-[11px]">Active Vehicle:</span>
                <span className="font-semibold text-white text-[11px] sm:text-xs">
                  Proton {vehicle.carType} {vehicle.plate ? `(${vehicle.plate})` : ""}
                </span>
              </div>

              {/* Live Test Speech Bubble Banner */}
              <AnimatePresence>
                {testResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border ${
                      testResult.ok
                        ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                        : "bg-red-950/40 border-red-500/30 text-red-200"
                    }`}
                  >
                    <Volume2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-semibold uppercase tracking-wider text-[9px] text-zinc-400">
                        Siri Voice Confirmation:
                      </p>
                      <p className="mt-0.5 text-white font-medium text-xs break-words leading-relaxed">
                        &ldquo;{testResult.speech}&rdquo;
                      </p>
                    </div>
                    <button
                      onClick={() => setTestResult(null)}
                      className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions List */}
              <div className="space-y-2.5">
                {actions.map((item) => {
                  const Icon = item.icon;
                  const webhookUrl = getWebhookUrl(item.action);
                  const isCopied = copiedId === item.id;
                  const isTesting = testingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="group relative flex flex-col gap-2 p-3 sm:p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] transition"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${item.color}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-semibold text-white truncate">{item.label}</h3>
                          <div className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-purple-300 max-w-full">
                            <Mic className="h-3 w-3 shrink-0 text-purple-400" />
                            <span className="truncate">&ldquo;{item.phrase}&rdquo;</span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
                        </div>
                      </div>

                      {/* Action buttons: Responsive 2-column or flex row */}
                      <div className="mt-1 pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-zinc-500 truncate hidden sm:inline-block max-w-[200px]">
                          /api/shortcuts?action={item.action}
                        </span>

                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => runTest(item)}
                            disabled={isTesting}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {isTesting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            <span>{isTesting ? "Testing…" : "Test Siri"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => copyUrl(item.id, webhookUrl)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer ${
                              isCopied
                                ? "bg-emerald-500 text-black font-bold"
                                : "bg-white text-black hover:bg-zinc-200"
                            }`}
                          >
                            {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{isCopied ? "Copied!" : "Copy URL"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Webhook Token Box */}
              <div className="mt-3 p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <KeyRound className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-300 truncate">Siri Webhook Token</span>
                  </div>
                  <button
                    onClick={() => copyUrl("raw_token", token)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer shrink-0"
                  >
                    {copiedId === "raw_token" ? "Copied!" : "Copy Token"}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                  Safely authorizes background iOS voice requests without disclosing your login password.
                </p>
              </div>
            </>
          ) : (
            /* ================= DETAILED RESPONSIVE HOW-TO GUIDE ================= */
            <div className="space-y-4 text-xs text-zinc-300">
              {/* Intro Banner */}
              <div className="p-3.5 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-transparent">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                  <h3 className="font-semibold text-xs sm:text-sm text-purple-200">How to Create an Apple Siri Shortcut</h3>
                </div>
                <p className="mt-1 text-zinc-400 leading-relaxed text-[11px] sm:text-xs">
                  Runs natively on iPhone, Apple Watch, CarPlay & Mac using Apple&apos;s built-in <strong>&ldquo;Get Contents of URL&rdquo;</strong> action.
                </p>
              </div>

              {/* Command Picker for the Guide */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Select Command:
                  </label>
                  <span className="text-[10px] text-purple-300 font-medium">Updates recipe below</span>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
                  {actions.map((act) => (
                    <button
                      key={act.action}
                      type="button"
                      onClick={() => setSelectedGuideAction(act.action)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer border text-center ${
                        selectedGuideAction === act.action
                          ? "bg-purple-600/30 border-purple-500 text-white shadow-sm"
                          : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {act.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* VISUAL SHORTCUT BLOCK MOCKUP */}
              <div className="rounded-2xl border border-white/[0.12] bg-[#09090c] p-3.5 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-purple-600/30 text-purple-300 shrink-0">
                      <Mic className="h-3 w-3" />
                    </div>
                    <span className="font-bold text-white text-xs truncate">
                      {currentGuideConfig.phrase.replace("Hey Siri, ", "")}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono shrink-0">iOS Shortcuts Blocks</span>
                </div>

                {/* Block 1: Get Contents of URL */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500 text-white shrink-0">
                        <Globe className="h-3 w-3" />
                      </div>
                      <span className="font-semibold text-white text-xs">Get Contents of URL</span>
                    </div>
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[8px] font-mono text-blue-300 uppercase">
                      Action 1
                    </span>
                  </div>

                  <div className="rounded-lg bg-black/60 p-2 border border-white/[0.08] flex items-center justify-between gap-2 min-w-0">
                    <p className="font-mono text-[10px] text-blue-200 truncate min-w-0 flex-1">
                      {getWebhookUrl(currentGuideConfig.action)}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyUrl("guide_block_url", getWebhookUrl(currentGuideConfig.action))}
                      className="shrink-0 flex items-center gap-1 rounded bg-white/[0.12] hover:bg-white/[0.2] px-2 py-0.5 text-[10px] text-white transition cursor-pointer"
                    >
                      {copiedId === "guide_block_url" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedId === "guide_block_url" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400">Method: <strong>GET</strong> (or POST)</p>
                </div>

                {/* Connecting Arrow */}
                <div className="flex justify-center -my-1 text-zinc-600">
                  <ChevronDown className="h-4 w-4" />
                </div>

                {/* Block 2: Speak Text */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500 text-white shrink-0">
                        <Volume2 className="h-3 w-3" />
                      </div>
                      <span className="font-semibold text-white text-xs">Speak Text</span>
                    </div>
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[8px] font-mono text-purple-300 uppercase">
                      Action 2
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/60 p-2 border border-white/[0.08]">
                    <span className="text-[10px] font-mono text-purple-200">
                      Text: <span className="bg-purple-500/30 px-1.5 py-0.5 rounded text-white">Contents of URL</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-1">
                    Siri confirms: <em>&ldquo;{currentGuideConfig.spokenSample}&rdquo;</em>
                  </p>
                </div>
              </div>

              {/* STEP BY STEP WALKTHROUGH */}
              <div className="space-y-2.5 pt-1">
                <h4 className="font-semibold text-white text-xs tracking-wider uppercase text-zinc-400">
                  Step-by-Step Instructions:
                </h4>

                {/* Step 1 */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-white text-xs">Open Shortcuts App</h5>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Launch Apple&apos;s pre-installed <strong>Shortcuts</strong> app on your iPhone, iPad, or Mac.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                    2
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h5 className="font-semibold text-white text-xs">Create & Name the Shortcut</h5>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Tap <strong>+</strong> in top right. Rename it to what you want to say to Siri:
                    </p>
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-2 min-w-0">
                      <span className="text-[11px] text-purple-200 font-medium truncate">
                        Name: <strong>{currentGuideConfig.phrase.replace("Hey Siri, ", "")}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyUrl("guide_name", currentGuideConfig.phrase.replace("Hey Siri, ", ""))}
                        className="text-[10px] text-purple-300 font-semibold cursor-pointer shrink-0 hover:underline"
                      >
                        {copiedId === "guide_name" ? "Copied" : "Copy Name"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                    3
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h5 className="font-semibold text-white text-xs">Add &ldquo;Get Contents of URL&rdquo;</h5>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Tap <strong>Add Action</strong>, search for <strong>&ldquo;Get Contents of URL&rdquo;</strong>, and paste your webhook URL:
                    </p>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-white/[0.1] min-w-0">
                      <span className="font-mono text-[10px] text-blue-300 truncate min-w-0 flex-1">
                        {getWebhookUrl(currentGuideConfig.action)}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyUrl("step3_url", getWebhookUrl(currentGuideConfig.action))}
                        className="flex items-center gap-1 rounded bg-white text-black px-2.5 py-1 text-[10px] font-semibold hover:bg-zinc-200 transition cursor-pointer shrink-0"
                      >
                        {copiedId === "step3_url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedId === "step3_url" ? "Copied" : "Copy URL"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                    4
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-white text-xs">Add &ldquo;Speak Text&rdquo; (Optional)</h5>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Tap <strong>Add Action</strong>, search for <strong>&ldquo;Speak Text&rdquo;</strong>, and set text to <strong>&ldquo;Contents of URL&rdquo;</strong> so Siri speaks live voice feedback.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                    5
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h5 className="font-semibold text-white text-xs">Test with Siri!</h5>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Tap ▶️ to test run. You can now trigger it hands-free anytime:
                    </p>
                    <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/10 border border-purple-500/30 text-white font-semibold text-xs flex items-center gap-2">
                      <Mic className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">&ldquo;{currentGuideConfig.phrase}&rdquo;</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  Trigger from Apple Watch or Action Button:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px]">
                      <Watch className="h-3 w-3 text-cyan-400 shrink-0" />
                      <span>Apple Watch</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Toggle &ldquo;Show on Apple Watch&rdquo; in shortcut info to trigger from your wrist.
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-1.5 font-semibold text-zinc-200 text-[11px]">
                      <Smartphone className="h-3 w-3 text-orange-400 shrink-0" />
                      <span>Action Button</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      On iPhone 15 Pro / 16, assign this shortcut to your physical Action Button.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 pt-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] sm:px-6 sm:py-3.5 border-t border-white/[0.08] bg-[#08080a] flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate max-w-[240px]">
            Tap anywhere outside to close
          </p>
          <button
            onClick={onClose}
            className="rounded-xl sm:rounded-2xl bg-white px-5 py-1.5 sm:py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
