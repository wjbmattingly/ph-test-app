<!-- components/Navbar.vue -->

<template>
    <nav class="navbar">
      <div class="navbar-container">
        <NuxtLink to="/" class="logo-link">
          <!-- <img src="/images/logo.png" alt="Platform Logo" class="navbar-logo" /> -->
          <span class="navbar-title">Placing the Holocaust</span>
        </NuxtLink>
        <ul class="navbar-links">
          <li><NuxtLink to="/explore">Explore</NuxtLink></li>
          <li><NuxtLink to="/map">Map</NuxtLink></li>
          <li><NuxtLink to="/search">Search</NuxtLink></li>
          <li><NuxtLink to="/transcripts">Transcripts</NuxtLink></li>
          <li><NuxtLink to="/documentation">Documentation</NuxtLink></li>
          <li><NuxtLink to="/about">About</NuxtLink></li>
        </ul>
      </div>
    </nav>
  </template>
  
  <script>
  export default {
    name: 'Navbar',
  }
  </script>
  
  <style scoped>
  .navbar {
    background-color: white;
    padding: 10px 20px;
    position: sticky;
    top: 0;
    z-index: 1000;
  }
  
  .navbar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 auto;
  }
  
  .logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
  }
  
  .navbar-logo {
    width: 40px;
    height: auto;
    margin-right: 10px;
  }
  
  .navbar-title {
    font-family: 'ivypresto-text', serif;
    color: black;
    font-size: 1.5em;
    font-weight: bold;
  }
  
  .navbar-links {
    list-style: none;
    display: flex;
    gap: 20px;
    margin: 0;
    padding: 0;
  }
  
  .navbar-links a {
    color: black;
    text-decoration: none;
    font-size: 1em;
    transition: color 0.3s;
  }
  
  .navbar-links a:hover {
    color: gray;
  }
  </style>
  