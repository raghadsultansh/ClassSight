"use client"

import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "./theme-provider"
import { cn } from "@/lib/cn"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full",
        "glass border transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={cn(
          "pointer-events-none inline-block h-7 w-7 rounded-full",
          "shadow-lg ring-0 transition-transform duration-200",
          "translate-x-1 translate-y-1 bg-white dark:bg-slate-900",
          theme === "dark" && "translate-x-8"
        )}
      >
        <span className="flex h-full w-full items-center justify-center">
          {theme === "light" ? (
            <IconSun className="h-4 w-4 text-yellow-500" />
          ) : (
            <IconMoon className="h-4 w-4 text-blue-400" />
          )}
        </span>
      </span>
    </button>
  )
}
