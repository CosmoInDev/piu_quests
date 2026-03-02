"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Menu, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  if (status === "loading") return null;

  if (session) {
    return (
      <div className={`flex items-center gap-2 ${mobile ? "flex-col items-start" : ""}`}>
        <span className="text-sm text-muted-foreground truncate max-w-[160px]">
          {session.user?.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="text-muted-foreground hover:text-primary"
        >
          <LogOut className="w-4 h-4 mr-1" />
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signIn("google")}
      className="text-muted-foreground hover:text-primary font-medium"
    >
      로그인하세요
    </Button>
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
