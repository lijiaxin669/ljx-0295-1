export interface Point {
  x: number;
  y: number;
}

export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const createIdentityMatrix = (): Matrix => ({
  a: 1, b: 0, c: 0, d: 1, e: 0, f: 0
});

export const multiplyMatrices = (m1: Matrix, m2: Matrix): Matrix => ({
  a: m1.a * m2.a + m1.b * m2.c,
  b: m1.a * m2.b + m1.b * m2.d,
  c: m1.c * m2.a + m1.d * m2.c,
  d: m1.c * m2.b + m1.d * m2.d,
  e: m1.e * m2.a + m1.f * m2.c + m2.e,
  f: m1.e * m2.b + m1.f * m2.d + m2.f
});

export const translate = (m: Matrix, tx: number, ty: number): Matrix =>
  multiplyMatrices(m, { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty });

export const scale = (m: Matrix, sx: number, sy: number): Matrix =>
  multiplyMatrices(m, { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 });

export const rotate = (m: Matrix, angle: number): Matrix => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return multiplyMatrices(m, { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
};

export const transformPoint = (m: Matrix, p: Point): Point => ({
  x: m.a * p.x + m.c * p.y + m.e,
  y: m.b * p.x + m.d * p.y + m.f
});

export const inverseMatrix = (m: Matrix): Matrix => {
  const det = m.a * m.d - m.b * m.c;
  if (det === 0) return createIdentityMatrix();
  return {
    a: m.d / det,
    b: -m.b / det,
    c: -m.c / det,
    d: m.a / det,
    e: (m.c * m.f - m.d * m.e) / det,
    f: (m.b * m.e - m.a * m.f) / det
  };
};

export const getStickerTransformMatrix = (
  x: number,
  y: number,
  rotation: number,
  scale: number,
  flipX: boolean,
  flipY: boolean
): Matrix => {
  let m = createIdentityMatrix();
  m = translate(m, x, y);
  m = rotate(m, rotation);
  m = scale(m, scale * (flipX ? -1 : 1), scale * (flipY ? -1 : 1));
  return m;
};

export const getTransformedCorners = (
  width: number,
  height: number,
  matrix: Matrix
): Point[] => {
  const hw = width / 2;
  const hh = height / 2;
  const corners: Point[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh }
  ];
  return corners.map(p => transformPoint(matrix, p));
};

export const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const distance = (p1: Point, p2: Point): number =>
  Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

export const angle = (p1: Point, p2: Point): number =>
  Math.atan2(p2.y - p1.y, p2.x - p1.x);

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
