export type StoryType = "Comic" | "Novel" | "Short story";

export type ComicPanelStyle =
  | "archive"
  | "mountain"
  | "portal"
  | "orbital"
  | "signal";

export type ComicPanel = {
  id: string;
  style: ComicPanelStyle;
  scene: string;
  dialogue?: string;
  caption?: string;
};

export type ComicPanel = {
  id: string;
  style: "archive" | "mountain" | "portal" | "orbital" | "signal";
  scene: string;
  dialogue?: string;
  caption?: string;
};

export type Story = {
  id: string;
  title: string;
  creator: string;
  genre: string;
  type: StoryType;
  minutes: number;
  coverImage: string;
  description: string;
  status: "Ongoing" | "Completed";
  previewTitle: string;
  previewParagraphs: string[];
  comicPanels?: ComicPanel[];
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
    "A forgotten map, a kingdom hidden beyond the mountains, and a choice that could change everything.",
  previewTitle: "The Map Beneath the Glass",
  previewParagraphs: [
    "The map was not drawn on paper. It was etched into a sheet of glass so thin that Mira could see the candlelight trembling through it. Every road ended at the same mountain, and every time she looked away, the mountain seemed to move.",
    "Her grandfather had called it a warning. The royal archivists called it a myth. Tonight, with the palace gates sealed and footsteps climbing the stairs, Mira finally understood why he had hidden it.",
    "A line of light appeared beneath the glass. It traced a path from the old city to a place that had been removed from every map in the kingdom. At its end, someone had written her name."
  ],
  comicPanels: [
    {
      id: "glass-1",
      style: "archive",
      scene: "A quiet archive lit by a single candle. Mira stands over a translucent map.",
      caption: "The map was older than the kingdom itself.",
      dialogue: "Every road ends at the same mountain."
    },
    {
      id: "glass-2",
      style: "mountain",
      scene: "A vast mountain rises beyond a sleeping city beneath a violet night sky.",
      caption: "Her grandfather had called it a warning. The royal archivists called it a myth.",
      dialogue: "Then why does it keep moving?"
    },
    {
      id: "glass-3",
      style: "portal",
      scene: "A glowing route appears on the glass and ends at a hidden doorway.",
      caption: "At the end of the forgotten road, a name appeared.",
      dialogue: "Mira."
    }
  ]
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
    description: "One train, one missing passenger and a night full of secrets.",
    previewTitle: "Platform Nine",
    previewParagraphs: [
      "The station clock stopped at 11:47, just as the last train pulled away. Ishan watched its red tail lights shrink into the rain, then noticed the woman still sitting on the opposite bench.",
      "She had been there when he arrived. She had not moved, not even when the announcement named a train that had not appeared on the board for twenty years.",
      "When the station lights flickered, the bench was empty. A folded ticket lay in its place, warm to the touch, with tomorrow's date printed across it."
    ]
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
    description: "A lost kingdom is waiting for its final heir.",
    previewTitle: "The Door in the Hill",
    previewParagraphs: [
      "At the top of the hill stood a door with no wall around it. Its bronze handle was polished, as if someone had opened it yesterday.",
      "Kael placed the old crown against the lock. Deep below the grass, gears began to turn. The hill answered with a low, sleeping sound.",
      "Beyond the doorway was not a room but a night sky, full of unfamiliar stars. A voice from the darkness spoke the name his family had forbidden him to use."
    ],
    comicPanels: [
      {
        id: "kingdom-1",
        style: "mountain",
        scene: "A lone bronze door stands at the top of a hill under a storm-lit sky.",
        caption: "At the top of the hill stood a door with no wall around it.",
        dialogue: "Who built you?"
      },
      {
        id: "kingdom-2",
        style: "archive",
        scene: "Kael presses an old crown against an intricate lock as gears turn below.",
        caption: "The hill began to wake beneath his feet.",
        dialogue: "This was never a crown. It was a key."
      },
      {
        id: "kingdom-3",
        style: "portal",
        scene: "The doorway opens onto a deep star-filled sky.",
        caption: "Beyond the door was a sky no map had ever recorded.",
        dialogue: "Welcome home, final heir."
      }
    ]
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
    description: "Some letters arrive years after they were written.",
    previewTitle: "The Blue Envelope",
    previewParagraphs: [
      "The envelope was waiting beneath the door when June came home. No stamp, no return address, only her name written in the handwriting she had spent six years trying to forget.",
      "She made tea before opening it. It was an old habit from the days when difficult news arrived by post and there was always time to let the kettle boil.",
      "Inside was a single line: I kept the promise, even when you stopped asking."
    ]
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
    description: "A signal from space changes everything.",
    previewTitle: "The Quiet Signal",
    previewParagraphs: [
      "At 03:16 UTC, every receiver on the far side of the moon recorded the same three notes. The signal lasted eleven seconds and repeated after exactly one hour.",
      "Dr. Sato listened to it once, then again with the lights off. The pattern was not random. It was a countdown, and someone had started it before humanity learned to listen.",
      "On the third replay, a fourth note appeared. The observatory's oldest screen lit up with a message in plain English: WE CAN SEE YOU NOW."
    ],
    comicPanels: [
      {
        id: "stars-1",
        style: "orbital",
        scene: "A silent lunar observatory floats above the blue curve of Earth.",
        caption: "03:16 UTC. Every receiver on the far side of the moon went silent.",
        dialogue: "Signal detected."
      },
      {
        id: "stars-2",
        style: "signal",
        scene: "A monitor glows in a dark control room as three bright waveforms appear.",
        caption: "Three notes. Eleven seconds. Exactly one hour apart.",
        dialogue: "That is not noise. It is a countdown."
      },
      {
        id: "stars-3",
        style: "orbital",
        scene: "A vast shape emerges from darkness beyond the edge of the planet.",
        caption: "On the third replay, a fourth note appeared.",
        dialogue: "WE CAN SEE YOU NOW."
      }
    ]
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
    description: "There was never supposed to be a fifth room.",
    previewTitle: "Room Five",
    previewParagraphs: [
      "The floor plan showed four rooms. The landlord showed me four rooms. I counted four doors every morning before leaving for work.",
      "On Thursday, a fifth door appeared at the end of the hall. Its paint was still wet, and someone had written my childhood address on the brass plate.",
      "I called the landlord. He answered on the first ring and whispered, without saying hello, that I must not open it again."
    ]
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
    description: "A summer, a promise and a goodbye.",
    previewTitle: "The Place We Promised",
    previewParagraphs: [
      "Every June, they returned to the same stretch of coast. The town had grown louder, the pier had lost two planks, and the little shop still sold the same orange ice cream.",
      "This year, only Anya came. She brought the postcard they had written together at seventeen and left it beneath the blue stone.",
      "The tide carried the message away slowly. For the first time, she did not wait for an answer."
    ]
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
    description: "Something has been transmitting for two hundred years.",
    previewTitle: "A Voice in the Static",
    previewParagraphs: [
      "The broadcast had been buried under two centuries of static. When the restoration team cleaned the recording, they expected music, weather reports, perhaps a speech.",
      "Instead, they heard a child counting down from ten. The voice was calm, close to the microphone, and unmistakably frightened.",
      "At the end of the recording, the child said the exact date and time of the team's discovery. Then the studio microphone, unplugged since 1912, clicked on."
    ]
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
    description: "Two strangers meet at the same café every night.",
    previewTitle: "One Table by the Window",
    previewParagraphs: [
      "The café closed at midnight, but the owner always left one table free for the woman with the yellow notebook. She never ordered until the rain began.",
      "Across the room, a man came in every evening and wrote nothing at all. For three weeks they occupied the same silence without exchanging a word.",
      "Tonight, he placed a second cup on her table. On the saucer was a note: I think we have been waiting for the same person."
    ]
  }
];

export const allStories: Story[] = [featuredStory, ...demoStories];

export function getStoryBySlug(slug: string): Story | undefined {
  return allStories.find((story) => story.id === slug);
}

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
