<script lang="ts">
	import { normalizeOtpCode } from '$lib/otp-code';
	let { id, value = $bindable('') }: { id: string; value?: string } = $props();
	const normalize = (text: string) => normalizeOtpCode(text).replace(/[^0-9]/g, '').slice(0, 6);
	function update(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		value = normalize(input.value);
		input.value = value;
	}
	function paste(event: ClipboardEvent) {
		event.preventDefault();
		const digits = normalize(event.clipboardData?.getData('text') || '');
		if (!digits) return;
		value = digits;
		const input = event.currentTarget as HTMLInputElement;
		input.value = value;
		input.setSelectionRange(value.length, value.length);
	}
</script>

<div class="relative mx-auto w-full max-w-[21rem] rounded-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-4">
	<input {id} name="code" type="text" inputmode="numeric" autocomplete="one-time-code" aria-label="6-digit email verification code" minlength={6} required value={value} oninput={update} onpaste={paste} class="absolute inset-0 z-10 h-full w-full cursor-text rounded-full opacity-0" />
	<div aria-hidden="true" class="pointer-events-none grid grid-cols-6 gap-2">
		{#each Array(6) as _, index}
			<span class="flex aspect-square items-center justify-center rounded-full border bg-background text-xl font-semibold tabular-nums {value[index] ? 'border-primary text-foreground' : 'border-input text-muted-foreground/40'}">{value[index] || '0'}</span>
		{/each}
	</div>
</div>
