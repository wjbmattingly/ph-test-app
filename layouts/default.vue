<!-- layouts/default.vue -->

<template>
  <div class="layout-container">
    <header class="header">
      <Navbar />
    </header>
    
    <main class="main-content">
      <Nuxt />
    </main>
    
  </div>
</template>

<script>
import Navbar from '~/components/Navbar.vue'

export default {
  components: {
    Navbar,
  },
  data() {
    return {
      currentYear: new Date().getFullYear(),
    }
  },
}
</script>

<style>
/* layouts/default.vue */

.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Full viewport height */
}

.header {
  /* Optional: Define a fixed height or allow it to size naturally */
  /* Example fixed height:
  height: 60px;
  */
}

.main-content {
  flex: 1; /* This makes the main content expand to fill available space */
  padding: 0px; /* Optional: Add padding as needed */
  display: flex; /* Use Flexbox to allow child to stretch */
}

.footer {
  background-color: white;
  color: black;
  text-align: center;
  padding: 2.5px 0;
}
</style>
