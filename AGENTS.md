# AGENTS.md — Agent Quick Reference & Operating Rules

Welcome to **SuriOS**. Before performing any coding or modifications in this project, you must inspect and follow [GEMINI.md](./GEMINI.md).

---

## ⚡ The 7 Golden Rules for Every Agent

1. **Strict Workspace Isolation:**
   - Stay strictly inside `/home/andy/Projects/surios-ai`.
   - Never inspect, search, modify, or create files in parent directories or other projects unless explicitly asked by the user.

2. **Sensitive File & Secret Shielding:**
   - Never commit, stage, or push credentials, keys, or environment files (`.env`, `.env.*`).
   - Always confirm `.gitignore` coverage before adding files.

3. **Svelte 5 Runes Only:**
   - Use `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
   - Never use legacy Svelte 3/4 stores (`writable`) or `export let`.

4. **Branch Before You Code:**
   - Check out a new branch (`feat/<name>`, `fix/<name>`, `chore/<name>`) before writing any code.
   - Do not commit directly to `main`.

5. **Break Down Commits:**
   - Keep commits small, atomic, and focused.
   - Use concise, human commit messages (`feat: ...`, `fix: ...`, `chore: ...`).

6. **DO NOT PUSH AUTOMATICALLY:**
   - The user pushes code manually.
   - Always output a single-line copy-pastable push command (no `cd` command) at the end of your response:
     ```bash
     git push -u origin <branch-name>
     ```

7. **Security & API Keys:**
   - Keep `GEMINI_API_KEY` strictly on the server (`+server.ts` or `$env/static/private`).
   - Never expose API keys in client-side code.
