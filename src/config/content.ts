// ════════════════════════════════════════════════════════════════════════════
//  EDIT ME  ✏️  — every word you see in the museum lives in this file
//  (plus photo captions in captions.ts). Change text freely; keep the quotes.
// ════════════════════════════════════════════════════════════════════════════

export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

const turningAge = 23 // fixed on purpose: she turns 23 on 26 Nov 2026

export interface QuizQuestion {
  question: string
  yes: string
  no: string
  /** Shown one by one each time she goes for the "No" button. */
  gags: string[]
  /** Shown after she finally picks Yes. */
  done: string
}

export const content = {
  recipientName: 'Sudha',
  senderName: 'Karthik',
  birthday: { day: 26, month: 'November', year: 2026 },
  turningAge,

  museumTitle: "Sudha's Museum",
  subtitleFrom: 'Karthik',
  subtitleTo: 'Sudha',
  loadingLabel: 'Preparing the collection',
  startButton: 'Tap to open your gift 🎁',

  introBubbles: ['Happy Birthday, Sudha! 🎉', 'I built you a whole museum 🥹'],

  hints: {
    desktop: [
      'Walk with W A S D or the arrow keys',
      'Or just click the floor to walk there',
      'Click a photo to take a closer look',
    ],
    mobile: ['Drag the joystick to walk', 'Or tap the floor to walk there', 'Tap a photo to take a closer look'],
    gotIt: 'Got it',
    skipIntro: 'Skip',
  },

  actions: {
    photo: 'View photo',
    bench: 'Sit together',
    screen: 'Open the screen',
    cake: 'Make a wish 🎂',
    standUp: 'Stand up',
    back: 'Back',
    next: 'Next',
    prev: 'Previous',
  },

  /** Lines Karthik's avatar says now and then while you walk around. */
  guideChatter: [
    'Careful, some of these are embarrassing 😂',
    'I swear I curated this myself 😌',
    'Best museum in Whitefield. Fight me.',
    'Please do not touch the exhibits. Except the cake. Later.',
    'Entry is free. Compliments are mandatory 😎',
    'The lighting alone cost me three coffees ☕',
    'Yes, I know this hall is too long. It is called ambition.',
    'Take your time. The museum is not going anywhere 🐢',
    'Fun fact: nobody has ever left this museum unfriended.',
    'I would give you a guided tour but I only know three facts.',
    'Stay hydrated. Art is thirsty work 💧',
    'Plot twist: you are the main exhibit ✨',
  ],

  /** Lines Karthik says when you sit on a bench together. */
  benchLines: [
    'Ahh, finally a sit. My legs have been walking since 2026 😮‍💨',
    'Best seats in the house, right?',
    'We should do this in real life too 🪑',
    'Pretend we are very serious art critics 🧐',
    'Okay but this bench is actually comfy.',
  ],

  /** Tiny reactions Sudha's avatar might make. */
  sudhaLines: ['Okay, this is cute 🥹', 'Wait, I remember this one 😂', 'Karthik… you did all this? 🥺'],

  hudChip: "Sudha's Museum",
  memories: 'Memories',

  quiz: {
    intro: {
      title: "Happy Birthday, Sudha! 🎂",
      typed: 'I made you a whole museum 🥹',
      next: 'Next',
    },
    treat: {
      question: 'Will you give me a treat? 😏',
      yes: 'Yes',
      no: 'No',
      gags: [
        'hey… the other button 👀',
        'i made you a whole museum 🥹',
        "okay now you're doing it on purpose 😭",
        'No is basically decoration at this point',
        'the Yes button is getting bigger, just saying',
      ],
      done: 'Treat confirmed! 🎉🍰',
    } satisfies QuizQuestion,
    friends: {
      question: 'Forever friends? 🥹',
      yes: 'Yes',
      no: 'No',
      gags: [
        'this is not a real option 😌',
        'the yes is getting bigger 😭',
        'you are fighting a losing battle, my friend',
        'No has left the chat 🚪',
        'just press the big one, it is right there 🥺',
      ],
      done: 'Forever friends, it is. 🤝💖',
    } satisfies QuizQuestion,
    next: 'Next',
    close: 'Close',
    /** Text shown on the wall screen once the quiz is finished. */
    screenDone: 'Forever friends 🤝💖',
    screenHello: 'Happy Birthday Sudha! 🎂',
    screenTap: 'tap to open',
    afterQuiz: ['Forever friends, officially 🤝 The door is open now 🚪'],
  },

  finale: {
    wishPrompt: 'Close your eyes, make a wish… then blow! 🌬️',
    holdToBlow: 'Hold to blow',
    useMic: 'Use my microphone',
    micOn: 'Listening… blow gently at your device 🎤',
    micFail: 'No microphone? No problem, just use the button 😊',
    banner: 'Happy {ordinal} Birthday, {name}! 🎉',
    readLetter: 'Read my letter 💌',
    keepExploring: 'Keep exploring',
    postCelebration: ['Best birthday museum ever? Probably 😌', 'Go look at the photos again, the captions are good.'],
    hugLine: 'Happy birthday, my friend 🤗',
  },

  // TODO(Karthik): replace this with your own letter. Each string is one paragraph.
  letter: {
    heading: 'To Sudha',
    paragraphs: [
      'Happy 23rd birthday, Sudha! 🎂',
      'I wanted to give you something more than a message, so I built you a tiny museum. A museum, because some people and some memories deserve to be put on a wall, under a nice light, with a little plaque. You are one of those people.',
      'Thank you for being such a good friend. For the random chats, the awful jokes you pretend not to laugh at, and for the way you make ordinary days feel a bit lighter. I do not say it enough, so here it is on a screen: I am really glad you are in my life.',
      'I hope this year brings you calm mornings, big wins, good food, and trips where the photos come out perfect on the first try. And whenever things get heavy, remember that you have a friend who will always show up, even if only as a slightly overdressed cartoon in a museum.',
      'Now go eat some cake. And yes, you still owe me that treat 😏',
    ],
    signOff: '— Karthik',
    close: 'Close',
    replay: 'Replay museum',
  },

  /* ─────────────────────────── the journey (rooms) ─────────────────────────── */
  journey: {
    continueJourney: 'Continue my journey',
    startOver: 'Start over',
    map: 'Map',
    mapTitle: 'Your journey',
    hint: 'Hint',
    memories: 'Memories',
    doorOpen: 'Open door →',
    doorLocked: 'Locked 🔒',
    starFound: 'You found a star! ⭐',
    allStars: 'All the stars! You really looked everywhere 🌟',
  },

  roomNames: {
    lobby: 'The Ticket Gate',
    hall: 'Memory Lane',
    cinema: 'The Movie of Us',
    lounge: 'The Lounge',
    'post-office': 'The Post Office',
    rooftop: 'The Rooftop',
  },

  /** What Karthik says the first time she walks into each room. */
  roomIntros: {
    lobby: ['Welcome to the museum! First things first: your ticket 🎟️'],
    hall: ['Chapter time! Walk slowly, the lights follow you ✨'],
    cinema: ['Grab a seat, the movie is about to start 🍿'],
    lounge: ['The lounge! The big screen has a question for you 📺'],
    'post-office': ['Some mail arrived for you 💌'],
    rooftop: ['You made it 🥹'],
  },

  /** Lines for doors. {n} = photos still to see, {rooms} = rooms with a hidden star. */
  doorLines: {
    lobby: 'Grab your ticket at the desk first 🎟️',
    hall: 'See a few more memories first 👀 ({n} to go)',
    cinema: 'The movie first! Then the door 🍿',
    lounge: 'The big screen has two questions for you 📺',
    'post-office': 'Read the big sealed letter first 💌',
    stars: 'Hmm… I think a star is still hiding in {rooms} 👀',
    unlocked: "Door's open when you're ready 🚪",
  },

  ticket: {
    action: 'Take your ticket 🎟️',
    again: 'See your ticket 🎟️',
    admit: 'ADMIT ONE',
    museum: "Sudha's Museum",
    gate: 'GATE 23',
    seat: 'SEAT: FOREVER',
    note: 'Valid for one (1) birthday. Non-refundable. Friendship included.',
    close: 'Keep it 💛',
  },

  cinema: {
    sit: 'Sit together 🍿',
    play: 'Play ▶',
    skip: 'Skip ⏭',
    standUp: 'Stand up',
    titleStart: 'The Movie of Us',
    titleEnd: 'The End… or is it? 🎬',
    whispers: ['this one 😂', 'okay this is a classic', 'look at that 🥹', 'director’s cut, obviously', 'iconic.'],
    afterLine: 'Best movie ever made. Door’s open 🚪',
  },

  arcade: {
    action: 'Play the Friendship Quiz 🕹️',
    title: 'Friendship Quiz',
    intro: 'Three questions about Karthik. No pressure. (There is no wrong answer. Literally.)',
    start: 'Start',
    next: 'Next',
    close: 'Close',
    result: 'Friendship level: 100% 🏆',
    resultSub: 'Certified best friend. The arcade has spoken.',
    questions: [
      {
        q: "What is Karthik's most-used emoji?",
        options: [
          { text: '😂', reply: 'Correct. He laughs at his own jokes first.' },
          { text: '🥹', reply: 'Also correct. He is a softie, apparently.' },
          { text: '😌', reply: 'Yes. Peak "I planned this" energy.' },
        ],
      },
      {
        q: 'If Karthik were a snack, he would be…',
        options: [
          { text: 'Popcorn 🍿', reply: 'Light, a bit noisy, great at the movies. Accurate.' },
          { text: 'Chocolate 🍫', reply: 'Sweet. Melts under pressure. Very accurate.' },
          { text: 'Samosa 🥟', reply: 'Crunchy outside, soft inside. Wow, you know him.' },
        ],
      },
      {
        q: 'What does Karthik do when he is late?',
        options: [
          { text: '"5 more minutes" 🏃', reply: 'It was never 5 minutes. You know it.' },
          { text: 'Brings a peace offering 🍰', reply: 'Smart guess. Cake fixes everything.' },
          { text: 'Builds a museum 🏛️', reply: 'Okay, this one is suspiciously specific 😂' },
        ],
      },
    ],
    champion: 'Quiz champion 🏆',
  },

  // TODO(Karthik): replace these three little notes with your own words.
  openWhen: [
    {
      label: "Open when you're sad 🌧️",
      title: 'For a grey day',
      body: "Hey you. If today is heavy, that's okay. You don't have to fix everything right now. Drink some water, eat something nice, and text me something random. I'll reply with something even more random. Rain always stops. You always come back stronger.",
    },
    {
      label: 'Open when you need a laugh 😂',
      title: 'Emergency laugh kit',
      body: 'Imagine me trying to dance at your birthday. Now imagine me trying to dance AND hold cake. Now imagine the cake winning. That is the energy I bring to this friendship. You are welcome. Also: the parrot photo. Go look at it again.',
    },
    {
      label: 'Open when you doubt yourself 💪',
      title: 'A tiny reminder',
      body: "You are smarter, kinder and braver than that little voice says. I've watched you figure out hard things again and again. The people who know you think you're amazing, and we have evidence. Exhibit A: this entire museum.",
    },
  ],

  sealed: {
    action: 'Open the big envelope 💌',
    locked: 'Read the three little envelopes first 😌',
    seal: 'Happy Birthday',
    tapToBreak: 'Tap the seal to open',
  },
  notes: {
    open: 'Open',
    close: 'Close',
  },

  wishTree: {
    action: 'Make a wish on the tree 🏮',
    title: 'The Wish Tree',
    prompt: 'Write a little wish (or leave it secret) and hang it on the tree.',
    placeholder: 'My wish is…',
    hang: 'Hang it 🏮',
    cancel: 'Not now',
    private: 'Nothing is saved or sent anywhere. It only glows here, tonight.',
    thanks: 'Hung on the tree ✨',
  },

  closing: {
    title: 'Thanks for visiting, Sudha 💛',
    sign: '— Karthik',
    recap: '⭐ {stars}/{total} stars found · {photos} memories seen',
    wander: 'Wander the museum',
    replay: 'Replay the journey',
  },

  fallback: {
    title: 'Happy Birthday, Sudha! 🎂',
    text: 'The 3D museum had a hiccup. Tap to retry.',
    retry: 'Tap to retry',
  },

  colors: {
    // avatars
    sudha: {
      skin: '#f2c19e',
      hair: '#3b2518',
      top: '#ffffff',
      cardigan: '#f7c6d4',
      bottom: '#6f93c4',
      shoes: '#ffffff',
    },
    karthik: {
      skin: '#e8b48c',
      hair: '#1f1a18',
      top: '#ffffff',
      vest: '#8a8d4a',
      bottom: '#c9a77a',
      shoes: '#6b4a32',
    },
    // pastel accents
    blush: '#f7c6d4',
    lavender: '#d9ccf2',
    butter: '#fbe7a6',
    coral: '#ff7f8e',
    charcoal: '#26262b',
    cream: '#fbf3e4',
  },

  /** Optional background music. The first file that exists and plays is used; none is fine too. */
  musicFile: '/audio/birthday.mp3',
  musicFallbacks: ['/audio/bgm.mp3'],
}

export function formatBanner(): string {
  return content.finale.banner
    .replace('{ordinal}', ordinal(content.turningAge))
    .replace('{name}', content.recipientName)
}
