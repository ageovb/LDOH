/**
 * Site Log Dialog - 操作日志弹窗
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type SiteLog = {
  id: string;
  action: string;
  actor_id: number;
  actor_username: string;
  message: string;
  created_at: string;
};

type SiteLogDialogProps = {
  open: boolean;
  siteId: string;
  siteName: string;
  onClose: () => void;
};

const formatBeijingTime = (value: string) => {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${beijing.getFullYear()}-${pad(beijing.getMonth() + 1)}-${pad(
    beijing.getDate()
  )} ${pad(beijing.getHours())}:${pad(beijing.getMinutes())}:${pad(
    beijing.getSeconds()
  )}`;
};

export function SiteLogDialog({
  open,
  siteId,
  siteName,
  onClose,
}: SiteLogDialogProps) {
  const [logs, setLogs] = useState<SiteLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/sites/${siteId}/logs`, { cache: "no-store" })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.error || "加载失败");
        }
        return payload?.logs ?? [];
      })
      .then((data) => {
        if (!cancelled) {
          setLogs(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, siteId]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="py-6 text-center text-sm text-brand-muted">
          加载中...
        </div>
      );
    }
    if (error) {
      return (
        <div className="py-6 text-center text-sm text-red-500">{error}</div>
      );
    }
    if (!logs.length) {
      return (
        <div className="py-6 text-center text-sm text-brand-muted">
          暂无日志
        </div>
      );
    }
    return (
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-lg border border-brand-border/60 bg-white/90 p-3 text-xs text-brand-text shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold">
                {log.actor_username || "未知"} #{log.actor_id}
              </span>
              <span className="text-[10px] text-brand-muted">
                {formatBeijingTime(log.created_at)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-brand-muted">
              {log.message || "无变更说明"}
            </div>
          </div>
        ))}
      </div>
    );
  }, [logs, loading, error]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-lg rounded-xl border border-brand-border bg-white p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-brand-text">
                  操作日志
                </h3>
                <p className="mt-0.5 text-xs text-brand-muted">
                  感谢佬友们一路守护，每一次编辑都让它变得更好。
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-slate-100"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
            {content}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
