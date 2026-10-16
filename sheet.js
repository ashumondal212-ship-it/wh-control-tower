const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRaZXpB6uEaylgtugQfxqTFSgLMypAxopCvLfUrwn_pnmZ-NukGvpJyABqed6-4GA/pub?output=csv';

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"' && quoted && next === '"') { cell += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && next === '\n') i++;
      row.push(cell); if (row.some(v => v.trim() !== '')) rows.push(row);
      row = []; cell = '';
    } else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); if (row.some(v => v.trim() !== '')) rows.push(row); }
  return rows;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch(CSV_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error(`Google Sheets returned ${response.status}`);
    const csv = await response.text();
    const parsed = parseCSV(csv);
    if (parsed.length < 2) throw new Error('No tabular data found. Check that the sheet is published as CSV.');
    const headers = parsed[0].map((h, i) => (h || `Column ${i + 1}`).trim());
    const rows = parsed.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])));
    res.status(200).json({ updatedAt: new Date().toISOString(), headers, rows, count: rows.length });
  } catch (error) {
    res.status(502).json({ error: 'Could not read the published Google Sheet.', details: error.message });
  }
};
