<!-- pages/map.vue -->

<template>
  <div class="map-page">
    <Map :mapStyle="mapStyle" :center="mapCenter" :zoom="mapZoom" />
  </div>
</template>

<script>
import Map from '@/components/Map.vue'

export default {
  components: {
    Map,
  },
  data() {
    const stylePath = `${process.env.NUXT_PUBLIC_BASE_PATH || ''}/styles/style.json`
    return {
      mapStyle: stylePath, // Path to your custom style
      mapCenter: [15.2551, 52.5200], // Centered on Europe
      mapZoom: 4,
    }
  },
}
</script>

<style scoped>
.map-page {
 flex: 1;
}
</style>
