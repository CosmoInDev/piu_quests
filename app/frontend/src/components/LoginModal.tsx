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

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const inAppBrowser = useInAppBrowser();

  function openInExternalBrowser() {
    const url = window.location.href;
    const intentUrl = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          {/* Kakao login — always available, works inside KakaoTalk too */}
          <Button
            onClick={() => signIn("kakao")}
            className="w-full bg-[#FEE500] hover:bg-[#F0D800] text-[#3C1E1E] font-semibold"
          >
            카카오로 로그인
          </Button>

          {inAppBrowser ? (
            /* In-app browser: warn Google login is blocked */
            <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 space-y-2">
              <p className="font-semibold">Google 로그인은 카카오톡 내 브라우저에서 제한됩니다.</p>
              <p>Google 로그인을 사용하려면 외부 브라우저에서 열어주세요.</p>
              {inAppBrowser === "kakaotalk" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInExternalBrowser}
                  className="w-full mt-1"
                >
                  Chrome으로 열기 시도
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {inAppBrowser === "kakaotalk"
                  ? "버튼이 동작하지 않으면 우측 하단 ··· 메뉴 → '다른 브라우저로 열기'를 이용해 주세요."
                  : "앱 메뉴에서 '브라우저로 열기'를 선택해 주세요."}
              </p>
            </div>
          ) : (
            /* Normal browser: show Google login */
            <Button variant="outline" onClick={() => signIn("google")} className="w-full">
              Google로 로그인
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
