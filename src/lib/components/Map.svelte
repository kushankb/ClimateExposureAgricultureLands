<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import {
    BREADBASKET,
    BREADBASKET_METHODS,
    RASTER_OVERLAYS,
    FOOD_GROUP_COLORS,
    FOOD_GROUP_CODES,
    FOOD_GROUP_BY_CODE,
    ADMIN2_STATES,
    COUNTRY_BOUNDARIES,
    methodCodeExpr,
    decodePackedC,
    getTileDir,
  } from '$lib/layers/tilesetIds.js';

  let { activeLayers, layerOpacity, selectedPercentile, selectedMethod, selectedFoodGroup, onLegendChange, selectedStateId = null, selectedCountryId = null, onStateSelect = () => {}, onCountrySelect = () => {} } = $props();

  import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
  const MAPBOX_TOKEN = PUBLIC_MAPBOX_TOKEN;

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

  function buildFoodGroupColorExpr(methodKey) {
    // The packed tile stores all 3 method codes in a single integer `c`.
    // We extract the relevant code via methodCodeExpr() and match to a colour.
    const expr = ['match', methodCodeExpr(methodKey || 'zscore')];
    Object.entries(FOOD_GROUP_COLORS).forEach(([key, { color }]) => {
      const code = FOOD_GROUP_CODES[key];
      if (code !== undefined) expr.push(code, color);
    });
    expr.push('#444444');
    return expr;
  }

  function addAllSources(m) {
    m.addSource('breadbaskets', {
      type: 'vector',
      url: `mapbox://${BREADBASKET.id}`,
    });

    // Country boundaries (visible z0–z5)
    m.addSource('countries', {
      type: 'vector',
      url: `mapbox://${COUNTRY_BOUNDARIES.id}`,
      promoteId: { [COUNTRY_BOUNDARIES.layer]: COUNTRY_BOUNDARIES.idKey },
    });

    // Admin2 state/province boundaries (visible z4+)
    m.addSource('admin2', {
      type: 'vector',
      url: `mapbox://${ADMIN2_STATES.id}`,
      promoteId: { [ADMIN2_STATES.layer]: ADMIN2_STATES.idKey },
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
    // Country fill (z0–z5, for click/hover detection)
    m.addLayer({
      id: 'country-fill',
      type: 'fill',
      source: 'countries',
      'source-layer': COUNTRY_BOUNDARIES.layer,
      maxzoom: 4,
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.12,
          0.0,
        ],
      },
    });

    // Country outline (z0–z3)
    m.addLayer({
      id: 'country-outline',
      type: 'line',
      source: 'countries',
      'source-layer': COUNTRY_BOUNDARIES.layer,
      maxzoom: 4,
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#00d4ff',
          ['boolean', ['feature-state', 'hover'], false],
          'rgba(255, 255, 255, 0.55)',
          'rgba(255, 255, 255, 0.3)',
        ],
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          2.5,
          ['boolean', ['feature-state', 'hover'], false],
          1.2,
          0.6,
        ],
      },
    });

    // Admin2 fill (z6+, for click/hover detection)
    m.addLayer({
      id: 'admin2-fill',
      type: 'fill',
      source: 'admin2',
      'source-layer': ADMIN2_STATES.layer,
      minzoom: 4,
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.12,
          0.0,
        ],
      },
    });

    // Breadbaskets (dots)
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

    // Admin2 outline (z4+, ON TOP of breadbaskets so borders are visible)
    m.addLayer({
      id: 'admin2-outline',
      type: 'line',
      source: 'admin2',
      'source-layer': ADMIN2_STATES.layer,
      minzoom: 4,
      paint: {
        'line-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          '#00d4ff',
          ['boolean', ['feature-state', 'hover'], false],
          'rgba(255, 255, 255, 0.55)',
          'rgba(255, 255, 255, 0.3)',
        ],
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          2, 0,
          4, [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2.0,
            ['boolean', ['feature-state', 'hover'], false],
            1.0,
            0.4,
          ],
          6, [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2.5,
            ['boolean', ['feature-state', 'hover'], false],
            1.2,
            0.6,
          ],
        ],
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

  // Track hovered/selected features for feature-state
  let hoveredAdmin2Id = null;
  let selectedAdmin2FeatureId = null;
  let hoveredCountryId = null;
  let selectedCountryFeatureId = null;

  function setupCountryEvents(m) {
    m.on('mousemove', 'country-fill', (e) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      if (hoveredCountryId !== null && hoveredCountryId !== feat.id) {
        m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: hoveredCountryId }, { hover: false });
      }
      hoveredCountryId = feat.id;
      m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: hoveredCountryId }, { hover: true });
      m.getCanvas().style.cursor = 'pointer';
    });

    m.on('mouseleave', 'country-fill', () => {
      if (hoveredCountryId !== null) {
        m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: hoveredCountryId }, { hover: false });
        hoveredCountryId = null;
      }
      m.getCanvas().style.cursor = '';
    });

    m.on('click', 'country-fill', (e) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      const iso3 = feat.properties[COUNTRY_BOUNDARIES.idKey];

      // Deselect previous
      if (selectedCountryFeatureId !== null) {
        m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: selectedCountryFeatureId }, { selected: false });
      }

      // Toggle
      if (iso3 === selectedCountryId) {
        selectedCountryFeatureId = null;
        onCountrySelect(null);
      } else {
        selectedCountryFeatureId = feat.id;
        m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: feat.id }, { selected: true });
        onCountrySelect(iso3);
      }
    });
  }

  function setupAdmin2Events(m) {
    m.on('mousemove', 'admin2-fill', (e) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      if (hoveredAdmin2Id !== null && hoveredAdmin2Id !== feat.id) {
        m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: hoveredAdmin2Id }, { hover: false });
      }
      hoveredAdmin2Id = feat.id;
      m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: hoveredAdmin2Id }, { hover: true });
      m.getCanvas().style.cursor = 'pointer';
    });

    m.on('mouseleave', 'admin2-fill', () => {
      if (hoveredAdmin2Id !== null) {
        m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: hoveredAdmin2Id }, { hover: false });
        hoveredAdmin2Id = null;
      }
      m.getCanvas().style.cursor = '';
    });

    m.on('click', 'admin2-fill', (e) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      const stateId = feat.properties[ADMIN2_STATES.idKey];

      // Deselect previous
      if (selectedAdmin2FeatureId !== null) {
        m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: selectedAdmin2FeatureId }, { selected: false });
      }

      // Toggle
      if (stateId === selectedStateId) {
        selectedAdmin2FeatureId = null;
        onStateSelect(null);
      } else {
        selectedAdmin2FeatureId = feat.id;
        m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: feat.id }, { selected: true });
        onStateSelect(stateId);
      }
    });
  }

  function setupHoverEvents(m, popup, getActiveLayers) {
    m.on('mouseenter', 'breadbaskets-layer', (e) => {
      if (!getActiveLayers().includes('breadbaskets')) return;
      m.getCanvas().style.cursor = 'crosshair';
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      const methodKey = (BREADBASKET_METHODS[selectedMethod] || BREADBASKET_METHODS.zscore).key;
      const code = decodePackedC(props.c, methodKey);
      const key = FOOD_GROUP_BY_CODE[code];
      const fg = FOOD_GROUP_COLORS[key] || { label: String(code), color: '#888', desc: '' };
      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `<div class="popup-title">
            <span class="popup-swatch" style="background:${fg.color}"></span>
            ${fg.label}
          </div>
          ${fg.desc ? `<div class="popup-desc">${fg.desc}</div>` : ''}`
        )
        .addTo(m);
    });

    m.on('mouseleave', 'breadbaskets-layer', () => {
      m.getCanvas().style.cursor = '';
      popup.remove();
    });
  }

  // Expose flyTo for search bar
  export function flyTo(lng, lat, zoom = 5) {
    if (mapRef) {
      mapRef.flyTo({ center: [lng, lat], zoom, duration: 1500 });
    }
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
        color:           'rgb(18, 16, 13)',
        'high-color':    'rgb(24, 21, 17)',
        'horizon-blend': 0.008,
        'space-color':   'rgb(8, 7, 5)',
        'star-intensity': 0.4,
      });

      const style = m.getStyle();
      if (style && style.layers) {
        for (const layer of style.layers) {
          if (layer.id === 'land' && layer.type === 'background') {
            m.setPaintProperty('land', 'background-color', '#201e1a');
          }
          if (layer.id === 'water' && layer.type === 'fill') {
            m.setPaintProperty('water', 'fill-color', '#161410');
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
      setupCountryEvents(m);
      setupAdmin2Events(m);
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

        // Update color expression based on selected classification method
        const methodKey = (BREADBASKET_METHODS[selectedMethod] || BREADBASKET_METHODS.zscore).key;
        m.setPaintProperty('breadbaskets-layer', 'circle-color', buildFoodGroupColorExpr(methodKey));
      }

      // Food-group filter (extract the active method's code from packed `c`)
      const methodKey = (BREADBASKET_METHODS[selectedMethod] || BREADBASKET_METHODS.zscore).key;
      if (selectedFoodGroup) {
        const code = FOOD_GROUP_CODES[selectedFoodGroup];
        m.setFilter('breadbaskets-layer', ['==', methodCodeExpr(methodKey), code]);
      } else {
        m.setFilter('breadbaskets-layer', null);
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

    // Sync country selection highlight
    if (selectedCountryId == null && selectedCountryFeatureId !== null) {
      m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: selectedCountryFeatureId }, { selected: false });
      selectedCountryFeatureId = null;
    }

    // Sync admin2 selection highlight
    if (selectedStateId == null && selectedAdmin2FeatureId !== null) {
      m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: selectedAdmin2FeatureId }, { selected: false });
      selectedAdmin2FeatureId = null;
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
