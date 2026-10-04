const fs = require('fs');

const harPath = 'D:/Proyectos/dt_game/docs/localhost.har';
if (!fs.existsSync(harPath)) {
  console.log('File does not exist:', harPath);
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync(harPath, 'utf8'));
const entries = content.log.entries;
console.log('=== HAR ANALYSIS: localhost.har ===');
console.log('Total entries:', entries.length);

const summary = {};
let totalTime = 0;
const duplicateTracker = {};

entries.forEach((e, idx) => {
  const url = e.request.url;
  const time = e.time;
  totalTime += time;
  
  // Categorize
  let cleanUrl = url;
  if (url.includes('supabase.co')) {
    const parts = url.split('/rest/v1/');
    cleanUrl = '[supabase] ' + (parts[1] ? parts[1] : url);
  } else if (url.includes('localhost')) {
    const parts = url.split('localhost:5173');
    cleanUrl = '[local] ' + (parts[1] ? parts[1] : url);
  }

  // Count exact duplicate requests within close timing
  const queryString = url.split('?')[1] || '';
  const key = `${e.request.method} ${cleanUrl}`;
  if (!duplicateTracker[key]) duplicateTracker[key] = [];
  duplicateTracker[key].push({ time, startedDateTime: e.startedDateTime });

  const pathOnly = cleanUrl.split('?')[0];
  if (!summary[pathOnly]) {
    summary[pathOnly] = { count: 0, totalTime: 0, times: [], method: e.request.method };
  }
  summary[pathOnly].count++;
  summary[pathOnly].totalTime += time;
  summary[pathOnly].times.push(Math.round(time));
});

console.log('\n--- TOP ENDPOINTS BY TOTAL TIME SPENT ---');
const sorted = Object.entries(summary).sort((a,b) => b[1].totalTime - a[1].totalTime);
sorted.slice(0, 25).forEach(([path, data]) => {
  console.log(`${path}`);
  console.log(`   Count: ${data.count} | Total: ${Math.round(data.totalTime)}ms | Avg: ${Math.round(data.totalTime / data.count)}ms | Times: [${data.times.slice(0, 6).join('ms, ')}ms]`);
});

console.log('\n--- EXACT DUPLICATE REQUESTS (POSSIBLE WASTED FETCHES) ---');
Object.entries(duplicateTracker)
  .filter(([_, list]) => list.length > 1)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .forEach(([key, list]) => {
    console.log(`${key} -> x${list.length} calls (latencies: ${list.map(l => Math.round(l.time) + 'ms').join(', ')})`);
  });
