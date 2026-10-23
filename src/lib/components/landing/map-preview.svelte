<div class="map-window" role="group" aria-label="Illustrative SuriOS hazard map interface">
	<div class="window-bar">
		<div class="window-brand">
			<img src="/orie.png" alt="" width="25" height="25" />
			<span>Hazard map</span>
		</div>
		<span class="sample-label">Illustrative view</span>
	</div>
	<div class="map-scene">
		<svg class="street-map" viewBox="0 0 760 560" role="img" aria-labelledby="map-title map-description" preserveAspectRatio="xMidYMid slice">
			<title id="map-title">Illustrative SuriOS map preview</title>
			<desc id="map-description">A simplified neighborhood street map with one highlighted section and two report pins.</desc>
			<rect width="760" height="560" fill="#f0ede6" />
			<g fill="#e5dfd5">
				<path d="M22 26h143v85H22zM181 23h99v68h-99zM312 26h137v89H312zM485 19h118v76H485zM632 29h103v105H632z" />
				<path d="M32 149h108v90H32zM168 126h135v96H168zM335 141h92v81h-92zM464 124h132v100H464zM626 163h118v83H626z" />
				<path d="M17 283h125v89H17zM169 265h93v106h-93zM286 262h135v82H286zM450 270h111v103H450zM593 278h151v94H593z" />
				<path d="M37 408h112v115H37zM180 405h136v101H180zM347 396h99v126h-99zM478 413h129v92H478zM632 408h97v114h-97z" />
			</g>
			<g fill="none" stroke="#fffdfa" stroke-linecap="round" stroke-linejoin="round">
				<path d="M-24 116C115 155 196 157 290 193s165 60 259 54 133-27 238-3" stroke-width="34" />
				<path d="M-14 354c137-42 204-54 315-42s167 39 259 12 121-71 218-70" stroke-width="30" />
				<path d="M118-30c-8 102 16 174 22 239s-14 148-1 379" stroke-width="24" />
				<path d="M323-20c-13 86 5 138-2 212s-37 149-21 388" stroke-width="26" />
				<path d="M523-16c15 91 1 166 23 243s44 144 35 354" stroke-width="26" />
				<path d="M704-15c-20 114-17 197 16 293s30 169 18 295" stroke-width="22" />
				<path d="M-30 475c153-63 279-45 380-12s206 31 437-49" stroke-width="24" />
			</g>
			<g fill="none" stroke="#d6d0c7" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
				<path d="M-24 116C115 155 196 157 290 193s165 60 259 54 133-27 238-3" />
				<path d="M-14 354c137-42 204-54 315-42s167 39 259 12 121-71 218-70" />
				<path d="M118-30c-8 102 16 174 22 239s-14 148-1 379" />
				<path d="M323-20c-13 86 5 138-2 212s-37 149-21 388" />
				<path d="M523-16c15 91 1 166 23 243s44 144 35 354" />
				<path d="M704-15c-20 114-17 197 16 293s30 169 18 295" />
				<path d="M-30 475c153-63 279-45 380-12s206 31 437-49" />
			</g>
			<path class="highlight-shadow" d="M166 338c88-23 154-42 222-76s114-53 203-63" />
			<path class="highlight-road" d="M166 338c88-23 154-42 222-76s114-53 203-63" />
			<circle cx="166" cy="338" r="7" fill="#fff" stroke="#e66532" stroke-width="4" />
			<circle cx="591" cy="199" r="7" fill="#fff" stroke="#e66532" stroke-width="4" />
			<g fill="#cfc8be">
				<circle cx="221" cy="172" r="2" /><circle cx="454" cy="268" r="2" /><circle cx="499" cy="367" r="2" />
				<circle cx="297" cy="393" r="2" /><circle cx="618" cy="124" r="2" /><circle cx="101" cy="264" r="2" />
			</g>
		</svg>
		<div class="map-search">
			<span class="search-symbol" aria-hidden="true"></span>
			<span>Find a report or place</span>
		</div>
		<div class="map-controls" aria-hidden="true"><span>+</span><span>−</span></div>
		<div class="map-pin map-pin--one" aria-hidden="true"><span></span></div>
		<div class="map-pin map-pin--two" aria-hidden="true"><span></span></div>
		<div class="map-note glass-panel">
			<div class="note-topline"><span class="note-dot"></span><span>ROAD SECTION</span><span class="note-tag">ON MAP</span></div>
			<strong>Location stays with the report</strong>
			<p>Roads · bridges · drainage · more</p>
		</div>
	</div>
	<div class="map-caption"><span>Illustrative map interface</span><span>Community reports, placed in context</span></div>
</div>

<style>
	.map-window {
		position: relative;
		width: 100%;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.92);
		border-radius: 30px;
		background: rgba(255, 255, 255, 0.78);
		box-shadow: 0 24px 70px rgba(69, 53, 40, 0.12), 0 3px 10px rgba(69, 53, 40, 0.04);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		transition: transform 500ms cubic-bezier(.2, .75, .25, 1), box-shadow 500ms ease;
	}
	:global(.hero-map:hover) .map-window {
		transform: translateY(-5px) rotate(-0.35deg);
		box-shadow: 0 32px 84px rgba(69, 53, 40, 0.16), 0 4px 12px rgba(69, 53, 40, 0.05);
	}
	.window-bar, .map-caption {
		position: relative;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 18px;
	}
	.window-bar { border-bottom: 1px solid rgba(72, 57, 42, 0.07); }
	.window-brand { display: inline-flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 650; letter-spacing: -0.02em; }
	.window-brand img { object-fit: contain; }
	.sample-label, .map-caption { color: #847d75; font-size: 10px; letter-spacing: 0.04em; }
	.sample-label { border: 1px solid rgba(90, 75, 59, 0.11); border-radius: 999px; padding: 5px 9px; background: rgba(255, 255, 255, 0.72); }
	.map-scene { position: relative; height: clamp(320px, 43vw, 460px); overflow: hidden; background: #f0ede6; }
	.street-map { position: absolute; inset: 0; width: 100%; height: 100%; }
	.highlight-shadow { fill: none; stroke: rgba(255, 255, 255, 0.95); stroke-linecap: round; stroke-width: 15; }
	.highlight-road { fill: none; stroke: #ea7140; stroke-linecap: round; stroke-width: 7; }
	.map-search, .map-controls, .map-note {
		position: absolute;
		border: 1px solid rgba(255, 255, 255, 0.96);
		background: rgba(255, 255, 255, 0.76);
		box-shadow: 0 12px 34px rgba(55, 45, 35, 0.11);
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
	}
	.map-search {
		top: 18px;
		left: 18px;
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 43px;
		padding: 0 11px;
		border-radius: 13px;
		color: #77716a;
		font-size: 11px;
	}
	.search-symbol { width: 12px; height: 12px; border: 1.5px solid #77716a; border-radius: 50%; position: relative; }
	.search-symbol::after { content: ''; position: absolute; width: 5px; height: 1.5px; right: -4px; bottom: -2px; background: #77716a; transform: rotate(45deg); border-radius: 4px; }
	.map-controls { top: 18px; right: 18px; display: grid; width: 34px; overflow: hidden; border-radius: 11px; color: #655e56; text-align: center; font-size: 18px; line-height: 30px; }
	.map-controls span + span { border-top: 1px solid rgba(80, 66, 52, .1); }
	.map-pin { position: absolute; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid white; border-radius: 50% 50% 50% 8px; background: #e66532; box-shadow: 0 5px 14px rgba(179, 76, 36, .24); transform: rotate(-45deg); }
	.map-pin span { width: 11px; height: 11px; border: 2px solid #e66532; border-radius: 50%; background: white; }
	.map-pin--one { left: 47%; top: 42%; animation: pin-float 3.4s ease-in-out infinite; }
	.map-pin--two { left: 25%; top: 63%; width: 29px; height: 29px; animation: pin-float 3.8s ease-in-out 450ms infinite; }
	.map-pin--two span { width: 9px; height: 9px; }
	.map-note { right: 18px; bottom: 20px; width: min(275px, calc(100% - 36px)); padding: 14px 15px; border-radius: 17px; }
	.note-topline { display: flex; align-items: center; gap: 7px; color: #8a8177; font-size: 9px; font-weight: 700; letter-spacing: .11em; }
	.note-dot { width: 6px; height: 6px; border-radius: 50%; background: #e66532; }
	.note-tag { margin-left: auto; border-radius: 999px; padding: 4px 7px; background: #f7e9e1; color: #bd542b; font-size: 8px; letter-spacing: .06em; }
	.map-note strong { display: block; margin-top: 12px; font-size: 14px; letter-spacing: -.035em; }
	.map-note p { margin: 4px 0 0; color: #827a71; font-size: 11px; }
	.map-caption { padding: 12px 18px 14px; font-size: 9px; letter-spacing: .01em; }
	@keyframes pin-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -6px; } }
	@media (max-width: 560px) {
		.map-window { border-radius: 23px; }
		.window-bar, .map-caption { padding-left: 13px; padding-right: 13px; }
		.map-scene { height: 330px; }
		.map-search { top: 12px; left: 12px; min-height: 39px; padding: 0 9px; gap: 8px; }
		.map-controls { top: 12px; right: 12px; }
		.map-note { right: 12px; bottom: 13px; }
		.map-pin--one { left: 49%; top: 39%; }
		.map-pin--two { left: 27%; top: 61%; }
		.map-caption { flex-wrap: wrap; row-gap: 3px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.map-pin--one, .map-pin--two { animation: none; }
		.map-window { transition: none; }
	}
</style>
