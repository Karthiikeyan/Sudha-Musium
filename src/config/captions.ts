// ════════════════════════════════════════════════════════════════════════════
//  PHOTO CAPTIONS  ✏️  — edit these as much as you like!
//  The key is the exact file name inside public/images (spelling and
//  upper/lower case must match). `guideLine` is what Karthik says the first
//  time Sudha walks up to that photo (optional).
//  Any photo that is not listed here gets one of the fallback captions below.
// ════════════════════════════════════════════════════════════════════════════

export interface Caption {
  caption: string
  guideLine?: string
}

export const captions: Record<string, Caption> = {
  '0a695f45-3c0e-430a-b0d8-7bb829bd3400.jpg': {
    caption: 'Rooftop pose, hands on hips. Boss mode 😎',
    guideLine: 'The sunset knew you were coming 🌇',
  },
  '19a13b03-d794-4b57-9faa-f1d5eaf12f2d.jpg': {
    caption: 'The parrot is calm. You, not so much 🦜😂',
    guideLine: 'That bird has better camera confidence 🦜',
  },
  '1b59196f-8f26-4c2e-9973-19fecc4644ac.jpg': {
    caption: 'Boat day: calm lake, calmer smile 🚤',
    guideLine: 'Lake views. You win this round.',
  },
  '22fa3965-ee58-43f4-bf5d-b5c388731463.jpg': {
    caption: 'Selfie angle: perfected. No notes 📸',
    guideLine: 'Okay, selfie queen 👑',
  },
  '36c1e9f9-175e-4631-8fb4-b5e24e7a4767.jpg': {
    caption: 'Bridge walk. Hands in pockets, zero worries 🌿',
    guideLine: 'Very confident bridge energy.',
  },
  '3e788aa1-d4c4-400e-86ad-1dad7c07c46c.jpg': {
    caption: 'Dupatta in the wind. Main character moment 🎬',
    guideLine: 'Bollywood called. They want their scene back 🎬',
  },
  '4655a773-0cab-4bf9-b203-749c3dc7497a.jpg': {
    caption: 'Mall mode: pink top, big smile, no shopping bags yet 🛍️',
    guideLine: 'The bags came later, I assume 😂',
  },
  '59a7cf85-6dea-4c81-9020-ab723ad4b89e.jpg': {
    caption: 'Building a flower carpet, petal by petal 🌼',
    guideLine: 'So much patience. I would have quit at petal ten.',
  },
  '5cb1ecd2-bab5-4708-9c13-a0677ae55ca1.jpg': {
    caption: 'Golden hour looks good on you 🌅',
    guideLine: 'The sky did its best to keep up.',
  },
  '68645721-d568-46b5-817c-90fef0c1c5e2.jpg': {
    caption: 'Bright blue day, brighter smile 💙',
    guideLine: 'That blue is so good.',
  },
  '6ad2bb23-880e-4af1-b634-61d05bde3f1a.jpg': {
    caption: 'Life jacket on, safety first, selfie second 🦺',
    guideLine: 'Safety first. Selfie right after 😂',
  },
  '72415981-d83c-4060-9232-8111a4750703.jpg': {
    caption: 'Side-eye with a tiny elephant on the kurta 🐘',
    guideLine: 'The elephant approves of this photo 🐘',
  },
  '756d3e94-4a5b-4b97-a374-927001bd6a11.jpg': {
    caption: 'Quiet road, tiny smile, hair flick 💁‍♀️',
    guideLine: 'Slow-motion hair flick. Cinematic.',
  },
  '795e05c0-227f-4e65-a8b2-5824fd9b5b82.jpg': {
    caption: 'Standing tall on a wobbly little bridge 🌉',
    guideLine: 'Brave. I would have walked very slowly.',
  },
  '7ae10071-fcbf-4619-9ad5-a07fd2df25d6.jpg': {
    caption: 'Peek-a-boo! Purple dupatta edition 🙈💜',
    guideLine: 'I see you 👀',
  },
  'a0a8be70-79b0-4022-bb24-bf047f7c4490.jpg': {
    caption: 'Hill therapy: loading… ☁️',
    guideLine: 'The shirt says it all. Loading complete.',
  },
  'b0b97cdf-5743-4be2-9410-f7c6ae91c5de.jpg': {
    caption: 'Shades on, bike behind. Very cool, very you 😎🏍️',
    guideLine: 'Honestly, the bike is lucky.',
  },
  'bc78e5c8-35f5-4aec-bbcc-f317a4c618ae.jpg': {
    caption: 'Looking away like a movie poster 🎞️',
    guideLine: 'Coming soon, in a theatre near you.',
  },
  'be4944de-c8a8-42be-925d-fb7c1bd8ffec.jpg': {
    caption: 'Green wall, teal outfit, jhumkas. Matching achieved 💚',
    guideLine: 'That green wall was clearly waiting for you.',
  },
  'e2b7d5aa-899a-4ab6-83dc-20b37817d330.jpg': {
    caption: 'Stone floor, pink flowers, a very peaceful moment 🌸',
    guideLine: 'Peaceful. No notes.',
  },
  'e2f8f8ef-b146-4c89-8260-d0e765389a85.jpg': {
    caption: 'Tilted selfie against the old rocks 🪨',
    guideLine: 'Even the rocks are impressed.',
  },
  'ec006c13-8002-45fa-8756-ed659c2d916e.jpg': {
    caption: 'Lost in the clouds, happily 🌫️',
    guideLine: 'Foggy day, clear smile.',
  },
  'edef8051-7089-496e-9566-4e5667ef0534.jpg': {
    caption: 'Blue dress, green leaves, phone in hand 📱',
    guideLine: 'Checking messages? I hope one is mine 😄',
  },
  'f458997e-6e41-416d-ab6d-544adc11acfa.jpg': {
    caption: 'Terracotta gate, white blossoms, one cool look 🌺',
    guideLine: 'The flowers are just a bonus.',
  },
}

/** Used (in order, cycling) for any photo that is not in the list above. */
export const fallbackCaptions: string[] = [
  'A memory worth framing 🖼️',
  'Caught being adorable 📸',
  'Exhibit A: great vibes',
  'Smile level: museum quality ✨',
  'This one gets its own spotlight 💡',
  'Pure main character energy 🎬',
  'Priceless. Not for sale 😌',
  'Collected on a very good day ☀️',
  'The curator is proud of this one',
  'Cute alert 🚨',
  'A masterpiece, no filter needed',
  'Certified good mood 🌈',
  'Frame-worthy, obviously',
  'Another one for the collection 🥹',
  'You, being you. Perfect.',
  'Handle with care: contains happiness 💛',
]

export const fallbackGuideLines: string[] = [
  'Ooh, good one!',
  'I love this one 🥹',
  'Look at that smile 😄',
  'Museum-quality, honestly.',
  'Okay, this one is staying on the wall.',
]

export function captionFor(name: string, index: number): Caption {
  const hit = captions[name]
  if (hit) return hit
  return {
    caption: fallbackCaptions[index % fallbackCaptions.length],
    guideLine: fallbackGuideLines[index % fallbackGuideLines.length],
  }
}
