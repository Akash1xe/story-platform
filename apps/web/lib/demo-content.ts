export type StoryType = "Comic" | "Novel" | "Short story";

export type Story = {
  id: string;
  title: string;
  creator: string;
  genre: string;
  type: StoryType;
  minutes: number;
  coverImage: string;
  description: string;
  status?: "Ongoing" | "Completed";
};

export const featuredStory: Story = {
  id: "the-glass-kingdom",
  title: "The Glass Kingdom",
  creator: "Demo Creator",
  genre: "Fantasy",
  type: "Comic",
  minutes: 8,
  status: "Ongoing",
  coverImage:
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1800&q=85",
  description:
    "A forgotten map, a kingdom hidden beyond the mountains, and a choice that could change everything."
};

export const demoStories: Story[] = [
  {
    id: "after-the-last-train",
    title: "After the Last Train",
    creator: "Mira Sen",
    genre: "Mystery",
    type: "Short story",
    minutes: 5,
    status: "Completed",
    coverImage:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=85",
    description: "One train, one missing passenger and a night full of secrets."
  },
  {
    id: "the-forgotten-kingdom",
    title: "The Forgotten Kingdom",
    creator: "Arin Vale",
    genre: "Fantasy",
    type: "Comic",
    minutes: 8,
    status: "Ongoing",
    coverImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=85",
    description: "A lost kingdom is waiting for its final heir."
  },
  {
    id: "letters-to-june",
    title: "Letters to June",
    creator: "Elena Rose",
    genre: "Romance",
    type: "Novel",
    minutes: 5,
    status: "Ongoing",
    coverImage:
      "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=85",
    description: "Some letters arrive years after they were written."
  },
  {
    id: "beyond-the-stars",
    title: "Beyond the Stars",
    creator: "Noah Reed",
    genre: "Sci-fi",
    type: "Comic",
    minutes: 10,
    status: "Ongoing",
    coverImage:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=85",
    description: "A signal from space changes everything."
  },
  {
    id: "the-empty-room",
    title: "The Empty Room",
    creator: "Ava Morgan",
    genre: "Horror",
    type: "Short story",
    minutes: 3,
    status: "Completed",
    coverImage:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=85",
    description: "There was never supposed to be a fifth room."
  },
  {
    id: "one-last-summer",
    title: "One Last Summer",
    creator: "Sam Wilson",
    genre: "Romance",
    type: "Short story",
    minutes: 5,
    status: "Completed",
    coverImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=85",
    description: "A summer, a promise and a goodbye."
  },
  {
    id: "the-signal",
    title: "The Signal",
    creator: "Leo Carter",
    genre: "Sci-fi",
    type: "Short story",
    minutes: 10,
    status: "Completed",
    coverImage:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=85",
    description: "Something has been transmitting for two hundred years."
  },
  {
    id: "midnight-coffee",
    title: "Midnight Coffee",
    creator: "Nina Rose",
    genre: "Drama",
    type: "Short story",
    minutes: 8,
    status: "Completed",
    coverImage:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=85",
    description: "Two strangers meet at the same café every night."
  }
];

export const genres = [
  "Action",
  "Fantasy",
  "Romance",
  "Mystery",
  "Horror",
  "Thriller",
  "Sci-fi",
  "Drama",
  "Comedy"
] as const;
