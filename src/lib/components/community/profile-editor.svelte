<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { isGovernment, type PublicProfile } from '$lib/types/community';
	import Avatar from './avatar.svelte';
	let { open = $bindable(false), profile }: { open?: boolean; profile: Pick<PublicProfile, 'name' | 'avatarUrl' | 'coverUrl'> & Partial<PublicProfile> } = $props();
	let name = $state(untrack(() => profile.name));
	let governmentLevel = $state(untrack(() => profile.governmentProfile?.level || 'MUNICIPAL'));
	let jurisdiction = $state(untrack(() => profile.governmentProfile?.jurisdiction || ''));
	let bio = $state(untrack(() => profile.governmentProfile?.bio || ''));
	let avatar = $state<File | null>(null);
	let cover = $state<File | null>(null);
	let avatarPreview = $state<string | null>(null);
	let coverPreview = $state<string | null>(null);
	let removeAvatar = $state(false);
	let removeCover = $state(false);
	let busy = $state(false);
	let error = $state('');
	function choose(event: Event, kind: 'avatar' | 'cover') {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		if (file.size > 4 * 1024 * 1024) { error = 'Each photo must be 4 MB or less.'; return; }
		error = '';
		if (kind === 'avatar') { if (avatarPreview) URL.revokeObjectURL(avatarPreview); avatar = file; avatarPreview = URL.createObjectURL(file); removeAvatar = false; }
		else { if (coverPreview) URL.revokeObjectURL(coverPreview); cover = file; coverPreview = URL.createObjectURL(file); removeCover = false; }
	}
	onDestroy(() => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); if (coverPreview) URL.revokeObjectURL(coverPreview); });
	async function save() {
		if (busy) return;
		busy = true; error = '';
		try {
			const form = new FormData(); form.set('name', name); form.set('removeAvatar', String(removeAvatar)); form.set('removeCover', String(removeCover));
			if (isGovernment(profile.role)) { form.set('governmentLevel', governmentLevel); form.set('jurisdiction', jurisdiction); form.set('bio', bio); }
			if (avatar && !removeAvatar) form.set('avatar', avatar);
			if (cover && !removeCover) form.set('cover', cover);
			const response = await fetch('/api/profile', { method: 'POST', body: form });
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || 'Could not save your profile. Try again.');
			await invalidateAll(); open = false;
		} catch (cause) { error = cause instanceof Error ? cause.message : 'Could not save your profile.'; }
		finally { busy = false; }
	}
</script>
<Dialog bind:open>
	<DialogContent class="max-h-[92svh] overflow-y-auto sm:max-w-lg" showCloseButton={!busy} onInteractOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeydown={(event) => { if (busy) event.preventDefault(); }}>
		<DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription class="sr-only">Change your public name and profile photos.</DialogDescription></DialogHeader>
		<form class="space-y-5" onsubmit={(event) => { event.preventDefault(); void save(); }}>
			<fieldset disabled={busy} class="space-y-5">
				<div class="space-y-2"><label for="profile-name" class="text-sm font-medium">Name</label><Input id="profile-name" bind:value={name} minlength={2} maxlength={80} required class="h-11" autocomplete="name" /></div>
				{#if isGovernment(profile.role)}
					<label class="block space-y-2 text-sm font-medium">Government level<select aria-label="Government level" bind:value={governmentLevel} class="h-11 w-full rounded-lg border border-border bg-card px-3"><option value="MUNICIPAL">Municipality</option><option value="BARANGAY">Barangay</option></select></label>
					<label class="block space-y-2 text-sm font-medium">Jurisdiction<Input aria-label="Jurisdiction" bind:value={jurisdiction} required minlength={2} maxlength={120} placeholder="e.g. Santa Cruz, Laguna" /></label>
					<label class="block space-y-2 text-sm font-medium">About this office<textarea aria-label="About this office" bind:value={bio} rows="3" maxlength={500} class="w-full rounded-lg border border-border bg-card p-3 text-sm"></textarea></label>
				{/if}
				<div class="space-y-2"><label for="profile-avatar" class="text-sm font-medium">Profile picture</label><div class="flex items-center gap-3"><Avatar {name} src={removeAvatar ? null : avatarPreview || profile.avatarUrl} class="size-16" /><input id="profile-avatar" type="file" accept="image/jpeg,image/png,image/webp" onchange={(event) => choose(event, 'avatar')} class="min-w-0 w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:text-foreground" /></div>{#if !removeAvatar && (avatar || profile.avatarUrl)}<button type="button" class="min-h-11 text-xs text-muted-foreground hover:text-foreground" onclick={() => removeAvatar = true}>Remove profile picture</button>{/if}</div>
				<div class="space-y-2"><label for="profile-cover" class="text-sm font-medium">Cover photo</label><div class="aspect-[3/1] overflow-hidden rounded-lg bg-primary/10">{#if !removeCover && (coverPreview || profile.coverUrl)}<img src={coverPreview || profile.coverUrl || ''} alt="Cover preview" class="size-full object-cover" />{/if}</div><input id="profile-cover" type="file" accept="image/jpeg,image/png,image/webp" onchange={(event) => choose(event, 'cover')} class="min-w-0 w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:text-foreground" />{#if !removeCover && (cover || profile.coverUrl)}<button type="button" class="min-h-11 text-xs text-muted-foreground hover:text-foreground" onclick={() => removeCover = true}>Remove cover photo</button>{/if}</div>
			</fieldset>
			<p class="text-xs text-muted-foreground">JPEG, PNG or WebP · Up to 4 MB per photo</p>
			{#if error}<p role="alert" class="text-sm text-destructive">{error}</p>{/if}
			<Button type="submit" class="h-11 w-full" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
		</form>
	</DialogContent>
</Dialog>
