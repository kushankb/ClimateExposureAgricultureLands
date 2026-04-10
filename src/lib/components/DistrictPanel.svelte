<script>
  import { onMount } from 'svelte';
  import { FOOD_GROUP_COLORS } from '$lib/layers/tilesetIds.js';

  let { stateId = null, countryId = null, selectedPercentile = 'p50', onClose = () => {} } = $props();

  // Which level are we showing?
  let activeId = $derived(stateId || countryId);
  let isCountry = $derived(!stateId && !!countryId);

  // ── Metric toggle ────────────────────────────────────────────────────────
  const METRICS = [
    { key: 'calories', label: 'Calories', field: 'calories', unit: 'kcal', fmtTotal: fmtCalories },
    { key: 'tonnage',  label: 'Weight',   field: 'tonnage',  unit: 't',    fmtTotal: fmtTonnage },
    { key: 'protein',  label: 'Protein',  field: 'protein',  unit: 't',    fmtTotal: fmtTonnage },
  ];
  let selectedMetric = $state('calories');

  // ── Climate var display metadata ──────────────────────────────────────────
  const CLIMATE_META = {
    CDD:  { label: 'Dry spell change',    color: '#d73027', fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
    Rx5:  { label: 'Extreme rain change',  color: '#238b45', fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
    Tx35: { label: 'Heat days change',     color: '#fb6a4a', fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} d` },
    FD:   { label: 'Frost days change',    color: '#2171b5', fmt: (v) => `${v.toFixed(1)} d` },
  };
  const CLIMATE_KEYS = ['CDD', 'Rx5', 'Tx35', 'FD'];

  // ── Data load (cached) ────────────────────────────────────────────────────
  let allData = $state(null);
  let loadError = $state(null);
  let loading = $state(false);

  async function ensureLoaded() {
    if (allData || loading) return;
    loading = true;
    try {
      const r = await fetch('/district_stats.json');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      allData = await r.json();
    } catch (e) {
      loadError = String(e);
      console.error('Stats JSON load failed', e);
    }
    loading = false;
  }

  $effect(() => {
    if (activeId) ensureLoaded();
  });

  // ── Derived data ──────────────────────────────────────────────────────────
  let record = $derived.by(() => {
    if (!allData) return null;
    if (isCountry) return allData.countries?.[countryId] ?? null;
    return allData.districts?.[stateId] ?? null;
  });

  let currentMetric = $derived(METRICS.find((m) => m.key === selectedMetric) || METRICS[0]);

  // Sort food groups by selected metric desc
  let sortedFood = $derived.by(() => {
    const data = record?.[currentMetric.field];
    if (!data) return [];
    return Object.entries(data).sort((a, b) => b[1] - a[1]);
  });

  let total = $derived(
    sortedFood.reduce((s, [, v]) => s + v, 0)
  );

  // ── Formatters ────────────────────────────────────────────────────────────
  function fmtTonnage(t) {
    if (t >= 1e9) return `${(t / 1e9).toFixed(1)}B t`;
    if (t >= 1e6) return `${(t / 1e6).toFixed(1)}M t`;
    if (t >= 1e3) return `${(t / 1e3).toFixed(0)}K t`;
    return `${t.toFixed(0)} t`;
  }

  function fmtCalories(c) {
    if (c >= 1e15) return `${(c / 1e15).toFixed(1)}P kcal`;
    if (c >= 1e12) return `${(c / 1e12).toFixed(1)}T kcal`;
    if (c >= 1e9)  return `${(c / 1e9).toFixed(1)}B kcal`;
    if (c >= 1e6)  return `${(c / 1e6).toFixed(1)}M kcal`;
    if (c >= 1e3)  return `${(c / 1e3).toFixed(0)}K kcal`;
    return `${c.toFixed(0)} kcal`;
  }

  function fmtPct(frac) {
    return `${(frac * 100).toFixed(0)}%`;
  }
</script>

{#if activeId}
  <div class="state-panel">
    <button class="dp-close" onclick={onClose} aria-label="Close panel">&times;</button>

    {#if loadError}
      <div class="dp-error">Error: {loadError}</div>
    {:else if !record}
      <div class="dp-loading">{loading ? 'Loading data…' : 'Not found in dataset.'}</div>
    {:else}
      <!-- Header -->
      <div class="dp-header">
        <div class="dp-level-badge">{isCountry ? 'Country' : 'State / Province'}</div>
        <div class="dp-name">{record.name}</div>
        {#if !isCountry}
          <div class="dp-country">{record.country} ({record.iso3})</div>
        {:else}
          <div class="dp-country">{record.iso3}{record.n_districts ? ` · ${record.n_districts} states` : ''}</div>
        {/if}
      </div>

      <!-- Climate exposure cards -->
      <div class="dp-section-label">Climate exposure at 2 °C warming ({selectedPercentile})</div>
      <div class="dp-climate-grid">
        {#each CLIMATE_KEYS as cvar}
          {@const meta = CLIMATE_META[cvar]}
          {@const val = record.climate?.[cvar]?.[selectedPercentile]}
          <div class="dp-climate-card" style="--cc: {meta.color}">
            <div class="dp-cc-label">{meta.label}</div>
            <div class="dp-cc-value">
              {#if val != null}
                {meta.fmt(val)}
              {:else}
                –
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Metric toggle -->
      <div class="dp-metric-row">
        <div class="dp-section-label" style="margin: 0;">Food production</div>
        <div class="dp-metric-toggle">
          {#each METRICS as m}
            <button
              class="dp-metric-btn {selectedMetric === m.key ? 'active' : ''}"
              onclick={() => selectedMetric = m.key}
            >{m.label}</button>
          {/each}
        </div>
      </div>

      <!-- Food production bars -->
      {#if sortedFood.length > 0}
        <div class="dp-total">{currentMetric.fmtTotal(total)} total</div>
        <div class="dp-bars">
          {#each sortedFood as [key, value]}
            {@const fgMeta = FOOD_GROUP_COLORS[key] || { label: key, color: '#888' }}
            {@const frac = total > 0 ? value / total : 0}
            <div class="dp-bar-row">
              <div class="dp-bar-label">{fgMeta.label}</div>
              <div class="dp-bar-track">
                <div class="dp-bar-fill"
                     style="width: {Math.max(0, Math.min(1, frac)) * 100}%; background: {fgMeta.color}">
                </div>
              </div>
              <div class="dp-bar-val">{fmtPct(frac)}</div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="dp-no-data">No data for this {isCountry ? 'country' : 'state'}.</div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .state-panel {
    position: absolute;
    top: 80px;
    right: 16px;
    z-index: 6;
    width: 390px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    background: rgba(14, 18, 28, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 16px 14px 14px;
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .dp-close {
    position: absolute;
    top: 8px;
    right: 10px;
    background: none;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    padding: 2px 6px;
  }
  .dp-close:hover { color: #fff; }

  .dp-level-badge {
    display: inline-block;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #0a0a0a;
    background: rgba(100, 210, 255, 0.8);
    padding: 1px 6px;
    border-radius: 3px;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .dp-header {
    margin-bottom: 12px;
    padding-right: 20px;
  }
  .dp-name {
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
  }
  .dp-country {
    font-size: 12px;
    color: #9aa3b2;
    margin-top: 2px;
  }

  .dp-section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6f7886;
    margin: 12px 0 6px;
  }

  .dp-climate-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .dp-climate-card {
    background: rgba(255, 255, 255, 0.04);
    border-left: 3px solid var(--cc);
    border-radius: 4px;
    padding: 6px 8px;
  }
  .dp-cc-label {
    font-size: 11px;
    color: #9aa3b2;
  }
  .dp-cc-value {
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }

  /* Metric toggle row */
  .dp-metric-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 12px 0 4px;
  }
  .dp-metric-toggle {
    display: flex;
    gap: 2px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    padding: 2px;
  }
  .dp-metric-btn {
    background: none;
    border: none;
    color: #8892a0;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .dp-metric-btn:hover {
    color: #ccc;
  }
  .dp-metric-btn.active {
    background: rgba(100, 210, 255, 0.2);
    color: #fff;
    font-weight: 600;
  }

  .dp-total {
    font-size: 11px;
    color: #9aa3b2;
    margin-bottom: 4px;
  }

  .dp-bars {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .dp-bar-row {
    display: grid;
    grid-template-columns: 82px 1fr 30px;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
  }
  .dp-bar-label {
    color: #c8cdd6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dp-bar-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    overflow: hidden;
  }
  .dp-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.2s ease;
  }
  .dp-bar-val {
    color: #fff;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .dp-no-data {
    color: #6f7886;
    font-style: italic;
    padding: 4px 0;
  }

  .dp-error { color: #ff8080; padding: 6px 0; }
  .dp-loading { color: #888; padding: 6px 0; }
</style>
