"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string | null;
  userName: string;
}

export function PhotoModal({ open, onOpenChange, photoUrl, userName }: PhotoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{userName}의 제출 사진</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${userName}의 제출 사진`}
              className="w-full rounded-md object-contain max-h-[70vh]"
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">사진이 없습니다.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
