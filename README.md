# Sudha's Museum 🎂

A small, cute 3D museum you walk through **one room at a time**, made as a 23rd-birthday gift (26 Nov 2026) for Sudha, from Karthik.
Friendship-flavoured, a little funny, entirely in the browser: **no backend, no database, no API keys, no external requests at runtime.**

Sudha walks the journey with a little avatar of Karthik as her guide. Each room has its own look and one small thing to do. When she finishes it, the room's door glows and opens, the screen fades, a chapter card appears, and the next room loads. She never sees all the photos at once.

---

## The journey 🗺️

| # | Room | What she does | The door opens when… |
|---|------|---------------|----------------------|
| 1 | **The Ticket Gate** (lobby) | A gift box pops open, Karthik says hi, she takes her ticket from the desk ("ADMIT ONE · SUDHA · SEAT: FOREVER"). | she has taken the ticket |
| 2 | **Memory Lane** (1 to 3 halls, one per chapter) | Frames stay dark until she walks close; then the spotlight eases on and the photo fades in. She can zoom into each one. A bench to sit together. | she has seen **70 % of that hall's photos (at least 3)** |
| 3 | **The Movie of Us** (cinema) | They sit together and press **Play**: a slideshow with soft crossfades and subtitle captions. **Skip** appears after 10 s. | the movie has finished (or was skipped) |
| 4 | **The Lounge** | The big wall screen asks "Will you give me a treat? 😏" and "Forever friends? 🥹" (Yes grows, No shrinks). An optional **Friendship Quiz** arcade in the corner. | both screen questions are answered |
| 5 | **The Post Office** | Three "Open when…" envelopes, then the big wax-sealed envelope with the main letter. | the main letter has been read **and every hidden star ⭐ has been found** |
| 6 | **The Rooftop** (finale) | Night sky and fairy lights. Wish tree, cake and candles, fireworks, balloons, a dance, a friendly hug, "Happy 23rd Birthday, Sudha! 🎉", and a thank-you card. | (the end) |

**Hidden stars ⭐:** every room before the rooftop hides one star (behind the plant, under a bench, under a back-row seat, in a plant pot, in a pigeonhole…). She picks one up just by walking next to it. The HUD shows `⭐ 3/7`.
- After 60 seconds in a room, a soft sparkle trail appears around the star.
- The 💡 button in the top bar makes Karthik give a hint and shows a light beam over the star.
- If a star is missing, the Post Office door stays locked and Karthik names the room(s) ("I think a star is still hiding in the Cinema 👀"). The map marks those rooms with ⭐, and she can travel back to any visited room.

**Map:** the 🗺️ chip (top left) lists every room. Locked rooms show a 🔒; visited rooms can be tapped to fast-travel there. Completed rooms stay completed.

**Saved progress:** progress is kept in the browser (`localStorage`, key `sudha-museum-v2`). When she comes back, the start screen offers **"Continue my journey"** and a small **"Start over"** link. "Start over" (and "Replay the journey" at the end) clears everything, including which photos she has seen. If the browser blocks storage, everything still works, it is just not remembered after a reload.

**After the finale:** "Wander the museum" unlocks the whole map for free roaming.

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

### Testing shortcut (`?dev=1`)

Open the page with **`?dev=1`** (for example `http://localhost:5173/?dev=1`) to get a small "dev" panel on the left edge: jump to any room, "unlock everything", and see the GPU texture/geometry counts. `?dev=1&room=cinema` jumps straight into a room after the start button. Without the parameter, the panel does not exist. (`?debug` only exposes the store on `window.__museum`, for automated tests.)

---

## Photos 📷

1. Put your photos in **`public/images/`**.
2. Use **JPG, PNG or WebP**. **Not HEIC** (iPhone photos): convert them to JPG first. Unsupported files are skipped and a warning is printed.
3. Recommended: **≤ 1600 px on the long edge and ≤ 400 KB each**. The app shrinks them anyway, but small files keep the repository and the page light.
4. Any number works. With **no** photos, 12 pastel placeholder frames ("Add a photo 📷") are used and every room still works.

The list of photos is made automatically (`scripts/generate-photos.mjs` runs before `dev`, `build` and `typecheck`), so you never edit a list by hand.

> **Don't** add `public/images` to `.gitignore`. Vercel only builds what is in the repository.

### Which photo goes in which room → `src/config/journey.ts`

- **`chapters`**: the Memory Lane halls. Each chapter has a title, a subtitle and a list of file names. I looked at every photo and grouped the best two thirds into three chapters: *The Funny Ones*, *Out & About* and *Main Character Energy*. Move file names between chapters, rename the chapters, or delete a chapter.
- **`cinemaOrder`**: photos that only appear in the cinema movie, shown first. After them, the movie quickly recaps every hall photo, so every photo appears in the movie.
- **Number of halls** = `ceil(hall photos / 5)`, between 1 and 3. If your chapters match that number, they are used as they are; otherwise the hall photos are split evenly.
- **It heals itself:** a photo in `public/images` that isn't mentioned anywhere is added to the last hall (up to 6 photos there), then to the cinema. A name in `journey.ts` whose file no longer exists is ignored. If none of the names match (for example you replaced every photo), the photos are split automatically: about two thirds into halls with friendly default titles, the rest into the cinema.

### Captions ✏️

Open **`src/config/captions.ts`**. Each photo has a caption (and optionally a line Karthik says the first time she looks at it), keyed by the **exact file name** (same spelling and upper/lower case). The caption also appears as a subtitle in the cinema. A photo without an entry gets a friendly fallback caption.

## Music 🎵

Drop an MP3 at **`public/audio/birthday.mp3`**. It loops quietly and fades in after the first tap, and is turned down while the movie plays. If that file isn't there, `public/audio/bgm.mp3` is tried next (names listed in `musicFile` / `musicFallbacks` in `src/config/content.ts`). If neither plays, the museum is simply silent and the mute button is hidden. Only use music you have the right to use.

## Edit the words ✏️ → `src/config/content.ts`

Everything she reads lives there:

- names, birthday, age (a constant: she turns **23** on 26 Nov 2026)
- `roomIntros` (what Karthik says on entering each room), `doorLines` (locked-door messages), `guideChatter`, `benchLines`
- `ticket`: the text on the museum ticket
- `cinema`: the movie title cards and Karthik's whispers
- `quiz`: the two wall-screen questions and every "No" gag
- `arcade`: the Friendship Quiz (3 questions; every answer is "right")
- **`openWhen`**: the three "Open when…" notes. They are placeholders, marked `TODO(Karthik)`.
- **`letter`**: the main letter. A placeholder, marked `TODO(Karthik)`. Replace it with your own.
- `wishTree`, `closing` (the thank-you card), `finale`
- avatar colours and the palette (`colors`)

Star hint lines are in `starHints` in `src/config/journey.ts`.

---

## Deploy to Vercel (via GitHub) 🚀

1. Push this folder to a **new GitHub repository** (commit `package-lock.json`, `public/images`, `public/audio` and `src/generated/photos.json`; they are not ignored).
2. Go to <https://vercel.com> → **Add New… → Project** → import the repository.
3. Vercel detects **Vite** automatically (`vercel.json` also sets the build command and the `dist` folder). Click **Deploy**.
4. Open the link on a phone and on a laptop, then send it to Sudha.

To update later: change files, commit, push. Vercel redeploys on its own.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Blank screen / "the 3D museum can't be shown" | The browser or device doesn't support **WebGL**. Try another browser or turn on hardware acceleration. A 2D fallback with the letter is shown instead. |
| A room shows "This room had a little hiccup" | Something in that room failed. Use **Skip to the next room** or **Back to the lobby**; the rest of the museum keeps working. |
| Stuck at a locked door | Walk up to the door: Karthik says exactly what is missing. Use 💡 for a star hint, or the 🗺️ map to go back to a room with a ⭐ marker. |
| A photo is missing | File type (JPG/PNG/WebP, **not HEIC**), the file is really in `public/images`, then re-run `npm run dev` / `npm run build`. A photo that fails to load becomes a placeholder frame. |
| Caption is the generic one | The key in `captions.ts` must match the file name exactly (including case). |
| No music | The file must be `public/audio/birthday.mp3` (or `bgm.mp3`). Phones only allow sound after a tap (the start button does that). |
| Microphone blowing doesn't work | It's optional. Permission denied or no microphone: use the **Hold to blow** button. |
| Works locally, not on Vercel | Case-sensitive file names (Linux). Make sure names in `captions.ts` / `journey.ts` match exactly. |
| Want to see it fresh again | Tap **Start over** on the start screen. |

---

## Decisions (where the brief was silent)

- **Stack** is exactly the pinned one: Vite 5, React 18, TypeScript 5.6, three 0.169, @react-three/fiber 8.18, @react-three/drei 9.122, zustand 4. No new dependencies; no ESLint, Prettier or test tooling.
- **No external assets:** fonts come from `@fontsource`; lights are plain lights (no HDRs); avatars, rooms, cake, mascot, skyline and every texture are generated in code. Drei is used only for `<Html>` name tags and bubbles.
- **Only the current room is mounted.** Leaving a room unmounts it, and every geometry, material and canvas texture it created is disposed. Photo textures are loaded on demand: the current room's photos plus the next room's (preloaded in the background). Cycling through every room three times kept the GPU at a steady maximum of 24 textures and 113 geometries (cycles 2 and 3 identical).
- **Dollhouse camera:** the south wall and the ceiling are never drawn, so the camera can look in from above. Each room has its own camera preset.
- **Lights:** at most 3 real lights per room (hemisphere + directional, plus one warm point light in the lobby, cinema, post office and at the cake). No shadow maps; soft blob shadows.
- **Photo assignment:** I looked at all 24 photos and picked 16 for three themed halls (6 + 5 + 5); the other 8 open the cinema movie. With 3 photos there is 1 hall; with 15 there are 2 halls of 5.
- **"Seen" photos:** a photo counts as seen when she opens it, or after standing in front of it for 1.5 s.
- **Star rule** is enforced at the Post Office → Rooftop door (the only door into the finale), as the brief asked. Earlier doors don't need stars.
- **Rooftop arrival:** there is no forward door there; the stair-kiosk door she came through swings shut behind her instead.
- **Map:** fast travel only to rooms she has already visited. After the finale, "Wander the museum" marks every room as visited.
- **Gift box** in the lobby opens on its own a moment after she arrives (no tap needed), so the "Sudha's Museum" sign appears right away.
- **Friendship Quiz** questions are generic and playful (no private facts); finishing it adds "Quiz champion 🏆" to the closing card.
- **Wish tree:** a wish is up to 40 characters; it adds a glowing lantern on the tree for this visit only. It is never saved or sent.
- **3D rendering pauses** while a full-screen card (ticket, notes, letter, arcade, wish) covers the scene, to save battery on phones.
- **Previous version:** the single-hall version is kept as the git tag `v1-single-hall`.
