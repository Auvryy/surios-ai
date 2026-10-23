# Community profiles

`/profile` is reserved for the signed-in user’s own profile. Viewing another person stays inside `/community?profile=<user UUID>`, with Community feed active in navigation and the content showing that person’s identity and posts. Guests can browse this view. Post authors, comment/reply authors, and the people list link here. Legacy `/profile/<user UUID>` links redirect to the community view, preserving pagination. **Back to feed** restores the regular community stream.

The profile contains a cover photo, round profile picture, name, real authored-post count, and the author's saved posts. Photos use `object-cover`; users without photos see an initials avatar and a plain cover area. The former municipal statistics, privileges, demo-persona cards, and large account forms have been removed from the profile view.

Only the owner on `/profile` sees **Edit profile** and **New post**. The community view stays read-only for profile identity, including when viewing yourself. On the owner page, hovering the profile picture or cover reveals camera controls that open a file picker and save the selected image directly. Keyboard focus reveals the same controls, and touch devices show them without hover. Upload progress and errors are shown inline. The editor saves the public name, profile picture, and cover photo. Both photos can be replaced or removed. `/api/profile` authenticates the session, checks the request origin, accepts only the signed-in user's changes, and validates image format signatures and a 4 MiB limit per photo. It never accepts a target user, role, password, or email change. No AI assessment is used for profile photos.

Image files use the existing runtime uploads volume and `/media/<uuid>.<extension>` route; PostgreSQL stores their URLs in `users.avatar_url` and `users.cover_url`. Replacing/removing a photo updates the reference; older files are retained so existing cached references are not broken. Public profile data selects only the profile ID, name and photo URLs, plus public posts. It does not return the viewed person's email, password hash, settings, department, or badge number.

The shared post card preserves the photo/video/map gallery, confirmations, comments, and share links on both feed and profile. **Reply** targets a particular saved comment; `community_comments.parent_id` records that relationship. The server rejects parent comments from another post. Reply authors link to their own profiles. Signed-out users can read profiles and posts; submitting a comment or reply sends them to sign-in with a return destination.

Profiles start with 20 posts. **Load more posts** increases the displayed batch by 20 up to the existing 1,000-post feed limit. Every query is scoped to the profile's author, and the count comes from PostgreSQL.

## Upgrade

Apply migration 0004 after 0003, before starting this version:

```bash
docker compose exec -T surios-db psql -U postgres -d surios -v ON_ERROR_STOP=1 -1 < drizzle/0004_community-profiles.sql
```

For databases managed through Drizzle's journal, use the normal migration runner instead. Existing user photos and comment parents default to null; all existing posts and comments are preserved.

## Verification

`npm run check`, `npm run build`, and `npm run test:community` cover compilation and the shared posting flows. Profile browser tests use isolated users/posts and verify photo/name persistence, public data privacy, author-scoped pagination, responsive layout, author navigation, persisted replies, image validation, ownership, origin checks, and cross-post reply rejection. Fixtures and their uploads are removed afterward.
