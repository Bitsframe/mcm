import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The design system's type ramp uses names tailwind-merge does not ship with
 * (`text-body`, `text-footnote`, …). Left to guess, it reads `text-<word>` as a
 * text COLOUR, so merging "text-white … text-footnote" dropped the white as a
 * conflicting colour. Every `size="sm"` / `size="lg"` button lost its label
 * colour that way and fell back to whatever it inherited — black text on the
 * brand-green fill.
 *
 * Declaring the ramp as font sizes keeps colour and size independent, which is
 * what the utilities were always meant to be.
 */
const RAMP = [
  "caption",
  "footnote",
  "body",
  "callout",
  "headline",
  "title3",
  "title2",
  "title1",
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: RAMP }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
