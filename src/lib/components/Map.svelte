<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import {
    BREADBASKET,
    RASTER_OVERLAYS,
    FOOD_GROUP_COLORS,
    getTileDir,
  } from '$lib/layers/tilesetIds.js';

  let { activeLayers, layerOpacity, selectedPercentile, onLegendChange } = $props();

  // TODO: move to $env/static/public when ready
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGlnaGVzdHJvYWQiLCJhIjoiY21senhycGFvMDI5NDNlcHpxbm5qdzJmcyJ9.9EuVHmWXRQOKNpVAG5A4mQ';

  const PERCENTILES = ['p05', 'p50', 'p95'];
  const CLIMATE_KEYS = ['CDD', 'FD', 'Rx5', 'Tx35'];

  const TILE_BASE = 'https://kushankbajaj.com/exposure-tiles';

  function tileUrl(dir) {
    return `${TILE_BASE}/${dir}/{z}/{x}/{y}.png`;
  }

  const BREADBASKET_SIZE = [
    'interpolate', ['linear'], ['zoom'],
    1, 0.5, 2, 0.7, 3, 1.0, 4, 1.4, 5, 2.0, 6, 2.8, 7, 3.6, 8, 4.5,
  ];

  function buildFoodGroupColorExpr() {
    const expr = ['match', ['get', BREADBASKET.groupKey]];
    Object.entries(FOOD_GROUP_COLORS).forEach(([key, { color }]) => {
      expr.push(key, color);
    });
    expr.push('#444444');
    return expr;
  }

  function addAllSources(m) {
    m.addSource('breadbaskets', {
      type: 'vector',
      url: `mapbox://${BREADBASKET.id}`,
    });

    for (const key of CLIMATE_KEYS) {
      for (const pctl of PERCENTILES) {
        const dir = getTileDir(key, pctl);
        m.addSource(`raster-${key.toLowerCase()}-${pctl}`, {
          type: 'raster',
          tiles: [tileUrl(dir)],
          tileSize: 512,
          minzoom: 1,
          maxzoom: 7,
        });
      }
    }

    const fsDir = getTileDir('farmsize');
    m.addSource('raster-farmsize', {
      type: 'raster',
      tiles: [tileUrl(fsDir)],
      tileSize: 512,
      minzoom: 1,
      maxzoom: 7,
    });
  }

  function addAllLayers(m) {
    m.addLayer({
      id: 'breadbaskets-layer',
      type: 'circle',
      source: 'breadbaskets',
      'source-layer': BREADBASKET.layer,
      layout: { visibility: 'visible' },
      paint: {
        'circle-radius':         BREADBASKET_SIZE,
        'circle-color':          buildFoodGroupColorExpr(),
        'circle-opacity':        1.0,
        'circle-stroke-width':   [
          'interpolate', ['linear'], ['zoom'],
          1, 0.6, 4, 0.4, 8, 0.2,
        ],
        'circle-stroke-color':   '#ffffff',
        'circle-stroke-opacity': 0.5,
        'circle-blur':           0.0,
      },
    });

    for (const key of CLIMATE_KEYS) {
      for (const pctl of PERCENTILES) {
        m.addLayer({
          id: `raster-${key.toLowerCase()}-${pctl}`,
          type: 'raster',
          source: `raster-${key.toLowerCase()}-${pctl}`,
          layout: { visibility: 'none' },
          paint: {
            'raster-opacity': 0.65,
            'raster-fade-duration': 150,
          },
        });
      }
    }

    m.addLayer({
      id: 'raster-farmsize',
      type: 'raster',
      source: 'raster-farmsize',
      layout: { visibility: 'none' },
      paint: {
        'raster-opacity': 0.65,
        'raster-fade-duration': 150,
      },
    });
  }

  function setupHoverEvents(m, popup, getActiveLayers) {
    m.on('mouseenter', 'breadbaskets-layer', (e) => {
      if (!getActiveLayers().includes('breadbaskets')) return;
      m.getCanvas().style.cursor = 'crosshair';
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      const fg = FOOD_GROUP_COLORS[props[BREADBASKET.groupKey]] || {
        label: props[BREADBASKET.groupKey],
        color: '#888',
      };
      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `<div class="popup-title">
            <span class="popup-swatch" style="background:${fg.color}"></span>
            ${fg.label}
          </div>
          <div class="popup-row">
            <span class="popup-key">Production</span>
            <span class="popup-value">${Number(props[BREADBASKET.valueKey] || 0).toLocaleString()}</span>
          </div>`
        )
        .addTo(m);
    });

    m.on('mouseleave', 'breadbaskets-layer', () => {
      m.getCanvas().style.cursor = '';
      popup.remove();
    });
  }

  let mapContainer;
  let mapRef = null;
  let mapReady = $state(false);  // $state so $effect re-runs when map finishes loading

  // Keep a live reference to activeLayers for the hover closure
  let activeLayersSnapshot = $derived(activeLayers);

  onMount(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 2,
      minZoom: 1,
      maxZoom: 8,
      projection: 'mercator',
      antialias: true,
      hash: true,
    });

    mapRef = m;

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '320px',
    });

    m.on('style.load', () => {
      m.setFog({
        color:           'rgb(12, 15, 22)',
        'high-color':    'rgb(14, 18, 28)',
        'horizon-blend': 0.008,
        'space-color':   'rgb(6, 8, 14)',
        'star-intensity': 0.4,
      });

      const style = m.getStyle();
      if (style && style.layers) {
        for (const layer of style.layers) {
          if (layer.id === 'land' && layer.type === 'background') {
            m.setPaintProperty('land', 'background-color', '#1e2430');
          }
          if (layer.id === 'water' && layer.type === 'fill') {
            m.setPaintProperty('water', 'fill-color', '#141a26');
          }
          if (layer.id.includes('landuse') || layer.id.includes('landcover')) {
            if (layer.type === 'fill') {
              m.setPaintProperty(layer.id, 'fill-opacity', 0.3);
            }
          }
          if (layer.id.includes('admin') && layer.type === 'line') {
            m.setPaintProperty(layer.id, 'line-opacity', 0.25);
          }
        }
      }

      addAllSources(m);
      addAllLayers(m);
      setupHoverEvents(m, popup, () => activeLayersSnapshot);
      mapReady = true;  // triggers $effect to run with the now-ready map
    });

    m.addControl(
      new mapboxgl.NavigationControl({ showCompass: true }),
      'top-right'
    );

    return () => {
      m.remove();
      mapRef = null;
      mapReady = false;
    };
  });

  // Sync layer visibility, opacity, and percentile whenever props change
  $effect(() => {
    const m = mapRef;
    if (!m || !mapReady) return;

    const pctl = selectedPercentile || 'p50';
    const bbActive = activeLayers.includes('breadbaskets');

    // Breadbasket
    if (m.getLayer('breadbaskets-layer')) {
      m.setLayoutProperty('breadbaskets-layer', 'visibility', bbActive ? 'visible' : 'none');
      if (bbActive) {
        m.setPaintProperty('breadbaskets-layer', 'circle-opacity', layerOpacity.breadbaskets);
        m.setPaintProperty('breadbaskets-layer', 'circle-stroke-opacity', layerOpacity.breadbaskets * 0.5);
      }
    }

    // Climate raster layers
    for (const key of CLIMATE_KEYS) {
      const isActive = activeLayers.includes(key);
      for (const p of PERCENTILES) {
        const lid = `raster-${key.toLowerCase()}-${p}`;
        if (!m.getLayer(lid)) continue;
        const shouldShow = isActive && p === pctl;
        m.setLayoutProperty(lid, 'visibility', shouldShow ? 'visible' : 'none');
        if (shouldShow) {
          m.setPaintProperty(lid, 'raster-opacity', layerOpacity[key] ?? 0.65);
        }
      }
    }

    // Farm size
    const fsLid = 'raster-farmsize';
    const fsActive = activeLayers.includes('farmsize');
    if (m.getLayer(fsLid)) {
      m.setLayoutProperty(fsLid, 'visibility', fsActive ? 'visible' : 'none');
      if (fsActive) {
        m.setPaintProperty(fsLid, 'raster-opacity', layerOpacity.farmsize ?? 0.65);
      }
    }

    // Update legend (last active overlay wins)
    const activeOverlays = Object.keys(RASTER_OVERLAYS).filter((k) =>
      activeLayers.includes(k)
    );
    onLegendChange(
      activeOverlays.length
        ? RASTER_OVERLAYS[activeOverlays[activeOverlays.length - 1]]
        : null
    );
  });
</script>

<div bind:this={mapContainer} id="map"></div>
