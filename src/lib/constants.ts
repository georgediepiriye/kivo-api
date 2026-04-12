// @/lib/constants.ts

export const EVENT_TYPES = {
  activity: {
    label: "Activity",
    slug: "activity",
    description: "Community-driven gatherings and social meetups.",
    defaultStatus: "casual",
  },
  showcase: {
    label: "Showcase",
    slug: "showcase",
    description: "Professional events and curated brand experiences.",
    defaultStatus: "verified",
  },
} as const;

export const EVENT_CATEGORIES = {
  // --- CORE SOCIAL ---
  social: {
    label: "Social",
    color: "bg-yellow-100 text-yellow-800",
  },
  hangout: {
    label: "Hangout",
    color: "bg-amber-100 text-amber-800",
  },
  party: {
    label: "Party",
    color: "bg-rose-100 text-rose-800",
  },
  culture: {
    label: "Culture",
    color: "bg-emerald-100 text-emerald-800",
  },

  // --- LIFESTYLE & WELLNESS ---
  wellness: {
    label: "Wellness",
    color: "bg-cyan-100 text-cyan-800",
  },
  fitness: {
    label: "Fitness",
    color: "bg-blue-100 text-blue-800",
  },
  sports: {
    label: "Sports",
    color: "bg-green-100 text-green-800",
  },

  // --- ENTERTAINMENT ---
  entertainment: {
    label: "Entertainment",
    color: "bg-pink-50 text-rose-700",
  },
  music: {
    label: "Music",
    color: "bg-pink-100 text-pink-800",
  },
  gaming: {
    label: "Gaming",
    color: "bg-violet-100 text-violet-800",
  },

  // --- FOOD & COMMERCE ---
  food: {
    label: "Food",
    color: "bg-orange-100 text-orange-800",
  },
  market: {
    label: "Market",
    color: "bg-lime-100 text-lime-800",
  },

  // --- PROFESSIONAL & GROWTH ---
  business: {
    label: "Business",
    color: "bg-indigo-100 text-indigo-800",
  },
  tech: {
    label: "Tech",
    color: "bg-purple-100 text-purple-800",
  },
  education: {
    label: "Education",
    color: "bg-teal-100 text-teal-800",
  },

  // --- COMMUNITY ---
  religious: {
    label: "Religious",
    color: "bg-gray-200 text-gray-800",
  },
} as const;

export type KivoType = keyof typeof EVENT_TYPES;
export type EventCategory = keyof typeof EVENT_CATEGORIES;
