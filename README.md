# placing-holocaust-app

## Running locally (self-contained version)

The testimony search now runs fully locally: query embeddings are computed
on your machine with [transformers.js](https://huggingface.co/docs/transformers.js)
(model: `Xenova/LaBSE`, the ONNX port of `sentence-transformers/LaBSE`), and
the Weaviate connection is configured via `.env` instead of hardcoded keys.

```bash
# 1. Install (skip the optional CUDA download; CPU inference is fine)
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install

# 2. Configure
cp .env.example .env      # then fill in WEAVIATE_API_KEY

# 3. Run
npm run dev               # http://localhost:3000
```

Notes:

- The **first vector search** downloads the LaBSE model weights (~1.8 GB,
  cached afterward under `HF_HOME` or the default HF cache). The search page
  shows progress; later searches embed in well under a second.
- All embedding happens **locally** via transformers.js — no external
  embedding services are used, ever.
- The corpus was indexed with the full `sentence-transformers/LaBSE`
  pipeline (CLS pooling → Dense+tanh → normalize). The Xenova ONNX export
  omits the Dense layer, so `server/api/embed.js` applies it explicitly
  (weights fetched once, ~2.3 MB, and cached). Verified: local vectors match
  the vectors stored in Weaviate at cosine 1.0000. Do not remove that layer —
  without it, semantic search silently returns noise.
- API endpoints: `POST /api/embed` (local embedding) and `POST /api/weaviate`
  (GraphQL proxy). Both answer `GET` with a health/config summary, which is
  handy for debugging: `curl localhost:3000/api/embed`.
- Set `EMBED_DTYPE=q8` in `.env` for a ~4x smaller model download at the cost
  of slight embedding drift.
- On macOS with Homebrew libvips installed, run installs as
  `SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --legacy-peer-deps` so sharp
  uses its prebuilt binaries instead of building from source.

## Explore (map + testimony in tandem)

`/explore` combines the gazetteer map and the testimony search in one view.
Searching highlights every mapped site named by the matching testimonies
(via the RG-number bridge in `static/data/testimony-mentions.json`);
clicking a site on the map — or a "Places named" chip on a result — runs a
search for that place and flies the map to it. The `/map` site popups and
the `/search` results toolbar both deep-link into `/explore?q=…`.
Shared query logic lives in `mixins/testimonySearch.js`.

## Testimony mentions on the map

`static/data/testimony-mentions.json` records which of the 2,892 gazetteer
sites are named in the 979 USHMM testimony transcripts (573 sites, with
per-site transcript/passage counts and RG numbers). The map's
"Mentioned in Transcripts" filter and the site popups read from this file —
it replaces the `mentioned_in_transcripts` flags baked into the PMTiles,
which missed diacritic names (Kraków, Łódź, Riga…) and all three Auschwitz
main camps.

Regenerate after transcript or gazetteer changes with:

```bash
pip install pyahocorasick
python3 scripts/compute-testimony-mentions.py
```

The script header documents the matching rules and their known limitations
(e.g. sites named after everyday English words such as "Bar" or "Luck"
cannot be matched reliably and are excluded).

## Build Setup (original notes)

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, check out the [documentation](https://nuxtjs.org).

## Special Directories

You can create the following extra directories, some of which have special behaviors. Only `pages` is required; you can delete them if you don't want to use their functionality.

### `assets`

The assets directory contains your uncompiled assets such as Stylus or Sass files, images, or fonts.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/assets).

### `components`

The components directory contains your Vue.js components. Components make up the different parts of your page and can be reused and imported into your pages, layouts and even other components.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/components).

### `layouts`

Layouts are a great help when you want to change the look and feel of your Nuxt app, whether you want to include a sidebar or have distinct layouts for mobile and desktop.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/layouts).


### `pages`

This directory contains your application views and routes. Nuxt will read all the `*.vue` files inside this directory and setup Vue Router automatically.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/docs/2.x/get-started/routing).

### `plugins`

The plugins directory contains JavaScript plugins that you want to run before instantiating the root Vue.js Application. This is the place to add Vue plugins and to inject functions or constants. Every time you need to use `Vue.use()`, you should create a file in `plugins/` and add its path to plugins in `nuxt.config.js`.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/plugins).

### `static`

This directory contains your static files. Each file inside this directory is mapped to `/`.

Example: `/static/robots.txt` is mapped as `/robots.txt`.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/static).

### `store`

This directory contains your Vuex store files. Creating a file in this directory automatically activates Vuex.

More information about the usage of this directory in [the documentation](https://nuxtjs.org/docs/2.x/directory-structure/store).

## Weaviate proxy & environment variables

Set the following env vars (e.g., in Vercel project settings):

- `WEAVIATE_URL`
- `WEAVIATE_API_KEY`
- `CORS_ALLOW_ORIGIN` (optional)

Client-side code always calls `POST /api/weaviate` (see `api/weaviate.js`) with `{ "query": "<GraphQL>" }`.

Test via curl:

```bash
curl -s -X POST https://<your-domain>/api/weaviate \
  -H "Content-Type: application/json" \
  -d '{"query":"{ Aggregate { HolocaustTestimonies { meta { count } } } }"}'
```

## Transcript build workflow

Raw transcript HTML files (with front matter) live under `content/transcripts`. Generate the public JSON index and per-transcript HTML files with:

```bash
npm run transcripts:build
```

This writes `static/data/transcripts.json` (full metadata for detail pages), `static/data/transcripts-summary.json` (lightweight listing data), and cleaned HTML copies in `static/transcript-html/`. The command runs automatically before `npm run dev`, `npm run build`, and `npm run generate`, but you can also trigger it manually after adding new source files.
