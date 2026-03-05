"use client";

import { useEffect, useState } from "react";

export type InAppBrowserType = "kakaotalk" | "naver" | "instagram" | "other" | null;

function detectInAppBrowser(ua: string): InAppBrowserType {
  const lower = ua.toLowerCase();
  if (lower.includes("kakaotalk")) return "kakaotalk";
  if (lower.includes("naver")) return "naver";
  if (lower.includes("instagram")) return "instagram";
  // Generic WebView detection
  if (
    (lower.includes("android") && lower.includes("wv")) ||
    lower.includes("fb_iab") ||
    lower.includes("fbav")
  )
    return "other";
  return null;
}

export function useInAppBrowser() {
  const [browserType, setBrowserType] = useState<InAppBrowserType>(null);

  useEffect(() => {
    setBrowserType(detectInAppBrowser(navigator.userAgent));
  }, []);

  return browserType;
}
