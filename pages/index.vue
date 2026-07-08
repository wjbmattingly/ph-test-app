<!-- pages/index.vue -->

<template>
  <div class="landing">
    <div class="intro">
      <h1>Why did places matter in the Holocaust?</h1>
      <p>The Holocaust was not limited to iconic places like Auschwitz and the Warsaw ghetto. It transformed
      ordinary places – city streets, public squares, farm fields, forests. The Nazi regime and their
      collaborators created thousands of places where civilians were confined, tortured, exploited, and killed.
      The violence inspired their targets to create safe spaces, places to hide and resist. This interactive
      website is the first place-based, text and mapping platform for studying where, and how, the Holocaust
      unfolded, as described in survivor testimonies and perpetrator documents. Explore the geographies of
      the Holocaust from the scale of the continent to one person’s experience.</p>
    </div>

    <NuxtLink to="/explore" class="primary-cta">
      <span class="cta-title">Explore testimony and territory together</span>
      <span class="cta-sub">
        Search nearly 1,000 survivor testimonies and see the camps and ghettos they name
        light up on the map — or start from a place and hear how survivors spoke about it.
      </span>
    </NuxtLink>

    <div class="secondary-links">
      <NuxtLink to="/map">
        <span class="link-title">Map</span>
        <span class="link-sub">Camps and ghettos with full attribute filters</span>
      </NuxtLink>
      <NuxtLink to="/search">
        <span class="link-title">Search</span>
        <span class="link-sub">Testimony search with biographic filters</span>
      </NuxtLink>
      <NuxtLink to="/transcripts">
        <span class="link-title">Transcripts</span>
        <span class="link-sub">Browse the full interview library</span>
      </NuxtLink>
      <NuxtLink to="/documentation">
        <span class="link-title">Documentation</span>
        <span class="link-sub">Place categories and dataset fields</span>
      </NuxtLink>
      <NuxtLink to="/about">
        <span class="link-title">About</span>
        <span class="link-sub">The project, funding, and staff</span>
      </NuxtLink>
    </div>

    <div class="logo">
      <img src="/media/UMaine_fullcrest_logo4c_gray.png" alt="University of Maine" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
}
</script>

<style scoped>
.landing {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 32px;
}

.intro {
  max-width: 820px;
}

h1 {
  color: black;
  font-size: 2.6em;
  margin: 0 0 16px;
}

.intro p {
  font-family: 'usual', sans-serif;
  font-size: 1.1em;
  line-height: 1.65;
  color: #2c3e50;
  margin: 0;
}

/* Primary call-to-action */
.primary-cta {
  display: block;
  max-width: 820px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 36px;
  padding: 22px 26px;
  background: #000;
  color: #fff;
  border-radius: 12px;
  text-decoration: none;
  transition: transform 0.12s, box-shadow 0.12s;
}
.primary-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}
.cta-title {
  display: block;
  font-size: 1.35em;
  font-weight: 700;
  margin-bottom: 6px;
}
.cta-sub {
  display: block;
  font-family: 'usual', sans-serif;
  font-weight: 300;
  font-size: 0.95em;
  line-height: 1.5;
  color: #d8d8d8;
}

/* Secondary links */
.secondary-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  max-width: 820px;
  width: 100%;
  margin-top: 16px;
}
.secondary-links a {
  display: block;
  padding: 14px 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  text-decoration: none;
  color: #111;
  background: #fff;
  transition: border-color 0.12s, background 0.12s;
}
.secondary-links a:hover {
  border-color: #000;
  background: #fafafa;
}
.link-title {
  display: block;
  font-weight: 700;
  margin-bottom: 3px;
}
.link-sub {
  display: block;
  font-family: 'usual', sans-serif;
  font-weight: 300;
  font-size: 0.83em;
  color: #666;
  line-height: 1.4;
}

/* Logo: in flow, bottom of the page (no overlap on short screens) */
.logo {
  margin-top: 48px;
}
.logo img {
  width: 170px;
  height: auto;
}

@media (max-width: 600px) {
  h1 { font-size: 1.9em; }
  .landing { padding: 28px 16px; }
}
</style>
