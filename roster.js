// Fetch and parse CSV, then render roster by week
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    // Handle quoted URLs and commas
    const match = line.match(/(?:"([^"]*)"|([^,]+))/g);
    const values = match ? match.map(v => v.replace(/^"|"$/g, '')) : line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    obj.jersey_number = parseInt(obj.jersey_number, 10);
    obj.week = parseInt(obj.week, 10);
    return obj;
  });
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}

async function loadRoster() {
  const res = await fetch('roster_info.csv');
  const text = await res.text();
  return parseCSV(text);
}

function renderRoster(roster, week) {
  const filtered = roster.filter(p => p.week === week);
  const bySide = groupBy(filtered, 'team_side');
  const sectionOrder = ['Offense', 'Defense', 'Special Teams'];
  const rosterDiv = document.getElementById('roster');
  rosterDiv.innerHTML = '';
  sectionOrder.forEach(side => {
    if (!bySide[side]) return;
    const section = document.createElement('div');
    section.className = 'section';
    section.innerHTML = `<h2>${side}</h2>`;
    const byPosition = groupBy(bySide[side], 'position');
    Object.keys(byPosition).sort().forEach(pos => {
      const posGroup = document.createElement('div');
      posGroup.className = 'position-group';
      posGroup.innerHTML = `<h3>${pos}</h3>`;
      const playersDiv = document.createElement('div');
      playersDiv.className = 'players';
      byPosition[pos].forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
          <img src="${player.headshot_url}" alt="${player.player_name}">
          <div class="player-info">
            <span class="player-name">${player.player_name}</span>
            <span class="player-meta">#${player.jersey_number} | ${player.position}</span>
          </div>
        `;
        playersDiv.appendChild(card);
      });
      posGroup.appendChild(playersDiv);
      section.appendChild(posGroup);
    });
    rosterDiv.appendChild(section);
  });
}

function populateWeeks(roster) {
  const weekSet = new Set(roster.map(p => p.week));
  const weeks = Array.from(weekSet).sort((a, b) => a - b);
  const select = document.getElementById('week');
  select.innerHTML = weeks.map(w => `<option value="${w}">Week ${w}</option>`).join('');
}

window.addEventListener('DOMContentLoaded', async () => {
  const roster = await loadRoster();
  populateWeeks(roster);
  const select = document.getElementById('week');
  let currentWeek = parseInt(select.value, 10) || roster[0].week;
  renderRoster(roster, currentWeek);
  select.addEventListener('change', () => {
    renderRoster(roster, parseInt(select.value, 10));
  });
});
