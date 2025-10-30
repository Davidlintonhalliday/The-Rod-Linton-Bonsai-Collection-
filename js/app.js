window.RLB = {
  async loadJSON(path) {
    try {
      const r = await fetch(path);
      if (!r.ok) throw new Error(r.statusText);
      return await r.json();
    } catch (e) {
      console.error("Failed to load", path, e);
      return null;
    }
  },

  fmt: {
    cm(v) { return v ? v + " cm" : "—"; },
    years(v) { return v ? v + (v == 1 ? " year" : " years") : "—"; }
  },

  async renderCollection() {
    const data = await RLB.loadJSON("data/trees.json");
    if (!data) {
      document.getElementById("collection-grid").innerHTML = "<p>Could not load catalogue.</p>";
      return;
    }

    const grid = document.getElementById("collection-grid");
    const q = document.getElementById("q");
    const speciesSel = document.getElementById("species");
    const styleSel = document.getElementById("style");

    const species = [...new Set(data.map(x => x.species))].sort();
    const styles = [...new Set(data.map(x => x.style))].sort();

    speciesSel.innerHTML = "<option value=''>All species</option>" + species.map(s => `<option>${s}</option>`).join("");
    styleSel.innerHTML = "<option value=''>All styles</option>" + styles.map(s => `<option>${s}</option>`).join("");

    function draw() {
      const term = (q.value || "").toLowerCase().trim();
      const sp = speciesSel.value;
      const st = styleSel.value;

      const filtered = data.filter(item => {
        const matchesTerm = !term || [item.name, item.species, item.style, item.notes].join(" ").toLowerCase().includes(term);
        const matchesSp = !sp || item.species === sp;
        const matchesSt = !st || item.style === st;
        return matchesTerm && matchesSp && matchesSt;
      });

      grid.innerHTML = filtered.map(item => {
        const img = item.photos?.[0] || "assets/placeholder-bonsai.jpg";
        return `
          <article class="item">
            <a href="tree.html?id=${encodeURIComponent(item.id)}">
              <img src="${img}" alt="${item.species} bonsai: ${item.name}">
            </a>
            <div class="meta pad">
              <div class="small">${item.species} • ${item.style}</div>
              <h3>${item.name}</h3>
              <div class="small">Age: ${RLB.fmt.years(item.age_years)} | Height: ${RLB.fmt.cm(item.height_cm)}</div>
            </div>
          </article>
        `;
      }).join("");
    }

    q.addEventListener("input", draw);
    speciesSel.addEventListener("change", draw);
    styleSel.addEventListener("change", draw);
    draw();
  },

  async renderTree() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const data = await RLB.loadJSON("data/trees.json");
    if (!data) {
      document.getElementById("tree").innerHTML = "<p>Could not load item.</p>";
      return;
    }
    const item = data.find(x => String(x.id) === String(id));
    if (!item) {
      document.getElementById("tree").innerHTML = "<p>Item not found.</p>";
      return;
    }

    const photos = (item.photos?.length ? item.photos : ["assets/placeholder-bonsai.jpg"])
      .map(src => `<img src="${src}" alt="${item.species} — ${item.name}">`)
      .join("");

    document.title = `${item.name} — Rod Linton Bonsai`;

    document.getElementById("tree").innerHTML = `
      <div class="grid cols-3">
        <div class="card pad" style="grid-column: span 2;">
          <span class="badge">${item.species} • ${item.style}</span>
          <h1>${item.name}</h1>
          <p class="small">Age: ${RLB.fmt.years(item.age_years)} | Height: ${RLB.fmt.cm(item.height_cm)} | Pot: ${item.pot || "—"}</p>
          <p>${item.notes || ""}</p>
          <table class="table">
            <tr><th>Watering</th><td>${item.care?.watering || "—"}</td></tr>
            <tr><th>Pruning</th><td>${item.care?.pruning || "—"}</td></tr>
            <tr><th>Wiring</th><td>${item.care?.wiring || "—"}</td></tr>
            <tr><th>Repotting</th><td>${item.care?.repotting || "—"}</td></tr>
            <tr><th>Substrate</th><td>${item.care?.substrate || "—"}</td></tr>
          </table>
        </div>
        <div class="card pad">
          <h3>Photo Gallery</h3>
          <div class="gallery">${photos}</div>
        </div>
      </div>
    `;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("collection-grid")) RLB.renderCollection();
  if (document.getElementById("tree")) RLB.renderTree();
});
