"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

type Tab = "paste" | "upload";

export default function SyllabusUploader() {
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  const canSubmit = activeTab === "paste" ? text.trim().length > 20 : file !== null;

  return (
    <section id="upload" className="py-24 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
            Try it now
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Paste or upload your syllabus
          </h2>
          <p className="mt-3 text-gray-500">
            Supports PDF, DOCX, and plain text. Your data is never stored.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["paste", "upload"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "paste" ? "Paste text" : "Upload file"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "paste" ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                placeholder="Paste your syllabus here...&#10;&#10;Example:&#10;Week 3 Quiz — September 18&#10;Midterm Exam — October 9&#10;Research Paper Due — November 1"
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-16 transition-colors ${
                  isDragging
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                  <svg className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-medium text-gray-700">
                      Drop your file here, or{" "}
                      <span className="text-indigo-600">browse</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-400">PDF, DOCX, or TXT — up to 10 MB</p>
                  </div>
                )}
              </div>
            )}

            <button
              disabled={!canSubmit}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Extract deadlines & build study plan
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Your syllabus is processed securely and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
