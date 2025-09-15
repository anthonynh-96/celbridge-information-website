/* Celbridge Live Map & Places — resilient version */
(() => {
  const CELBRIDGE = { lat: 53.339, lon: -6.536 };
  const RADIUS_METERS = 2200; // trimmed radius to reduce load
  const OVERPASS_ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter"
  ];

  const map = L.map("map", { scrollWheelZoom: true }).setView([CELBRIDGE.lat, CELBRIDGE.lon], 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  const markersLayer = L.layerGroup().addTo(map);

  // DOM
  const chips = Array.from(document.querySelectorAll(".chip"));
  const searchBox = document.getElementById("searchBox");
  const statusEl = document.getElementById("status");
  const resetBtn = document.getElementById("resetBtn");
  const listEl = document.getElementById("placeList");
  const emptyEl = document.getElementById("emptyState");

  let currentCategory = "heritage";
  let currentResults = [];
  const cache = new Map(); // category -> elements

  // --- small helpers ---
  const setStatus = (t) => (statusEl.textContent = t);
  const prettyCategory = (cat) => {
    const table = { cafe: "Café", restaurant: "Restaurant", pub: "Pub", attraction: "Attraction",
      castle: "Castle", monument: "Monument", church: "Church", park: "Park", pitch: "Pitch", wood: "Woodland" };
    return table[cat] || (cat ? cat[0].toUpperCase() + cat.slice(1) : "POI");
  };
  const escapeHtml = (s) =>
    String(s || "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const distanceKm = (a, b) => {
    const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180;
    const x = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  };

  // Debounce utility
  const debounce = (fn, ms=300) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  // --- Overpass query builder (leaner) ---
function overpassQuery(category) {
  const head = `[out:json][timeout:25];
area["name"="Celbridge"]["boundary"="administrative"]["admin_level"~"8|9"]->.searchArea;`;

  const out = "out center tags;";

  if (category === "heritage") {
    return head + `
      (
        node["historic"](area.searchArea);
        way["historic"](area.searchArea);
        node["tourism"="attraction"](area.searchArea);
        way["tourism"="attraction"](area.searchArea);
        node["heritage"](area.searchArea);
        way["heritage"](area.searchArea);
      ); ${out}`;
  } else if (category === "parks") {
    return head + `
      (
        node["leisure"="park"](area.searchArea);
        way["leisure"="park"](area.searchArea);
        node["natural"="wood"](area.searchArea);
        way["natural"="wood"](area.searchArea);
        node["leisure"="pitch"](area.searchArea);
        way["leisure"="pitch"](area.searchArea);
      ); ${out}`;
  } else { // cafés & food
    return head + `
      (
        node["amenity"="cafe"](area.searchArea);
        way["amenity"="cafe"](area.searchArea);
        node["amenity"="restaurant"](area.searchArea);
        way["amenity"="restaurant"](area.searchArea);
        node["amenity"="pub"](area.searchArea);
        way["amenity"="pub"](area.searchArea);
      ); ${out}`;
  }
}


  // --- Resilient fetch: timeout, retry, mirror failover ---
  async function fetchWithRetry(body, { attempts = 4, perTryMs = 15000 } = {}) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      for (const base of OVERPASS_ENDPOINTS) {
        try {
          const controller = new AbortController();
          const to = setTimeout(() => controller.abort(), perTryMs);
          const res = await fetch(base, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: new URLSearchParams({ data: body }),
            signal: controller.signal
          });
          clearTimeout(to);

          // Handle rate-limit politely
          if (res.status === 429) {
            const retryAfter = parseInt(res.headers.get("Retry-After") || "1", 10);
            await new Promise(r => setTimeout(r, Math.min(8000, retryAfter * 1000)));
            continue; // try next mirror/attempt
          }

          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

          return await res.json();
        } catch (e) {
          lastErr = e;
          // exponential backoff between attempts
          await new Promise(r => setTimeout(r, 400 * (i + 1) * (1 + Math.random())));
        }
      }
    }
    throw lastErr || new Error("Overpass fetch failed");
  }

  function normalise(el) {
    const lat = (typeof el.lat === "number") ? el.lat : (el.center && el.center.lat);
    const lon = (typeof el.lon === "number") ? el.lon : (el.center && el.center.lon);
    const tags = el.tags || {};
    const name = tags.name || null;

    if (typeof lat !== "number" || typeof lon !== "number") return null; // guard missing geometry

    let displayName = name || tags["amenity"] || tags["historic"] || tags["tourism"] || "Unnamed";
    const category =
      tags["amenity"] || tags["historic"] || tags["tourism"] || tags["leisure"] || tags["natural"] || "poi";

    return {
      id: `${el.type}/${el.id}`,
      lat, lon,
      name,
      displayName,
      category,
      raw: el
    };
  }

  function renderMarkers(items) {
    markersLayer.clearLayers();
    items.forEach(item => {
      const m = L.marker([item.lat, item.lon]).addTo(markersLayer);
      m.bindPopup(`
        <strong>${escapeHtml(item.displayName)}</strong><br/>
        <small>${escapeHtml(prettyCategory(item.category))}</small><br/>
        <a target="_blank" rel="noopener"
           href="https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lon}#map=18/${item.lat}/${item.lon}">
          View on OpenStreetMap
        </a>
      `);
      item._marker = m;
    });
  }

  function renderList(items) {
    listEl.innerHTML = "";
    emptyEl.hidden = items.length > 0;
    items.forEach(item => {
      const li = document.createElement("li");
      li.className = "place"; li.tabIndex = 0;
      const dot = Object.assign(document.createElement("span"), { className:"dot" });
      const name = Object.assign(document.createElement("div"), { className:"name", textContent: item.displayName });
      const meta = Object.assign(document.createElement("div"), { className:"meta", textContent: prettyCategory(item.category) });
      const dist = Object.assign(document.createElement("div"), { className:"distance" });
      dist.textContent = `${distanceKm(CELBRIDGE, { lat: item.lat, lon: item.lon }).toFixed(2)} km`;
      li.append(dot, name, meta, dist);
      listEl.appendChild(li);
      li.addEventListener("mouseenter", () => item._marker?.openPopup());
      li.addEventListener("click", () => {
        if (item._marker) {
          map.setView([item.lat, item.lon], 17, { animate: true });
          item._marker.openPopup();
        }
      });
      li.addEventListener("keypress", (e) => e.key === "Enter" && li.click());
    });
  }

  function sortByDistanceThenName(items) {
    return items.sort((a,b) => {
      const da = distanceKm(CELBRIDGE, a);
      const db = distanceKm(CELBRIDGE, b);
      return da - db || (a.displayName || "").localeCompare(b.displayName || "");
    });
  }

  // --- Main loader with cache ---
  async function loadCategory(category) {
    try {
      setStatus("Loading…");
      listEl.innerHTML = ""; emptyEl.hidden = true;
      markersLayer.clearLayers();

      let items;
      if (cache.has(category)) {
        items = cache.get(category);
      } else {
        const q = overpassQuery(category);
        const data = await fetchWithRetry(q, { attempts: 4, perTryMs: 15000 });
        items = (data.elements || []).map(normalise).filter(Boolean);
        cache.set(category, items);
      }

      items = sortByDistanceThenName(items);
      currentResults = items;
      renderMarkers(items);
      renderList(items);
      setStatus(`Loaded ${items.length} place${items.length === 1 ? "" : "s"}.`);
    } catch (err) {
      console.error(err);
      setStatus("Error loading places.");
      emptyEl.hidden = false;
      emptyEl.textContent = "Couldn’t load data (rate-limit or timeout). Please try again.";
    }
  }

  // --- UI wiring with debounce (avoid spamming the API) ---
  const onChipClick = (chip) => {
    chips.forEach(c => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    currentCategory = chip.dataset.category;
    searchBox.value = "";
    loadCategory(currentCategory);
  };
  chips.forEach(chip => chip.addEventListener("click", debounce(() => onChipClick(chip), 100)));

  resetBtn.addEventListener("click", () => {
    map.setView([CELBRIDGE.lat, CELBRIDGE.lon], 14);
    searchBox.value = "";
    renderList(currentResults);
  });

  searchBox.addEventListener("input", debounce(() => {
    const q = searchBox.value.trim().toLowerCase();
    const filtered = currentResults.filter(p => (p.displayName || "").toLowerCase().includes(q));
    renderList(filtered);
  }, 150));

  // Initial
  loadCategory(currentCategory);
})();
