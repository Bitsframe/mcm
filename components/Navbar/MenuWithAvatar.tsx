"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar } from "@/assets/images";
import { signOut } from "@/actions/supabase_auth/action";
import { AuthContext } from "@/context";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import LanguageChanger2 from "@/components/LanguageChanger2";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { resolveAvatar } from "@/utils/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Account menu in the toolbar. A compact avatar + name pill that opens a
 * macOS-style popover; on phones the language switcher moves in here because
 * the toolbar has no room for it.
 */
export default function MenuWithAvatar() {
  const { userProfile, userRole } = useContext(AuthContext);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { t, i18n } = useTranslation(translationConstant.SIDEBAR);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const logoutLabel = i18n.language?.startsWith("es") ? "Cerrar sesión" : "Log Out";
  const name = userProfile?.full_name || "User";
  const picture = resolveAvatar(userProfile?.profile_pictures);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          id="avatar-menu-button"
          aria-label={name}
          className="group flex h-9 items-center gap-2 rounded-full border border-border bg-white pl-1 pr-2.5 text-left shadow-mac-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 data-[state=open]:bg-surface"
        >
          <span className="relative h-7 w-7 overflow-hidden rounded-full bg-surface-2">
            <Image
              src={picture ?? Avatar}
              alt=""
              fill
              sizes="28px"
              className="object-cover"
              unoptimized={Boolean(picture)}
            />
          </span>
          {!isMobile && (
            <span className="flex max-w-[160px] flex-col leading-tight">
              <span className="truncate text-body font-semibold text-label">{name}</span>
              <span className="truncate text-caption text-label-2">{userRole || "Role"}</span>
            </span>
          )}
          <ChevronDown
            size={14}
            className="text-label-3 transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-60 rounded-lg border-border bg-vibrant-white p-1.5 shadow-mac-lg"
      >
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="truncate text-body font-semibold text-label">{name}</div>
          <div className="truncate text-caption font-normal text-label-2">{userRole || "Role"}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onSelect={() => router.push("/tools/settings")}
          className="gap-2.5 rounded-md px-2 py-1.5 text-body focus:bg-brand-600 focus:text-white"
        >
          <Settings size={15} /> {t("Sidebar_k22")}
        </DropdownMenuItem>
        {isMobile && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="px-2 py-1 text-caption font-medium uppercase tracking-wide text-label-3">
              Language
            </DropdownMenuLabel>
            <div className="px-2 pb-1.5">
              <LanguageChanger2 locale={userProfile?.locale || "en"} />
            </div>
          </>
        )}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className="gap-2.5 rounded-md px-2 py-1.5 text-body text-destructive focus:bg-destructive focus:text-white"
        >
          <LogOut size={15} /> {logoutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
