import { useEffect, useRef } from 'react';
import type { UserLocation, RouteData } from '@/types/map';

interface Props {
  center: { lat: number; lon: number } | null;
  userLocations: UserLocation[];
  route: RouteData | null;
  currentUserId: string | null;
}

function NaverMapView({ center, userLocations, route, currentUserId }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const routePolylineRef = useRef<naver.maps.Polyline | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = new naver.maps.LatLng(37.5665, 126.978);

    mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
      mapTypeControl: true,
    });
  }, []);

  // 중심 좌표 업데이트
  useEffect(() => {
    if (center && mapInstanceRef.current) {
      const latLng = new naver.maps.LatLng(center.lat, center.lon);
      mapInstanceRef.current.setCenter(latLng);
    }
  }, [center]);

  // 사용자 위치 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const currentMarkerIds = new Set(userLocations.map((loc) => loc.userId));

    // 삭제된 마커 제거
    markersRef.current.forEach((marker, userId) => {
      if (!currentMarkerIds.has(userId)) {
        marker.setMap(null);
        markersRef.current.delete(userId);
      }
    });

    // 마커 추가 또는 업데이트
    userLocations.forEach((loc) => {
      const position = new naver.maps.LatLng(loc.lat, loc.lon);
      const existingMarker = markersRef.current.get(loc.userId);

      if (existingMarker) {
        existingMarker.setPosition(position);
      } else {
        const isCurrentUser = loc.userId === currentUserId;

        const marker = new naver.maps.Marker({
          position,
          map: mapInstanceRef.current!,
          title: loc.nickname,
          icon: {
            content: `
              <div style="
                background: ${isCurrentUser ? '#4F46E5' : '#10B981'};
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                white-space: nowrap;
              ">
                ${isCurrentUser ? '🙋 ' : ''}${loc.nickname}
              </div>
            `,
            anchor: new naver.maps.Point(0, 0),
          },
        });

        markersRef.current.set(loc.userId, marker);
      }
    });
  }, [userLocations, currentUserId]);

  // 루트 표시
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 기존 폴리라인 제거
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (route && route.features.length > 0) {
      const firstFeature = route.features[0];

      if (firstFeature.geometry.type === 'LineString') {
        const path = (firstFeature.geometry.coordinates as number[][]).map(
          ([lon, lat]) => new naver.maps.LatLng(lat, lon)
        );

        routePolylineRef.current = new naver.maps.Polyline({
          map: mapInstanceRef.current,
          path,
          strokeColor: '#FF5722',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        });
      }
    }
  }, [route]);

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />;
}

export default NaverMapView;
