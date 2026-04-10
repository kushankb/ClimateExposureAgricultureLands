<script>
  import "../app.css";
  import { base } from '$app/paths';
  import NavCard from "$lib/components/NavCard.svelte";
</script>

<main>
  <h1>Climate Exposure &amp; Agriculture Lands</h1>
  <p class="subtitle">Interactive visualizations of global agriculture exposure to future weather extremes</p>

  <div class="card-grid">
    <NavCard
      href="{base}/old-app"
      title="Agriculture Exposure Original App"
      description="Interactive map showing breadbasket regions overlaid with CMIP6 climate projections (CDD, FD, Rx5, Tx35) under SSP2-4.5 at 2°C warming."
    />
  </div>
</main>

<style>
  main {
    min-height: 100vh;
    padding: 4rem 2rem;
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: 2rem;
    font-weight: 700;
    color: #fff;
  }

  .subtitle {
    margin: 0 0 3rem;
    font-size: 1rem;
    color: #888;
    max-width: 560px;
    line-height: 1.6;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
  }
</style>
