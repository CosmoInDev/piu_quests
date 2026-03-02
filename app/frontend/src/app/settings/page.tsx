"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrentUser, updateUserName, deleteAccount } from "@/hooks/useUser";
import { AxiosError } from "axios";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";
  const { user, checked, refetch } = useCurrentUser(isAuthenticated);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameUpdated, setNameUpdated] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  if (!checked || !user) return null;

  const handleUpdateName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateUserName(name.trim());
      await refetch();
      setNameUpdated(true);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail: string }>;
      if (axiosErr.response?.status === 409) {
        alert("이미 사용 중인 이름입니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleting(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-xl font-bold mb-6">설정</h1>

      {/* Name change section */}
      <section className="mb-8">
        <Label className="text-sm font-medium mb-2 block">이름 변경</Label>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={256}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateName();
            }}
          />
          <Button
            onClick={handleUpdateName}
            disabled={saving || !name.trim() || name.trim() === user.name}
          >
            확인
          </Button>
        </div>
      </section>

      {/* Name updated confirmation dialog */}
      <AlertDialog open={nameUpdated} onOpenChange={setNameUpdated}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이름이 변경되었습니다.</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.reload()}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Account deletion section */}
      <section>
        <Label className="text-sm font-medium mb-2 block">회원탈퇴</Label>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              회원탈퇴
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                탈퇴 시 회원 정보는 사라지지만, 업로드한 기록은 사라지지 않습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>확인</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </main>
  );
}
