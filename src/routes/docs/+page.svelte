<script lang="ts">
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
</script>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-8">
	<!-- Page Title -->
	<div class="space-y-1.5">
		<div class="flex items-center gap-2">
			<Badge variant="outline" class="text-xs font-normal border-border">
				Specification
			</Badge>
			<span class="text-xs text-muted-foreground">Engineering Standards & Design Charter</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
			SuriOS Civil Standards & Design System
		</h1>
		<p class="text-xs text-muted-foreground leading-relaxed">
			The definitive specification for ASTM D6433 road distress classification, Vulnerable Road User (VRU) lethality scoring, and our Zero AI-Slop UI charter.
		</p>
	</div>

	<!-- Section 1: Zero AI-Slop Design Charter -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<PaletteIcon class="h-4 w-4 text-foreground" />
				<span>Zero AI-Slop Design Charter</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Strict visual rules defining the authentic shadcn-ui institutional look.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs leading-relaxed text-muted-foreground">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🚫 Strictly NO Gradients</p>
					<p>Zero radial gradients, zero gradient text, and zero glowing borders. All surfaces are flat, solid, and matte.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🚫 No Excessive Shadows</p>
					<p>No neon-colored drop shadows or blurry elevation. Boundaries are articulated cleanly with 1px border strokes (`border-border`).</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">✨ Soft Typography</p>
					<p>Clean human sans-serif typography (Inter system stack). Monospace is reserved strictly for coordinates and ASTM codes.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🌓 Dual-Mode Equality</p>
					<p>100% feature and visual parity between light and dark modes via semantic OKLCH tokens.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<p class="font-semibold text-foreground">🚫 No Status Dots</p>
					<p>Zero pulsing green or colored dots. State is expressed purely through clean text and subtle badges.</p>
				</div>
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1 sm:col-span-2">
					<p class="font-semibold text-foreground">✂️ Minimalist Copy</p>
					<p>Zero marketing fluff or unnecessary words. Terse, functional, high-density civic communication.</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Section 2: Two-Wheeler Lethality & Rider Safety Index -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<BikeIcon class="h-4 w-4 text-foreground" />
				<span>Two-Wheeler Lethality Index (VRU Profiling)</span>
			</CardTitle>
			<CardDescription class="text-xs">
				SDG 9 innovation prioritizing vulnerable road users in provincial corridors.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<p>
				Traditional civil standards (ASTM D6433, PCI) were designed around four-wheeled vehicular wear. In Philippine provincial corridors like Santa Cruz and Pagsanjan, motorcycles and tricycles make up over <strong>68% of daily trips</strong>.
			</p>
			<p>
				SuriOS couples multimodal vision depth extraction with a deterministic lethality formula:
			</p>
			<div class="p-3 rounded-lg bg-secondary/40 border border-border font-mono text-[11px] text-foreground">
				VRU_Index = f(Distress_Type, Depth_mm, Lateral_Position, Traffic_Profile)
			</div>
			<ul class="space-y-1.5 list-disc list-inside pt-1">
				<li><strong class="text-foreground">Depth &gt; 50mm:</strong> High instability; triggers instant emergency VRU alert.</li>
				<li><strong class="text-foreground">Depth &gt; 80mm:</strong> Critical catastrophic rim-catch hazard for small motorcycle tires.</li>
				<li><strong class="text-foreground">Edge Drop-Off:</strong> High-risk tipping hazard for tricycles on narrow uncurbed provincial shoulders.</li>
			</ul>
		</CardContent>
	</Card>

	<!-- Section 3: Gemini "Proof of Patch" Protocol -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<SparklesIcon class="h-4 w-4 text-foreground" />
				<span>Gemini Multimodal "Proof of Patch" Verification</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Automated visual auditing for municipal maintenance closure.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<p>
				Municipal road tickets cannot be closed by dispatcher self-certification alone. Road crews must submit an after-repair photo from the same geodetic coordinates.
			</p>
			<p>
				Gemini 3.5 Flash performs comparative visual inference:
			</p>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center">
				<div class="p-2.5 rounded-lg bg-secondary/30 border border-border">
					<p class="font-semibold text-foreground">1. Surface Planarity</p>
					<p class="text-[11px] text-muted-foreground mt-0.5">Verifies flush asphalt compaction without mounds or dips.</p>
				</div>
				<div class="p-2.5 rounded-lg bg-secondary/30 border border-border">
					<p class="font-semibold text-foreground">2. Edge Tacking</p>
					<p class="text-[11px] text-muted-foreground mt-0.5">Audits asphalt emulsion seal along old pavement borders.</p>
				</div>
				<div class="p-2.5 rounded-lg bg-secondary/30 border border-border">
					<p class="font-semibold text-foreground">3. Void Elimination</p>
					<p class="text-[11px] text-muted-foreground mt-0.5">Confirms zero water-trapping voids before releasing ticket closure.</p>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
