// ============================================================
// Floor plan generation engine — ported from the frontend so the
// server is the single source of truth (prevents users from
// spoofing plan data, and lets us reuse this for PDF export etc.)
// ============================================================

export const ROOM_TYPES = {
  hall:     { name: "Main Hall",       dev: "बैठक",       ratio: 0.20,  fill: "#EADFC5", wall: "#C9A66B", dark: "#A9855A" },
  kitchen:  { name: "Kitchen",         dev: "रसोई",        ratio: 0.10,  fill: "#F0DCC9", wall: "#D2A679", dark: "#B08558" },
  master:   { name: "Master Bedroom",  dev: "शयन कक्ष",     ratio: 0.15,  fill: "#E3D3E8", wall: "#B79BC4", dark: "#93789F" },
  masterwc: { name: "Master Washroom", dev: "स्नानघर",      ratio: 0.045, fill: "#CFE3DD", wall: "#8FBBAE", dark: "#6E998C" },
  bed2:     { name: "Bedroom 2",       dev: "कमरा",        ratio: 0.11,  fill: "#D7E3EA", wall: "#9CB8C7", dark: "#7A97A6" },
  wc2:      { name: "Washroom",        dev: "स्नानघर",      ratio: 0.035, fill: "#CFE3DD", wall: "#8FBBAE", dark: "#6E998C" },
  bed3:     { name: "Bedroom 3",       dev: "कमरा",        ratio: 0.10,  fill: "#D7E3EA", wall: "#9CB8C7", dark: "#7A97A6" },
  bed4:     { name: "Bedroom 4",       dev: "कमरा",        ratio: 0.09,  fill: "#D7E3EA", wall: "#9CB8C7", dark: "#7A97A6" },
  garage:   { name: "Garage",          dev: "गैरेज",        ratio: 0.13,  fill: "#DDD7CE", wall: "#A69C8C", dark: "#877D6D" },
  balcony:  { name: "Balcony",         dev: "आंगन",        ratio: 0.06,  fill: "#E8ECD9", wall: "#B7C299", dark: "#96A179" }
};

function buildRoomList(area) {
  const keys = ["hall", "kitchen", "master", "masterwc", "bed2", "wc2"];
  if (area >= 1100) keys.push("bed3");
  if (area >= 1800) keys.push("bed4");
  if (area >= 900) keys.push("garage");
  keys.push("balcony");
  const rooms = keys.map(k => ({ key: k, ...ROOM_TYPES[k] }));
  const total = rooms.reduce((s, r) => s + r.ratio, 0);
  rooms.forEach(r => (r.ratio = r.ratio / total));
  return rooms;
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function partition(x, y, w, h, rooms) {
  if (rooms.length === 1) return [{ ...rooms[0], x, y, w, h }];
  const total = rooms.reduce((s, r) => s + r.ratio, 0);
  const half = total / 2;
  let bestIdx = 1, bestDiff = Infinity;
  for (let i = 1; i < rooms.length; i++) {
    const acc = rooms.slice(0, i).reduce((s, r) => s + r.ratio, 0);
    const diff = Math.abs(acc - half);
    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  }
  const groupA = rooms.slice(0, bestIdx), groupB = rooms.slice(bestIdx);
  const aRatio = groupA.reduce((s, r) => s + r.ratio, 0) / total;
  const dir = w >= h ? "v" : "h";
  let result = [];
  if (dir === "v") {
    const wA = w * aRatio;
    result = result.concat(partition(x, y, wA, h, groupA));
    result = result.concat(partition(x + wA, y, w - wA, h, groupB));
  } else {
    const hA = h * aRatio;
    result = result.concat(partition(x, y, w, hA, groupA));
    result = result.concat(partition(x, y + hA, w, h - hA, groupB));
  }
  return result;
}

/**
 * Generate a single layout variation.
 * @param {number} length - plot length in ft
 * @param {number} width - plot width in ft
 * @param {number} seed - variation seed (use i for the i-th of N variations)
 */
export function generateLayout(length, width, seed) {
  const rnd = seededRandom(seed);
  const rooms = shuffle(buildRoomList(length * width), rnd);
  rooms.forEach(r => (r.ratio *= 0.85 + rnd() * 0.3));
  const total = rooms.reduce((s, r) => s + r.ratio, 0);
  rooms.forEach(r => (r.ratio /= total));
  return partition(0, 0, length, width, rooms);
}

/**
 * Splits the full room list across floors: ground keeps hall/kitchen/garage/
 * balcony/a common washroom; bedrooms + master washroom move upstairs.
 */
function distributeRoomsAcrossFloors(area, floorsCount) {
  const allRooms = buildRoomList(area);
  if (floorsCount <= 1) return [{ label: "Ground Floor", rooms: allRooms }];
  const groundKeys = new Set(["hall", "kitchen", "garage", "balcony", "wc2"]);
  const groundRooms = allRooms.filter(r => groundKeys.has(r.key));
  const upperRooms = allRooms.filter(r => !groundKeys.has(r.key));
  if (floorsCount === 2) {
    return [{ label: "Ground Floor", rooms: groundRooms }, { label: "First Floor", rooms: upperRooms }];
  }
  const mid = Math.ceil(upperRooms.length / 2);
  return [
    { label: "Ground Floor", rooms: groundRooms },
    { label: "First Floor", rooms: upperRooms.slice(0, mid) },
    { label: "Second Floor", rooms: upperRooms.slice(mid) }
  ];
}

function placeRoomsOnFloor(rooms, length, width, rnd) {
  const copy = shuffle(rooms.map(r => ({ ...r })), rnd);
  copy.forEach(r => (r.ratio *= 0.85 + rnd() * 0.3));
  const total = copy.reduce((s, r) => s + r.ratio, 0);
  copy.forEach(r => (r.ratio /= total));
  return partition(0, 0, length, width, copy);
}

/**
 * Generate every floor for one layout variation (uniform shape whether
 * floorsCount is 1, 2, or 3).
 */
export function generateFloors(length, width, floorsCount, seed) {
  const rnd = seededRandom(seed);
  const distributed = distributeRoomsAcrossFloors(length * width, floorsCount);
  return distributed.map(f => ({ label: f.label, rooms: placeRoomsOnFloor(f.rooms, length, width, rnd) }));
}

/**
 * Generate N multi-floor layout variations for a plot.
 */
export function generateFloorVariations(length, width, floorsCount = 1, count = 10) {
  const variations = [];
  for (let i = 0; i < count; i++) {
    variations.push({ id: i + 1, floors: generateFloors(length, width, floorsCount, 1000 + i * 37) });
  }
  return variations;
}

/**
 * Generate N layout variations for a plot (single-floor, legacy shape).
 */
export function generateVariations(length, width, count = 10) {
  const variations = [];
  for (let i = 0; i < count; i++) {
    variations.push({ id: i + 1, rooms: generateLayout(length, width, 1000 + i * 37) });
  }
  return variations;
}
