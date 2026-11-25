# Sudha's Museum 🎂

A small, cute, walkable 3D museum, made as a 23rd-birthday gift (26 Nov 2026) for Sudha, from Karthik.
Friendship-flavoured, a little funny, entirely in the browser: **no backend, no database, no API keys, no external requests at runtime.**

What happens when she opens it:

1. A dark "Preparing the collection" loading screen, then a *Tap to open your gift* button (this tap also starts the music).
2. A short intro where Karthik's avatar waves and says hi.
3. She walks around a white gallery (keyboard, click-to-walk, or an on-screen joystick on phones). Walk up to a framed photo and the camera pushes in to show it with a caption. Karthik follows her around and chats.
4. Two benches: sit down together.
5. The big wall screen asks a couple of silly questions (the **Yes** button keeps growing, **No** keeps shrinking).
6. When that's done a birthday cake appears. She makes a wish and blows the candles out (hold the button, or use the microphone).
7. Confetti, balloons, a happy dance and a friendly hug, then a letter from Karthik.

---

## Quick start (local)

You need [Node.js](https://nodejs.org) 18.18 or newer.

```bash
npm install        # once
npm run dev        # starts the dev server, open the printed address
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # TypeScript check
```

---

## Add or change photos 📷

1. Put your photos in **`public/images/`**.
2. Use **JPG, PNG or WebP**. **Not HEIC** (iPhone photos): convert them to JPG first. Unsupported files are skipped and a warning is printed.
3. Rename them `01-beach.jpg`, `02-cake.jpg`, `03-…` to control the order. Photos are shown in natural file-name order (`2-…` comes before `10-…`).
4. Recommended: **≤ 1600 px on the long edge and ≤ 400 KB each**. The app shrinks them for the screen anyway, but small files keep the repository and the page light.
5. Any number from 0 to 24 works. With **no** photos, 12 pretty placeholder frames ("Add a photo 📷") are shown instead, so nothing breaks.

The list of photos is created automatically (`scripts/generate-photos.mjs` runs before `dev`, `build` and `typecheck`), so you never edit a list by hand.

Where they hang: the first two photos go on the dark wall near the entrance, the rest alternate between the left and right walls (the hall automatically gets longer for more photos).

> **Don't** add `public/images` to `.gitignore`. Vercel only builds what is in the repository.

### Captions ✏️

Open **`src/config/captions.ts`**. Each photo has a caption (and optionally a line Karthik says when she first arrives at the photo), keyed by the **exact file name** (same spelling and upper/lower case). If you rename a photo, rename its key too. A photo without an entry gets a friendly fallback caption, so nothing is ever blank.

## Add music 🎵

Drop an MP3 at **`public/audio/birthday.mp3`**. It loops quietly and fades in after the first tap. If that file isn't there, `public/audio/bgm.mp3` is tried next (the names are listed in `musicFile` / `musicFallbacks` in `src/config/content.ts`). If neither plays, the museum is simply silent and the mute button is hidden. Only use music you have the right to use.

## Edit the words ✏️

Everything she reads lives in **`src/config/content.ts`**:

- names, birthday, age (the age is a constant: she turns **23** on 26 Nov 2026)
- the lines Karthik says while walking (`guideChatter`), on the bench (`benchLines`)
- the quiz on the wall screen (questions and every "No" gag)
- the finale text and the **letter** (`letter.paragraphs`). **The letter is a placeholder, replace it with your own** (look for `TODO(Karthik)`).
- avatar colours and the pastel palette (`colors`)

---

## Deploy to Vercel (via GitHub) 🚀

1. Push this folder to a **new GitHub repository** (commit `package-lock.json`, `public/images`, and `src/generated/photos.json`; they are not ignored).
2. Go to <https://vercel.com> → **Add New… → Project** → import the repository.
3. Vercel detects **Vite** automatically (the included `vercel.json` also sets the build command and the `dist` output folder). Click **Deploy**.
4. Open the link on a phone and on a laptop, and send it to Sudha.

To update later: change files, commit, push. Vercel redeploys on its own.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Blank screen / "the 3D museum can't be shown" | The browser or device doesn't support **WebGL**. Try another browser, or turn on hardware acceleration. A 2D fallback with the letter is shown instead. |
| A photo is missing | File type (JPG/PNG/WebP, **not HEIC**), the file is really inside `public/images`, and then re-run `npm run dev` / `npm run build`. A photo that fails to load turns into a placeholder frame. |
| Caption is the generic one | The key in `captions.ts` must match the file name exactly (including case). |
| No music | The file must be exactly `public/audio/birthday.mp3`. Phones only allow sound after a tap (the start button does that). |
| Microphone blowing doesn't work | It's optional. Permission denied or no microphone: use the **Hold to blow** button. |
| Works locally, not on Vercel | Case-sensitive file names (Linux). Make sure photo names in `captions.ts` match exactly. |

---

## Notes on decisions (where the brief was silent)

- **Stack** is exactly the pinned one: Vite 5, React 18, TypeScript 5.6, three 0.169, @react-three/fiber 8.18, @react-three/drei 9.122, zustand 4. No ESLint, Prettier, or test tooling.
- **No external assets at all:** fonts come from `@fontsource` packages; lights are plain lights (no HDRs); avatars, cake, mascot and every texture are generated in code. Drei is used only for `<Html>` labels.
- **No shadow maps:** fake blob shadows. Three real lights at most (hemisphere, one weak directional, one warm point light at the cake).
- **Photos on the walls:** the first two photos go on the dark feature wall; the rest alternate left / right (left gets the extra one when the count is odd). The hall grows with the photo count. On phones, photos are downscaled to 1024 px (800 px when there are more than 16) to stay inside iOS memory limits; on desktop 1280 px.
- **Name tags and bubbles** use drei `<Html>` but with a small clamped scale based on camera distance (instead of `distanceFactor`) so they stay readable when the camera moves in close.
- **Photo view** keeps the camera level and ~3.4 to 9 units from the wall (computed from the photo's size and the screen shape), so the whole photo and the caption card fit on phones too. The camera is closer than "2.4 units" because a 2.4-unit-tall frame cannot fit the screen from only 2.4 units away.
- **Prev / Next** while viewing a photo hops between photos; if the next photo is across the hall the two avatars are placed there directly rather than walking the whole way.
- **Cake** is only locked behind the wall-screen quiz; photos are optional.
- **Replay** (in the letter) resets the seen photos, the quiz, and the cake.
- The page has a tiny developer aid: opening it with `?debug` exposes the world/store on `window.__museum` (used for automated testing, harmless otherwise).
