<script lang="ts">
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import BikeIcon from '@lucide/svelte/icons/bike';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

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

	<!-- Section 4: Hackathon 5-Branch Delivery Architecture -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<GitBranchIcon class="h-4 w-4 text-primary" />
				<span>Hackathon 5-Branch Delivery Architecture</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Strict atomic branch planning enforcing zero scope-creep, rapid execution, and robust feature delivery.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">1. feat/merge-map-foundation</span>
						<Badge variant="outline" class="text-[9px] font-mono border-primary/40 text-primary">MERGED</Badge>
					</div>
					<p class="text-[11px]">Geoapify road geometry integration, Positron light CAD basemap, animated dispatch route polylines, and squircle dot bomb indicators.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">2. feat/proof-of-patch</span>
						<Badge variant="secondary" class="text-[9px] font-mono border-border">ACTIVE</Badge>
					</div>
					<p class="text-[11px]">`/verification` — Interactive Before/After asphalt comparison slider, DPWH Item 310 1-year contractor warranty countdown, and engineering sign-off stamp.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">3. feat/road-analytics-pci</span>
						<Badge variant="secondary" class="text-[9px] font-mono border-border">QUEUED</Badge>
					</div>
					<p class="text-[11px]">`/analytics` — Pure SVG/Tailwind Network PCI gauge (49/100), longitudinal pavement deterioration curves, monsoon rain defect correlation, and ₱1.4M saved budget counter.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">4. feat/contractors-and-community</span>
						<Badge variant="secondary" class="text-[9px] font-mono border-border">QUEUED</Badge>
					</div>
					<p class="text-[11px]">`/crews` &amp; `/community` — DPWH-accredited asphalt paving crew roster, machinery allocation status (roller, tack tanker), and citizen hazard confirmation leaderboard.</p>
				</div>

				<div class="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1 sm:col-span-2">
					<div class="flex items-center justify-between">
						<span class="font-bold text-foreground font-mono text-[11px]">5. feat/hackathon-demo-kit</span>
						<Badge variant="secondary" class="text-[9px] font-mono border-border">QUEUED</Badge>
					</div>
					<p class="text-[11px]">One-click "Reset Demo Data" action for live presentations, 3-minute pitch script with exact click order, mobile responsive viewport hardening, and Docker container verification.</p>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Section 5: Citizen vs. Municipal LGU Process Flow Matrix -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<UsersIcon class="h-4 w-4 text-primary" />
				<span>Citizen vs. Municipal LGU Operational Process Flows</span>
			</CardTitle>
			<CardDescription class="text-xs">
				End-to-end lifecycle comparison between public reporting and institutional engineering dispatch.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4 text-xs text-muted-foreground leading-relaxed">
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="border-b border-border text-[11px] font-semibold text-foreground">
							<th class="py-2 pr-4">Phase / Module</th>
							<th class="py-2 pr-4 text-muted-foreground">Citizen / Motorist View</th>
							<th class="py-2 text-primary">Municipal LGU / Engineer View</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border/60 text-[11px]">
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">1. Access &amp; Entry</td>
							<td class="py-2.5 pr-4">1-tap quick Citizen login; immediate light-mode road safety map.</td>
							<td class="py-2.5">Badge/role authenticated dispatch console (`engineer@surios.gov`).</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">2. Defect Intake</td>
							<td class="py-2.5 pr-4">Snaps asphalt crater photo on `/report`; receives 1.5s AI safety rating.</td>
							<td class="py-2.5">Auto-snapped road corridor position + auto DPWH materials checklist.</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">3. Map &amp; Routing</td>
							<td class="py-2.5 pr-4">Visualizes squircle dot bombs with severity 1–10 on Laguna map.</td>
							<td class="py-2.5">1-click animated route dispatch from Depot HQ + turn-by-turn maneuvers.</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">4. Proof of Patch</td>
							<td class="py-2.5 pr-4">Drags Before/After comparison slider; taps "+1 Confirm Smooth Road".</td>
							<td class="py-2.5">Audits 98% compaction score, activates 1-yr DPWH warranty, stamps sign-off.</td>
						</tr>
						<tr>
							<td class="py-2.5 pr-4 font-mono font-bold text-foreground">5. Macro Analytics</td>
							<td class="py-2.5 pr-4">Public transparency: Santa Cruz road health index &amp; fixed potholes count.</td>
							<td class="py-2.5">PCI degradation forecast, monsoon rain defect timeline, ₱1.4M saved counter.</td>
						</tr>
					</tbody>
				</table>
			</div>
		</CardContent>
	</Card>

	<!-- Section 6: Institutional Civil Safety Amber Brand Identity -->
	<Card class="border border-border bg-card shadow-xs">
		<CardHeader class="pb-3">
			<CardTitle class="text-sm font-semibold flex items-center gap-2">
				<ShieldCheckIcon class="h-4 w-4 text-primary" />
				<span>Institutional Safety Amber Brand Identity</span>
			</CardTitle>
			<CardDescription class="text-xs">
				Deliberate departure from generic SaaS blue in favor of authentic civil infrastructure authority.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3 text-xs text-muted-foreground leading-relaxed">
			<p>
				Generic blue interfaces evoke generic B2B software. In Philippine civil works and international highway administration, <strong class="text-foreground">Safety Amber &amp; High-Visibility Ochre</strong> (`oklch(0.62 0.21 48)` / `#d97706`) signify active road work zones, heavy machinery readiness, and emergency DPWH transit corridors.
			</p>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
				<div class="p-3 rounded-lg border border-border bg-card space-y-1">
					<div class="h-3 w-8 rounded-sm bg-primary mb-1"></div>
					<p class="font-semibold text-foreground text-[11px]">Primary: Civil Safety Amber</p>
					<p class="text-[10px] text-muted-foreground">High-contrast institutional accent for actions, badges, and route geometry.</p>
				</div>
				<div class="p-3 rounded-lg border border-border bg-card space-y-1">
					<div class="h-3 w-8 rounded-sm bg-destructive mb-1"></div>
					<p class="font-semibold text-foreground text-[11px]">Alert: ASTM Critical Red</p>
					<p class="text-[10px] text-muted-foreground">Reserved exclusively for life-threatening VRU rim-strike pothole hazards.</p>
				</div>
				<div class="p-3 rounded-lg border border-border bg-card space-y-1">
					<div class="h-3 w-8 rounded-sm bg-muted-foreground/30 mb-1"></div>
					<p class="font-semibold text-foreground text-[11px]">Canvas: Neutral Civil Slate</p>
					<p class="text-[10px] text-muted-foreground">Paper white in daylight, deep matte slate at night for zero screen glare.</p>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
