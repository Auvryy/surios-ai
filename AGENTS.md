# AGENTS.md — Agent Quick Reference & Operating Rules

Welcome to **SuriOS**. Before performing any coding or modifications in this project, you must inspect and follow [GEMINI.md](./GEMINI.md).

---

## ⚡ The 5 Golden Rules for Every Agent

1. **Svelte 5 Runes Only:**
   - Use `$state`, `$derived`, `$effect`, `$props`, `$bindable`.
   - Never use Svelte 3/4 stores (`writable`) or `export let`.

2. **Branch Before You Code:**
   - Check out a new branch (`feat/<name>`, `fix/<name>`, `chore/<name>`) before writing any code.
   - Do not commit directly to `main`.

3. **Break Down Commits:**
   - Keep commits small, atomic, and focused.
   - Use concise, human commit messages (`feat: ...`, `fix: ...`, `chore: ...`).

4. **DO NOT PUSH AUTOMATICALLY:**
   - The user pushes code manually.
   - Output a single-line copy-pastable push command at the end of your response:
     ```bash
     cd /home/andy/Projects/surios-ai && git push -u origin <branch-name>
     ```

5. **Security & API Keys:**
   - Keep `GEMINI_API_KEY` strictly on the server (`+server.ts` or `$env/static/private`).
   - Never commit `.env`.
