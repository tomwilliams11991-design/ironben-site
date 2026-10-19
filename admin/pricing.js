// חישוב מחיר. קובץ אחד שמשמש את ממשק הניהול ואת הבדיקות.
// עלות ליחידה = ק"ג × מחיר ברזל לק"ג × (1 + אחוז סטייה) + עץ + צביעה + שעות × עלות שעה + אחר
// מחיר ליחידה = עלות ליחידה ÷ (1 − יעד רווח), מעוגל כלפי מעלה ל-10 ₪
(function (root) {
  function unitCost(p, s) {
    var steelKg = Number(s.steel_current_price_kg || s.steel_base_price_kg) * (1 + Number(s.steel_safety_pct || 0) / 100);
    var parts = {
      steel: Number(p.kg_per_unit) * steelKg,
      wood: Number(p.wood_per_unit),
      finish: Number(p.finish_per_unit),
      labor: Number(p.hours_per_unit) * Number(s.labor_rate),
      other: Number(p.other_per_unit)
    };
    parts.total = parts.steel + parts.wood + parts.finish + parts.labor + parts.other;
    parts.steel_kg_price = steelKg;
    return parts;
  }
  function priceLine(p, s, qty, override) {
    var c = unitCost(p, s);
    var m = Math.min(Number(s.target_margin_pct), 90) / 100;
    var unit = override != null && override !== "" ? Number(override) : Math.ceil(c.total / (1 - m) / 10) * 10;
    var line = unit * Number(qty);
    var minApplied = false;
    if (Number(p.min_price) && line < Number(p.min_price)) { line = Number(p.min_price); minApplied = true; }
    var cost = c.total * Number(qty);
    var market = null;
    if (p.market_low != null || p.market_high != null) {
      market = unit < Number(p.market_low || 0) ? "below" : (p.market_high != null && unit > Number(p.market_high) ? "above" : "in");
    }
    return {
      unit_cost: c, unit_price: unit, line_total: line, line_cost: cost,
      profit: line - cost, margin_pct: line ? (line - cost) / line * 100 : 0,
      steel_kg: Number(p.kg_per_unit) * Number(qty), min_applied: minApplied, market: market
    };
  }
  function totals(lines, s) {
    var sub = lines.reduce(function (a, l) { return a + l.line_total; }, 0);
    var cost = lines.reduce(function (a, l) { return a + l.line_cost; }, 0);
    var vat = sub * Number(s.vat_pct) / 100;
    return { subtotal: sub, vat: vat, total: sub + vat, cost: cost, profit: sub - cost, margin_pct: sub ? (sub - cost) / sub * 100 : 0,
      deposit: (sub + vat) * Number(s.deposit_pct || 0) / 100 };
  }
  var api = { unitCost: unitCost, priceLine: priceLine, totals: totals };
  if (typeof module !== "undefined") module.exports = api; else root.IronPricing = api;
})(this);
