export type Vec2 = {
    x: number,
    y: number,
};

export type BezierCurve = {
    p0: Vec2,
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
};

export function pointOnBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
    const u = 1 - t;
    return u*u*u*p0
         + 3*u*u*t*p1
         + 3*u*t*t*p2
         + t*t*t*p3;
}


function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function subdivideAt(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number
) {
  const p01 = lerp(p0, p1, t);
  const p12 = lerp(p1, p2, t);
  const p23 = lerp(p2, p3, t);

  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);

  const p0123 = lerp(p012, p123, t); // point on curve

  return {
    left:  { p0, p1: p01, p2: p012, p3: p0123 },
    right: { p0: p0123, p1: p123, p2: p23, p3 }
  };
}

export function subdivideBezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t1: number, t2: number) {
  // subdivide first at t1
  const { right } = subdivideAt(p0, p1, p2, p3, t1);

  // map t2 into segment
  const u = (t2 - t1) / (1 - t1);

  // subdivide again at u
  const { left } = subdivideAt(right.p0, right.p1, right.p2, right.p3, u);

  return left; // contains p0..p3 of the t1→t2 segment
}