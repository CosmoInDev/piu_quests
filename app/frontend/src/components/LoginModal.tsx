"use client";

import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInAppBrowser } from "@/hooks/useInAppBrowser";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IN_APP_LABELS: Record<string, string> = {
  kakaotalk: "카카오톡",
  naver: "네이버",
  instagram: "인스타그램",
  other: "앱 내 브라우저",
};

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const inAppBrowser = useInAppBrowser();
  const appLabel = inAppBrowser ? IN_APP_LABELS[inAppBrowser] ?? "앱 내 브라우저" : null;

  function openInExternalBrowser() {
    const url = window.location.href;
    // Android KakaoTalk: try intent URI to open in Chrome
    const intentUrl = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    // Fallback: copy URL instruction shown in the UI
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          {inAppBrowser ? (
            <>
              <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 space-y-1">
                <p className="font-semibold">
                  {appLabel}에서는 Google 로그인이 제한됩니다.
                </p>
                <p>
                  Google 정책에 의해 카카오톡 등 앱 내 브라우저에서는 Google 로그인을 사용할 수 없습니다.
                </p>
                <p className="mt-1">
                  아래 주소를 복사하여 <strong>Chrome</strong> 또는 <strong>Safari</strong> 브라우저에서 직접 열어주세요.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted text-xs break-all select-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>
              {inAppBrowser === "kakaotalk" && (
                <Button variant="outline" onClick={openInExternalBrowser} className="w-full">
                  Chrome으로 열기 시도
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                {inAppBrowser === "kakaotalk"
                  ? "버튼이 동작하지 않으면 우측 하단 ··· 메뉴 → '다른 브라우저로 열기'를 이용해 주세요."
                  : "앱의 메뉴에서 '브라우저로 열기'를 선택해 주세요."}
              </p>
            </>
          ) : (
            <Button onClick={() => signIn("google")} className="w-full">
              Google로 로그인
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
