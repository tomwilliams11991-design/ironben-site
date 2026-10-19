// חישוב מחיר. קובץ אחד שמשמש את ממשק הניהול ואת בדיקת התאימות.
// התאום בשרת: price_unit() ו-estimate_quote() ב-supabase/migrations/001_schema.sql. כל שינוי כאן צריך להיעשות גם שם.
// עלות ליחידה = ק"ג × מחיר ברזל לק"ג × (1 + אחוז סטייה) + עץ×מקדם + גימור×מקדם + שעות × עלות שעה + אחר
// מחיר ליחידה = עלות ליחידה ÷ (1 − יעד רווח), מעוגל כלפי מעלה ל-10 ₪
(function (root) {
  function unitCost(p, s, f) {
    f = f || {};
    var steelKg = Number(s.steel_current_price_kg || s.steel_base_price_kg) * (1 + Number(s.steel_safety_pct || 0) / 100);
    var parts = {
      steel: Number(p.kg_per_unit) * steelKg,
      wood: Number(p.wood_per_unit) * (f.wood_factor == null ? 1 : Number(f.wood_factor)),
      finish: Number(p.finish_per_unit) * (f.finish_factor == null ? 1 : Number(f.finish_factor)),
      labor: Number(p.hours_per_unit) * Number(s.labor_rate),
      other: Number(p.other_per_unit)
    };
    parts.total = parts.steel + parts.wood + parts.finish + parts.labor + parts.other;
    parts.steel_kg_price = steelKg;
    return parts;
  }
  function priceLine(p, s, qty, override, f) {
    var c = unitCost(p, s, f);
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
  // כמות מתוך קלטי הלקוח, לפי input_schema (תאום של estimate_qty בשרת)
  function qtyFromInputs(schema, inputs) {
    var vals = {};
    (schema.fields || []).forEach(function (f) {
      if (f.type === "choice") { vals[f.key] = inputs[f.key] || f.default; return; }
      var v = Number(inputs[f.key]); if (!isFinite(v) || inputs[f.key] === "" || inputs[f.key] == null) v = Number(f.default || 0);
      if (f.min != null) v = Math.max(v, f.min); if (f.max != null) v = Math.min(v, f.max);
      vals[f.key] = v;
    });
    var q = { count: vals.steps, length: vals.length_m, area_wl: vals.width_m * vals.length_m, area_wh: vals.width_m * vals.height_m }[schema.formula];
    if (q == null) q = vals.units == null ? 1 : vals.units;
    return { qty: Math.max(q || 0, 0), values: vals };
  }
  function factor(arr, key) { var e = (arr || []).filter(function (x) { return x.key === key; })[0]; return e ? Number(e.factor) : 1; }
  var api = { unitCost: unitCost, priceLine: priceLine, totals: totals, qtyFromInputs: qtyFromInputs, factor: factor };
  if (typeof module !== "undefined") module.exports = api; else root.IronPricing = api;
})(this);
