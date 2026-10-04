const searchInput = document.getElementById("search");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("count");
const clearBtn = document.getElementById("clear");
const dataInfo = document.getElementById("data-info");

let entries = [];

const normalize = (value) =>
  value
    .toLocaleLowerCase("de-DE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function highlight(value, query) {
  const safeValue = escapeHtml(value);
  if (!query) return safeValue;

  const normalizedValue = normalize(value);
  const normalizedQuery = normalize(query);
  const index = normalizedValue.indexOf(normalizedQuery);

  if (index < 0) return safeValue;

  return (
    escapeHtml(value.slice(0, index)) +
    "<mark>" +
    escapeHtml(value.slice(index, index + query.length)) +
    "</mark>" +
    escapeHtml(value.slice(index + query.length))
  );
}

function score(entry, query) {
  if (!query) return 0;

  const q = normalize(query);
  const abbreviation = normalize(entry.abkuerzung);
  const term = normalize(entry.begriff);

  if (abbreviation === q) return 100;
  if (abbreviation.startsWith(q)) return 80;
  if (term === q) return 75;
  if (term.startsWith(q)) return 65;
  if (abbreviation.includes(q)) return 55;
  if (term.includes(q)) return 50;

  return -1;
}

function render() {
  const query = searchInput.value.trim();

  const filtered = entries
    .map((entry) => ({
      item: entry,
      score: score(entry, query)
    }))
    .filter((result) => !query || result.score >= 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.begriff.localeCompare(b.item.begriff, "de")
    );



  clearBtn.style.display = query ? "block" : "none";

  if (!filtered.length) {
    resultsEl.innerHTML = `
      <div class="empty">
        <strong>Kein Treffer</strong>
        Versuche eine Abkürzung, einen Teil des Begriffs
        oder eine andere Schreibweise.
      </div>
    `;
    return;
  }

  resultsEl.innerHTML = filtered
    .map(({ item }) => `
      <article class="card">
        <div class="top">
          <div class="abbr">
            ${highlight(item.abkuerzung, query)}
          </div>

          <div>
            <div class="term">
              ${highlight(item.begriff, query)}
            </div>
          </div>
        </div>
      </article>
    `)
    .join("");
}

async function loadData() {
  try {
    const response = await fetch("../data/terms.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    entries = data.entries ?? [];

 

    render();
  } catch (error) {
    console.error(error);

    dataInfo.textContent = "Fehler beim Laden der Begriffsdaten";

    resultsEl.innerHTML = `
      <div class="empty">
        <strong>Daten konnten nicht geladen werden</strong>
        Bitte starte die Anwendung über einen kleinen lokalen Webserver.
        Ein direktes Öffnen der HTML-Datei per Doppelklick kann den
        Browser-Zugriff auf JSON-Dateien blockieren.
      </div>
    `;
  }
}

searchInput.addEventListener("input", render);

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  render();
});

loadData();