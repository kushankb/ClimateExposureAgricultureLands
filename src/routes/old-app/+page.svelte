<script>
  import { onMount } from 'svelte';
  import '$lib/styles/map.css';
  import Map from '$lib/components/Map.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import Legend from '$lib/components/Legend.svelte';

  // ── State ────────────────────────────────────────────────────────────────────
  let activeLayers      = $state(['breadbaskets']);
  let layerOpacity      = $state({
    breadbaskets: 1.0,
    CDD:          0.65,
    FD:           0.65,
    Rx5:          0.65,
    Tx35:         0.65,
    farmsize:     0.65,
  });
  let selectedPercentile = $state('p50');
  let legendConfig       = $state(null);
  let mapLoaded          = $state(false);

  // Set mapLoaded after 2.2s (gives globe time to render)
  onMount(() => {
    const t = setTimeout(() => { mapLoaded = true; }, 2200);
    return () => clearTimeout(t);
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleToggle(key) {
    activeLayers = activeLayers.includes(key)
      ? activeLayers.filter((k) => k !== key)
      : [...activeLayers, key];
  }

  function handleOpacityChange(key, value) {
    layerOpacity = { ...layerOpacity, [key]: value };
  }

  let breadbasketActive = $derived(activeLayers.includes('breadbaskets'));
</script>

<!-- Loading overlay -->
<div class="loading-overlay {mapLoaded ? 'hidden' : ''}">
  <div class="loading-spinner"></div>
  <div class="loading-text">Loading global agriculture data…</div>
</div>

<!-- Header -->
<div class="app-header">
  <div class="app-title">
    Global Agriculture<br />Exposure to Weather Extremes
  </div>
  <div class="app-subtitle">CMIP6 · SSP2-4.5 · 2°C GMT compared to now</div>
</div>

<!-- Map -->
<Map
  {activeLayers}
  {layerOpacity}
  {selectedPercentile}
  onLegendChange={(cfg) => { legendConfig = cfg; }}
/>

<!-- Layer controls -->
<ControlPanel
  {activeLayers}
  {layerOpacity}
  {selectedPercentile}
  onToggle={handleToggle}
  onOpacityChange={handleOpacityChange}
  onPercentileChange={(pctl) => { selectedPercentile = pctl; }}
/>

<!-- Legends -->
<Legend config={legendConfig} {breadbasketActive} />

<!-- Scenario badge -->
<div class="scenario-badge">SSP2-4.5 · CMIP6 Ensemble · 2°C GMT</div>
