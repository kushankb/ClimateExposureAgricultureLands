<script>
  import { onMount } from 'svelte';
  import { FOOD_GROUP_COLORS } from '$lib/layers/tilesetIds.js';

  let { activeLayers, selectedPercentile } = $props();

  // ── Static config ─────────────────────────────────────────────────────────
  // Each variable is a *change* under 2°C warming. The threshold reads as
  // "how much worse the climate gets at this location" — we show magnitudes.
  const CLIMATE_META = {
    CDD: {
      label:    'Longer dry spells',
      color:    '#d73027',
      // formats a numeric threshold (which may be negative, but for CDD it's positive)
      fmtVal:   (v) => `+${Math.round(v)}%`,
      headline: (txt) => `Longest dry spell at least ${txt} longer`,
    },
    Rx5: {
      label:    'Heavier extreme rainfall',
      color:    '#238b45',
      fmtVal:   (v) => `+${Math.round(v)}%`,
      headline: (txt) => `Heaviest 5-day rainfall at least ${txt} more intense`,
    },
    Tx35: {
      label:    'More extreme heat days',
      color:    '#fb6a4a',
      fmtVal:   (v) => `+${Math.round(v)} d/yr`,
      headline: (txt) => `Gains at least ${txt} above 35 °C`,
    },
    FD: {
      label:    'Lost frost days',
      color:    '#2171b5',
      // FD thresholds are stored negative; display as positive magnitude.
      fmtVal:   (v) => `${Math.round(Math.abs(v))} d/yr`,
      headline: (txt) => `Loses at least ${txt} of frost`,
    },
  };
  const CLIMATE_KEYS = ['CDD', 'Rx5', 'Tx35', 'FD'];

  // ── Data load ─────────────────────────────────────────────────────────────
  let curves = $state(null);
  let loadError = $state(null);

  onMount(async () => {
    try {
      const r = await fetch('/exposure_curves.json');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      curves = await r.json();
      // Start every slider at index 0 (= "no change") so the bars are full,
      // then the user drags right to tighten the threshold.
      thresholdIdx = { CDD: 0, Rx5: 0, Tx35: 0, FD: 0 };
    } catch (e) {
      loadError = String(e);
      console.error('exposure_curves.json failed', e);
    }
  });

  // ── Slider state (per climate var) ────────────────────────────────────────
  let thresholdIdx = $state({ CDD: 0, Rx5: 0, Tx35: 0, FD: 0 });

  // ── Derived: which climate vars are visible? ──────────────────────────────
  let activeClimateKeys = $derived(
    CLIMATE_KEYS.filter((k) => activeLayers.includes(k))
  );

  let showFoodGroups = $derived(activeLayers.includes('breadbaskets'));
  let showFarmClasses = $derived(activeLayers.includes('farmsize'));
  let panelVisible = $derived(
    activeClimateKeys.length > 0 && (showFoodGroups || showFarmClasses)
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  function fmtPct(f) {
    if (f == null) return '–';
    return `${(f * 100).toFixed(0)}%`;
  }

  // Read fraction for a given group key and climate var/percentile/threshold idx
  function getFoodFrac(fgKey, cvar, idx) {
    if (!curves) return 0;
    const arr = curves.by_food_group?.[fgKey]?.[cvar]?.[selectedPercentile];
    return arr ? arr[idx] ?? 0 : 0;
  }

  function getFarmFrac(clsKey, cvar, idx) {
    if (!curves) return 0;
    const arr = curves.by_farm_class?.[clsKey]?.[cvar]?.[selectedPercentile];
    return arr ? arr[idx] ?? 0 : 0;
  }

  // Sorted food group keys (by total tonnage, desc)
  let sortedFoodKeys = $derived.by(() => {
    if (!curves) return [];
    return [...curves.food_group_keys].sort(
      (a, b) => (curves.food_totals[b] || 0) - (curves.food_totals[a] || 0)
    );
  });
</script>

{#if panelVisible}
  <div class="exposure-panel">
    <div class="ep-header">
      <div class="ep-title">How much production is exposed?</div>
      <div class="ep-sub">
        All values are <em>changes</em> at 2&nbsp;°C global warming relative to today.
        Drag a slider to ask “how much {showFoodGroups && showFarmClasses ? 'production / farmland' : showFoodGroups ? 'production' : 'farmland'} sits where the climate gets at least this much worse?”
        Using {selectedPercentile} of the model ensemble.
      </div>
    </div>

    {#if loadError}
      <div class="ep-error">Could not load curves: {loadError}</div>
    {:else if !curves}
      <div class="ep-loading">Loading exposure curves…</div>
    {:else}
      <div class="ep-cols">
        {#each activeClimateKeys as cvar}
          {@const meta = CLIMATE_META[cvar]}
          {@const thresholds = curves.thresholds[cvar]}
          {@const idx = thresholdIdx[cvar] ?? 20}
          {@const tval = thresholds[idx]}
          {@const valTxt = meta.fmtVal(tval)}
          <div class="ep-col">
            <div class="ep-col-title" style="--c: {meta.color}">
              <span class="ep-dot"></span>
              {meta.label}
            </div>
            <div class="ep-headline">{meta.headline(valTxt)}</div>

            <div class="ep-slider-row">
              <input
                type="range"
                class="ep-slider"
                min="0"
                max={thresholds.length - 1}
                step="1"
                value={idx}
                oninput={(e) => thresholdIdx = { ...thresholdIdx, [cvar]: parseInt(e.target.value) }}
                style="--sc: {meta.color}"
              />
              <div class="ep-thresh">{valTxt}</div>
            </div>

            {#if showFoodGroups}
              <div class="ep-section-label">By food group</div>
              <div class="ep-bars">
                {#each sortedFoodKeys as fg}
                  {@const frac = getFoodFrac(fg, cvar, idx)}
                  {@const fgMeta = FOOD_GROUP_COLORS[fg] || { label: fg, color: '#888' }}
                  <div class="ep-bar-row">
                    <div class="ep-bar-label">{fgMeta.label}</div>
                    <div class="ep-bar-track">
                      <div class="ep-bar-fill"
                           style="width: {Math.max(0, Math.min(1, frac)) * 100}%; background: {fgMeta.color}">
                      </div>
                    </div>
                    <div class="ep-bar-val">{fmtPct(frac)}</div>
                  </div>
                {/each}
              </div>
            {/if}

            {#if showFarmClasses}
              <div class="ep-section-label">By farm size</div>
              <div class="ep-bars">
                {#each curves.farm_classes as cls}
                  {@const frac = getFarmFrac(cls.key, cvar, idx)}
                  <div class="ep-bar-row">
                    <div class="ep-bar-label">{cls.label}</div>
                    <div class="ep-bar-track">
                      <div class="ep-bar-fill"
                           style="width: {Math.max(0, Math.min(1, frac)) * 100}%; background: #df65b0">
                      </div>
                    </div>
                    <div class="ep-bar-val">{fmtPct(frac)}</div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .exposure-panel {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    background: rgba(14, 18, 28, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 14px 16px 16px;
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    max-width: calc(100vw - 380px);
    max-height: 56vh;
    overflow: auto;
  }

  .ep-header {
    margin-bottom: 10px;
  }
  .ep-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 0.2px;
  }
  .ep-sub {
    margin-top: 2px;
    font-size: 12px;
    color: #9aa3b2;
    max-width: 640px;
  }

  .ep-error  { color: #ff8080; padding: 6px 0; }
  .ep-loading { color: #888; padding: 6px 0; }

  .ep-cols {
    display: flex;
    flex-wrap: nowrap;
    gap: 18px;
    align-items: flex-start;
  }

  .ep-col {
    min-width: 260px;
    max-width: 300px;
    flex: 0 0 auto;
    border-left: 1px solid rgba(255,255,255,0.08);
    padding-left: 12px;
  }
  .ep-col:first-child {
    border-left: none;
    padding-left: 0;
  }

  .ep-col-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
  }
  .ep-headline {
    font-size: 12px;
    color: #c8cdd6;
    margin-bottom: 6px;
    min-height: 14px;
  }
  .ep-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--c);
  }

  .ep-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .ep-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
    outline: none;
  }
  .ep-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--sc);
    border: 2px solid #fff;
    cursor: pointer;
  }
  .ep-slider::-moz-range-thumb {
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--sc);
    border: 2px solid #fff;
    cursor: pointer;
  }
  .ep-thresh {
    font-variant-numeric: tabular-nums;
    font-size: 12px;
    color: #fff;
    min-width: 56px;
    text-align: right;
  }

  .ep-section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6f7886;
    margin: 8px 0 4px;
  }

  .ep-bars {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .ep-bar-row {
    display: grid;
    grid-template-columns: 78px 1fr 32px;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
  }
  .ep-bar-label {
    color: #c8cdd6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ep-bar-track {
    height: 8px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
  }
  .ep-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.15s ease;
  }
  .ep-bar-val {
    color: #fff;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
</style>
