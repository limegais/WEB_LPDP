<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'leaflet/dist/leaflet.css';

  export let plantWeatherData: Record<string, { status: string, icon: string, temp: string, irradiance: string }> = {};

  let mapElement: HTMLDivElement;
  let map: any;

  export let plants = [
    { name: 'PLTS Gedung 3 FT', lat: -7.5619387, lng: 110.8539860, power: '3.46 h' },
    { name: 'PLTS di Indomaker', lat: -6.9329403, lng: 107.6845779, power: '3.34 h' }
  ];

  onMount(async () => {
    if (typeof window !== 'undefined') {
      const L = (await import('leaflet')).default;

      // Custom icon to fix standard leaflet marker issue in bundlers
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      map = L.map(mapElement).setView([-4.0, 115.0], 4); // Center of Indonesia

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      plants.forEach(plant => {
        const w = plantWeatherData[plant.name] || { status: 'Partly Cloudy', icon: '⛅', temp: '28°C', irradiance: '450 W/m²' };
        const popupContent = `
          <strong>${plant.name}</strong><br>
          <span style="font-size: 11px; color: #5b7383;">Eq. Hours: ${plant.power}</span>
          <hr style="margin: 6px 0; border: 0; border-top: 1px solid #eef3f5;">
          <div style="font-size: 11px; color: #5b7383; line-height: 1.4;">
            ${w.icon} <span style="color: #2b4357; font-weight: 600;">${w.status}</span><br>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>Temp: <b style="color: #17324a">${w.temp}</b></span>
              <span>Irr: <b style="color: #17324a">${w.irradiance}</b></span>
            </div>
          </div>
        `;
        L.marker([plant.lat, plant.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent);
      });
      
      // Auto fit bounds
      const group = L.featureGroup(plants.map(p => L.marker([p.lat, p.lng])));
      map.fitBounds(group.getBounds().pad(0.2));
    }
  });

  onDestroy(() => {
    if (map) {
      map.remove();
    }
  });
</script>

<div class="map-container" bind:this={mapElement}></div>

<style>
  .map-container {
    width: 100%;
    height: 100%;
    min-height: 250px;
    border-radius: 8px;
    z-index: 1;
  }
</style>
