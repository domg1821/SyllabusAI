"use client";

import { useState, useRef } from "react";
import { Difficulty, QuestionType } from "@/lib/types";
import {
  FREE_WEEKLY_LIMIT,
  FREE_MAX_QUESTIONS,
  PRO_MAX_QUESTIONS,
} from "@/lib/usePracticeTests";

interface Props {
  isPro: boolean;
  canTakeTest: boolean;
  remainingFreeTests: number;
  weeklyCount: number;
  generating: boolean;
  error: string | null;
  onGenerate: (opts: {
    topic: string;
    questionCount: number;
    questionType: QuestionType;
    difficulty: Difficulty;
  }) => void;
  onViewHistory: () => void;
  onUpgradeClick: () => void;
}

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice", desc: "A/B/C/D auto-graded" },
  { value: "short_answer", label: "Short Answer", desc: "Written responses" },
  { value: "mixed", label: "Mixed", desc: "Both types" },
];

const DIFFICULTIES: { value: Difficulty; label: string; desc: string; color: string }[] = [
  { value: "easy", label: "Easy", desc: "Recall & basics", color: "emerald" },
  { value: "medium", label: "Medium", desc: "Application", color: "amber" },
  { value: "hard", label: "Hard", desc: "Synthesis", color: "red" },
];

const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const MAX_FILE_SIZE_MB = 10;

export default function PracticeTestSetup({
  isPro,
  canTakeTest,
  remainingFreeTests,
  weeklyCount,
  generating,
  error,
  onGenerate,
  onViewHistory,
  onUpgradeClick,
}: Props) {
  const [topic, setTopic] = useState("");
  const maxQ = isPro ? PRO_MAX_QUESTIONS : FREE_MAX_QUESTIONS;
  const [questionCount, setQuestionCount] = useState(Math.min(5, maxQ));
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [extractedMock, setExtractedMock] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (!topic.trim() || generating) return;
    onGenerate({ topic: topic.trim(), questionCount, questionType, difficulty });
  }

  function clearImage() {
    setImagePreview(null);
    setImageName(null);
    setImageError(null);
    setExtractedMock(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mediaType = ACCEPTED_IMAGE_TYPES[ext];

    if (!mediaType) {
      setImageError("Unsupported file type. Please upload a PNG, JPG, JPEG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setImageError(`Image is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setImageError(null);
    setExtractedMock(false);
    setImageName(file.name);

    // Read the file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);

      // Strip the "data:image/...;base64," prefix
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        setImageError("Could not read the image file. Please try again.");
        return;
      }

      setExtracting(true);
      try {
        const res = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });

        const json = await res.json();

        if (!res.ok) {
          setImageError(json.error ?? "Failed to extract text. Please try pasting your content instead.");
          return;
        }

        if (json.text) {
          setTopic(json.text);
          if (json.mock) setExtractedMock(true);
        } else {
          setImageError("No text was found in the image. Try a clearer photo or paste the content directly.");
        }
      } catch {
        setImageError("Network error while reading the image. Please check your connection or paste the text directly.");
      } finally {
        setExtracting(false);
      }
    };

    reader.onerror = () => {
      setImageError("Could not read the image file. Please try again.");
    };

    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Practice Test Builder
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Generate a custom exam on any topic and test your knowledge.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        {/* Topic input */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">
              Topic or study material
            </label>
            {/* Image upload trigger */}
            <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              imagePreview && !imageError
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {extracting ? "Reading…" : imagePreview ? "Change image" : "Upload image"}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleImageChange}
                disabled={extracting}
              />
            </label>
          </div>

          {/* Image preview + status row */}
          {(imagePreview || imageError) && (
            <div className="mb-2">
              {imagePreview && !imageError && (
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${
                  extracting ? "border-indigo-200 bg-indigo-50" : "border-emerald-200 bg-emerald-50"
                }`}>
                  {/* Thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="h-14 w-14 shrink-0 rounded-lg object-cover border border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-700">{imageName}</p>
                    {extracting ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs text-indigo-600">Extracting text from image…</span>
                      </div>
                    ) : (
                      <p className="mt-0.5 text-xs text-emerald-600">
                        {extractedMock ? "Demo: sample text loaded" : "Text extracted — edit below if needed"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={clearImage}
                    className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                    aria-label="Remove image"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {imageError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-xs text-red-700">{imageError}</p>
                </div>
              )}
            </div>
          )}

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              imagePreview && extracting
                ? "Extracting text from your image…"
                : "e.g. World War II causes and consequences, the water cycle, Python data structures, calculus derivatives…"
            }
            rows={extracting ? 3 : 4}
            disabled={extracting}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-60 disabled:cursor-wait"
          />
          <p className="mt-1 text-xs text-gray-400">
            Paste text, type a topic, or upload an image of your notes or textbook.
          </p>
        </div>

        {/* Question count */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">
              Number of questions
            </label>
            <span className="text-sm font-bold text-indigo-600">{questionCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={maxQ}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>1</span>
            {!isPro && (
              <span className="text-amber-500 font-medium">
                Free plan: max {FREE_MAX_QUESTIONS} questions
              </span>
            )}
            <span>{maxQ}</span>
          </div>
        </div>

        {/* Question type */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Question type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {QUESTION_TYPES.map((qt) => (
              <button
                key={qt.value}
                onClick={() => setQuestionType(qt.value)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  questionType === qt.value
                    ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                }`}
              >
                <div className="text-sm font-semibold text-gray-800">{qt.label}</div>
                <div className="mt-0.5 text-xs text-gray-500">{qt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTIES.map((d) => {
              const isSelected = difficulty === d.value;
              const colorMap: Record<string, string> = {
                emerald: isSelected
                  ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white",
                amber: isSelected
                  ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white",
                red: isSelected
                  ? "border-red-400 bg-red-50 ring-1 ring-red-300"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white",
              };
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${colorMap[d.color]}`}
                >
                  <div className="text-sm font-semibold text-gray-800">{d.label}</div>
                  <div className="mt-0.5 text-xs text-gray-500">{d.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error from generation */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CTA */}
        {canTakeTest ? (
          <button
            onClick={handleSubmit}
            disabled={!topic.trim() || generating || extracting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating your test…
              </>
            ) : extracting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Reading image…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                Generate Test
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">Weekly limit reached.</span> Free plan allows{" "}
              {FREE_WEEKLY_LIMIT} tests per week. You&apos;ve used {weeklyCount}.
            </div>
            <button
              onClick={onUpgradeClick}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Upgrade to Pro for unlimited tests
            </button>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          {!isPro && canTakeTest && (
            <span className="text-xs text-gray-400">
              {remainingFreeTests} of {FREE_WEEKLY_LIMIT} free tests remaining this week ·{" "}
              <button
                onClick={onUpgradeClick}
                className="font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                Upgrade
              </button>
            </span>
          )}
          {isPro && <span className="text-xs text-gray-400">Unlimited tests · Pro plan</span>}
          <button
            onClick={onViewHistory}
            className="ml-auto text-xs font-medium text-gray-400 hover:text-indigo-500 transition-colors"
          >
            View test history →
          </button>
        </div>
      </div>
    </div>
  );
}
