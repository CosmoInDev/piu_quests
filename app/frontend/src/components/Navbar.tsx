"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, LogOut, LogIn, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LoginModal } from "@/components/LoginModal";
import { RegisterModal } from "@/components/RegisterModal";
import { useCurrentUser } from "@/hooks/useUser";

const NAV_LINKS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/quests/ongoing", label: "오늘의 숙제", icon: null },
  { href: "/quests/past", label: "지난번 숙제", icon: null },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV_LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClick}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
            pathname === href
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          }`}
        >
          {Icon ? <Icon className="w-4 h-4" /> : label}
        </Link>
      ))}
    </>
  );
}

function AuthButton({ mobile = false }: { mobile?: boolean }) {
  const { data: session, status } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const isAuthenticated = status === "authenticated" && !!session;
  const { user, checked, refetch } = useCurrentUser(isAuthenticated);

  if (status === "loading") return null;

  // Not logged in: show login button
  if (!session) {
    return (
      <>
        <Button
          size="sm"
          onClick={() => setLoginOpen(true)}
          className="font-medium"
        >
          <LogIn className="w-4 h-4 mr-1" />
          로그인
        </Button>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  // OAuth done but backend user not yet checked
  if (!checked) return null;

  // OAuth done, no backend user → show registration modal
  if (!user) {
    return (
      <RegisterModal
        open={true}
        defaultName={session.user?.name || ""}
        onRegistered={refetch}
      />
    );
  }

  // Fully logged in
  return (
    <div className={`flex items-center gap-2 ${mobile ? "flex-col items-start" : ""}`}>
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <span className="truncate max-w-[160px]">{user.name}</span>
        <Settings className="w-4 h-4" />
      </Link>
      <Button
        size="sm"
        onClick={() => signOut()}
        className="font-medium"
      >
        <LogOut className="w-4 h-4 mr-1" />
        로그아웃
      </Button>
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center gap-3">
        {/* Mobile: hamburger on the left */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-primary text-left">망겜기록제출소</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                <NavLinks />
              </div>
              <div className="mt-6 border-t pt-4">
                <AuthButton mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg shrink-0">
          망겜기록제출소
        </Link>

        {/* PC: center nav + right auth */}
        <nav className="hidden md:flex items-center gap-1 mx-6 flex-1">
          <NavLinks />
        </nav>
        <div className="hidden md:flex items-center ml-auto">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
