# Lupo Solitario — a PWA reader for Lone Wolf gamebooks

An **offline-first PWA** to read and *play* the **Lone Wolf** gamebooks
(the EPUBs freely published by [Project Aon](https://www.projectaon.org)) on your
phone: EPUB reader plus Action Chart, inventory, random number generator, combat
helper, bookmarks and a war log. Designed mobile-first for iPhone, installable
on the home screen, fully functional with no network.

> **Unofficial fan project** — not affiliated with, or endorsed by, the estate of
> Joe Dever or Project Aon. See [Legal](#legal--lone-wolf-and-project-aon) below.

## ▶️ Try it online

**The app is live at [lw.ingalbertoplebani.it](https://lw.ingalbertoplebani.it)** —
this is the quickest way to try it: no local setup or deploy needed. It is
mobile friendly and **installable as a PWA** (on iPhone: Safari → Share →
*Add to Home Screen*; on Android: *Install app*). Once opened, it keeps working
fully **offline**.

> ⚠️ **You need the gamebooks in EPUB format.** The app is only a reader/companion
> and ships with **no book content**: to play you must load the *Lone Wolf*
> gamebooks as `.epub` files. The English editions can be downloaded **for free
> and legally** from [Project Aon](https://www.projectaon.org). Download the
> EPUB to your device, then load it from the app's library.

- **Language:** this fork (*Kai-Chronik*) has a German-only interface. The
  i18n structure (`src/i18n/`) is kept, so languages can be added back later.
- **Section navigation** works with Project Aon EPUBs (one `sectN` file per
  section) and with EPUBs that keep many numbered sections in one file, such as
  the German *Einsamer Wolf* edition: sections are found by their number-only
  headings and `sectN`/`levN` anchors.
- **One section per page:** in EPUBs with many sections per file only the
  current section is shown (a section split across two files is joined), and
  ‹ / › step to the previous/next section number.
- **Buttons in the text:** enemy stat lines get a "⚔️ Fight" button that opens
  the combat helper pre-filled; "lose/regain N Endurance" gets a one-tap button;
  "pick a number" opens the number generator. Nothing is applied without a tap.
- **Pickers:** Kai Disciplines (and the Weaponskill weapon) are chosen with a tap
  in the Action Chart; standard weapons can be added with a tap in the Backpack.
- **Built-in help:** the ❓ *Guide* button in the library explains every
  feature (reader, Action Chart, combat helper, backups…).

Stack: **Vite + React + TypeScript**, **Tailwind v4**, **react-reader (EpubView)**,
**Dexie** (IndexedDB), **Zustand**, **vite-plugin-pwa** (Workbox).

| Library | Reader | Combat helper |
| --- | --- | --- |
| ![Library](screenshots/library.png) | ![Reader](screenshots/reader.png) | ![Combat helper](screenshots/combat.png) |

| Action Chart | Backpack |
| --- | --- |
| ![Action Chart](screenshots/action-chart.png) | ![Backpack](screenshots/backpack.png) |

---

## Design principle: the player is the referee

With the paper gamebook the player was the only referee: you could flee a fight,
ignore an unlucky result, or fix your points by hand. This app **assists, it does
not enforce**. Everything automated is a **suggestion you can override**: every
value (Endurance, Combat Skill, gold, inventory, combat values) is always
editable by hand, even mid-combat. No automatic game over, no flow that traps
you. Combat works on a **copy** of your values; the Action Chart is updated
**only** when you tap *"Update endurance in the chart"*.

---

## Commands

```bash
npm install         # install dependencies
npm run dev         # development (http://localhost:4200) — the service worker is NOT active here
npm run build       # production build (also generates the service worker)
npm run preview     # serve the production build at http://localhost:4200
```

### Testing offline mode

The service worker only registers in a **secure context** (HTTPS or `localhost`)
and only in the **production build**:

```bash
npm run build && npm run preview
```

Open `http://localhost:4200`, load an EPUB, navigate a bit, then in
DevTools → **Network → Offline** (or turn off the network) and **reload**: the
app comes back up and works, EPUB and saves included (they live in IndexedDB;
the app shell is in Cache Storage).

---

## Testing on a real iPhone

The service worker requires **HTTPS** (or `localhost`). From an iPhone you have
two options:

1. **HTTPS tunnel** to your dev machine, e.g.:
   ```bash
   npm run build && npm run preview   # then expose port 4200 through an HTTPS tunnel
   ```
   (ngrok, cloudflared, etc. — the point is serving the build over HTTPS.)
2. **Deploy to a static HTTPS host** (Netlify, Vercel, GitHub Pages, …):
   publish the contents of `dist/`. A `Dockerfile` (nginx, PWA-aware cache
   headers) is also included for self-hosting.

### GitHub Pages (automatic)

The workflow `.github/workflows/deploy-pages.yml` builds the app and publishes
it on every push to `main` (it can also be started by hand from the Actions
tab). One-time setup: **Settings → Pages → Source: GitHub Actions**. The app is
then served at `https://<owner>.github.io/<repo>/`.

Builds for a sub-path set `BASE_PATH` (the workflow does this for you):

```bash
BASE_PATH=/lone-wolf/ npm run build
```

Without `BASE_PATH` the app is built for the site root (`/`), as before.

### Add to Home Screen (install the PWA)

On iPhone, in **Safari**: open the site → **Share** → **Add to Home Screen**.
Launch the app from its icon: it runs **standalone** (full screen, with
safe-area support for the notch/Dynamic Island/home indicator). Do the **final
check on a real iPhone**: the quirks of `dvh`, safe areas and the reader iframe
only show up there. Test both in Safari and as an installed PWA, in portrait
(priority) and landscape.

---

## Game data

- **Combat Results Table (CRT)** — `src/data/crt.ts` contains the table values
  transcribed from the official Lone Wolf CRT as published by
  [Project Aon](https://www.projectaon.org). They are used only to *propose*
  round losses; the player can always correct or ignore them.
- **Kai Disciplines** — `src/data/disciplines.ts` (the 10 disciplines of Book 1).
- **No book content is bundled.** The app ships no text, illustrations or maps
  from the gamebooks: you download the EPUBs yourself from Project Aon and load
  them from your device.

---

## Technical note: EPUB as ArrayBuffer (not a blob URL)

The loaded EPUB is stored as a **Blob** in Dexie. To feed it to the reader we
read the blob and pass it to `EpubView` as an **`ArrayBuffer`**, NOT as
`URL.createObjectURL`. Reason: epub.js infers the input type from the **URL
extension**, and a blob URL (`blob:…/uuid`) has none → it would be treated as a
*directory* and the book would never load. With an ArrayBuffer epub.js
recognises the archive and unzips it (JSZip), staying 100% offline. See
`src/hooks/useBookUrl.ts`. (`URL.createObjectURL` + `revokeObjectURL` is still
used for the JSON export download, where it belongs — `src/utils/saveExport.ts`.)

---

## Structure

```
src/
  db.ts                 # Dexie schema (books, playthroughs, pendingBookmarks) + defaults
  store.ts              # global state (Zustand) + persistence to Dexie
  data/crt.ts           # Combat Results Table (values from Project Aon)
  data/disciplines.ts   # Kai Disciplines
  i18n/                 # UI dictionary (German)
  components/
    Library.tsx         # library + EPUB loading + copy character between books
    Reader.tsx          # EpubView wrapper, MEMOIZED (stable iframe)
    Header.tsx          # top bar + bottom action bar (thumb zone)
    Sheet.tsx           # reusable full-screen sheet (mobile-first, safe-area)
    ui.tsx              # Stepper / TextField / EditableList
    panels/             # NumberGenerator, ActionChart, Inventory, WarLog, Combat, GoToSection, Settings, Instructions
  hooks/
    useBookUrl.ts       # Dexie blob -> ArrayBuffer (see note above)
    usePersistence.ts   # navigator.storage.persist() + indicator
  utils/
    combat.ts           # pure combat logic (proposals, history)
    sections.ts         # section->href index + link interception
    saveExport.ts       # JSON export/import of saves (incl. bookmarks & notes)
    readerControl.ts    # non-reactive bridge for "go to section"
  App.tsx, main.tsx, index.css
```

---

## Mobile-first (iPhone)

- Full-screen containers use `100dvh` (never `100vh`: it jumps with the Safari bar).
- `viewport-fit=cover` + `env(safe-area-inset-*)` on the header and bars.
- Touch targets ≥ 44px, inputs at `font-size: 16px` (no iOS zoom on focus),
  `inputMode="numeric"` for numeric fields.
- Panels are **full-screen sheets**, dismissable with a large button or `Esc`.
- `navigator.storage.persist()` on startup to reduce eviction; **JSON
  export/import** of saves (bookmarks and free notes included) as a safety net.

---

## Contributing

Issues and pull requests are welcome. Before submitting, please run
`npm run build` (it type-checks and builds) and keep the core product principle
in mind: **the app never enforces the rules — the player is the referee**.
`CLAUDE.md` (in Italian) contains the full product spec and the reasoning behind
the design constraints.

---

## Legal — Lone Wolf and Project Aon

- **Lone Wolf** (Lupo Solitario) and all related characters, titles, settings
  and game content were created by **Joe Dever** and are the intellectual
  property of his estate. This project is an **unofficial, non-commercial fan
  tool** and is not affiliated with, or endorsed by, the estate of Joe Dever,
  Project Aon, or any publisher of the series.
- The gamebooks themselves are **not included** in this repository or in the
  app. They are distributed by [Project Aon](https://www.projectaon.org) under
  the [Project Aon license](https://www.projectaon.org/en/Main/License): you
  download the EPUBs from there and load them into the app yourself.
- The **Combat Results Table** values in `src/data/crt.ts` are game mechanics
  transcribed from the material published by Project Aon, included solely to
  make this companion tool usable. If you are a rights holder and have any
  concern about this, please open an issue and it will be addressed promptly.
- The [MIT license](LICENSE) of this repository covers the **source code
  only** — it grants no rights whatsoever over the Lone Wolf intellectual
  property.

Thanks to Joe Dever for the books, and to the Project Aon volunteers for
keeping them alive.
