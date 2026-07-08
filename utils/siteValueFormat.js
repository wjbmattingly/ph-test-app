// utils/siteValueFormat.js
//
// Presentation formatting for gazetteer site attribute values, shared by
// the map popup and the explore side panel:
//   - "1941-06-24"            -> "June 24, 1941"
//   - "17200"                 -> "17,200"   (years like 1941 left alone)
//   - "a;b;c"                 -> { kind: 'list', items: [...] }

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function formatScalar(raw) {
  const s = (raw ?? '').toString().trim();
  if (!s) return '';

  // ISO date -> readable date
  const dm = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dm) {
    const [, y, m, d] = dm;
    const mi = Number(m) - 1;
    if (mi >= 0 && mi < 12) return `${MONTHS[mi]} ${Number(d)}, ${y}`;
  }

  // Plain integers -> thousands separators (but keep years as-is)
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    const looksLikeYear = n >= 1800 && n <= 2100;
    if (!looksLikeYear && n >= 1000) return n.toLocaleString('en-US');
    return s;
  }

  return s;
}

// Substantive field -> its certainty field in the gazetteer data, so
// displays can pair them ("Clear association of certainty fields to their
// substantive field(s)").
export const CERTAINTY_FIELDS = {
  StartMid_ISO: 'StartCert',
  EndMid_ISO: 'EndCert',
  GerOcMid_ISO: 'GerOcCert',
  PMaxPop: 'PMaxCert',
  GPopMax: 'GPopCert',
  Epidemic: 'EpiCert',
  Labor: 'LbCert',
  LaborType: 'LbCert',
  PopJ: 'PopJCert',
  PopJOc: 'PopJOcCert'
};

export function certaintyFor(props, field) {
  const certField = CERTAINTY_FIELDS[field];
  if (!certField || !props) return '';
  const v = (props[certField] ?? '').toString().trim().toLowerCase();
  return v && v !== 'unknown' && v !== 'unspecified' ? v : '';
}

export function formatSiteValue(raw) {
  const s = (raw ?? '').toString().trim();
  if (!s) return { kind: 'text', text: '' };

  if (s.includes(';')) {
    const items = s.split(';').map(x => formatScalar(x)).filter(Boolean);
    if (items.length > 1) return { kind: 'list', items };
    return { kind: 'text', text: items[0] || '' };
  }

  return { kind: 'text', text: formatScalar(s) };
}
