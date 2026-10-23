<script lang="ts">
	import type { PageProps } from './$types';
	import MapPreview from '$lib/components/landing/map-preview.svelte';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>SuriOS — Public infrastructure, in clear view.</title>
	<meta name="description" content="See live community reports for roads, bridges, drainage, lighting, water, and communications infrastructure across Santa Cruz, Laguna." />
	<meta name="theme-color" content="#fbfaf8" />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to content</a>

<div class="landing-page">
	<header class="site-header">
		<a class="brand" href="/" aria-label="SuriOS home">
			<img src="/orie.png" alt="" width="34" height="34" />
			<span>SuriOS</span>
		</a>
		<nav aria-label="Main navigation">
			<a href="/map">Hazard map</a>
			<a href="/community">Community</a>
		</nav>
		<a class="header-action" href="/login">Sign in <span aria-hidden="true">↗</span></a>
	</header>

	<main id="main-content" class="content-width">
		<section class="hero" aria-labelledby="hero-title">
			<p class="eyebrow"><span class="eyebrow-dot"></span> SANTA CRUZ, LAGUNA</p>
			<h1 id="hero-title">Infrastructure,<br /><span>in clear view.</span></h1>
			<p class="hero-description">Follow community reports and public-service updates for the places and systems people rely on.</p>
			<div class="hero-actions">
				<a class="button button-primary" href="/map">Explore the hazard map <span aria-hidden="true">↗</span></a>
				<a class="button button-secondary" href="/community">Community feed <span aria-hidden="true">→</span></a>
			</div>
		</section>

		<section class="map-section" aria-label="Current infrastructure hazards">
			<MapPreview snapshot={data.liveMap} />
		</section>

		<section class="response-strip" aria-label="How reports lead to updates">
			<div class="response-flow" aria-label="Report, review, resolve">
				<span>Report</span><span class="flow-arrow" aria-hidden="true">→</span>
				<span>Review</span><span class="flow-arrow" aria-hidden="true">→</span>
				<span>Resolve</span>
			</div>
			<p>Official resolutions link back to the original reports.</p>
		</section>

		<section class="features" aria-label="SuriOS features">
			<article class="feature">
				<p class="feature-label">Community reports</p>
				<h2>Report what you see.</h2>
				<p>Add a location, photos, and a short note. Neighbors can confirm a hazard or add context.</p>
			</article>
			<article class="feature">
				<p class="feature-label">Municipal work</p>
				<h2>Track the repair.</h2>
				<p>Teams can assign work orders, submit repair evidence, and review each job.</p>
			</article>
		</section>
	</main>

	<footer class="site-footer content-width">
		<a class="footer-brand" href="/" aria-label="SuriOS home"><img src="/orie.png" alt="" width="25" height="25" />SuriOS</a>
		<span class="footer-note">Public infrastructure reports · Santa Cruz, Laguna</span>
		<a class="github-credit" href="https://github.com/Auvryy" target="_blank" rel="me noopener noreferrer" aria-label="Visit Andy's GitHub profile">
			<img src="/herta-github.jpg" alt="Herta, used as the GitHub profile avatar" width="30" height="30" loading="lazy" />
			<span>GitHub</span><span aria-hidden="true">↗</span>
		</a>
	</footer>
</div>

<style>
	:global(html) { scroll-behavior: smooth; background: #fbfaf8; }
	:global(body) { margin: 0; background: #fbfaf8; }
	.landing-page {
		--ink: #24211e;
		--muted: #77716a;
		--orange: #df602f;
		--line: rgba(52, 42, 33, .09);
		min-height: 100svh;
		overflow-x: clip;
		background: #fbfaf8;
		color: var(--ink);
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	}
	.content-width { width: min(1050px, calc(100% - 64px)); margin-inline: auto; }
	.skip-link { position: fixed; top: 8px; left: 8px; z-index: 100; padding: 10px 14px; border-radius: 10px; background: white; color: var(--ink); transform: translateY(-150%); }
	.skip-link:focus { transform: translateY(0); }
	.site-header {
		position: relative;
		top: auto;
		z-index: 20;
		display: flex;
		width: min(1050px, calc(100% - 40px));
		height: 58px;
		align-items: center;
		justify-content: space-between;
		margin: 20px auto 0;
		padding: 0 15px;
		border: 1px solid rgba(51, 42, 33, .1);
		border-radius: 999px;
		background: rgba(255,255,255,.88);
		box-shadow: 0 8px 28px rgba(49,40,31,.06);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}
	.brand, .footer-brand { display: inline-flex; align-items: center; gap: 9px; color: var(--ink); font-size: 16px; font-weight: 720; letter-spacing: -.045em; text-decoration: none; }
	.brand img, .footer-brand img { object-fit: contain; }
	.site-header nav { display: flex; align-items: center; gap: clamp(22px, 3vw, 40px); }
	.site-header nav a, .header-action { color: #686159; font-size: 12px; text-decoration: none; transition: color 160ms ease; }
	.site-header nav a:hover, .header-action:hover { color: var(--orange); }
	.header-action { display: inline-flex; align-items: center; gap: 11px; padding: 10px 14px; border: 1px solid rgba(58, 46, 35, .1); border-radius: 999px; background: rgba(255,255,255,.62); color: var(--ink); font-weight: 600; }
	.header-action span { color: var(--orange); font-size: 14px; }
	.site-header nav { gap: clamp(18px, 3vw, 32px); }
	.site-header nav a { font-size: 10px; letter-spacing: .035em; }
	.header-action { padding: 8px 12px; font-size: 10px; }
	.hero { display: flex; align-items: center; flex-direction: column; padding: 70px 0 27px; text-align: center; }
	.eyebrow { display: flex; align-items: center; gap: 9px; margin: 0; color: #898177; font-size: 9px; font-weight: 700; letter-spacing: .15em; }
	.eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--orange); box-shadow: 0 0 0 4px rgba(223, 96, 47, .1); }
	h1, p { margin-top: 0; }
	h1 { margin: 19px 0 13px; font-size: clamp(3.5rem, 7vw, 6.5rem); font-weight: 740; line-height: .97; letter-spacing: -.075em; }
	h1 span { color: var(--orange); }
	.hero-description { max-width: 470px; margin-bottom: 17px; color: var(--muted); font-size: 13px; line-height: 1.65; }
	.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
	.button { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; gap: 12px; padding: 0 14px; border: 1px solid transparent; border-radius: 999px; font-size: 10px; font-weight: 650; text-decoration: none; transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease; }
	.button:hover { transform: translateY(-2px); }
	.button:focus-visible, .site-header a:focus-visible, .github-credit:focus-visible { outline: 3px solid rgba(223, 96, 47, .42); outline-offset: 4px; }
	.button-primary { background: var(--orange); color: white; box-shadow: 0 5px 14px rgba(223, 96, 47, .16); }
	.button-primary:hover { background: #ca5126; box-shadow: 0 8px 18px rgba(223, 96, 47, .22); }
	.button-secondary { color: #605a53; }
	.button-secondary:hover { background: white; }
	.map-section { width: min(1040px, 100%); margin: 0 auto; padding-bottom: 48px; }
	.response-strip { display: flex; width: min(1040px, 100%); min-height: 78px; align-items: center; justify-content: space-between; gap: 24px; margin: 0 auto; border-top: 1px solid var(--line); }
	.response-flow { display: flex; align-items: center; gap: clamp(9px, 2vw, 21px); color: #49443e; font-size: 12px; font-weight: 620; }
	.flow-arrow { color: #beb5aa; font-size: 14px; font-weight: 400; }
	.response-strip p { margin: 0; color: var(--muted); font-size: 11px; }
	.features { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(26px, 6vw, 72px); padding: 32px 0 42px; border-top: 1px solid var(--line); }
	.feature + .feature { padding-left: clamp(24px, 4vw, 48px); border-left: 1px solid var(--line); }
	.feature-label { margin: 0 0 10px; color: var(--orange); font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
	.feature h2 { margin: 0 0 8px; font-size: clamp(18px, 2.2vw, 22px); font-weight: 680; letter-spacing: -.045em; }
	.feature > p:last-child { max-width: 390px; margin: 0; color: var(--muted); font-size: 12px; line-height: 1.7; }
	.site-footer { display: flex; min-height: 80px; align-items: center; justify-content: space-between; gap: 18px; border-top: 1px solid var(--line); }
	.footer-brand { gap: 7px; font-size: 13px; }
	.footer-note { color: #958d84; font-size: 10px; }
	.github-credit { display: inline-flex; align-items: center; gap: 8px; color: #726a61; font-size: 10px; text-decoration: none; transition: color 160ms ease, transform 160ms ease; }
	.github-credit:hover { color: var(--orange); transform: translateY(-1px); }
	.github-credit img { border: 1px solid rgba(65, 51, 39, .1); border-radius: 50%; object-fit: cover; }
	@media (max-width: 600px) {
		.content-width { width: calc(100% - 38px); }
		.site-header { width: calc(100% - 28px); height: 54px; margin-top: 12px; padding-inline: 10px; }
		.brand { font-size: 14px; }
		.brand img { width: 30px; height: 30px; }
		.site-header nav { gap: 12px; }
		.site-header nav a { font-size: 9px; }
		.header-action { gap: 6px; padding: 8px 9px; font-size: 9px; }
		.hero { padding-top: 57px; padding-bottom: 22px; }
		h1 { margin: 18px 0 12px; font-size: clamp(3.2rem, 13.5vw, 4.8rem); }
		.hero-description { max-width: 320px; font-size: 12px; }
		.button { min-height: 39px; padding-inline: 12px; font-size: 9px; }
		.map-section { padding-bottom: 28px; }
		.response-strip { min-height: auto; align-items: flex-start; flex-direction: column; gap: 8px; padding-block: 18px 22px; }
		.response-flow { font-size: 11px; }
		.response-strip p { font-size: 10px; }
		.features { grid-template-columns: 1fr; gap: 20px; padding: 24px 0 30px; }
		.feature + .feature { padding: 20px 0 0; border-top: 1px solid var(--line); border-left: 0; }
		.feature h2 { font-size: 19px; }
		.feature > p:last-child { font-size: 11px; }
		.site-footer { min-height: 75px; flex-wrap: wrap; gap: 9px 16px; padding-block: 15px; }
		.footer-note { order: 3; width: 100%; font-size: 9px; }
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html) { scroll-behavior: auto; }
		.button, .github-credit { transition: none; }
	}
</style>
