"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { X, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useSWR from "swr";
import { usePathname } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  content: string;
  valid_from: string;
  valid_until: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NotificationBanner() {
  const pathname = usePathname();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAdminRoute = pathname?.startsWith("/admin");

  // 1. User Auth Check (Simple fetch, no SWR needed for one-time check, or useSWRImmutable)
  const { data: userData } = useSWR(isAdminRoute ? null : "/api/ld/user", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const isLoggedIn = !!userData?.username;

  // 2. Notifications Fetch (SWR) - Only fetch if logged in
  const { data: notifData } = useSWR(
    isLoggedIn && !isAdminRoute ? "/api/notifications" : null,
    fetcher,
    {
      revalidateOnFocus: true,
      focusThrottleInterval: Number(process.env.NEXT_PUBLIC_SWR_FOCUS_THROTTLE_INTERVAL) || 5 * 60 * 1000,
      refreshInterval: Number(process.env.NEXT_PUBLIC_SWR_REFRESH_INTERVAL) || 30 * 60 * 1000,
    }
  );

  const notifications: Notification[] = notifData?.notifications || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (!isVisible || notifications.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isVisible, notifications.length, isPaused]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
  }, [notifications.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % notifications.length);
  }, [notifications.length]);

  if (isAdminRoute || !mounted || !isLoggedIn || !isVisible || notifications.length === 0) {
    return null;
  }

  // Safe guard for index if notifications change
  const safeIndex = currentIndex >= notifications.length ? 0 : currentIndex;
  const currentNotification = notifications[safeIndex];

  return (
    <div className="w-full bg-brand-blue/5 border-b border-brand-blue/10">
      <div 
        className="mx-auto max-w-7xl px-4 h-9 sm:px-6 lg:px-8 flex items-center justify-between gap-4 text-xs sm:text-sm"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Icon & Controls */}
        <div className="flex items-center gap-2 text-brand-blue shrink-0">
          <Bell className="h-3.5 w-3.5 fill-current" />
          {notifications.length > 1 && (
            <div className="flex items-center gap-0.5 text-brand-muted/50">
              <button onClick={handlePrev} className="hover:text-brand-blue transition-colors">
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button onClick={handleNext} className="hover:text-brand-blue transition-colors">
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Content Carousel */}
        <div className="flex-1 min-w-0 overflow-hidden relative h-full flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNotification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full flex items-center gap-2 truncate"
            >
              <span className="font-semibold text-brand-text shrink-0">
                {currentNotification.title}:
              </span>
              <div className="truncate text-brand-muted/90 [&_a]:text-brand-blue [&_a]:underline hover:[&_a]:text-amber-700 [&_p]:inline [&_p]:m-0">
                <ReactMarkdown 
                  components={{
                    p: ({children}) => <span className="inline">{children}</span>,
                    a: (props) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    )
                  }}
                >
                  {currentNotification.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 -mr-2 text-brand-muted/60 hover:text-brand-text hover:bg-brand-blue/10 rounded-full transition-colors"
          title="关闭通知"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
