/* ==========================================================================
   EnergyScope · core — constantes, formatage, aides données, gabarits
   Version Algérie · dinars algériens · interface française
   ========================================================================== */
window.ES = (function () {
  "use strict";

  var DATA = window.ENERGY_DATA || { meta: {}, records: [], buildings: [], rates: [] };

  var C = {
    cream: "#ECDD96",
    orange: "#E66937",
    blue: "#0A69BE",
    sky: "#6EB9FF",
    red: "#EB2D23",
    green: "#7FE3B4",
    dzGreen: "#0B8A4B",
    dzRed: "#D21034",
    text: "#F6F4E9",
    muted: "#A9B3D6",
    faint: "#7D89B6"
  };
  var ENERGY_ORDER = ["Eau", "Gaz", "Électricité"];
  var ENERGY_COLOR = { "Eau": C.sky, "Gaz": C.orange, "Électricité": C.cream };
  var ENERGY_ROUTE = { "Eau": "water", "Gaz": "gas", "Électricité": "electricity" };
  var MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var ALL_FROM = DATA.meta.first;
  var ALL_TO = DATA.meta.last;

  var CITY_COORDS = {
    "Alger": [3.0588, 36.7538],
    "Oran": [-0.6417, 35.6971],
    "Constantine": [6.6147, 36.365],
    "Annaba": [7.7667, 36.9],
    "Sétif": [5.4137, 36.1911]
  };

  var CITY_LABEL = {
    "Oran": { position: "left", offset: [-6, -2] },
    "Alger": { position: "top", offset: [0, -3] },
    "Sétif": { position: "bottom", offset: [-4, 10] },
    "Constantine": { position: "right", offset: [7, 2] },
    "Annaba": { position: "top", offset: [16, -2] }
  };

  var PAGES = {
    overview: { title: "Vue d'ensemble", crumb: "Vue d'ensemble", energy: null, desc: "" },
    water: {
      title: "Eau", crumb: "Eau", energy: "Eau",
      desc: "Prélèvement d'eau potable du portefeuille — la plus grande part des dépenses énergétiques."
    },
    gas: {
      title: "Gaz", crumb: "Gaz", energy: "Gaz",
      desc: "Consommation de gaz par immeuble et par ville, avec l'évolution annuelle des tarifs."
    },
    electricity: {
      title: "Électricité", crumb: "Électricité", energy: "Électricité",
      desc: "Consommation électrique du portefeuille, pondérée par la surface des immeubles."
    }
  };

  var ICONS = {
    coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5v19M17 6.6c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.6 5 3.4 5 1.5 5 3.4-2.2 3-5 3-5-1.1-5-3"/></svg>',
    bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16v-4M12.5 16V8M17 16v-6"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>',
    pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
    droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5S5.5 9.4 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9.4 12 2.5 12 2.5Z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8Z"/></svg>',
    chevronL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    chevronR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
  };
  var ENERGY_ICON = { "Eau": ICONS.droplet, "Gaz": ICONS.flame, "Électricité": ICONS.bolt };

  var state = {
    route: "overview",
    type: "All",
    city: "All",
    building: "All",
    from: ALL_FROM,
    to: ALL_TO,
    table: { page: 1, size: 10, sortKey: "d", dir: "desc", search: "" }
  };

  var COLUMNS = [
    { key: "y", label: "Année" },
    { key: "q", label: "Trimestre" },
    { key: "m", label: "Mois" },
    { key: "c", label: "Ville" },
    { key: "b", label: "Immeuble" },
    { key: "e", label: "Énergie" },
    { key: "u", label: "Quantité", right: true },
    { key: "k", label: "Coût total (DZD)", right: true }
  ];

  /* ------------------------------------------------------------- utilities */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sum(arr, key) {
    var t = 0;
    for (var i = 0; i < arr.length; i++) t += (key ? arr[i][key] : arr[i]) || 0;
    return t;
  }
  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }

  var BUILDING_NAMES = {};
  DATA.buildings.forEach(function (b) { BUILDING_NAMES[b.id] = b.name || b.id; });
  function buildingName(id) { return BUILDING_NAMES[id] || id; }

  var nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  var nf2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var nfCompact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
  var nfRate = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  function money(v) { return nf0.format(Math.round(v || 0)) + " DZD"; }
  function money2(v) { return nf2.format(v || 0) + " DZD"; }
  function moneyCompact(v) { return nfCompact.format(v || 0) + " DZD"; }
  function unitsCompact(v) { return nfCompact.format(v || 0); }
  function unitsFull(v) { return nf0.format(v || 0); }
  function rate(v) { return nfRate.format(v || 0) + " DZD"; }
  function pct(v, d) { return Number(v || 0).toFixed(d == null ? 1 : d).replace(".", ",") + " %"; }

  function monthShort(key) { return MONTHS[Number(key.slice(5, 7)) - 1] + " " + key.slice(2, 4); }
  function monthLong(key) { return MONTHS_LONG[Number(key.slice(5, 7)) - 1] + " " + key.slice(0, 4); }
  function rangeLabel(a, b) { return monthLong(a) + " — " + monthLong(b); }

  function formatVal(v, kind) {
    if (kind === "money") return moneyCompact(v);
    if (kind === "moneyFull") return money(v);
    if (kind === "units") return unitsCompact(v);
    if (kind === "rate") return rate(v);
    if (kind === "pct") return pct(v);
    return nf0.format(v || 0);
  }

  /* ------------------------------------------------------------- selectors */
  function filterRows(st, typeOverride) {
    var type = typeOverride != null ? typeOverride
      : (st.route === "overview" ? st.type : (PAGES[st.route] || {}).energy);
    var from = st.from, to = st.to, city = st.city, building = st.building;
    return DATA.records.filter(function (r) {
      return (type === "All" || r.e === type) &&
        (city === "All" || r.c === city) &&
        (building === "All" || r.b === building) &&
        r.d >= from && r.d <= to;
    });
  }

  function monthlyAgg(rows) {
    var map = {};
    rows.forEach(function (r) {
      var o = map[r.d] || (map[r.d] = { key: r.d, cost: 0, units: 0 });
      o.cost += r.k; o.units += r.u;
    });
    return Object.keys(map).sort().map(function (k) { return map[k]; });
  }

  function groupSum(rows, key, value) {
    var map = {};
    rows.forEach(function (r) {
      map[r[key]] = (map[r[key]] || 0) + (value ? r[value] : 1);
    });
    return map;
  }

  function trendMonthly(monthly, mode) {
    if (!monthly || monthly.length < 2) return null;
    function val(arr) {
      if (mode === "rate") {
        var u = sum(arr, "units"), c = sum(arr, "cost");
        return u ? c / u : 0;
      }
      return sum(arr, mode === "units" ? "units" : "cost");
    }
    var a, b, label;
    if (monthly.length >= 24) {
      a = val(monthly.slice(-12));
      b = val(monthly.slice(-24, -12));
      label = "vs 12 mois préc.";
    } else {
      a = val(monthly.slice(-1));
      b = val(monthly.slice(-2, -1));
      label = "vs mois préc.";
    }
    return { pct: b ? ((a - b) / b) * 100 : 0, label: label };
  }

  var sparkSeq = 0;
  function sparkSvg(values, color) {
    if (!values || values.length < 2) return "";
    var w = 120, h = 34, pad = 2;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var span = max - min || 1;
    var pts = values.map(function (v, i) {
      var x = (i / (values.length - 1)) * w;
      var y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
    var area = d + " L" + w + "," + h + " L0," + h + " Z";
    sparkSeq++;
    var gid = "spark" + sparkSeq;
    return '<svg class="spark" viewBox="0 0 120 34" preserveAspectRatio="none" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity=".35"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* ------------------------------------------------------------- templates */
  function selectField(id, label, optionsHtml, disabled) {
    return '<div class="filter-field"><label for="' + id + '">' + label + '</label>' +
      '<div class="select-wrap"><select id="' + id + '"' + (disabled ? " disabled" : "") + ">" +
      optionsHtml + "</select></div></div>";
  }

  function filterBarHTML() {
    var isOverview = state.route === "overview";
    var typeOpts = '<option value="All">Toutes les énergies</option>' + ENERGY_ORDER.map(function (e) {
      return '<option value="' + e + '"' + (state.type === e ? " selected" : "") + ">" + e + "</option>";
    }).join("");
    if (!isOverview) {
      var en = PAGES[state.route].energy;
      typeOpts = '<option value="' + en + '" selected>' + en + "</option>";
    }
    var cityList = uniq(DATA.buildings.map(function (b) { return b.city; })).sort();
    var cityOpts = '<option value="All">Toutes les villes</option>' + cityList.map(function (c) {
      return '<option value="' + esc(c) + '"' + (state.city === c ? " selected" : "") + ">" + esc(c) + "</option>";
    }).join("");
    var bList = DATA.buildings.filter(function (b) { return state.city === "All" || b.city === state.city; });
    var bOpts = '<option value="All">Tous les immeubles</option>' + bList.map(function (b) {
      return '<option value="' + b.id + '"' + (state.building === b.id ? " selected" : "") + ">" +
        esc(b.name || b.id) + " · " + esc(b.city) + "</option>";
    }).join("");

    return '<div class="card filters" role="group" aria-label="Filtres du tableau de bord">' +
      '<div class="filter-row">' +
      selectField("fType", "Type de consommation", typeOpts, !isOverview) +
      selectField("fCity", "Ville", cityOpts, false) +
      selectField("fBuilding", "Immeuble", bOpts, false) +
      '<div class="filter-field"><span class="flabel">Période</span><div class="date-range">' +
      '<div class="date-input"><span>Du</span><input type="month" id="fFrom" min="' + ALL_FROM + '" max="' + ALL_TO + '" value="' + state.from + '" aria-label="Mois de début"></div>' +
      '<span class="date-sep" aria-hidden="true">→</span>' +
      '<div class="date-input"><span>Au</span><input type="month" id="fTo" min="' + ALL_FROM + '" max="' + ALL_TO + '" value="' + state.to + '" aria-label="Mois de fin"></div>' +
      "</div></div>" +
      '<button class="reset-btn" type="button" data-reset>' + ICONS.reset + " Réinitialiser</button>" +
      "</div>" +
      '<div class="filter-foot">' +
      '<div class="presets"><span class="presets-label">Raccourcis</span>' +
      '<button class="chip" type="button" data-preset="all">Tout</button>' +
      '<button class="chip" type="button" data-preset="2019">2019</button>' +
      '<button class="chip" type="button" data-preset="2018">2018</button>' +
      '<button class="chip" type="button" data-preset="1617">2016–2017</button>' +
      "</div>" +
      '<div class="filter-state" id="filterState"></div>' +
      "</div></div>";
  }

  function chartCard(o) {
    return '<article class="card chart-card ' + (o.span || "") + '" data-chart-card="' + o.name + '">' +
      '<header class="card-head"><div>' +
      '<p class="card-kicker">' + esc(o.kicker) + "</p>" +
      "<h3>" + esc(o.title) + "</h3>" +
      '<p class="card-sub">' + esc(o.sub) + "</p>" +
      "</div>" +
      '<button class="icon-btn" type="button" data-expand aria-label="Agrandir ' + esc(o.title) + '">' + ICONS.expand + "</button>" +
      "</header>" +
      '<div class="chart" id="' + o.name + 'Chart" role="img" aria-label="' + esc(o.aria || o.title) + '"></div>' +
      "</article>";
  }

  var FLAG_DZ = '<span class="dz-flag" role="img" aria-label="Drapeau de l\'Algérie">' +
    '<svg viewBox="0 0 30 20" aria-hidden="true"><defs><mask id="dzCrescent">' +
    '<rect width="30" height="20" fill="#fff"/><circle cx="16.4" cy="9.4" r="3.7" fill="#000"/>' +
    '</mask></defs><rect width="15" height="20" fill="#0B8A4B"/><rect x="15" width="15" height="20" fill="#F6F4E9"/>' +
    '<circle cx="15" cy="10" r="4.5" fill="#D21034" mask="url(#dzCrescent)"/>' +
    '<path d="M18.2 7.7l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.8-1.3.8.3-1.5-1.1-1 1.5-.2Z" fill="#D21034"/></svg></span>';

  function overviewHTML() {
    var quick = ENERGY_ORDER.map(function (e) {
      return '<button class="qlink" type="button" data-route="' + ENERGY_ROUTE[e] + '" style="--accent:' + ENERGY_COLOR[e] + '">' +
        '<span class="qlink-icon">' + ENERGY_ICON[e] + "</span>" +
        '<span class="qlink-body"><strong>' + e + '</strong><span data-quick="' + e + '">—</span></span>' +
        '<span class="qlink-arrow">' + ICONS.arrow + "</span></button>";
    }).join("");

    return '<section class="page page-overview">' +
      '<div class="hero">' +
      '<div class="hero-main">' +
      '<p class="hero-eyebrow"><span class="live-dot"></span>Portefeuille énergétique · Algérie ' + FLAG_DZ + '</p>' +
      '<h2 class="hero-title">Consommation<br><span>énergétique</span></h2>' +
      '<p class="hero-sub">Vue consolidée de l\'eau, du gaz et de l\'électricité sur 11 immeubles et 5 grandes villes — 48 mois de données de facturation, modélisées en dinars algériens.</p>' +
      '<div class="hero-links">' + quick + "</div>" +
      "</div>" +
      '<div class="hero-side">' +
      '<div class="ring-wrap"><div class="ring" id="heroRing"><div class="ring-hole"><div class="ring-center">' +
      '<span>Coût total</span><strong id="heroTotal">—</strong><em id="heroPeriod">48 mois</em>' +
      "</div></div></div></div>" +
      '<div class="ring-legend" id="heroLegend"></div>' +
      "</div></div>" +
      filterBarHTML() +
      '<div class="kpi-grid" id="kpiGrid"></div>' +
      '<div class="grid">' +
      chartCard({
        name: "map", span: "span-5", kicker: "Géographie", title: "Coût par ville",
        sub: "Taille des bulles = coût total · cliquez sur une ville pour filtrer",
        aria: "Carte interactive du coût énergétique total par ville algérienne"
      }) +
      chartCard({
        name: "donut", span: "span-4", kicker: "Part des unités", title: "Unités consommées par énergie",
        sub: "Part des unités consommées · cliquez sur une part pour filtrer",
        aria: "Diagramme en anneau des unités consommées par type d'énergie"
      }) +
      '<article class="card summary-card span-3">' +
      '<header class="card-head"><div><p class="card-kicker">Synthèse</p><h3>Synthèse exécutive</h3>' +
      '<p class="card-sub">Générée automatiquement pour la vue actuelle</p></div>' +
      '<span class="summary-pill">' + ICONS.spark + "Direct</span></header>" +
      '<div class="summary-list">' +
      '<div class="summary-item"><div class="summary-item-head"><span class="s-label">Poste de coût principal</span></div><div class="s-main"><strong id="sumEnergy">—</strong><span id="sumEnergyPct">—</span></div><div class="s-bar"><i id="sumEnergyBar"></i></div></div>' +
      '<div class="summary-item"><div class="summary-item-head"><span class="s-label">Ville la plus coûteuse</span></div><div class="s-main"><strong id="sumCity">—</strong><span id="sumCityPct">—</span></div><div class="s-bar"><i id="sumCityBar"></i></div></div>' +
      '<div class="summary-item"><div class="summary-item-head"><span class="s-label">Immeuble le plus coûteux</span></div><div class="s-main"><strong id="sumBuilding">—</strong><span id="sumBuildingPct">—</span></div><div class="s-bar"><i id="sumBuildingBar"></i></div></div>' +
      '<div class="summary-item"><div class="summary-item-head"><span class="s-label">Mois de dépense maximal</span></div><div class="s-main"><strong id="sumPeak">—</strong><span id="sumPeakValue">—</span></div><div class="s-bar"><i id="sumPeakBar"></i></div></div>' +
      "</div>" +
      '<div class="summary-note" id="sumNote"></div>' +
      '<div class="summary-spacer"></div>' +
      "</article>" +
      chartCard({
        name: "mix", span: "span-7", kicker: "100 % empilé", title: "Coût total par date et par énergie",
        sub: "Répartition mensuelle des coûts par filière · cliquez sur un segment pour filtrer",
        aria: "Histogramme empilé à 100 % du coût mensuel par type de consommation"
      }) +
      chartCard({
        name: "buildings", span: "span-5", kicker: "Empilé", title: "Coût total par immeuble",
        sub: "Dépenses classées par immeuble, ventilées par énergie · cliquez sur une barre pour filtrer",
        aria: "Histogramme empilé du coût total par immeuble"
      }) +
      "</div></section>";
  }

  function energyHTML(energy) {
    var color = ENERGY_COLOR[energy];
    var extra = "";
    if (energy === "Eau") {
      extra = '<article class="card insight-card span-5">' +
        '<header class="card-head"><div><p class="card-kicker">Profil de la filière</p><h3>Ce qui pèse sur le coût de l\'eau</h3>' +
        '<p class="card-sub">Instantané pour les filtres actuels</p></div></header>' +
        '<div class="insight-list">' +
        '<div class="insight-item"><span class="i-label">Ville principale</span><span class="i-value" id="insCity">—<small>—</small></span></div>' +
        '<div class="insight-item"><span class="i-label">Immeuble principal</span><span class="i-value" id="insBuilding">—<small>—</small></span></div>' +
        '<div class="insight-item"><span class="i-label">Mois moyen</span><span class="i-value" id="insAvg">—<small>—</small></span></div>' +
        '<div class="insight-item"><span class="i-label">Mois de pointe</span><span class="i-value" id="insPeak">—<small>—</small></span></div>' +
        '<div class="insight-item"><span class="i-label">Évolution du tarif</span><span class="i-value" id="insTariff">—<small>—</small></span></div>' +
        "</div>" +
        '<div class="insight-note" id="insNote"></div>' +
        "</article>";
    } else if (energy === "Gaz") {
      extra = chartCard({
        name: "waterfall", span: "span-5", kicker: "Cascade",
        title: "Coût total par ville",
        sub: "Contribution aux dépenses de gaz, ville par ville · cliquez sur une ville pour filtrer",
        aria: "Graphique en cascade du coût total de gaz par ville"
      });
    } else {
      extra = chartCard({
        name: "treemap", span: "span-5", kicker: "Treemap",
        title: "Coût total par ville",
        sub: "Surface = part des dépenses d'électricité · cliquez sur une ville pour filtrer",
        aria: "Treemap du coût total d'électricité par ville"
      });
    }

    return '<section class="page page-energy" style="--energy:' + color + '">' +
      '<div class="card energy-head">' +
      '<div class="energy-id">' +
      '<div class="energy-icon">' + ENERGY_ICON[energy] + "</div>" +
      "<div><p class=\"card-kicker\">Filière énergétique</p><h2>" + energy + "</h2><p>" + PAGES[state.route].desc + "</p></div>" +
      "</div>" +
      '<div class="energy-tags">' +
      '<div class="energy-tag"><span>Dernier tarif</span><strong id="tagTariff">—</strong></div>' +
      '<div class="energy-tag"><span>Part des dépenses</span><strong id="tagShare">—</strong></div>' +
      '<div class="energy-tag"><span>Dans la vue actuelle</span><strong id="tagScope">—</strong></div>' +
      "</div></div>" +
      filterBarHTML() +
      '<div class="kpi-grid" id="kpiGrid"></div>' +
      '<div class="grid">' +
      chartCard({
        name: "line", span: "span-7", kicker: "Tendance",
        title: "Coût total dans le temps",
        sub: "Coût mensuel avec moyenne mobile sur 3 mois",
        aria: "Courbe du coût total dans le temps"
      }) +
      extra +
      "</div>" +
      '<article class="card table-card span-12">' +
      '<div class="table-head">' +
      '<div class="table-title-wrap"><p class="card-kicker">Détail</p>' +
      '<h3>Détail des consommations <span class="count-pill" id="tableCount">0 ligne</span></h3></div>' +
      '<div class="table-tools">' +
      '<div class="search-wrap">' + ICONS.search + '<input id="searchInput" type="search" placeholder="Rechercher une ville ou un immeuble" aria-label="Rechercher dans le détail des consommations" autocomplete="off"></div>' +
      '<select class="mini-select" id="pageSize" aria-label="Lignes par page">' +
      '<option value="10">10 / page</option><option value="25">25 / page</option><option value="50">50 / page</option><option value="100">100 / page</option>' +
      "</select>" +
      '<button class="export-btn" type="button" data-export>' + ICONS.download + " Exporter CSV</button>" +
      "</div></div>" +
      '<div class="table-scroll"><table class="data-table"><thead><tr id="tableHeadRow"></tr></thead>' +
      '<tbody id="tableBody"></tbody></table></div>' +
      '<div class="table-foot"><span class="showing" id="tableShowing"></span><div class="pager" id="tablePager"></div></div>' +
      "</article></section>";
  }

  /* --------------------------------------------------------------- exports */
  return {
    DATA: DATA, C: C, ENERGY_ORDER: ENERGY_ORDER, ENERGY_COLOR: ENERGY_COLOR,
    ENERGY_ROUTE: ENERGY_ROUTE, MONTHS: MONTHS, MONTHS_LONG: MONTHS_LONG,
    ALL_FROM: ALL_FROM, ALL_TO: ALL_TO, CITY_COORDS: CITY_COORDS, CITY_LABEL: CITY_LABEL,
    PAGES: PAGES, ICONS: ICONS, ENERGY_ICON: ENERGY_ICON, COLUMNS: COLUMNS,
    state: state, buildingName: buildingName,
    $: $, $$: $$, esc: esc, sum: sum, uniq: uniq,
    money: money, money2: money2, moneyCompact: moneyCompact,
    unitsCompact: unitsCompact, unitsFull: unitsFull, rate: rate, pct: pct,
    monthShort: monthShort, monthLong: monthLong, rangeLabel: rangeLabel,
    formatVal: formatVal,
    filterRows: filterRows, monthlyAgg: monthlyAgg, groupSum: groupSum,
    trendMonthly: trendMonthly, sparkSvg: sparkSvg,
    overviewHTML: overviewHTML, energyHTML: energyHTML, filterBarHTML: filterBarHTML,
    chartCard: chartCard
  };
})();
