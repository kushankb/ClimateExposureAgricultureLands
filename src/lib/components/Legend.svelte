<script>
  import { FOOD_GROUP_COLORS } from '$lib/layers/tilesetIds.js';

  let { config, breadbasketActive, selectedFoodGroup = null, onSelectFoodGroup = () => {} } = $props();

  let gradientStyle = $derived.by(() => {
    if (!config?.legendColors) return '';
    const stops = config.legendColors.map(({ color }, i) => {
      const pct = (i / (config.legendColors.length - 1)) * 100;
      return `${color} ${pct}%`;
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
  });

  const foodGroups = Object.entries(FOOD_GROUP_COLORS);

  function handleSwatchClick(key) {
    onSelectFoodGroup(selectedFoodGroup === key ? null : key);
  }
</script>

<div class="legend-stack">
  <!-- Raster overlay gradient legend -->
  {#if config?.legendColors}
    <div class="legend">
      <div class="legend-title">{config.label} ({config.unit})</div>
      <div class="legend-gradient" style="background: {gradientStyle}"></div>
      <div class="legend-labels">
        {#each config.legendColors as { label }, i}
          {#if i === 0 || i === config.legendColors.length - 1 || i === Math.floor(config.legendColors.length / 2)}
            <span>{label}</span>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- Breadbasket categorical legend -->
  {#if breadbasketActive}
    <div class="legend legend-categorical">
      <div class="legend-title">Food Breadbaskets</div>
      <div class="legend-swatches">
        {#each foodGroups as [key, { color, label }]}
          <div
            class="legend-swatch-row clickable {selectedFoodGroup && selectedFoodGroup !== key ? 'dimmed' : ''} {selectedFoodGroup === key ? 'selected' : ''}"
            onclick={() => handleSwatchClick(key)}
            title={selectedFoodGroup === key ? `Click to show all food groups` : `Click to show only ${label}`}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSwatchClick(key); }}
          >
            <span class="legend-swatch" style="background: {color}"></span>
            <span class="legend-swatch-label">{label}</span>
          </div>
        {/each}
      </div>
      <div class="legend-hint {selectedFoodGroup ? 'faded' : 'pulse'}">
        {selectedFoodGroup ? 'Click selected group to reset' : 'Click a food group to filter'}
      </div>
    </div>
  {/if}
</div>
