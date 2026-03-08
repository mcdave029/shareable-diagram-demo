#!/usr/bin/env node
// Generate a standalone HTML diagram from a JSON spec
const fs = require('fs');

const input = process.argv[2];
const output = process.argv[3] || 'diagram.html';
if (!input) {
  console.error('Usage: node generate_html.js <spec.json> <output.html?>');
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(input, 'utf8'));

const defaults = {
  primary: '#0F62FE',
  secondary: '#161616',
  accent: '#FF6A3D',
  bg: '#F7F9FB',
  panel: '#FFFFFF',
  text: '#1B1B1B',
  muted: '#6F6F6F',
  border: '#E0E6ED',
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  radius: 10,
  shadow: '0 8px 20px rgba(0,0,0,0.08)',
  spacing: 12
};

const theme = { ...defaults, ...(spec.theme || {}) };
const type = (spec.type || 'flow').toLowerCase();

const statusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'done') return '#12b76a';
  if (s === 'doing' || s === 'in-progress') return theme.primary;
  if (s === 'risk') return theme.accent;
  return theme.muted;
};

const renderStatus = (status) => status ? `<span class="badge" style="color:${statusColor(status)};background:${statusColor(status)}1a">${status}</span>` : '';

const escape = (str = '') => String(str)
  .replace(/&/g,'&amp;')
  .replace(/</g,'&lt;')
  .replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;');

const renderFlow = (data = {}) => {
  const nodes = data.nodes || [];
  return `
    <div class="flow">
      ${nodes.map((n, i) => `
        <div class="flow-row">
          <div class="dot" style="background:${statusColor(n.status)}"></div>
          <div class="flow-card">
            <div class="flow-title">${escape(n.label || n.id || 'Step')}</div>
            <div class="flow-detail">${escape(n.detail || '')}</div>
            ${renderStatus(n.status)}
          </div>
        </div>
        ${i < nodes.length - 1 ? `<div class="connector"></div>` : ''}
      `).join('')}
    </div>
  `;
};

const renderTimeline = (data = {}) => {
  const items = data.items || [];
  return `
    <div class="timeline">
      ${items.map((item, idx) => `
        <div class="time-item">
          <div class="time-dot" style="border-color:${statusColor(item.status)}"></div>
          <div class="time-card">
            <div class="time-date">${escape(item.date || '')}</div>
            <div class="time-title">${escape(item.label || 'Milestone')}</div>
            <div class="time-detail">${escape(item.detail || '')}</div>
            ${renderStatus(item.status)}
          </div>
        </div>
        ${idx < items.length -1 ? '<div class="time-line"></div>' : ''}
      `).join('')}
    </div>
  `;
};

const renderLanes = (data = {}) => {
  const lanes = data.lanes || [];
  return `
    <div class="lanes">
      ${lanes.map(l => `
        <div class="lane">
          <div class="lane-title">${escape(l.name || 'Lane')}</div>
          <div class="lane-steps">
            ${(l.steps || []).map(s => `
              <div class="lane-card">
                <div class="lane-label">${escape(s.label || '')}</div>
                <div class="lane-detail">${escape(s.detail || '')}</div>
                ${renderStatus(s.status)}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
};

const renderKPI = (data = {}) => {
  const cards = data.cards || [];
  return `
    <div class="kpi-grid">
      ${cards.map(c => `
        <div class="kpi-card">
          <div class="kpi-label">${escape(c.label || '')}</div>
          <div class="kpi-value">${escape(c.value || '')}</div>
          ${c.delta ? `<div class="kpi-delta">${escape(c.delta)}</div>` : ''}
          ${c.footnote ? `<div class="kpi-foot">${escape(c.footnote)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
};

const renderComparison = (data = {}) => {
  const columns = data.columns || [];
  const rows = data.rows || [];
  return `
    <div class="comparison">
      <div class="comp-head">
        <div class="comp-cell label"></div>
        ${columns.map(c => `<div class="comp-cell">${escape(c.name || '')}</div>`).join('')}
      </div>
      ${rows.map(r => `
        <div class="comp-row">
          <div class="comp-cell label">${escape(r.label || '')}</div>
          ${(r.values || []).map(v => `<div class="comp-cell">${escape(v)}</div>`).join('')}
        </div>
      `).join('')}
    </div>
  `;
};

const renderer = {
  flow: renderFlow,
  timeline: renderTimeline,
  lanes: renderLanes,
  kpi: renderKPI,
  comparison: renderComparison,
}[type] || renderFlow;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escape(spec.title || 'Diagram')}</title>
<style>
  :root {
    --primary: ${theme.primary};
    --secondary: ${theme.secondary};
    --accent: ${theme.accent};
    --bg: ${theme.bg};
    --panel: ${theme.panel};
    --text: ${theme.text};
    --muted: ${theme.muted};
    --border: ${theme.border};
    --radius: ${theme.radius}px;
    --shadow: ${theme.shadow};
    --spacing: ${theme.spacing}px;
    --font: ${theme.fontFamily};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: var(--font);
    background: radial-gradient(circle at 10% 20%, #f4f7ff 0, transparent 26%),
                radial-gradient(circle at 90% 10%, #eef5ff 0, transparent 22%),
                var(--bg);
    color: var(--text);
    padding: 40px;
  }
  .canvas {
    max-width: 1240px;
    margin: 0 auto;
    display: grid;
    gap: 14px;
  }
  h1 { margin: 0 0 6px 0; letter-spacing: -0.01em; }
  .desc { color: var(--muted); margin: 0 0 12px 0; }
  .panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) + 2px);
    box-shadow: 0 14px 40px rgba(15,23,42,0.08);
    padding: 26px 26px 22px;
  }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: rgba(15,98,254,0.08);
    color: var(--primary);
  }
  /* Flow */
  .flow { display: grid; gap: calc(var(--spacing) * 1.4); position: relative; counter-reset: step; }
  .flow-row { display: grid; grid-template-columns: auto 1fr; gap: var(--spacing); align-items: start; }
  .dot { width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px var(--border); margin-top: 4px; position: relative; background: var(--primary); }
  .dot::after { counter-increment: step; content: counter(step); position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 700; }
  .flow-card {
    background: linear-gradient(135deg, rgba(15,98,254,0.02), rgba(15,98,254,0));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 18px;
    box-shadow: var(--shadow);
  }
  .flow-title { font-weight: 750; letter-spacing: -0.01em; }
  .flow-detail { color: var(--muted); margin: 6px 0 8px 0; line-height: 1.45; }
  .connector { width: 2px; background: linear-gradient(180deg, var(--border), rgba(15,98,254,0.25)); height: 26px; margin-left: 9px; justify-self: center; border-radius: 999px; }
  /* Timeline */
  .timeline { display: grid; gap: calc(var(--spacing) * 1.6); position: relative; }
  .timeline::before { content: ""; position: absolute; left: 10px; top: 12px; bottom: 12px; width: 2px; background: linear-gradient(180deg, var(--border), rgba(15,98,254,0.2)); border-radius: 999px; }
  .time-item { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; position: relative; }
  .time-dot { width: 18px; height: 18px; border: 3px solid #fff; border-radius: 50%; background: var(--primary); box-shadow: 0 0 0 2px var(--border); margin-top: 4px; }
  .time-card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; box-shadow: var(--shadow); min-width: 220px; }
  .time-date { font-size: 12px; color: var(--muted); font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
  .time-title { font-weight: 750; margin-top: 2px; letter-spacing: -0.01em; }
  .time-detail { color: var(--muted); margin: 6px 0 8px 0; line-height: 1.45; }
  /* Lanes */
  .lanes { display: grid; gap: calc(var(--spacing) * 1.1); }
  .lane { background: linear-gradient(135deg, rgba(15,98,254,0.04), rgba(15,98,254,0)); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px; }
  .lane-title { font-weight: 750; margin-bottom: 10px; color: var(--secondary); letter-spacing: -0.01em; }
  .lane-steps { display: flex; gap: var(--spacing); flex-wrap: wrap; }
  .lane-card { background: var(--panel); border: 1px dashed var(--border); border-radius: var(--radius); padding: 12px 14px; min-width: 160px; box-shadow: 0 8px 24px rgba(15,23,42,0.06); }
  .lane-label { font-weight: 700; }
  .lane-detail { color: var(--muted); margin: 6px 0; line-height: 1.4; }
  /* KPI */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--spacing); }
  .kpi-card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 18px; display: grid; gap: 6px; }
  .kpi-label { color: var(--muted); font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.04em; }
  .kpi-value { font-size: 30px; font-weight: 800; letter-spacing: -0.01em; }
  .kpi-delta { color: var(--accent); font-weight: 700; }
  .kpi-foot { color: var(--muted); font-size: 12px; }
  /* Comparison */
  .comparison { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
  .comp-head, .comp-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
  .comp-cell { padding: 14px 16px; background: var(--panel); border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); }
  .comp-cell.label { background: #eef2ff; font-weight: 750; color: var(--secondary); letter-spacing: -0.01em; }
  .comp-row:last-child .comp-cell { border-bottom: none; }
  .comp-row .comp-cell:last-child, .comp-head .comp-cell:last-child { border-right: none; }
</style>
</head>
<body>
  <div class="canvas">
    <div>
      <div class="badge">Roadmap & Integrations</div>
      <h1>${escape(spec.title || 'Diagram')}</h1>
      ${spec.description ? `<p class="desc">${escape(spec.description)}</p>` : ''}
    </div>
    <div class="panel">
      ${renderer(spec.data)}
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(output, html, 'utf8');
console.log(`Wrote ${output}`);
