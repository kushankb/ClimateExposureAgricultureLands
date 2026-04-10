<script>
  import { onMount } from 'svelte';
  import '$lib/styles/map.css';
  import Map from '$lib/components/Map.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import Legend from '$lib/components/Legend.svelte';
  import InfoPanel from '$lib/components/InfoPanel.svelte';
  import ExposurePanel from '$lib/components/ExposurePanel.svelte';
  import DistrictPanel from '$lib/components/DistrictPanel.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';

  // ── State ────────────────────────────────────────────────────────────────────
  let selectedStateId = $state(null);
  let selectedCountryId  = $state(null);
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
  let selectedFoodGroup  = $state(null);
  let legendConfig       = $state(null);
  let mapLoaded          = $state(false);
  let mapRef;

  function handleSearchSelect(item) {
    // Select the country or state/province
    if (item.type === 'country') {
      selectedCountryId = item.id;
      selectedStateId = null;
    } else {
      selectedStateId = item.id;
      selectedCountryId = null;
    }
    // Fly to it
    const zoom = item.type === 'country' ? 4 : 5;
    if (mapRef && item.lat && item.lon) {
      mapRef.flyTo(item.lon, item.lat, zoom);
    }
  }

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

<!-- Map -->
<Map
  bind:this={mapRef}
  {activeLayers}
  {layerOpacity}
  {selectedPercentile}
  selectedMethod="zscore"
  {selectedFoodGroup}
  {selectedStateId}
  {selectedCountryId}
  onLegendChange={(cfg) => { legendConfig = cfg; }}
  onStateSelect={(id) => { selectedStateId = id; selectedCountryId = null; }}
  onCountrySelect={(id) => { selectedCountryId = id; selectedStateId = null; }}
/>

<!-- Search bar -->
<SearchBar onSelect={handleSearchSelect} />

<!-- Layer controls -->
<ControlPanel
  {activeLayers}
  {layerOpacity}
  {selectedPercentile}
  onToggle={handleToggle}
  onOpacityChange={handleOpacityChange}
  onPercentileChange={(pctl) => { selectedPercentile = pctl; }}
/>

<!-- Info panel -->
<InfoPanel />

<!-- Production-weighted exposure panel -->
<ExposurePanel
  {activeLayers}
  {selectedPercentile}
/>

<!-- State / Province summary (click a state) -->
<DistrictPanel
  stateId={selectedStateId}
  countryId={selectedCountryId}
  {selectedPercentile}
  onClose={() => { selectedStateId = null; selectedCountryId = null; }}
/>

<!-- Onboarding + contextual hints -->
<Onboarding
  {activeLayers}
  {selectedStateId}
  {selectedCountryId}
/>

<!-- Legends -->
<Legend
  config={legendConfig}
  {breadbasketActive}
  {selectedFoodGroup}
  onSelectFoodGroup={(fg) => { selectedFoodGroup = fg; }}
/>

