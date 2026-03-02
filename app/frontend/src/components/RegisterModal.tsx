"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/hooks/useUser";
import { AxiosError } from "axios";

interface RegisterModalProps {
  open: boolean;
  defaultName: string;
  onRegistered: () => void;
}

export function RegisterModal({ open, defaultName, onRegistered }: RegisterModalProps) {
  const [name, setName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await registerUser(name.trim());
      onRegistered();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>;
      if (axiosErr.response?.status === 409) {
        alert("이미 사용 중인 이름입니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    signOut();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>회원가입</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <Label>사용자명을 입력해주세요.</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="사용자명"
            maxLength={256}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
              확인
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
