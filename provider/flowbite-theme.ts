import type { CustomFlowbiteTheme } from "flowbite-react";

/*
 * flowbite-react ships a cyan/gray theme of its own. The pages that still use
 * its Button / Spinner / Modal / form controls take the macOS tokens from here
 * instead, so they match components/ui and the shell. Only the keys that
 * carry colour or shape are overridden; layout classes stay flowbite's.
 */
const push =
  "border border-transparent rounded-md text-body font-medium shadow-[0_1px_1px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] focus:ring-2 focus:ring-ring/40";

export const flowbiteTheme: CustomFlowbiteTheme = {
  button: {
    base: "group relative flex items-stretch justify-center p-0 text-center font-medium transition-[color,background-color,border-color,box-shadow] active:scale-[0.98] focus:z-10 focus:outline-none",
    color: {
      // flowbite's default colour is "info"; "blue" is what a few pages pass explicitly.
      info: `${push} bg-brand-600 text-white enabled:hover:bg-brand-700`,
      blue: `${push} bg-brand-600 text-white enabled:hover:bg-brand-700`,
      success: `${push} bg-brand-600 text-white enabled:hover:bg-brand-700`,
      failure: `${push} bg-destructive text-white enabled:hover:bg-[#B80012]`,
      gray: "rounded-md border border-input bg-white text-label shadow-mac-sm text-body font-medium focus:ring-2 focus:ring-ring/40 enabled:hover:bg-surface",
      light: "rounded-md border border-input bg-white text-label shadow-mac-sm text-body font-medium focus:ring-2 focus:ring-ring/40 enabled:hover:bg-surface",
      dark: "rounded-md border border-transparent bg-label text-white text-body font-medium focus:ring-2 focus:ring-ring/40 enabled:hover:bg-black",
    },
    inner: {
      base: "flex items-stretch transition-all duration-150",
    },
    size: {
      xs: "px-2 py-1 text-caption",
      sm: "px-2.5 py-1 text-footnote",
      md: "px-3.5 py-1.5 text-body",
      lg: "px-5 py-2 text-callout",
      xl: "px-6 py-2.5 text-callout",
    },
  },
  spinner: {
    base: "inline animate-spin text-surface-2",
    color: {
      info: "fill-brand-600",
      gray: "fill-label-3",
      success: "fill-brand-600",
      failure: "fill-destructive",
    },
  },
  modal: {
    root: {
      show: { on: "flex bg-black/30", off: "hidden" },
    },
    content: {
      inner: "relative flex max-h-[90dvh] flex-col rounded-lg bg-white shadow-mac-lg",
    },
    header: {
      base: "flex items-start justify-between rounded-t-lg border-b border-border p-4",
      title: "text-title3 text-label",
      close: {
        base: "ml-auto inline-flex items-center rounded-md bg-transparent p-1.5 text-label-2 hover:bg-black/[0.05] hover:text-label",
      },
    },
    footer: {
      base: "flex items-center gap-2 rounded-b-lg border-t border-border p-4",
    },
  },
  label: {
    root: {
      base: "text-footnote font-medium",
      colors: { default: "text-label-2" },
    },
  },
  textInput: {
    field: {
      input: {
        colors: {
          gray: "border-input bg-white text-label placeholder:text-label-3 focus:border-ring focus:ring-ring/30",
        },
        withShadow: { on: "shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)]", off: "" },
      },
    },
  },
  select: {
    field: {
      select: {
        colors: {
          gray: "border-input bg-white text-label focus:border-ring focus:ring-ring/30",
        },
      },
    },
  },
  checkbox: {
    root: {
      base: "h-4 w-4 rounded border border-input bg-white focus:ring-2",
      color: { default: "text-brand-600 focus:ring-brand-600/40" },
    },
  },
  radio: {
    root: {
      base: "h-4 w-4 border border-input text-brand-600 focus:ring-2 focus:ring-brand-600/40",
    },
  },
};
