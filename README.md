# Tribble

I love playing Scrabble! In the quest for getting better at the game, I had been trying to conquer the 3-letter words, of which there are notoriously many (including *very* weird ones such as **TWP** and **YGO**). Doing these by brute-force like I did with the 2-letter words, felt like an impossible task, so naturally, being an engineering student, my first reaction was to build a solution! Tribble (**Tri- + Scrabble**) is a website for learning these 3-letter words. It generates fill-in-the-blank prompts, tracks what you got right, and (optionally) schedules review cards between random ones.

## How To Use

1. Sign up and log in to [https://shuvraneelmitra.github.io/tribble/](https://shuvraneelmitra.github.io/tribble/).
2. Choose a practice mode:
   - Endless random: always new random prompts
   - Scheduled review: mixes due review cards into random practice
3. Upload or select a saved word list pair (3-letter + 4-letter). If you are just starting out, you can download the `CSW_3s.txt` and `CSW_4s.txt` files present in the root of the repo; they contain all the 3- and 4-letter words in the CSW lexicon respectively.
4. Type letters to solve the blanks, much like Aerolith if you come to think of it.

Saved word lists and scheduled review are currently stored in the browser (`localStorage`).

## Contributing

Contributions are always welcome!!!! You are more than encouraged to fork a copy and make some edits to customise how the website functions for you, or feel free to open an issue/PR for any difficulties you might face while using the tool.

1. Create a branch from `main`.
2. Keep changes focused and prefer small PRs.
3. Run a production build before opening a PR:

```bash
DISABLE_ESLINT_PLUGIN=true npm run build
```

## Local Development

Requirements: Node 20+.

```bash
npm install
npm start
```

### Auth (Recommended: Supabase)

For static hosting (GitHub Pages), Tribble uses Supabase Auth in the browser.

Set build-time env vars:

```bash
REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
```

### Optional Local Auth Server

This repo also includes a small Node auth API for local experimentation:

```bash
npm run server
```
