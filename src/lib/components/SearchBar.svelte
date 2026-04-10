<script>
  import { base } from '$app/paths';
  let { onSelect = () => {} } = $props();

  let query = $state('');
  let results = $state([]);
  let allData = $state(null);
  let loading = $state(false);
  let focused = $state(false);
  let selectedIdx = $state(-1);

  async function ensureLoaded() {
    if (allData || loading) return;
    loading = true;
    try {
      const r = await fetch(`${base}/district_stats.json`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      allData = await r.json();
    } catch (e) {
      console.error('SearchBar: failed to load stats JSON', e);
    }
    loading = false;
  }

  // Build search index lazily
  let searchIndex = $derived.by(() => {
    if (!allData) return [];
    const items = [];

    // Countries
    for (const [iso3, c] of Object.entries(allData.countries || {})) {
      items.push({
        type: 'country',
        id: iso3,
        name: c.name,
        sub: iso3,
        lat: c.lat,
        lon: c.lon,
        search: `${c.name} ${iso3}`.toLowerCase(),
      });
    }

    // States / Provinces (keyed as "districts" in the JSON for legacy reasons)
    for (const [did, d] of Object.entries(allData.districts || {})) {
      items.push({
        type: 'state',
        id: did,
        name: d.name,
        sub: `${d.country} (${d.iso3})`,
        lat: d.lat,
        lon: d.lon,
        search: `${d.name} ${d.country} ${d.iso3}`.toLowerCase(),
      });
    }

    return items;
  });

  function doSearch(q) {
    if (!q || q.length < 2) { results = []; return; }
    const lower = q.toLowerCase();
    // Score: starts-with > includes
    const matches = searchIndex
      .filter((item) => item.search.includes(lower))
      .sort((a, b) => {
        const aStarts = a.search.startsWith(lower) ? 0 : 1;
        const bStarts = b.search.startsWith(lower) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        // Countries before states
        if (a.type !== b.type) return a.type === 'country' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
    results = matches;
    selectedIdx = -1;
  }

  $effect(() => {
    doSearch(query);
  });

  function handleSelect(item) {
    query = '';
    results = [];
    focused = false;
    onSelect(item);
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, -1);
    } else if (e.key === 'Enter' && selectedIdx >= 0 && results[selectedIdx]) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    } else if (e.key === 'Escape') {
      query = '';
      results = [];
    }
  }

  function handleFocus() {
    focused = true;
    ensureLoaded();
  }
</script>

<div class="search-wrapper">
  <div class="search-input-row">
    <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="13" y1="13" x2="18" y2="18" />
    </svg>
    <input
      type="text"
      class="search-input"
      placeholder="Search country or state…"
      bind:value={query}
      onfocus={handleFocus}
      onblur={() => setTimeout(() => { focused = false; }, 150)}
      onkeydown={handleKeydown}
    />
  </div>

  {#if focused && results.length > 0}
    <div class="search-results">
      {#each results as item, i}
        <button
          class="search-result {i === selectedIdx ? 'highlighted' : ''}"
          onmousedown={() => handleSelect(item)}
        >
          <span class="sr-badge">{item.type === 'country' ? 'Country' : 'State'}</span>
          <span class="sr-name">{item.name}</span>
          <span class="sr-sub">{item.sub}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-wrapper {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 7;
    width: 320px;
  }

  .search-input-row {
    display: flex;
    align-items: center;
    background: rgba(14, 18, 28, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    padding: 0 10px;
    backdrop-filter: blur(8px);
  }

  .search-icon {
    width: 16px;
    height: 16px;
    color: #6f7886;
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    background: none;
    border: none;
    color: #e0e0e0;
    font-size: 13px;
    padding: 9px 8px;
    outline: none;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .search-input::placeholder {
    color: #6f7886;
  }

  .search-results {
    margin-top: 4px;
    background: rgba(14, 18, 28, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .search-result {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    color: #c8cdd6;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .search-result:last-child { border-bottom: none; }
  .search-result:hover,
  .search-result.highlighted {
    background: rgba(100, 210, 255, 0.08);
  }

  .sr-badge {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64d2ff;
    background: rgba(100, 210, 255, 0.12);
    padding: 1px 5px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .sr-name {
    color: #fff;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sr-sub {
    color: #6f7886;
    font-size: 11px;
    margin-left: auto;
    flex-shrink: 0;
  }
</style>
