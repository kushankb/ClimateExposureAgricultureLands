<script>
  let open = $state(false);

  const STEPS = [
    { icon: "🔍", action: "Search",       desc: "Type a country or region in the search bar" },
    { icon: "🖱️", action: "Click",        desc: "Click any country or state to see its food production & climate exposure" },
    { icon: "🔎", action: "Zoom in",      desc: "Zoom in past country level to explore state / province detail" },
    { icon: "🌡️", action: "Add a layer",  desc: "Toggle a climate layer (drought, heat, flood, frost) on the left panel" },
    { icon: "📊", action: "Confidence",   desc: "Switch Low / Medium / High to see the range of model projections" },
    { icon: "🎨", action: "Filter",       desc: "Click a food group in the legend to highlight only that group" },
  ];
</script>

<div class="how-panel {open ? 'open' : 'closed'}">
  <button class="how-toggle" onclick={() => { open = !open; }}>
    {open ? "✕ Close" : "① How to use"}
  </button>

  {#if open}
    <div class="how-content">
      {#each STEPS as s}
        <div class="how-step">
          <span class="how-icon">{s.icon}</span>
          <div class="how-text">
            <span class="how-action">{s.action}</span>
            <span class="how-desc">{s.desc}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .how-panel {
    position: fixed;
    bottom: 28px;
    left: 16px;
    z-index: 8;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .how-toggle {
    background: rgba(14, 18, 28, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: #c8cdd6;
    font-size: 12px;
    font-weight: 500;
    padding: 7px 13px;
    border-radius: 7px;
    cursor: pointer;
    font-family: inherit;
    backdrop-filter: blur(8px);
    transition: all 0.15s;
    white-space: nowrap;
  }
  .how-toggle:hover {
    background: rgba(100, 210, 255, 0.1);
    border-color: rgba(100, 210, 255, 0.3);
    color: #fff;
  }

  .how-content {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    background: rgba(14, 18, 28, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 12px 14px;
    width: 260px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .how-step {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .how-icon {
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .how-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .how-action {
    font-size: 12px;
    font-weight: 600;
    color: #fff;
  }

  .how-desc {
    font-size: 11px;
    color: #8892a0;
    line-height: 1.4;
  }
</style>
