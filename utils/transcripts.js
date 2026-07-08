export async function getTranscriptsManifest(kind = 'full') {
  const fileName = kind === 'summary' ? 'transcripts-summary.json' : 'transcripts.json';
  if (process.server) {
    try {
      const fs = eval('require')('fs');
      const path = eval('require')('path');
      const candidatePaths = [
        path.join(process.cwd(), 'static', 'data', fileName),
        path.join(process.cwd(), 'platform', 'static', 'data', fileName)
      ];
      const found = candidatePaths.find(p => fs.existsSync(p));
      if (!found) return null;
      const raw = fs.readFileSync(found, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read transcripts manifest:', err);
      return null;
    }
  }

  const basePath = process.env.NUXT_PUBLIC_BASE_PATH || '';
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
  const prefixes = [basePath, origin, ''];
  const paths = [
    (bp) => `${bp}/data/${fileName}`,
    (bp) => `${bp}/static/data/${fileName}`,
    (bp) => `${bp}/platform/static/data/${fileName}`
  ];

  const attempted = [];
  for (const bp of prefixes) {
    for (const build of paths) {
      const url = build(bp);
      attempted.push(url);
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response.json();
        }
      } catch (e) {
        // continue trying
      }
    }
  }
  console.warn(`Failed to load transcripts manifest from any candidate: ${attempted.join(', ')}`);
  return null;
}
