#!/usr/bin/env node
/**
 * generate-map-config.js
 *
 * Reads a PMTiles vector tile archive, computes domain values for specified fields,
 * and writes out an updated map-config.json with preset `options` for dropdowns,
 * sliders, and time-sliders.
 *
 * Usage: node scripts/generate-map-config.js <input-config.json> <tiles.pmtiles> <output-config.json>
 */
import fs from 'fs';
import path from 'path';
import { Protocol } from 'pmtiles';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

if (process.argv.length !== 5) {
  console.error('Usage: generate-map-config.js <input-config.json> <tiles.pmtiles> <output-config.json>');
  process.exit(1);
}
const [, , configPath, tilesPath, outPath] = process.argv;

// Load base config
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Open PMTiles
const protocol = new Protocol();

async function getTile(z, x, y) {
  // fetch PBF from pmtiles
  return new Promise((resolve, reject) => {
    protocol.tile({ url: `pmtiles://${tilesPath}`, z, x, y }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

async function scanTiles() {
  const domains = {};
  // initialize domains for each control
  const allCtrls = [
    ...config.dropdownFilters,
    ...Object.values(config.fieldControlsByDataset).flat()
  ];
  allCtrls.forEach(ctrl => {
    if (ctrl.type === 'dropdown' || ctrl.type === 'multi-select') domains[ctrl.field] = new Set();
    if (ctrl.type === 'slider' || ctrl.type === 'time-slider') {
      domains[ctrl.field] = { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
    }
  });

  // get tilejson to know zoom range
  const info = await new Promise((res, rej) => protocol.tileJSON({ url: `pmtiles://${tilesPath}` }, (e, tj) => e ? rej(e) : res(tj)));

  for (let z = info.minzoom; z <= info.maxzoom; z++) {
    for (let x = 0; x < Math.pow(2, z); x++) {
      for (let y = 0; y < Math.pow(2, z); y++) {
        try {
          const tileData = await getTile(z, x, y);
          const vt = new VectorTile(new Pbf(tileData));
          Object.keys(vt.layers).forEach(layerName => {
            const layer = vt.layers[layerName];
            for (let i = 0; i < layer.length; i++) {
              const feat = layer.feature(i).properties;
              allCtrls.forEach(ctrl => {
                const field = ctrl.field;
                const v = feat[field];
                if (v == null) return;
                if (ctrl.type === 'dropdown' || ctrl.type === 'multi-select') domains[field].add(v);
                if (ctrl.type === 'slider') {
                  const n = Number(v);
                  if (!isNaN(n)) {
                    domains[field].min = Math.min(domains[field].min, n);
                    domains[field].max = Math.max(domains[field].max, n);
                  }
                }
                if (ctrl.type === 'time-slider') {
                  let d = Date.parse(v);
                  if (isNaN(d)) {
                    // adjust 20xx → 19xx
                    const parts = v.split('-');
                    let yr = parseInt(parts[0], 10);
                    if (yr >= 2000) yr -= 100;
                    d = Date.parse(`${yr}-${parts[1]}-${parts[2]}`);
                  }
                  if (!isNaN(d)) {
                    domains[field].min = Math.min(domains[field].min, d);
                    domains[field].max = Math.max(domains[field].max, d);
                  }
                }
              });
            }
          });
        } catch (err) {
          // ignore missing tiles (no data)
        }
      }
    }
  }

  // convert sets to sorted arrays or range objects
  allCtrls.forEach(ctrl => {
    const field = ctrl.field;
    if (ctrl.type === 'dropdown' || ctrl.type === 'multi-select') {
      config.fieldControlsByDataset = config.fieldControlsByDataset; // unchanged structure
      config.dropdownFilters = config.dropdownFilters;             // unchanged
      // attach options
      if (ctrl.options === undefined) ctrl.options = Array.from(domains[field]).sort();
    }
    if (ctrl.type === 'slider' || ctrl.type === 'time-slider') {
      ctrl.options = {
        min: domains[field].min,
        max: domains[field].max
      };
    }
  });

  // write updated config
  fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
  console.log('Updated config written to', outPath);
}

scanTiles().catch(err => {
  console.error('Error scanning PMTiles:', err);
  process.exit(1);
});
