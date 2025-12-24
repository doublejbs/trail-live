// 두 좌표 간의 거리 계산 (Haversine 공식, 미터 단위)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// 점에서 선분까지의 최단 거리 계산
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return calculateDistance(py, px, yy, xx);
}

// 현재 위치에서 경로까지의 최단 거리 계산
export function getDistanceFromRoute(
  currentLat: number,
  currentLon: number,
  routeCoordinates: [number, number][]
): number | null {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return null;
  }

  let minDistance = Infinity;

  // 각 선분에 대해 최단 거리 계산
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const [lon1, lat1] = routeCoordinates[i];
    const [lon2, lat2] = routeCoordinates[i + 1];

    const distance = pointToSegmentDistance(
      currentLon,
      currentLat,
      lon1,
      lat1,
      lon2,
      lat2
    );

    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

// 경로 이탈 여부 판단 (기본 임계값: 50m)
export function isOffRoute(
  currentLat: number,
  currentLon: number,
  routeCoordinates: [number, number][],
  threshold: number = 50
): boolean {
  const distance = getDistanceFromRoute(currentLat, currentLon, routeCoordinates);
  
  if (distance === null) {
    return false;
  }

  return distance > threshold;
}

