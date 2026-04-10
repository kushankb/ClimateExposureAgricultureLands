<script>
  let open = $state(false);

  const FINDINGS = [
    {
      icon: "\u{1F321}\uFE0F",
      stat: "25% of cropland",
      text: "will face >2 months of extreme heat under 2\u00b0C warming, up from 16% today",
    },
    {
      icon: "\u{1F33E}",
      stat: "11 million km\u00b2",
      text: "of agricultural land exposed to prolonged heat stress (Tmax > 35\u00b0C)",
    },
    {
      icon: "\u26C8\uFE0F",
      stat: "~12% of ag. area",
      text: "exposed to compound extremes (heat + heavy rainfall), up from ~10%",
    },
    {
      icon: "\u{1F3E1}",
      stat: "Medium farms (2\u20135 ha)",
      text: "face the sharpest increase in heat stress \u2014 nearly double that of large farms",
    },
  ];

  const FARM_SIZE_FINDINGS = [
    {
      size: "Small farms (<2 ha)",
      detail: "Greatest exposure to heavy precipitation increases; vulnerable to flooding and waterlogging",
    },
    {
      size: "Medium farms (2\u20135 ha)",
      detail: "Highest increase in heat stress days; nearly double the increase seen on large farms",
    },
    {
      size: "Large farms (>50 ha)",
      detail: "Lower per-area exposure overall, but still face significant drought risk in key breadbaskets",
    },
  ];

  const LAYERS_INFO = [
    {
      icon: "\u{1F525}",
      name: "Extreme Heat Days (Tx35)",
      detail: "Change in days when daily max temperature exceeds 35\u00b0C during the growing season",
      stat: "Cropland exposure: 16.7% \u2192 23.3%",
    },
    {
      icon: "\u{1F4A7}",
      name: "Consecutive Dry Days (CDD)",
      detail: "Change in the longest dry spell during the growing season",
      stat: "Stable at ~11\u201312% of agricultural area",
    },
    {
      icon: "\u2744\uFE0F",
      name: "Frost Days (FD)",
      detail: "Change in days when daily min temperature drops below 0\u00b0C during the growing season",
      stat: "Decreases: 7.3% \u2192 5.1% of cropland",
    },
    {
      icon: "\u{1F327}\uFE0F",
      name: "Max 5-Day Rainfall (Rx5)",
      detail: "Change in heaviest 5-day cumulative precipitation during the growing season",
      stat: "Stable at ~11\u201312% of agricultural area",
    },
  ];
</script>

<div class="info-panel {open ? 'open' : 'closed'}">
  <button class="info-toggle" onclick={() => { open = !open; }}>
    {open ? "\u2715 Close" : "\u2139 About this map"}
  </button>

  {#if open}
    <div class="info-content">
      <div class="info-section-title">Key Findings</div>
      <div class="findings-grid">
        {#each FINDINGS as f}
          <div class="finding-card">
            <span class="finding-icon">{f.icon}</span>
            <span class="finding-stat">{f.stat}</span>
            <span class="finding-text">{f.text}</span>
          </div>
        {/each}
      </div>

      <div class="info-section-title" style="margin-top: 1rem;">
        Exposure by Farm Size
      </div>
      <div class="burdens-table">
        {#each FARM_SIZE_FINDINGS as f}
          <div class="burden-info-row">
            <div class="bi-text">
              <div class="bi-name">{f.size}</div>
              <div class="bi-detail">{f.detail}</div>
            </div>
          </div>
        {/each}
      </div>

      <div class="info-section-title" style="margin-top: 1rem;">
        Climate Layers
      </div>
      <div class="burdens-table">
        {#each LAYERS_INFO as b}
          <div class="burden-info-row">
            <span class="bi-icon">{b.icon}</span>
            <div class="bi-text">
              <div class="bi-name">{b.name}</div>
              <div class="bi-detail">{b.detail}</div>
              <div class="bi-threshold">{b.stat}</div>
            </div>
          </div>
        {/each}
      </div>

      <div class="info-section-title" style="margin-top: 0.75rem;">
        Data Sources
      </div>
      <div class="info-sources">
        <div class="info-source-row">
          <span class="info-source-label">Climate extremes</span>
          <span class="info-source-value">CMIP6 SSP2-4.5 multi-model ensemble (Bajaj et al. 2025)</span>
        </div>
        <div class="info-source-row">
          <span class="info-source-label">Food production</span>
          <span class="info-source-value">Plotline breadbasket dataset</span>
        </div>
        <div class="info-source-row">
          <span class="info-source-label">Farm size</span>
          <span class="info-source-value">Mehrabi & Ricciardi 2024</span>
        </div>
      </div>

      <div class="info-cite">
        Bajaj et al. (2025). Future climate exposure over global agricultural lands.
        <em>Environ. Res. Lett.</em> 20 044038.
        <a
          href="https://iopscience.iop.org/article/10.1088/1748-9326/ae293c"
          target="_blank"
          rel="noopener noreferrer"
          class="info-cite-link"
        >
          DOI: 10.1088/1748-9326/ae293c
        </a>
      </div>

      <div class="info-built-by">
        Built by
        <a
          href="https://kushankbajaj.com"
          target="_blank"
          rel="noopener noreferrer"
          class="info-cite-link"
        >
          Kushank Bajaj
        </a>
      </div>
    </div>
  {/if}
</div>
