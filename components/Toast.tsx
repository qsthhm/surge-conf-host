"use client";
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

type Toast = { id: number; text: string; tone?: "default" | "success" | "warn" | "error"; };
type Ctx = { show: (text: string, tone?: Toast["tone"], ms?: number) => void; };

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const show = useCallback((text: string, tone: Toast["tone"]="default", ms=2200) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, tone }]);
    setTimeout(() => setList((l) => l.filter(t => t.id !== id)), ms);
  }, []);
  const ctx = useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      {typeof window !== "undefined" &&
        createPortal(
          <div className="fixed bottom-6 left-0 right-0 pointer-events-none">
            <div className="container-page flex flex-col items-end gap-2">
              {list.map(t => (
                <div
                  key={t.id}
                  className={[
                    "pointer-events-auto select-none rounded-xl px-3 py-2 text-sm shadow-card border",
                    t.tone==="success" ? "bg-green-50 text-green-700 border-green-200" :
                    t.tone==="warn"    ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                    t.tone==="error"   ? "bg-red-50 text-red-700 border-red-200" :
                                         "bg-white text-base-text border-base-border"
                  ].join(" ")}
                >
                  {t.text}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )
      }
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.show;
}
