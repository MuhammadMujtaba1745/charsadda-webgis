// Base maps
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
});
const satellite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
);

const map = L.map('map', { center: [34.2, 71.75], zoom: 10, layers: [osm] });
L.control.layers({ 'OpenStreetMap': osm, 'Satellite': satellite }).addTo(map);
L.control.scale().addTo(map);

// Colours per category
const colors = {
  'Stadium': '#d32f2f',
  'Sports Ground': '#1976d2',
  'Park': '#388e3c',
  'Zoo': '#f57c00'
};

function popupHtml(p) {
  const v = x => (x && x.trim() !== '') ? x : 'Not recorded';
  return `
    <div class="popup-title">${p.name}</div>
    <table class="popup-table">
      <tr><td>Category:</td><td>${v(p.category)}</td></tr>
      <tr><td>Sport:</td><td>${v(p.sport)}</td></tr>
      <tr><td>Description:</td><td>${v(p.description)}</td></tr>
    </table>`;
}

// Fetch data from OUR API (PostGIS -> Express -> Leaflet)
fetch('/api/facilities')
  .then(res => res.json())
  .then(data => {
    const layer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 9,
          fillColor: colors[feature.properties.category] || '#757575',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9
        }),
      onEachFeature: (feature, lyr) => {
        lyr.bindPopup(popupHtml(feature.properties));
        feature.properties._marker = lyr; // link marker to its feature
      }
    }).addTo(map);

    document.getElementById('count').textContent = data.features.length;
    map.fitBounds(layer.getBounds().pad(0.1));

    // Build the sidebar list
    const listDiv = document.getElementById('locationList');
    data.features
      .slice()
      .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
      .forEach(f => {
        const item = document.createElement('div');
        item.className = 'loc-item';
        item.style.borderLeftColor = colors[f.properties.category] || '#757575';
        item.innerHTML = `${f.properties.name}<div class="loc-category">${f.properties.category || ''}</div>`;
        item.addEventListener('click', () => {
          const marker = f.properties._marker;
          map.flyTo(marker.getLatLng(), 15);
          marker.openPopup();
        });
        listDiv.appendChild(item);
      });
  })
  .catch(err => {
    console.error(err);
    alert('Could not load data from the API. Is the server running?');
  });

// Legend
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML = '<h4>Legend</h4>' +
    Object.entries(colors).map(([k, c]) =>
      `<div><i style="background:${c}"></i>${k}</div>`).join('');
  return div;
};
legend.addTo(map);