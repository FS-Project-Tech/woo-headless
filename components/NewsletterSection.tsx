"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function NewsletterSection() {
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      error("Please enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      success("Subscribed! Check your inbox soon.");
      setEmail("");
    } catch {
      error("Unable to subscribe right now");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 p-6 sm:p-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-gray-900">Stay in the loop</h2>
            <p className="mt-1 text-sm text-gray-600">Get product updates, deals, and helpful tips in your inbox.</p>
            <form onSubmit={onSubmit} className="mt-4 flex w-full max-w-xl items-center gap-2 rounded-full border bg-white px-3 py-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="m22 6-10 7L2 6" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full outline-none"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
              >
                {submitting ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500">By subscribing, you agree to our terms and privacy policy.</p>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/10" />
        </div>
      </div>
    </section>
  );
}


