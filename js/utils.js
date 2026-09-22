// Shared namespace for the whole game so we can use plain <script> tags
// (no bundler / module server needed) while still avoiding global clutter.
window.SG = window.SG || {};

SG.Util = {
  clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  rand(min, max) {
    return Math.random() * (max - min) + min;
  },
  randInt(min, max) {
    return Math.floor(SG.Util.rand(min, max + 1));
  },
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  dist(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  circleRectOverlap(cx, cy, cr, rx, ry, rw, rh) {
    const nx = SG.Util.clamp(cx, rx, rx + rw);
    const ny = SG.Util.clamp(cy, ry, ry + rh);
    const dx = cx - nx, dy = cy - ny;
    return (dx * dx + dy * dy) < cr * cr;
  },
  circleOverlap(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1, dy = y2 - y1;
    const rr = r1 + r2;
    return (dx * dx + dy * dy) < rr * rr;
  },
  now() {
    return performance.now();
  }
};
