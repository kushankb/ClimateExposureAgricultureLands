<script>
  import { LAYER_DESCRIPTIONS } from '$lib/layers/tilesetIds.js';

  let { activeLayers, layerOpacity, selectedPercentile, onToggle, onOpacityChange, onPercentileChange } = $props();

  const CLIMATE_LAYERS = [
    { key: 'CDD',  label: 'Drought Stress',     sub: 'longer dry spells',         color: '#d73027' },
    { key: 'Rx5',  label: 'Flood Risk',          sub: 'heavier extreme rainfall',  color: '#238b45' },
    { key: 'Tx35', label: 'Extreme Heat',        sub: 'more days above 35 °C',     color: '#fb6a4a' },
    { key: 'FD',   label: 'Frost Loss',          sub: 'fewer frost days',          color: '#2171b5' },
  ];

  const PERCENTILE_OPTIONS = [
    { key: 'p05', label: 'Lower bound',      hint: 'optimistic models' },
    { key: 'p50', label: 'Central estimate', hint: 'median projection' },
    { key: 'p95', label: 'Upper bound',      hint: 'pessimistic models' },
  ];

  // Tooltip state (layer buttons + info button)
  let tooltipKey = $state(null);
  let tooltipPos = $state({ top: 0, right: 0 });
  let infoTooltipVisible = $state(false);
  let infoTooltipPos = $state({ top: 0, left: 0 });

  function showTooltip(event, key) {
    const rect = event.currentTarget.getBoundingClientRect();
    // Panel is on the left — tooltips appear to the right of buttons
    tooltipPos = { top: rect.top + rect.height / 2, left: rect.right + 12 };
    tooltipKey = key;
  }

  function hideTooltip() {
    tooltipKey = null;
  }

  function showInfoTooltip(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    infoTooltipPos = { top: rect.bottom + 6, left: rect.left };
    infoTooltipVisible = true;
  }

  function hideInfoTooltip() {
    infoTooltipVisible = false;
  }

  let breadbasketActive = $derived(activeLayers.includes('breadbaskets'));
  let farmActive = $derived(activeLayers.includes('farmsize'));
  let anyClimateActive = $derived(CLIMATE_LAYERS.some(l => activeLayers.includes(l.key)));
</script>

<div class="control-panel">
  <!-- Panel header -->
  <div class="panel-header">
    <div class="panel-title">Global Agriculture<br />Exposure to Weather Extremes</div>
    <button
      class="info-btn"
      onmouseenter={showInfoTooltip}
      onmouseleave={hideInfoTooltip}
      aria-label="About this data"
    >ⓘ</button>
  </div>
  <hr class="panel-divider" />

  <!-- Base Layer -->
  <div class="panel-section-label">Base Layer</div>

  <div class="layer-btn-wrapper">
    <button
      class="layer-btn {breadbasketActive ? 'active' : ''}"
      style="--btn-color: #e6a532"
      onclick={() => onToggle('breadbaskets')}
      onmouseenter={(e) => showTooltip(e, 'breadbaskets')}
      onmouseleave={hideTooltip}
    >
      <span class="layer-dot"></span>
      <span class="layer-btn-text">
        <span class="layer-btn-label">Food Production Zones</span>
        <span class="layer-btn-unit">by food group</span>
      </span>
    </button>
  </div>

  {#if breadbasketActive}
    <div class="opacity-slider-row">
      <input
        type="range"
        class="opacity-slider"
        min="0" max="1" step="0.05"
        value={layerOpacity.breadbaskets}
        oninput={(e) => onOpacityChange('breadbaskets', parseFloat(e.target.value))}
        style="--slider-color: #e6a532"
      />
      <span class="opacity-value">{Math.round(layerOpacity.breadbaskets * 100)}%</span>
    </div>
  {/if}

  <hr class="panel-divider" />

  <!-- Weather Extremes -->
  <div class="panel-section-label">Weather Extremes (SSP2-4.5)</div>

  {#each CLIMATE_LAYERS as lyr}
    {@const isActive = activeLayers.includes(lyr.key)}
    <div class="layer-btn-wrapper">
      <button
        class="layer-btn {isActive ? 'active' : ''}"
        style="--btn-color: {lyr.color}"
        onclick={() => onToggle(lyr.key)}
        onmouseenter={(e) => showTooltip(e, lyr.key)}
        onmouseleave={hideTooltip}
      >
        <span class="layer-dot"></span>
        <span class="layer-btn-text">
          <span class="layer-btn-label">{lyr.label}</span>
          <span class="layer-btn-unit">{lyr.sub}</span>
        </span>
      </button>
    </div>
    {#if isActive}
      <div class="opacity-slider-row">
        <input
          type="range"
          class="opacity-slider"
          min="0" max="1" step="0.05"
          value={layerOpacity[lyr.key]}
          oninput={(e) => onOpacityChange(lyr.key, parseFloat(e.target.value))}
          style="--slider-color: {lyr.color}"
        />
        <span class="opacity-value">{Math.round(layerOpacity[lyr.key] * 100)}%</span>
      </div>
    {/if}
  {/each}

  <hr class="panel-divider" />

  <!-- Overlay -->
  <div class="panel-section-label">Overlay</div>

  <div class="layer-btn-wrapper">
    <button
      class="layer-btn {farmActive ? 'active' : ''}"
      style="--btn-color: #df65b0"
      onclick={() => onToggle('farmsize')}
      onmouseenter={(e) => showTooltip(e, 'farmsize')}
      onmouseleave={hideTooltip}
    >
      <span class="layer-dot"></span>
      <span class="layer-btn-text">
        <span class="layer-btn-label">Farm Size</span>
        <span class="layer-btn-unit">dominant ha</span>
      </span>
    </button>
  </div>

  {#if farmActive}
    <div class="opacity-slider-row">
      <input
        type="range"
        class="opacity-slider"
        min="0" max="1" step="0.05"
        value={layerOpacity.farmsize}
        oninput={(e) => onOpacityChange('farmsize', parseFloat(e.target.value))}
        style="--slider-color: #df65b0"
      />
      <span class="opacity-value">{Math.round(layerOpacity.farmsize * 100)}%</span>
    </div>
  {/if}

  <!-- Percentile selector -->
  {#if anyClimateActive}
    <hr class="panel-divider" />
    <div class="panel-section-label">Model Confidence</div>
    <div class="percentile-selector">
      {#each PERCENTILE_OPTIONS as opt}
        <button
          class="pctl-btn {selectedPercentile === opt.key ? 'active' : ''}"
          onclick={() => onPercentileChange(opt.key)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
    <div class="pctl-hint">{PERCENTILE_OPTIONS.find(o => o.key === selectedPercentile)?.hint ?? ''}</div>
  {/if}
</div>

<!-- Layer description tooltip (right of panel) -->
{#if tooltipKey && LAYER_DESCRIPTIONS[tooltipKey]}
  {@const info = LAYER_DESCRIPTIONS[tooltipKey]}
  <div
    class="layer-tooltip"
    style="top: {tooltipPos.top}px; left: {tooltipPos.left}px; transform: translate(0, -50%)"
  >
    {info.text}
    {#if info.source}
      <span class="tooltip-source">{info.source}</span>
    {/if}
  </div>
{/if}

<!-- Info button tooltip -->
{#if infoTooltipVisible}
  <div
    class="layer-tooltip"
    style="top: {infoTooltipPos.top}px; left: {infoTooltipPos.left}px; transform: translate(0, 0)"
  >
    CMIP6 · SSP2-4.5 · 2°C GMT warming compared to now
    <span class="tooltip-source">Bajaj et al. 2025, Environ. Res. Lett.</span>
  </div>
{/if}
