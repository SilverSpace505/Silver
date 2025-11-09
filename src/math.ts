
export function rotateYX(v: [number, number, number], angleY: number, angleX: number) {
  const [x, y, z] = v;

  // Precompute cos and sin
  const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
  const cosX = Math.cos(angleX), sinX = Math.sin(angleX);

  // Rotate around Y
  const x1 = cosY * x + sinY * z;
  const z1 = -sinY * x + cosY * z;
  const y1 = y;

  // Rotate around X
  const y2 = cosX * y1 - sinX * z1;
  const z2 = sinX * y1 + cosX * z1;

  return [x1, y2, z2];
}