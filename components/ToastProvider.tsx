"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ToastKind = "success" | "error" | "info" | "warning";
export type Toast = { id: string; message: string; kind: ToastKind; durationMs?: number };

const ToastCtx = createContext<{
	show: (message: string, kind?: ToastKind, durationMs?: number) => void;
	success: (message: string, durationMs?: number) => void;
	error: (message: string, durationMs?: number) => void;
	info: (message: string, durationMs?: number) => void;
	warning: (message: string, durationMs?: number) => void;
} | null>(null);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);
	const timersRef = useRef<Map<string, number>>(new Map());

	const remove = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
		const tm = timersRef.current.get(id);
		if (tm) {
			window.clearTimeout(tm);
			timersRef.current.delete(id);
		}
	}, []);

	const show = useCallback((message: string, kind: ToastKind = "info", durationMs = 2500) => {
		const id = Math.random().toString(36).slice(2);
		setToasts((prev) => [{ id, message, kind, durationMs }, ...prev].slice(0, 5));
		const tm = window.setTimeout(() => remove(id), durationMs);
		timersRef.current.set(id, tm);
	}, [remove]);

	useEffect(() => () => {
		// cleanup on unmount
		timersRef.current.forEach((tm) => window.clearTimeout(tm));
		timersRef.current.clear();
	}, []);

	const api = useMemo(() => ({
		show,
		success: (m: string, d?: number) => show(m, "success", d),
		error: (m: string, d?: number) => show(m, "error", d),
		info: (m: string, d?: number) => show(m, "info", d),
		warning: (m: string, d?: number) => show(m, "warning", d),
	}), [show]);

	return (
		<ToastCtx.Provider value={api}>
			{children}
			<div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-80 max-w-[90vw] flex-col gap-2">
				{toasts.map((t) => (
					<div key={t.id} className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg transition-all ${
						t.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" :
						t.kind === "error" ? "border-red-200 bg-red-50 text-red-900" :
						t.kind === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" :
						"border-gray-200 bg-white text-gray-900"
					}` }>
						<div className="mt-0.5">
							{t.kind === "success" && (
								<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
							)}
							{t.kind === "error" && (
								<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
							)}
							{t.kind === "warning" && (
								<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
							)}
							{t.kind === "info" && (
								<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
							)}
						</div>
						<div className="flex-1 text-sm leading-5">{t.message}</div>
						<button onClick={() => remove(t.id)} className="ml-2 rounded p-1 text-gray-600 hover:bg-black/5">
							<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
						</button>
					</div>
				))}
			</div>
		</ToastCtx.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastCtx);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
}
