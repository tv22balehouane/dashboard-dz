/* ==========================================================================
   EnergyScope · app — routage, filtres, KPI, synthèse, tableau, interactions
   Version Algérie · interface française · DZD
   ========================================================================== */
(function () {
  "use strict";

  var E = ES;
  var S = E.state;
  var C = E.C;
  var MONTHS = E.MONTHS;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toastTimer = null;
  var tableRows = [];

  function $(s) { return E.$(s); }
  function $$(s) { return E.$$(s); }

  /* --------------------------------------------------------------- helpers */
  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  function topEntry(map) {
    var bestKey = null, bestVal = -Infinity;
    Object.keys(map).forEach(function (k) {
      if (map[k] > bestVal) { bestVal = map[k]; bestKey = k; }
    });
    return { key: bestKey, value: bestVal === -Infinity ? 0 : bestVal };
  }

  function toast(msg) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2800);
  }

  function animateCounters(root) {
    var els = E.$$("[data-count]", root || document);
    els.forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var kind = el.getAttribute("data-format") || "int";
      if (reduceMotion) { el.textContent = E.formatVal(target, kind); return; }
      var start = 0, t0 = performance.now(), dur = 780;
      function tick(now) {
        var t = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = E.formatVal(target * eased, kind);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* --------------------------------------------------------------- routing */
  function navigate(route, opts) {
    opts = opts || {};
    if (!E.PAGES[route]) route = "overview";
    var changed = route !== S.route;
    S.route = route;
    if (route === "overview") {
      if (changed) S.type = "All";
    } else {
      S.type = E.PAGES[route].energy;
    }
    if (changed) {
      S.table.page = 1;
      S.table.search = "";
      S.table.sortKey = "d";
      S.table.dir = "desc";
    }
    if (opts.push !== false) {
      history.pushState(null, "", "#/" + route);
    }
    closeExpand();
    renderView();
  }

  function updateNav() {
    var page = E.PAGES[S.route];
    $$(".nav-item").forEach(function (a) {
      var active = a.getAttribute("data-nav") === S.route;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    $("#pageTitle").textContent = page.title;
    $("#crumb").textContent = page.crumb;
    document.title = page.title + " · Tableau de bord énergétique · Algérie";
  }

  function renderView() {
    ES.charts.disposeAll();
    updateNav();
    var view = $("#view");
    var energy = S.route === "overview" ? null : E.PAGES[S.route].energy;
    view.innerHTML = S.route === "overview" ? E.overviewHTML() : E.energyHTML(energy);
    view.classList.remove("page-enter");
    void view.offsetWidth;
    view.classList.add("page-enter");
    buildTableHead();
    bindInputs();
    syncControls();
    updateAll();
    try { view.focus({ preventScroll: true }); } catch (err) { view.focus(); }
  }

  function onHashChange() {
    var m = location.hash.match(/^#\/([a-z]+)/i);
    navigate(m ? m[1] : "overview", { push: false });
  }

  /* ---------------------------------------------------------------- filters */
  function presetRange(p) {
    if (p === "2019") return ["2019-01", "2019-12"];
    if (p === "2018") return ["2018-01", "2018-12"];
    if (p === "1617") return ["2016-01", "2017-12"];
    return [E.ALL_FROM, E.ALL_TO];
  }

  function activeFilterCount() {
    var n = 0;
    if (S.route === "overview" && S.type !== "All") n++;
    if (S.city !== "All") n++;
    if (S.building !== "All") n++;
    if (S.from !== E.ALL_FROM || S.to !== E.ALL_TO) n++;
    return n;
  }

  function syncControls() {
    var typeSel = $("#fType");
    if (typeSel) typeSel.value = S.type;

    var citySel = $("#fCity");
    if (citySel) citySel.value = S.city;

    var bSel = $("#fBuilding");
    if (bSel) {
      var list = E.DATA.buildings.filter(function (b) {
        return S.city === "All" || b.city === S.city;
      });
      if (!list.some(function (b) { return b.id === S.building; })) S.building = "All";
      var sig = list.map(function (b) { return b.id; }).join(",");
      if (bSel.getAttribute("data-sig") !== sig) {
        bSel.innerHTML = '<option value="All">Tous les immeubles</option>' + list.map(function (b) {
          return '<option value="' + b.id + '">' + E.esc(b.name || b.id) + " · " + E.esc(b.city) + "</option>";
        }).join("");
        bSel.setAttribute("data-sig", sig);
      }
      bSel.value = S.building;
    }

    var from = $("#fFrom"), to = $("#fTo");
    if (from) from.value = S.from;
    if (to) to.value = S.to;

    E.$$("[data-preset]").forEach(function (btn) {
      var r = presetRange(btn.getAttribute("data-preset"));
      btn.classList.toggle("is-active", r[0] === S.from && r[1] === S.to);
    });

    var fs = $("#filterState");
    if (fs) {
      var n = activeFilterCount();
      fs.innerHTML = n
        ? "<strong>" + n + "</strong> filtre" + (n > 1 ? "s" : "") + " actif" + (n > 1 ? "s" : "") +
          '<span class="dot-sep"></span>' + E.rangeLabel(S.from, S.to)
        : "<span>Portefeuille complet</span><span class=\"dot-sep\"></span>" + E.rangeLabel(S.from, S.to);
    }
  }

  function bindInputs() {
    var typeSel = $("#fType");
    if (typeSel) {
      typeSel.addEventListener("change", function (e) {
        S.type = e.target.value;
        S.table.page = 1;
        updateAll();
      });
    }

    var citySel = $("#fCity");
    if (citySel) {
      citySel.addEventListener("change", function (e) {
        S.city = e.target.value;
        S.building = "All";
        S.table.page = 1;
        syncControls();
        updateAll();
        if (S.city !== "All") toast("Filtre ville · " + S.city);
      });
    }

    var bSel = $("#fBuilding");
    if (bSel) {
      bSel.addEventListener("change", function (e) {
        S.building = e.target.value;
        S.table.page = 1;
        updateAll();
        if (S.building !== "All") toast("Filtre immeuble · " + E.buildingName(S.building));
      });
    }

    var from = $("#fFrom");
    if (from) {
      from.addEventListener("change", function (e) {
        S.from = e.target.value || E.ALL_FROM;
        if (S.from > S.to) S.to = S.from;
        S.table.page = 1;
        syncControls();
        updateAll();
      });
    }
    var to = $("#fTo");
    if (to) {
      to.addEventListener("change", function (e) {
        S.to = e.target.value || E.ALL_TO;
        if (S.to < S.from) S.from = S.to;
        S.table.page = 1;
        syncControls();
        updateAll();
      });
    }

    var search = $("#searchInput");
    if (search) {
      search.value = S.table.search;
      search.addEventListener("input", function (e) {
        S.table.search = e.target.value;
        S.table.page = 1;
        renderTableBody();
      });
    }

    var size = $("#pageSize");
    if (size) {
      size.value = String(S.table.size);
      size.addEventListener("change", function (e) {
        S.table.size = parseInt(e.target.value, 10) || 10;
        S.table.page = 1;
        renderTableBody();
      });
    }
  }

  function resetFilters() {
    S.type = S.route === "overview" ? "All" : E.PAGES[S.route].energy;
    S.city = "All";
    S.building = "All";
    S.from = E.ALL_FROM;
    S.to = E.ALL_TO;
    S.table.page = 1;
    S.table.search = "";
    syncControls();
    updateAll();
    toast("Filtres réinitialisés sur le portefeuille complet");
  }

  function applyPreset(p) {
    var r = presetRange(p);
    S.from = r[0];
    S.to = r[1];
    S.table.page = 1;
    syncControls();
    updateAll();
  }

  /* ------------------------------------------------------------------ topbar */
  function updateTopbar() {
    var pill = $("#rangePill");
    if (pill) {
      var span = pill.querySelector("span");
      if (span) span.textContent = E.rangeLabel(S.from, S.to);
    }
    var scope = $("#scopePill");
    if (scope) {
      var rows = E.filterRows(S, "All");
      var cities = E.uniq(rows.map(function (r) { return r.c; })).length;
      var buildings = E.uniq(rows.map(function (r) { return r.b; })).length;
      scope.textContent = cities + " " + (cities === 1 ? "ville" : "villes") + " · " +
        buildings + " " + (buildings === 1 ? "immeuble" : "immeubles");
    }
  }

  /* ------------------------------------------------------------------- hero */
  function updateHero(rows) {
    var ring = $("#heroRing");
    if (!ring) return;
    var byType = {};
    E.ENERGY_ORDER.forEach(function (t) { byType[t] = 0; });
    rows.forEach(function (r) { byType[r.e] = (byType[r.e] || 0) + r.k; });
    var total = E.sum(rows, "k");

    var stops = [], acc = 0;
    E.ENERGY_ORDER.forEach(function (t) {
      var share = total ? (byType[t] / total) * 100 : 0;
      if (share > 0.01) {
        stops.push(E.ENERGY_COLOR[t] + " " + acc.toFixed(2) + "% " + (acc + share).toFixed(2) + "%");
        acc += share;
      }
    });
    ring.style.background = stops.length
      ? "conic-gradient(from -90deg, " + stops.join(", ") + ")"
      : "conic-gradient(from -90deg, rgba(236,221,150,.15) 0% 100%)";

    var totalEl = $("#heroTotal");
    if (totalEl) totalEl.textContent = total ? E.moneyCompact(total) : "—";
    var count = E.uniq(rows.map(function (r) { return r.d; })).length;
    var period = $("#heroPeriod");
    if (period) period.textContent = count + " mois dans la vue";

    var legend = $("#heroLegend");
    if (legend) {
      legend.innerHTML = E.ENERGY_ORDER.map(function (t) {
        var share = total ? (byType[t] / total) * 100 : 0;
        return '<div class="legend-row"><span class="legend-dot" style="background:' + E.ENERGY_COLOR[t] + '"></span>' +
          '<span class="legend-name">' + t + "</span>" +
          '<span class="legend-value">' + E.moneyCompact(byType[t]) + "</span>" +
          '<span class="legend-pct">' + E.pct(share) + "</span></div>";
      }).join("");
    }

    E.$$("[data-quick]").forEach(function (el) {
      var t = el.getAttribute("data-quick");
      var cost = byType[t] || 0;
      var share = total ? (cost / total) * 100 : 0;
      el.textContent = cost > 0 ? E.moneyCompact(cost) + " · " + E.pct(share) : "Aucune dépense dans la vue";
    });
  }

  /* -------------------------------------------------------------------- KPI */
  function kpiHTML(cfg) {
    var trend = "";
    if (cfg.trend) {
      var p = cfg.trend.pct;
      var cls = p >= 0.05 ? "up" : p <= -0.05 ? "down" : "flat";
      var icon = p >= 0 ? E.ICONS.up : E.ICONS.down;
      trend = '<span class="trend ' + cls + '">' + icon + Math.abs(p).toFixed(1).replace(".", ",") + "%</span>" +
        '<span class="kpi-meta">' + E.esc(cfg.trend.label) + "</span>";
    } else if (cfg.meta) {
      trend = '<span class="kpi-meta">' + E.esc(cfg.meta) + "</span>";
    }
    return '<article class="kpi" style="--accent:' + cfg.color + '">' +
      '<div class="kpi-head"><span class="kpi-label">' + E.esc(cfg.label) + "</span>" +
      '<span class="kpi-glyph">' + cfg.icon + "</span></div>" +
      '<div class="kpi-value" data-count="' + cfg.value + '" data-format="' + cfg.format + '">' +
      E.formatVal(cfg.value, cfg.format) + "</div>" +
      '<div class="kpi-foot">' + trend + "</div>" +
      (cfg.spark || "") + "</article>";
  }

  function renderKpis(cfgs) {
    var grid = $("#kpiGrid");
    if (!grid) return;
    grid.innerHTML = cfgs.map(kpiHTML).join("");
    animateCounters(grid);
  }

  function overviewKpis(rows, monthly) {
    var totalCost = E.sum(rows, "k");
    var totalUnits = E.sum(rows, "u");
    var avgRate = totalUnits ? totalCost / totalUnits : 0;
    var peak = monthly.reduce(function (a, m) { return !a || m.cost > a.cost ? m : a; }, null);
    var last12 = monthly.slice(-12);
    var costSeries = last12.map(function (m) { return m.cost; });
    var unitSeries = last12.map(function (m) { return m.units; });
    var rateSeries = last12.map(function (m) { return m.units ? m.cost / m.units : 0; });

    renderKpis([
      {
        label: "Coût total", value: totalCost, format: "money", color: C.cream,
        icon: E.ICONS.coins, trend: E.trendMonthly(monthly, "cost"),
        spark: E.sparkSvg(costSeries, C.cream)
      },
      {
        label: "Unités consommées", value: totalUnits, format: "units", color: C.sky,
        icon: E.ICONS.bars, trend: E.trendMonthly(monthly, "units"),
        spark: E.sparkSvg(unitSeries, C.sky)
      },
      {
        label: "Coût moyen / unité", value: avgRate, format: "rate", color: C.orange,
        icon: E.ICONS.tag, trend: E.trendMonthly(monthly, "rate"),
        spark: E.sparkSvg(rateSeries, C.orange)
      },
      {
        label: "Mois de pointe", value: peak ? peak.cost : 0, format: "money", color: C.cream,
        icon: E.ICONS.pulse, meta: peak ? E.monthLong(peak.key) + " · dépense maximale" : "Aucune donnée",
        spark: E.sparkSvg(costSeries, C.cream)
      }
    ]);
  }

  /* -------------------------------------------------------------- summary */
  function updateSummary(rows) {
    var total = E.sum(rows, "k");
    if (!total) return;
    var byType = {};
    var byCity = {};
    var byBuilding = {};
    rows.forEach(function (r) {
      byType[r.e] = (byType[r.e] || 0) + r.k;
      byCity[r.c] = (byCity[r.c] || 0) + r.k;
      byBuilding[r.b] = (byBuilding[r.b] || 0) + r.k;
    });
    var monthly = E.monthlyAgg(rows);
    var peak = monthly.reduce(function (a, m) { return !a || m.cost > a.cost ? m : a; }, null);

    var tE = topEntry(byType), tC = topEntry(byCity), tB = topEntry(byBuilding);

    function setText(id, v) { var el = $("#" + id); if (el) el.textContent = v; }
    function setWidth(id, v) { var el = $("#" + id); if (el) el.style.width = Math.max(2, Math.min(100, v)) + "%"; }

    setText("sumEnergy", tE.key || "—");
    setText("sumEnergyPct", E.pct((tE.value / total) * 100));
    setWidth("sumEnergyBar", (tE.value / total) * 100);
    var energyBar = $("#sumEnergyBar");
    if (energyBar) {
      energyBar.parentNode.className = "s-bar " + (tE.key === "Gaz" ? "gas" : tE.key === "Électricité" ? "elec" : "");
    }

    setText("sumCity", tC.key || "—");
    setText("sumCityPct", E.pct((tC.value / total) * 100));
    setWidth("sumCityBar", (tC.value / total) * 100);

    setText("sumBuilding", tB.key ? E.buildingName(tB.key) : "—");
    setText("sumBuildingPct", E.pct((tB.value / total) * 100));
    setWidth("sumBuildingBar", (tB.value / total) * 100);

    setText("sumPeak", peak ? E.monthLong(peak.key) : "—");
    setText("sumPeakValue", peak ? E.moneyCompact(peak.cost) : "—");
    setWidth("sumPeakBar", peak ? 100 : 0);

    var note = $("#sumNote");
    if (note) {
      note.innerHTML = "<strong>" + E.esc(tE.key) + "</strong> représente <strong>" +
        E.pct((tE.value / total) * 100) + "</strong> des dépenses, portées par <strong>" +
        E.esc(tC.key) + "</strong> (" + E.pct((tC.value / total) * 100) + "). Le pic de dépense survient en <strong>" +
        E.esc(peak ? E.monthLong(peak.key) : "—") + "</strong>, à " + E.moneyCompact(peak ? peak.cost : 0) + ".";
    }
  }

  /* --------------------------------------------------------------- overview */
  function updateOverview() {
    var rows = E.filterRows(S);
    var monthly = E.monthlyAgg(rows);
    updateHero(rows);
    overviewKpis(rows, monthly);
    updateSummary(rows);
    ES.charts.paintOverview(rows);
  }

  /* ----------------------------------------------------------------- energy */
  function updateEnergy(energy) {
    var rows = E.filterRows(S, energy);
    var monthly = E.monthlyAgg(rows);
    var totalCost = E.sum(rows, "k");
    var units = E.sum(rows, "u");
    var avgRate = units ? totalCost / units : 0;

    var allRows = E.filterRows(S, "All");
    var allCost = E.sum(allRows, "k");
    var share = allCost ? (totalCost / allCost) * 100 : 0;
    var allByType = E.groupSum(allRows, "e", "k");
    var ranked = E.ENERGY_ORDER.slice().sort(function (a, b) {
      return (allByType[b] || 0) - (allByType[a] || 0);
    });
    var rank = ranked.indexOf(energy) + 1;

    var allMonthly = {};
    allRows.forEach(function (r) {
      var o = allMonthly[r.d] || (allMonthly[r.d] = { cost: 0 });
      o.cost += r.k;
    });
    var shareSeries = monthly.slice(-12).map(function (m) {
      var a = allMonthly[m.key] ? allMonthly[m.key].cost : 0;
      return a ? (m.cost / a) * 100 : 0;
    });

    renderKpis([
      {
        label: "Coût total", value: totalCost, format: "money", color: E.ENERGY_COLOR[energy],
        icon: E.ICONS.coins, trend: E.trendMonthly(monthly, "cost"),
        spark: E.sparkSvg(monthly.slice(-12).map(function (m) { return m.cost; }), E.ENERGY_COLOR[energy])
      },
      {
        label: "Unités consommées", value: units, format: "units", color: C.sky,
        icon: E.ICONS.bars, trend: E.trendMonthly(monthly, "units"),
        spark: E.sparkSvg(monthly.slice(-12).map(function (m) { return m.units; }), C.sky)
      },
      {
        label: "Coût moyen / unité", value: avgRate, format: "rate", color: C.orange,
        icon: E.ICONS.tag, trend: E.trendMonthly(monthly, "rate"),
        spark: E.sparkSvg(monthly.slice(-12).map(function (m) { return m.units ? m.cost / m.units : 0; }), C.orange)
      },
      {
        label: "Part du portefeuille", value: share, format: "pct", color: C.cream,
        icon: E.ICONS.pulse, meta: "Rang n° " + rank + " sur 3 filières",
        spark: E.sparkSvg(shareSeries, C.cream)
      }
    ]);

    ES.charts.paintEnergy(energy, rows);
    updateEnergyTags(rows, share, energy);
    updateTable(rows);
    if (energy === "Eau") updateWaterInsights(rows, monthly, share);
  }

  function updateEnergyTags(rows, share, energy) {
    var latest = rows.reduce(function (a, r) { return !a || r.y > a.y ? r : a; }, null);
    var tariff = $("#tagTariff");
    if (tariff) {
      tariff.innerHTML = latest
        ? latest.y + " · " + E.rate(latest.p) + "<em> / unité</em>"
        : "—";
    }
    var shareEl = $("#tagShare");
    if (shareEl) shareEl.innerHTML = E.pct(share) + "<em> des dépenses</em>";

    var cities = E.uniq(rows.map(function (r) { return r.c; })).length;
    var buildings = E.uniq(rows.map(function (r) { return r.b; })).length;
    var scope = $("#tagScope");
    if (scope) scope.textContent = cities + " ville" + (cities > 1 ? "s" : "") + " · " +
      buildings + " immeuble" + (buildings > 1 ? "s" : "");
  }

  function updateWaterInsights(rows, monthly, share) {
    var byCity = {}, byBuilding = {};
    rows.forEach(function (r) {
      byCity[r.c] = (byCity[r.c] || 0) + r.k;
      byBuilding[r.b] = (byBuilding[r.b] || 0) + r.k;
    });
    var tC = topEntry(byCity), tB = topEntry(byBuilding);
    var total = E.sum(rows, "k");
    var peak = monthly.reduce(function (a, m) { return !a || m.cost > a.cost ? m : a; }, null);
    var avgMonth = monthly.length ? total / monthly.length : 0;

    function set(id, html) { var el = $("#" + id); if (el) el.innerHTML = html; }

    set("insCity", (tC.key || "—") + "<small>" + E.money(tC.value) + " · " +
      E.pct(total ? (tC.value / total) * 100 : 0) + " de la filière</small>");
    set("insBuilding", (tB.key ? E.buildingName(tB.key) : "—") + "<small>" + E.money(tB.value) + "</small>");
    set("insAvg", E.money(avgMonth) + "<small>par mois</small>");
    set("insPeak", (peak ? E.monthLong(peak.key) : "—") + "<small>" + E.money(peak ? peak.cost : 0) + "</small>");

    var rates = E.DATA.rates.filter(function (r) { return r.e === "Eau"; })
      .sort(function (a, b) { return a.y - b.y; });
    var first = rates[0], last = rates[rates.length - 1];
    if (first && last) {
      set("insTariff", E.rate(first.p) + " → " + E.rate(last.p) +
        "<small>" + first.y + "–" + last.y + " · +" + E.pct(((last.p - first.p) / first.p) * 100) + "</small>");
    }

    var note = $("#insNote");
    if (note) {
      var growth = first && last ? ((last.p - first.p) / first.p) * 100 : 0;
      note.innerHTML = "L'eau représente <strong>" + E.pct(share) + "</strong> des dépenses du portefeuille dans cette vue. " +
        "Le tarif unitaire a progressé de <strong>" + E.pct(growth) + "</strong> depuis " + (first ? first.y : "—") +
        " — la réduction des volumes reste le levier d'économie le plus fort.";
    }
  }

  /* ------------------------------------------------------------------ table */
  function buildTableHead() {
    var row = $("#tableHeadRow");
    if (!row) return;
    row.innerHTML = E.COLUMNS.map(function (c) {
      var sorted = S.table.sortKey === c.key;
      var ind = sorted ? (S.table.dir === "asc" ? "▲" : "▼") : "↕";
      var aria = sorted ? (S.table.dir === "asc" ? "ascending" : "descending") : "none";
      return '<th scope="col" aria-sort="' + aria + '"><button class="th-btn' +
        (sorted ? " is-sorted" : "") + (c.right ? " align-right" : "") +
        '" type="button" data-sort="' + c.key + '">' + E.esc(c.label) +
        '<span class="sort-ind" aria-hidden="true">' + ind + "</span></button></th>";
    }).join("");
  }

  function tableData() {
    var rows = tableRows.slice();
    var q = S.table.search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(function (r) {
        var hay = [r.c, r.b, E.buildingName(r.b), r.e, r.y, "t" + r.q, MONTHS[r.m - 1], r.d].join(" ").toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }
    var key = S.table.sortKey;
    var dir = S.table.dir === "asc" ? 1 : -1;
    rows.sort(function (a, b) {
      var va, vb;
      if (key === "b") {
        va = E.buildingName(a.b); vb = E.buildingName(b.b);
        return va.localeCompare(vb, "fr") * dir;
      }
      if (key === "d" || key === "c" || key === "e") {
        va = String(a[key]); vb = String(b[key]);
        return va.localeCompare(vb, "fr") * dir;
      }
      va = a[key]; vb = b[key];
      if (va === vb) return (a.k - b.k) * dir;
      return (va - vb) * dir;
    });
    return rows;
  }

  function renderTableBody() {
    var tbody = $("#tableBody");
    if (!tbody) return;

    var rows = tableData();
    var total = rows.length;
    var pages = Math.max(1, Math.ceil(total / S.table.size));
    if (S.table.page > pages) S.table.page = pages;
    if (S.table.page < 1) S.table.page = 1;
    var start = (S.table.page - 1) * S.table.size;
    var slice = rows.slice(start, start + S.table.size);

    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">Aucun enregistrement ne correspond aux filtres.</td></tr>';
    } else {
      tbody.innerHTML = slice.map(function (r) {
        var color = E.ENERGY_COLOR[r.e] || C.cream;
        return "<tr>" +
          "<td>" + r.y + "</td>" +
          '<td class="month-cell">T' + r.q + "</td>" +
          '<td class="month-cell">' + MONTHS[r.m - 1] + "</td>" +
          "<td>" + E.esc(r.c) + "</td>" +
          '<td><span class="mono-id" title="' + E.esc(r.b) + '">' + E.esc(E.buildingName(r.b)) + "</span></td>" +
          '<td><span class="energy-chip" style="--chip:' + color + '"><i></i>' + r.e + "</span></td>" +
          '<td class="num">' + E.unitsFull(r.u) + "</td>" +
          '<td class="cost">' + E.money2(r.k) + "</td>" +
          "</tr>";
      }).join("");
    }

    var count = $("#tableCount");
    if (count) count.textContent = total.toLocaleString("fr-FR") + (total === 1 ? " ligne" : " lignes");

    var showing = $("#tableShowing");
    if (showing) {
      if (!total) {
        showing.textContent = "Aucun enregistrement correspondant";
      } else {
        showing.innerHTML = "Affichage de <strong>" + (start + 1) + "–" + Math.min(start + S.table.size, total) +
          "</strong> sur <strong>" + total.toLocaleString("fr-FR") + "</strong> enregistrements";
      }
    }

    var pager = $("#tablePager");
    if (pager) pager.innerHTML = total > S.table.size ? pagerHTML(S.table.page, pages) : "";

    buildTableHead();
  }

  function pageItems(cur, total) {
    if (total <= 7) {
      var all = [];
      for (var i = 1; i <= total; i++) all.push(i);
      return all;
    }
    var set = [1, total, cur - 1, cur, cur + 1].filter(function (p) {
      return p >= 1 && p <= total;
    }).sort(function (a, b) { return a - b; });
    var unique = [];
    set.forEach(function (p) { if (unique.indexOf(p) === -1) unique.push(p); });
    var out = [];
    unique.forEach(function (p, i) {
      if (i && p - unique[i - 1] > 1) out.push("…");
      out.push(p);
    });
    return out;
  }

  function pagerHTML(cur, total) {
    var h = '<button class="page-btn" type="button" data-page="' + (cur - 1) + '"' +
      (cur === 1 ? " disabled" : "") + ' aria-label="Page précédente">' + E.ICONS.chevronL + "</button>";
    pageItems(cur, total).forEach(function (p) {
      if (p === "…") {
        h += '<span class="page-ellipsis" aria-hidden="true">…</span>';
      } else {
        h += '<button class="page-btn' + (p === cur ? " is-current" : "") + '" type="button" data-page="' + p +
          '"' + (p === cur ? ' aria-current="page"' : "") + ">" + p + "</button>";
      }
    });
    h += '<button class="page-btn" type="button" data-page="' + (cur + 1) + '"' +
      (cur === total ? " disabled" : "") + ' aria-label="Page suivante">' + E.ICONS.chevronR + "</button>";
    return h;
  }

  function updateTable(rows) {
    tableRows = rows;
    var size = $("#pageSize");
    if (size) size.value = String(S.table.size);
    renderTableBody();
  }

  function exportCsv() {
    var rows = tableData();
    if (!rows.length) { toast("Aucune donnée à exporter pour cette sélection"); return; }
    var header = ["Année", "Trimestre", "Mois", "Ville", "Immeuble", "Énergie",
      "Quantité consommée", "Coût total (DZD)"];
    var lines = [header.join(";")];
    rows.forEach(function (r) {
      lines.push([r.y, "T" + r.q, MONTHS[r.m - 1], r.c, E.buildingName(r.b), r.e,
        r.u, r.k.toFixed(2).replace(".", ",")].join(";"));
    });
    var blob = new Blob(["\ufeffsep=;\r\n" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "consommations-" + S.route + "-detail.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 600);
    toast(rows.length.toLocaleString("fr-FR") + " lignes exportées en CSV");
  }

  /* ---------------------------------------------------------------- actions */
  function setSort(key) {
    if (S.table.sortKey === key) {
      S.table.dir = S.table.dir === "asc" ? "desc" : "asc";
    } else {
      S.table.sortKey = key;
      S.table.dir = ["y", "u", "k", "d"].indexOf(key) !== -1 ? "desc" : "asc";
    }
    S.table.page = 1;
    renderTableBody();
  }

  function setPage(p) {
    var n = parseInt(p, 10);
    if (!isFinite(n)) return;
    S.table.page = Math.max(1, n);
    renderTableBody();
  }

  E.setCityFilter = function (city) {
    S.city = S.city === city ? "All" : city;
    S.building = "All";
    S.table.page = 1;
    syncControls();
    updateAll();
    toast(S.city === "All" ? "Filtre ville effacé" : "Filtré sur " + city);
  };

  E.setTypeFilter = function (type) {
    if (S.route !== "overview") return;
    S.type = S.type === type ? "All" : type;
    S.table.page = 1;
    syncControls();
    updateAll();
    toast(S.type === "All" ? "Toutes les énergies affichées" : "Filière affichée : " + type);
  };

  E.setBuildingFilter = function (building) {
    S.building = S.building === building ? "All" : building;
    S.table.page = 1;
    syncControls();
    updateAll();
    toast(S.building === "All" ? "Filtre immeuble effacé" : "Filtré sur " + E.buildingName(building));
  };

  /* --------------------------------------------------------------- expand */
  function toggleExpand(card) {
    if (!card) return;
    var open = card.classList.toggle("is-expanded");
    var backdrop = $("#expandBackdrop");
    if (backdrop) backdrop.hidden = !open;
    document.body.classList.toggle("has-expanded", open);
    var btn = card.querySelector("[data-expand]");
    if (btn) btn.setAttribute("aria-label", open ? "Fermer le graphique agrandi" : "Agrandir le graphique");
    setTimeout(function () { ES.charts.resizeAll(); }, 70);
    setTimeout(function () { ES.charts.resizeAll(); }, 360);
  }

  function closeExpand() {
    var card = $(".chart-card.is-expanded");
    if (card) {
      card.classList.remove("is-expanded");
      var btn = card.querySelector("[data-expand]");
      if (btn) btn.setAttribute("aria-label", "Agrandir le graphique");
    }
    var backdrop = $("#expandBackdrop");
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove("has-expanded");
    setTimeout(function () { ES.charts.resizeAll(); }, 60);
  }

  /* ----------------------------------------------------------------- events */
  function onViewClick(e) {
    var routeBtn = e.target.closest("[data-route]");
    if (routeBtn) { navigate(routeBtn.getAttribute("data-route")); return; }

    if (e.target.closest("[data-reset]")) { resetFilters(); return; }

    var preset = e.target.closest("[data-preset]");
    if (preset) { applyPreset(preset.getAttribute("data-preset")); return; }

    if (e.target.closest("[data-export]")) { exportCsv(); return; }

    var expand = e.target.closest("[data-expand]");
    if (expand) { toggleExpand(expand.closest(".chart-card")); return; }

    var sort = e.target.closest("[data-sort]");
    if (sort) { setSort(sort.getAttribute("data-sort")); return; }

    var page = e.target.closest("[data-page]");
    if (page && !page.disabled) { setPage(page.getAttribute("data-page")); return; }
  }

  /* ------------------------------------------------------------------- main */
  function updateAll() {
    syncControls();
    updateTopbar();
    if (S.route === "overview") updateOverview();
    else updateEnergy(E.PAGES[S.route].energy);
  }

  function boot() {
    var meta = E.DATA.meta || {};
    var sm = $("#sourceMeta");
    if (sm) {
      sm.textContent = (meta.rows || 0).toLocaleString("fr-FR") + " enregistrements · " +
        (meta.first || "").slice(0, 4) + "–" + (meta.last || "").slice(0, 4);
    }
    if (window.ALGERIA_GEO && typeof echarts !== "undefined" && !echarts.getMap("algeria")) {
      try { echarts.registerMap("algeria", window.ALGERIA_GEO); } catch (err) { /* noop */ }
    }

    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("resize", debounce(function () { ES.charts.resizeAll(); }, 140));
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeExpand();
    });
    var backdrop = $("#expandBackdrop");
    if (backdrop) backdrop.addEventListener("click", closeExpand);
    var view = $("#view");
    if (view) view.addEventListener("click", onViewClick);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ES.charts.resizeAll(); });
    }

    var m = location.hash.match(/^#\/([a-z]+)/i);
    navigate(m ? m[1] : "overview", { push: false });

    $$(".nav-item").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var route = a.getAttribute("data-nav");
        if (!route) return;
        e.preventDefault();
        navigate(route);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
