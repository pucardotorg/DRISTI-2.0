import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "display-s",
            "title-l",
            "title",
            "title-s",
            "body",
            "body-compact",
            "caption",
          ],
        },
      ],
      shadow: [{ shadow: ["raised", "overlay", "modal"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
