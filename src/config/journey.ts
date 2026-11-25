// ════════════════════════════════════════════════════════════════════════════
//  THE JOURNEY  ✏️  — which photo goes in which room
//
//  • `chapters` are the Memory Lane halls (1 to 3 of them). Each hall shows its
//    photos one by one as Sudha walks past. Use exact file names from public/images.
//  • `cinemaOrder` photos play FIRST in the cinema slideshow; afterwards the movie
//    quickly recaps every hall photo too, so every photo appears in the cinema.
//  • Self-healing: a photo that isn't listed anywhere is added automatically (to the
//    last hall, or to the cinema if the halls are full). A listed file that no longer
//    exists is ignored. With no photos at all, placeholder frames are used.
//  • The number of halls follows the number of hall photos: ceil(photos / 5), max 3.
// ════════════════════════════════════════════════════════════════════════════

export interface ChapterConfig {
  id: string
  title: string
  subtitle: string
  photos: string[]
}

export const chapters: ChapterConfig[] = [
  {
    id: 'funny',
    title: 'The Funny Ones',
    subtitle: 'we were definitely not being serious',
    photos: [
      '19a13b03-d794-4b57-9faa-f1d5eaf12f2d.jpg', // parrot vs. face
      '7ae10071-fcbf-4619-9ad5-a07fd2df25d6.jpg', // peek-a-boo dupatta
      '72415981-d83c-4060-9232-8111a4750703.jpg', // elephant side-eye
      '6ad2bb23-880e-4af1-b634-61d05bde3f1a.jpg', // life-jacket selfie
      '3e788aa1-d4c4-400e-86ad-1dad7c07c46c.jpg', // dupatta in the wind
      'b0b97cdf-5743-4be2-9410-f7c6ae91c5de.jpg', // shades + bike
    ],
  },
  {
    id: 'adventures',
    title: 'Out & About',
    subtitle: 'lakes, bridges, hills and a lot of clouds',
    photos: [
      '1b59196f-8f26-4c2e-9973-19fecc4644ac.jpg', // lake boat
      '36c1e9f9-175e-4631-8fb4-b5e24e7a4767.jpg', // bridge walk
      'a0a8be70-79b0-4022-bb24-bf047f7c4490.jpg', // hill therapy
      'ec006c13-8002-45fa-8756-ed659c2d916e.jpg', // in the clouds
      '4655a773-0cab-4bf9-b203-749c3dc7497a.jpg', // mall mode
    ],
  },
  {
    id: 'main-character',
    title: 'Main Character Energy',
    subtitle: 'no notes, only spotlights',
    photos: [
      '0a695f45-3c0e-430a-b0d8-7bb829bd3400.jpg', // rooftop boss pose
      '59a7cf85-6dea-4c81-9020-ab723ad4b89e.jpg', // flower carpet
      'e2b7d5aa-899a-4ab6-83dc-20b37817d330.jpg', // rock wall, pink flowers
      'be4944de-c8a8-42be-925d-fb7c1bd8ffec.jpg', // green wall selfie
      'f458997e-6e41-416d-ab6d-544adc11acfa.jpg', // terracotta gate
    ],
  },
]

export const cinemaOrder: string[] = [
  '22fa3965-ee58-43f4-bf5d-b5c388731463.jpg',
  '5cb1ecd2-bab5-4708-9c13-a0677ae55ca1.jpg',
  '68645721-d568-46b5-817c-90fef0c1c5e2.jpg',
  '756d3e94-4a5b-4b97-a374-927001bd6a11.jpg',
  '795e05c0-227f-4e65-a8b2-5824fd9b5b82.jpg',
  'bc78e5c8-35f5-4aec-bbcc-f317a4c618ae.jpg',
  'e2f8f8ef-b146-4c89-8260-d0e765389a85.jpg',
  'edef8051-7089-496e-9566-4e5667ef0534.jpg',
]

/** Titles used when the photos don't match the chapters above (e.g. you replaced every photo). */
export const autoChapters: Omit<ChapterConfig, 'photos'>[] = [
  { id: 'smiles', title: 'A Collection of Smiles', subtitle: 'the curator approves of every single one' },
  { id: 'adventures', title: 'Little Adventures', subtitle: 'places we went and things we saw' },
  { id: 'main-character', title: 'Main Character Energy', subtitle: 'no notes, only spotlights' },
]

/** Where each room hides its star, as Karthik describes it when she asks for a hint. */
export const starHints: Record<string, string> = {
  lobby: 'Psst… plants make great hiding spots 🌿',
  'hall-1': 'Have you checked under the bench? 👀',
  'hall-2': 'Something is twinkling near the far door ✨',
  'hall-3': 'Sometimes the best things are right behind you 😌',
  cinema: 'Back row. Very back. Under a seat 🍿',
  lounge: 'That plant in the corner looks suspicious 🪴',
  'post-office': 'One of the pigeonholes is glowing… 📮',
}
