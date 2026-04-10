<script>
  let { activeLayers = [], selectedStateId = null, selectedCountryId = null } = $props();

  // ── Welcome overlay (shown once) ──────────────────────────────────────────
  const STORAGE_KEY = 'agri-exposure-onboarded';
  let showWelcome = $state(false);

  // Check localStorage on init
  if (typeof window !== 'undefined') {
    showWelcome = !localStorage.getItem(STORAGE_KEY);
  }

  function dismissWelcome() {
    showWelcome = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '1');
    }
  }

  // ── Contextual hints (each shown once, disappear after condition met) ─────
  const HINT_KEYS = {
    clickCountry: 'hint-click-country',
    tryClimate:   'hint-try-climate',
    zoomState: 'hint-zoom-state',
  };

  function wasHintSeen(key) {
    return typeof window !== 'undefined' && localStorage.getItem(key);
  }
  function markHintSeen(key) {
    if (typeof window !== 'undefined') localStorage.setItem(key, '1');
  }

  // Hint 1: "Click a country" — show after welcome dismissed, hide when a country/state is selected
  let showClickHint = $derived(
    !showWelcome &&
    !wasHintSeen(HINT_KEYS.clickCountry) &&
    !selectedCountryId &&
    !selectedStateId
  );

  // Auto-dismiss when user clicks a country
  $effect(() => {
    if (selectedCountryId || selectedStateId) {
      markHintSeen(HINT_KEYS.clickCountry);
    }
  });

  // Hint 2: "Try a climate layer" — show after first country click, hide when a climate layer is on
  let anyClimateActive = $derived(
    ['CDD', 'Rx5', 'Tx35', 'FD'].some((k) => activeLayers.includes(k))
  );

  let showClimateHint = $derived(
    !showWelcome &&
    wasHintSeen(HINT_KEYS.clickCountry) &&
    !wasHintSeen(HINT_KEYS.tryClimate) &&
    !anyClimateActive
  );

  $effect(() => {
    if (anyClimateActive) {
      markHintSeen(HINT_KEYS.tryClimate);
    }
  });
</script>

<!-- Welcome overlay -->
{#if showWelcome}
  <div class="welcome-overlay" onclick={dismissWelcome}>
    <div class="welcome-card" onclick={(e) => e.stopPropagation()}>
      <div class="welcome-title">Global Agriculture Exposure</div>
      <div class="welcome-subtitle">to Weather Extremes under Climate Change</div>

      <div class="welcome-body">
        <p>This interactive map shows <strong>where the world's food is grown</strong> and how <strong>climate change at 2 °C warming</strong> threatens production across regions.</p>
        <div class="welcome-steps">
          <div class="welcome-step">
            <span class="step-num">1</span>
            <span>Click any <strong>country</strong> to see what it produces</span>
          </div>
          <div class="welcome-step">
            <span class="step-num">2</span>
            <span>Turn on a <strong>climate layer</strong> to see exposure</span>
          </div>
          <div class="welcome-step">
            <span class="step-num">3</span>
            <span>Zoom in to explore <strong>state / province</strong> detail</span>
          </div>
        </div>
      </div>

      <button class="welcome-btn" onclick={dismissWelcome}>
        Explore the map
      </button>

      <div class="welcome-source">
        Bajaj et al. (2025) <em>Environ. Res. Lett.</em> 20 044038
      </div>
    </div>
  </div>
{/if}

<!-- Contextual hints -->
{#if showClickHint}
  <div class="ctx-hint ctx-hint-center">
    Click any country to see its food production breakdown
  </div>
{/if}

{#if showClimateHint}
  <div class="ctx-hint ctx-hint-left">
    Now try turning on a climate layer to see exposure risks
  </div>
{/if}

<style>
  /* ── Welcome overlay ─────────────────────────────────────────────────────── */
  .welcome-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }

  .welcome-card {
    background: rgba(14, 18, 28, 0.97);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 36px 40px 28px;
    max-width: 480px;
    width: 90vw;
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    text-align: center;
  }

  .welcome-title {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.3px;
  }
  .welcome-subtitle {
    font-size: 14px;
    color: #9aa3b2;
    margin-top: 4px;
  }

  .welcome-body {
    margin: 20px 0 24px;
    text-align: left;
  }
  .welcome-body p {
    font-size: 13px;
    line-height: 1.6;
    color: #c8cdd6;
    margin: 0 0 16px;
  }

  .welcome-steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .welcome-step {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #c8cdd6;
  }
  .step-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(100, 210, 255, 0.15);
    color: #64d2ff;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
  }

  .welcome-btn {
    display: inline-block;
    background: rgba(100, 210, 255, 0.2);
    border: 1px solid rgba(100, 210, 255, 0.4);
    color: #64d2ff;
    font-size: 14px;
    font-weight: 600;
    padding: 10px 32px;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .welcome-btn:hover {
    background: rgba(100, 210, 255, 0.3);
    border-color: rgba(100, 210, 255, 0.6);
  }

  .welcome-source {
    margin-top: 16px;
    font-size: 10px;
    color: #6f7886;
  }

  /* ── Contextual hints ────────────────────────────────────────────────────── */
  .ctx-hint {
    position: absolute;
    z-index: 8;
    background: rgba(14, 18, 28, 0.9);
    border: 1px solid rgba(100, 210, 255, 0.3);
    border-radius: 8px;
    padding: 8px 16px;
    color: #c8cdd6;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
    backdrop-filter: blur(6px);
    pointer-events: none;
    animation: hintPulse 2s ease-in-out infinite;
  }

  .ctx-hint-center {
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
  }

  .ctx-hint-left {
    bottom: 80px;
    left: 280px;
  }

  @keyframes hintPulse {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.5; }
  }
</style>
