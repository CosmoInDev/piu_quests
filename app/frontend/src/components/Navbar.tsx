"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Home } from "lucide-react";
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
  { href: "/picks", label: "추첨 테스트", icon: null },
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

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center gap-3">
        {/* 모바일: 왼쪽 햄버거 → 왼쪽에서 사이드바 슬라이드 */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-primary text-left">망겜숙제추첨소</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg shrink-0">
          망겜숙제추첨소
        </Link>

        {/* PC: 가로 내비게이션 */}
        <nav className="hidden md:flex items-center gap-1 mx-6 flex-1">
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}
