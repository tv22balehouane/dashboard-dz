/* ==========================================================================
   EnergyScope · charts — options ECharts & rendu (version Algérie / DZD)
   ========================================================================== */
window.ES = window.ES || {};
ES.charts = (function () {
  "use strict";

  var E = ES;
  var C = E.C;
  var charts = {};
  var mapReady = false;

  var TOOLTIP = {
    backgroundColor: "#071242",
    borderColor: "rgba(236,221,150,.22)",
    borderWidth: 1,
    padding: [10, 13],
    confine: true,
    textStyle: { color: "#F6F4E9", fontFamily: "Manrope", fontSize: 12 },
    extraCssText: "border-radius:10px;box-shadow:0 18px 44px rgba(0,0,0,.55);"
  };

  function tt(title, rows) {
    var body = rows.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;gap:22px;line-height:1.95;font-size:11px">' +
        '<span style="color:#A9B3D6">' + r[0] + "</span>" +
        '<span style="color:' + (r[2] || "#F6F4E9") + ';font-weight:700;font-variant-numeric:tabular-nums">' + r[1] + "</span></div>";
    }).join("");
    return '<div style="min-width:150px"><div style="font-family:\'Space Grotesk\',sans-serif;font-weight:600;font-size:12.5px;color:#F6F4E9;margin-bottom:5px">' +
      title + "</div>" + body + "</div>";
  }

  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function moneyAxis(v) {
    return E.moneyCompact(v);
  }

  function axisCommon(showSplit) {
    return {
      axisLine: { lineStyle: { color: "rgba(169,179,214,.16)" } },
      axisTick: { show: false },
      axisLabel: { color: C.faint, fontFamily: "Manrope", fontSize: 10.5 },
      splitLine: showSplit === false ? { show: false } : {
        lineStyle: { color: "rgba(169,179,214,.08)", type: [2, 5] }
      }
    };
  }

  function get(name, id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var c = charts[name];
    if (!c || c.isDisposed() || c.getDom() !== el) {
      if (c && !c.isDisposed()) c.dispose();
      c = echarts.init(el, null, { renderer: "canvas" });
      charts[name] = c;
    }
    return c;
  }

  function paint(name, id, option) {
    var c = get(name, id);
    if (!c) return null;
    c.setOption(option, true);
    return c;
  }

  function bind(name, handler) {
    var c = charts[name];
    if (!c) return;
    c.off("click");
    c.on("click", handler);
  }

  function ensureMap() {
    if (mapReady) return true;
    if (!window.ALGERIA_GEO || typeof echarts === "undefined") return false;
    try {
      echarts.registerMap("algeria", window.ALGERIA_GEO);
      mapReady = true;
    } catch (err) {
      mapReady = false;
    }
    return mapReady;
  }

  /* ------------------------------------------------------------------ map */
  function mapOption(rows) {
    var byCity = {};
    rows.forEach(function (r) {
      var o = byCity[r.c] || (byCity[r.c] = { city: r.c, cost: 0, units: 0, buildings: {} });
      o.cost += r.k; o.units += r.u; o.buildings[r.b] = 1;
    });
    var list = Object.keys(byCity).map(function (k) {
      var o = byCity[k];
      return { city: o.city, cost: o.cost, units: o.units, count: Object.keys(o.buildings).length };
    }).sort(function (a, b) { return b.cost - a.cost; });
    var max = list.length ? list[0].cost : 1;
    var selected = E.state.city;

    var data = list.map(function (c) {
      var coords = E.CITY_COORDS[c.city] || [2.6, 28.2];
      var dim = selected !== "All" && selected !== c.city;
      var lab = E.CITY_LABEL[c.city] || { position: "right", offset: [6, 0] };
      return {
        name: c.city,
        value: [coords[0], coords[1], Math.round(c.cost), c.city, c.units, c.count],
        symbolSize: 13 + 31 * Math.sqrt(c.cost / max),
        itemStyle: { opacity: dim ? 0.22 : 1 },
        label: {
          position: lab.position,
          offset: lab.offset,
          opacity: dim ? 0.35 : 1
        }
      };
    });

    return {
      animationDuration: 900,
      animationEasing: "cubicOut",
      tooltip: Object.assign({}, TOOLTIP, {
        trigger: "item",
        formatter: function (p) {
          var v = p.value || [];
          var share = v[2] ? (v[2] / totalCityCost(list)) * 100 : 0;
          return tt(v[3] || p.name, [
            ["Coût total", E.money(v[2]), C.cream],
            ["Unités consommées", E.unitsFull(v[4])],
            ["Immeubles", v[5]],
            ["Part des villes", E.pct(share)]
          ]);
        }
      }),
      geo: {
        map: "algeria",
        roam: true,
        // Cadrage décalé vers le sud : la côte nord (Alger, Annaba) reste
        // sous les étiquettes au lieu d'être rognée par le bord supérieur.
        zoom: 0.96,
        center: [2.6, 30.0],
        scaleLimit: { min: 0.9, max: 8 },
        silent: false,
        itemStyle: {
          areaColor: "rgba(11,138,75,.20)",
          borderColor: "rgba(127,227,180,.34)",
          borderWidth: 0.7,
          shadowColor: "rgba(0,0,0,.45)",
          shadowBlur: 14
        },
        emphasis: {
          disabled: false,
          itemStyle: { areaColor: "rgba(11,138,75,.34)" },
          label: { show: false }
        },
        select: { disabled: true }
      },
      series: [{
        name: "Coût total",
        type: "effectScatter",
        coordinateSystem: "geo",
        zlevel: 2,
        rippleEffect: { brushType: "stroke", scale: 2.6, period: 4.5, number: 2 },
        symbol: "circle",
        showEffectOn: "render",
        data: data,
        itemStyle: {
          color: C.orange,
          borderColor: "rgba(255,248,231,.78)",
          borderWidth: 1.2,
          shadowBlur: 18,
          shadowColor: "rgba(230,105,55,.6)"
        },
        emphasis: {
          scale: 1.25,
          itemStyle: { color: "#FF8A5B", borderColor: "#FFF3D2", borderWidth: 2 },
          label: { show: true }
        },
        label: {
          show: true,
          formatter: function (p) {
            return p.value[3] + "\n" + E.moneyCompact(p.value[2]);
          },
          color: C.cream,
          fontFamily: "Space Grotesk",
          fontWeight: 600,
          fontSize: 9.5,
          lineHeight: 13,
          distance: 4,
          backgroundColor: "rgba(5,15,75,.68)",
          borderColor: "rgba(236,221,150,.18)",
          borderWidth: 1,
          borderRadius: 5,
          padding: [3, 6]
        }
      }]
    };
  }

  function totalCityCost(list) {
    return list.reduce(function (s, c) { return s + c.cost; }, 0) || 1;
  }

  /* ---------------------------------------------------------------- donut */
  function donutOption(rows) {
    var byType = {};
    rows.forEach(function (r) {
      var o = byType[r.e] || (byType[r.e] = { cost: 0, units: 0 });
      o.cost += r.k; o.units += r.u;
    });
    var types = E.ENERGY_ORDER.filter(function (t) { return byType[t] && byType[t].units > 0; });
    var totalUnits = types.reduce(function (s, t) { return s + byType[t].units; }, 0);
    var data = types.map(function (t) {
      return { name: t, value: byType[t].units, itemStyle: { color: E.ENERGY_COLOR[t] } };
    });

    return {
      animationDuration: 850,
      tooltip: Object.assign({}, TOOLTIP, {
        trigger: "item",
        formatter: function (p) {
          return tt(p.name, [
            ["Unités consommées", E.unitsFull(p.value), E.ENERGY_COLOR[p.name]],
            ["Part des unités", E.pct(p.percent)],
            ["Coût total", E.money(byType[p.name].cost), C.cream]
          ]);
        }
      }),
      title: {
        text: E.unitsCompact(totalUnits),
        subtext: "unités consommées",
        left: "center",
        top: "35%",
        textAlign: "center",
        textStyle: {
          color: C.text, fontFamily: "Space Grotesk", fontWeight: 600,
          fontSize: 25, letterSpacing: -1
        },
        subtextStyle: {
          color: C.faint, fontFamily: "Manrope", fontWeight: 600,
          fontSize: 9.5, letterSpacing: 0.4
        }
      },
      legend: {
        bottom: 4,
        left: "center",
        icon: "roundRect",
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 11,
        textStyle: { color: C.muted, fontFamily: "Manrope", fontSize: 9.5, padding: [0, 0, 0, 2] },
        formatter: function (name) {
          var u = byType[name] ? byType[name].units : 0;
          return name + " " + E.pct(totalUnits ? (u / totalUnits) * 100 : 0, 0);
        }
      },
      series: [{
        name: "Unités consommées",
        type: "pie",
        radius: ["58%", "82%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        padAngle: 2.5,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#07123F",
          borderWidth: 2
        },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 6, itemStyle: { shadowBlur: 18, shadowColor: "rgba(0,0,0,.5)" } },
        data: data
      }]
    };
  }

  /* ----------------------------------------------------------- mix (100%) */
  function mixOption(rows) {
    var months = {}, matrix = {};
    E.ENERGY_ORDER.forEach(function (t) { matrix[t] = {}; });
    rows.forEach(function (r) {
      months[r.d] = 1;
      matrix[r.e][r.d] = (matrix[r.e][r.d] || 0) + r.k;
    });
    var keys = Object.keys(months).sort();
    var totals = keys.map(function (d) {
      return E.ENERGY_ORDER.reduce(function (s, t) { return s + (matrix[t][d] || 0); }, 0);
    });
    var types = E.ENERGY_ORDER.filter(function (t) {
      return keys.some(function (d) { return matrix[t][d]; });
    });

    var series = types.map(function (t) {
      return {
        name: t,
        type: "bar",
        stack: "mix",
        barWidth: "58%",
        itemStyle: { color: E.ENERGY_COLOR[t], borderRadius: 2 },
        emphasis: { focus: "series" },
        data: keys.map(function (d, i) {
          var v = matrix[t][d] || 0;
          return totals[i] ? (v / totals[i]) * 100 : 0;
        })
      };
    });

    return {
      animationDuration: 800,
      tooltip: Object.assign({}, TOOLTIP, {
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(236,221,150,.05)" } },
        formatter: function (ps) {
          if (!ps.length) return "";
          var i = ps[0].dataIndex;
          var total = totals[i];
          var lines = types.map(function (t) {
            var v = matrix[t][keys[i]] || 0;
            return ["● " + t, E.moneyCompact(v) + "  ·  " + E.pct(total ? (v / total) * 100 : 0),
              E.ENERGY_COLOR[t]];
          });
          lines.push(["Total", E.money(total), C.cream]);
          return tt(E.monthLong(keys[i]), lines);
        }
      }),
      legend: {
        bottom: 0, left: "center", icon: "roundRect", itemWidth: 8, itemHeight: 8,
        itemGap: 14,
        textStyle: { color: C.muted, fontFamily: "Manrope", fontSize: 10 }
      },
      grid: { left: 44, right: 14, top: 14, bottom: 46 },
      xAxis: Object.assign({}, axisCommon(false), {
        type: "category",
        data: keys.map(E.monthShort),
        axisLabel: {
          color: C.faint, fontFamily: "Manrope", fontSize: 9,
          interval: Math.max(0, Math.round(keys.length / 8) - 1),
          margin: 10
        }
      }),
      yAxis: Object.assign({}, axisCommon(true), {
        type: "value", min: 0, max: 100, interval: 25, splitNumber: 4,
        axisLabel: { color: C.faint, fontFamily: "Manrope", fontSize: 10, formatter: "{value} %" }
      }),
      series: series
    };
  }

  /* ---------------------------------------------------- buildings (stack) */
  function buildingsOption(rows) {
    var map = {};
    rows.forEach(function (r) {
      var o = map[r.b] || (map[r.b] = { building: r.b, cost: 0, by: {} });
      o.cost += r.k;
      o.by[r.e] = (o.by[r.e] || 0) + r.k;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return a.cost - b.cost; });
    var types = E.ENERGY_ORDER.filter(function (t) {
      return list.some(function (x) { return x.by[t]; });
    });
    var totals = list.map(function (x) { return x.cost; });

    return {
      animationDuration: 850,
      tooltip: Object.assign({}, TOOLTIP, {
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(236,221,150,.05)" } },
        formatter: function (ps) {
          if (!ps.length) return "";
          var i = ps[0].dataIndex;
          var lines = types.map(function (t) {
            var v = list[i].by[t] || 0;
            return ["● " + t, E.moneyCompact(v), E.ENERGY_COLOR[t]];
          });
          lines.push(["Total", E.money(totals[i]), C.cream]);
          return tt(E.buildingName(list[i].building), lines);
        }
      }),
      legend: {
        bottom: 0, left: "center", icon: "roundRect", itemWidth: 8, itemHeight: 8,
        itemGap: 12,
        textStyle: { color: C.muted, fontFamily: "Manrope", fontSize: 9.5 }
      },
      grid: { left: 138, right: 58, top: 12, bottom: 42 },
      xAxis: Object.assign({}, axisCommon(true), {
        type: "value",
        axisLabel: { color: C.faint, fontFamily: "Manrope", fontSize: 9, formatter: moneyAxis }
      }),
      yAxis: Object.assign({}, axisCommon(false), {
        type: "category",
        data: list.map(function (x) { return x.building; }),
        axisLabel: {
          color: C.muted, fontFamily: "Space Grotesk", fontSize: 9.5, fontWeight: 600,
          width: 124, overflow: "truncate",
          formatter: function (v) { return E.buildingName(v); }
        }
      }),
      series: types.map(function (t, idx) {
        var isLast = idx === types.length - 1;
        return {
          name: t,
          type: "bar",
          stack: "b",
          barWidth: 13,
          itemStyle: { color: E.ENERGY_COLOR[t], borderRadius: 2 },
          emphasis: { focus: "series" },
          label: isLast ? {
            show: true,
            position: "right",
            formatter: function (p) { return E.moneyCompact(totals[p.dataIndex]); },
            color: C.cream,
            fontFamily: "Space Grotesk",
            fontWeight: 600,
            fontSize: 9.5,
            distance: 6
          } : { show: false },
          data: list.map(function (x) { return +(x.by[t] || 0).toFixed(2); })
        };
      })
    };
  }

  /* ----------------------------------------------------------------- line */
  function lineOption(rows, energy) {
    var monthly = E.monthlyAgg(rows);
    var color = E.ENERGY_COLOR[energy] || C.cream;
    var costs = monthly.map(function (m) { return +m.cost.toFixed(2); });
    var avg = monthly.reduce(function (s, m) { return s + m.cost; }, 0) / (monthly.length || 1);

    var ma = costs.map(function (_, i) {
      if (i < 2) return null;
      return +((costs[i] + costs[i - 1] + costs[i - 2]) / 3).toFixed(2);
    });

    return {
      animationDuration: 900,
      tooltip: Object.assign({}, TOOLTIP, {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: "rgba(236,221,150,.28)", width: 1, type: "dashed" } },
        formatter: function (ps) {
          if (!ps.length) return "";
          var i = ps[0].dataIndex;
          var m = monthly[i];
          return tt(E.monthLong(m.key), [
            ["Coût total", E.money(m.cost), color],
            ["Unités consommées", E.unitsFull(m.units)],
            ["Tarif moyen", E.rate(m.cost / m.units)]
          ]);
        }
      }),
      legend: {
        bottom: 0, left: "center", icon: "roundRect", itemWidth: 8, itemHeight: 8,
        itemGap: 16,
        textStyle: { color: C.muted, fontFamily: "Manrope", fontSize: 10.5 }
      },
      grid: { left: 66, right: 18, top: 20, bottom: 48 },
      xAxis: Object.assign({}, axisCommon(false), {
        type: "category",
        boundaryGap: false,
        data: monthly.map(function (m) { return E.monthShort(m.key); }),
        axisLabel: {
          color: C.faint, fontFamily: "Manrope", fontSize: 9,
          interval: Math.max(0, Math.round(monthly.length / 9) - 1)
        }
      }),
      yAxis: Object.assign({}, axisCommon(true), {
        type: "value",
        axisLabel: { color: C.faint, fontFamily: "Manrope", fontSize: 9.5, formatter: moneyAxis }
      }),
      series: [
        {
          name: "Coût mensuel",
          type: "line",
          smooth: 0.32,
          showSymbol: false,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 2.4, color: color, shadowBlur: 14, shadowColor: hexA(color, 0.45) },
          itemStyle: { color: color, borderColor: "#071346", borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: hexA(color, 0.32) },
              { offset: 1, color: hexA(color, 0) }
            ])
          },
          emphasis: { focus: "series" },
          markLine: {
            symbol: "none",
            silent: true,
            label: { show: false },
            lineStyle: { color: "rgba(236,221,150,.32)", type: "dashed", width: 1 },
            data: [{ yAxis: +avg.toFixed(2) }]
          },
          data: costs
        },
        {
          name: "Moyenne 3 mois",
          type: "line",
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { width: 1.4, color: C.cream, type: "dashed", opacity: 0.75 },
          itemStyle: { color: C.cream },
          data: ma
        }
      ]
    };
  }

  /* ------------------------------------------------------------ waterfall */
  function waterfallOption(rows) {
    var byCity = {};
    rows.forEach(function (r) {
      byCity[r.c] = (byCity[r.c] || 0) + r.k;
    });
    var list = Object.keys(byCity).map(function (k) { return { city: k, cost: byCity[k] }; })
      .sort(function (a, b) { return a.cost - b.cost; });
    var totalCost = list.reduce(function (s, x) { return s + x.cost; }, 0) || 1;

    var base = [], contrib = [], total = [], cum = 0;
    list.forEach(function (x) {
      base.push(+cum.toFixed(2));
      contrib.push(+x.cost.toFixed(2));
      total.push(null);
      cum += x.cost;
    });
    base.push(0);
    contrib.push(0);
    total.push(+cum.toFixed(2));

    var cats = list.map(function (x) { return x.city; }).concat("Total");

    return {
      animationDuration: 850,
      tooltip: Object.assign({}, TOOLTIP, {
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(236,221,150,.05)" } },
        formatter: function (ps) {
          if (!ps.length) return "";
          var i = ps[0].dataIndex;
          if (i === cats.length - 1) {
            return tt("Total du portefeuille", [["Coût total", E.money(cum), C.cream],
              ["Villes", list.length]]);
          }
          var before = base[i];
          var v = contrib[i];
          return tt(cats[i], [
            ["Coût de la ville", E.money(v), C.orange],
            ["Cumul", E.money(before + v), C.cream],
            ["Part du total", E.pct((v / totalCost) * 100)]
          ]);
        }
      }),
      grid: { left: 66, right: 18, top: 26, bottom: 44 },
      xAxis: Object.assign({}, axisCommon(false), {
        type: "category",
        data: cats,
        axisLabel: {
          color: C.faint, fontFamily: "Manrope", fontSize: 9,
          interval: 0, rotate: cats.length > 6 ? 18 : 0
        }
      }),
      yAxis: Object.assign({}, axisCommon(true), {
        type: "value",
        axisLabel: { color: C.faint, fontFamily: "Manrope", fontSize: 9.5, formatter: moneyAxis }
      }),
      series: [
        {
          name: "base",
          type: "bar",
          stack: "wf",
          silent: true,
          itemStyle: { color: "transparent" },
          emphasis: { disabled: true },
          tooltip: { show: false },
          data: base
        },
        {
          name: "Contribution",
          type: "bar",
          stack: "wf",
          barWidth: "52%",
          itemStyle: { color: C.orange, borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: "#FF8A5B" } },
          label: {
            show: true,
            position: "top",
            color: C.muted,
            fontFamily: "Space Grotesk",
            fontWeight: 600,
            fontSize: 9,
            formatter: function (p) { return p.value ? E.moneyCompact(p.value) : ""; }
          },
          data: contrib
        },
        {
          name: "Total",
          type: "bar",
          stack: "wf",
          barWidth: "52%",
          itemStyle: { color: C.cream, borderRadius: [3, 3, 0, 0] },
          label: {
            show: true,
            position: "top",
            color: C.cream,
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            fontSize: 9.5,
            formatter: function (p) { return p.value ? E.moneyCompact(p.value) : ""; }
          },
          data: total
        }
      ]
    };
  }

  /* --------------------------------------------------------------- treemap */
  function treemapOption(rows) {
    var byCity = {};
    rows.forEach(function (r) {
      byCity[r.c] = (byCity[r.c] || 0) + r.k;
    });
    var list = Object.keys(byCity).map(function (k) { return { city: k, cost: byCity[k] }; })
      .sort(function (a, b) { return b.cost - a.cost; });
    var total = list.reduce(function (s, x) { return s + x.cost; }, 0) || 1;
    var palette = [C.cream, "#1E7BCB", "#0A69BE", "#0C5596", "#0D4275", "#0F3159"];

    var data = list.map(function (x, i) {
      var light = i === 0;
      return {
        name: x.city,
        value: Math.round(x.cost),
        itemStyle: { color: palette[i % palette.length] },
        label: { color: light ? "#0B1550" : "#EAF3FF" }
      };
    });

    return {
      animationDuration: 850,
      tooltip: Object.assign({}, TOOLTIP, {
        trigger: "item",
        formatter: function (p) {
          return tt(p.name, [
            ["Coût total", E.money(p.value), C.cream],
            ["Part des dépenses", E.pct((p.value / total) * 100)]
          ]);
        }
      }),
      series: [{
        name: "Coût de l'électricité",
        type: "treemap",
        left: 6, right: 6, top: 10, bottom: 6,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        itemStyle: { borderColor: "#071346", borderWidth: 2, gapWidth: 2, borderRadius: 6 },
        upperLabel: { show: false },
        label: {
          show: true,
          formatter: function (p) { return p.name + "\n" + E.moneyCompact(p.value); },
          fontFamily: "Space Grotesk",
          fontWeight: 600,
          fontSize: 11.5,
          lineHeight: 17,
          color: "#EAF3FF"
        },
        emphasis: {
          itemStyle: { borderColor: "#ECDD96", borderWidth: 2 },
          label: { fontSize: 12.5 }
        },
        data: data
      }]
    };
  }

  /* --------------------------------------------------------------- actions */
  function paintOverview(rows) {
    if (!ensureMap()) { /* le fond de carte ne sera pas rendu */ }
    paint("map", "mapChart", mapOption(rows));
    paint("donut", "donutChart", donutOption(rows));
    paint("mix", "mixChart", mixOption(rows));
    paint("buildings", "buildingsChart", buildingsOption(rows));

    bind("map", function (p) {
      if (p && p.value && p.value[3]) E.setCityFilter(p.value[3]);
    });
    bind("donut", function (p) {
      if (p && p.name) E.setTypeFilter(p.name);
    });
    bind("mix", function (p) {
      if (p && p.seriesName && p.seriesName !== "mix") E.setTypeFilter(p.seriesName);
    });
    bind("buildings", function (p) {
      if (p && p.name) E.setBuildingFilter(p.name);
    });
  }

  function paintEnergy(energy, rows) {
    paint("line", "lineChart", lineOption(rows, energy));
    if (energy === "Gaz") {
      paint("waterfall", "waterfallChart", waterfallOption(rows));
      bind("waterfall", function (p) {
        if (p && p.name && p.name !== "Total") E.setCityFilter(p.name);
      });
    }
    if (energy === "Électricité") {
      paint("treemap", "treemapChart", treemapOption(rows));
      bind("treemap", function (p) {
        if (p && p.name) E.setCityFilter(p.name);
      });
    }
  }

  function resizeAll() {
    Object.keys(charts).forEach(function (k) {
      var c = charts[k];
      if (c && !c.isDisposed()) c.resize();
    });
  }

  function disposeAll() {
    Object.keys(charts).forEach(function (k) {
      var c = charts[k];
      if (c && !c.isDisposed()) c.dispose();
    });
    charts = {};
  }

  return {
    paintOverview: paintOverview,
    paintEnergy: paintEnergy,
    resizeAll: resizeAll,
    disposeAll: disposeAll
  };
})();
