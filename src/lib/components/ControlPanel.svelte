<script>
  import { LAYER_DESCRIPTIONS } from '$lib/layers/tilesetIds.js';

  let { activeLayers, layerOpacity, selectedPercentile, onToggle, onOpacityChange, onPercentileChange } = $props();

  const CLIMATE_LAYERS = [
    { key: 'CDD',  label: 'Consecutive Dry Days', unit: '% change',    color: '#d73027' },
    { key: 'Rx5',  label: 'Max 5-Day Rainfall',   unit: '% change',    color: '#238b45' },
    { key: 'Tx35', label: 'Days Tmax > 35°C',     unit: 'days change', color: '#fb6a4a' },
    { key: 'FD',   label: 'Frost Days',           unit: 'days change', color: '#2171b5' },
  ];

  const PERCENTILE_OPTIONS = [
    { key: 'p05', label: '5th' },
    { key: 'p50', label: '50th' },
    { key: 'p95', label: '95th' },
  ];

  // Tooltip state
  let tooltipKey = $state(null);
  let tooltipPos = $state({ top: 0, left: 0 });

  function showTooltip(event, key) {
    const rect = event.currentTarget.getBoundingClientRect();
    tooltipPos = { top: rect.top + rect.height / 2, left: rect.left - 12 };
    tooltipKey = key;
  }

  function hideTooltip() {
    tooltipKey = null;
  }

  let breadbasketActive = $derived(activeLayers.includes('breadbaskets'));
  let farmActive = $derived(activeLayers.includes('farmsize'));
  let anyClimateActive = $derived(CLIMATE_LAYERS.some(l => activeLayers.includes(l.key)));
</script>

<div class="control-panel">
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
        <span class="layer-btn-label">Food Breadbaskets</span>
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
          <span class="layer-btn-unit">{lyr.unit}</span>
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
    <div class="panel-section-label">Ensemble Percentile</div>
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
    <div class="pctl-hint">Switches between climate model ensemble percentiles</div>
  {/if}
</div>

<!-- Fixed-position tooltip (replaces React createPortal) -->
{#if tooltipKey && LAYER_DESCRIPTIONS[tooltipKey]}
  {@const info = LAYER_DESCRIPTIONS[tooltipKey]}
  <div
    class="layer-tooltip"
    style="top: {tooltipPos.top}px; left: {tooltipPos.left}px; transform: translate(-100%, -50%)"
  >
    {info.text}
    {#if info.source}
      <span class="tooltip-source">{info.source}</span>
    {/if}
  </div>
{/if}
