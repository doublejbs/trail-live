import { useEffect, useRef } from 'react';
import type { UserLocation, RouteData } from '@/types/map';

interface Props {
  center: { lat: number; lon: number } | null;
  userLocations: UserLocation[];
  route: RouteData | null;
  currentUserId: string | null;
  currentUserOffRoute?: boolean;
}

function NaverMapView({ center, userLocations, route, currentUserId, currentUserOffRoute = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const currentLocationMarkerRef = useRef<naver.maps.Marker | null>(null);
  const currentLocationCircleRef = useRef<naver.maps.Circle | null>(null);
  const routePolylinesRef = useRef<naver.maps.Polyline[]>([]);

  const handleMoveToCurrentLocation = () => {
    if (center && mapInstanceRef.current) {
      const latLng = new naver.maps.LatLng(center.lat, center.lon);
      mapInstanceRef.current.setCenter(latLng);
      mapInstanceRef.current.setZoom(15);
    }
  };

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

  // 현재 위치 마커 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (center) {
      const latLng = new naver.maps.LatLng(center.lat, center.lon);
      const isFirstTime = !currentLocationMarkerRef.current;

      // 현재 위치 마커 생성 또는 업데이트
      if (isFirstTime) {
        currentLocationMarkerRef.current = new naver.maps.Marker({
          position: latLng,
          map: mapInstanceRef.current,
          icon: {
            content: `
              <div style="
                width: 20px;
                height: 20px;
                background: #3B82F6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              "></div>
            `,
            anchor: new naver.maps.Point(10, 10),
          },
          zIndex: 1000,
        });

        // 정확도 원 생성
        currentLocationCircleRef.current = new naver.maps.Circle({
          map: mapInstanceRef.current,
          center: latLng,
          radius: 50,
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.3,
          strokeWeight: 1,
        });

        // 최초 1회만 지도 중심 이동
        mapInstanceRef.current.setCenter(latLng);
      } else {
        // 위치 업데이트
        currentLocationMarkerRef.current?.setPosition(latLng);
        currentLocationCircleRef.current?.setCenter(latLng);
      }
    } else {
      // center가 null이면 마커 제거
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
        currentLocationMarkerRef.current = null;
      }
      if (currentLocationCircleRef.current) {
        currentLocationCircleRef.current.setMap(null);
        currentLocationCircleRef.current = null;
      }
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
      const isCurrentUser = loc.userId === currentUserId;
      const isOffRoute = isCurrentUser && currentUserOffRoute;

      if (existingMarker) {
        existingMarker.setPosition(position);
        // 마커 아이콘 업데이트 (경로 이탈 상태 변경 반영)
        existingMarker.setIcon({
          content: `
            <div style="
              background: ${isOffRoute ? '#EF4444' : (isCurrentUser ? '#4F46E5' : '#10B981')};
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              white-space: nowrap;
              ${isOffRoute ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : ''}
            ">
              ${isOffRoute ? '⚠️ ' : (isCurrentUser ? '🙋 ' : '')}${loc.nickname}${isOffRoute ? ' 경로 이탈' : ''}
            </div>
          `,
          anchor: new naver.maps.Point(0, 0),
        });
      } else {
        const marker = new naver.maps.Marker({
          position,
          map: mapInstanceRef.current!,
          title: loc.nickname,
          icon: {
            content: `
              <div style="
                background: ${isOffRoute ? '#EF4444' : (isCurrentUser ? '#4F46E5' : '#10B981')};
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                white-space: nowrap;
                ${isOffRoute ? 'animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;' : ''}
              ">
                ${isOffRoute ? '⚠️ ' : (isCurrentUser ? '🙋 ' : '')}${loc.nickname}${isOffRoute ? ' 경로 이탈' : ''}
              </div>
            `,
            anchor: new naver.maps.Point(0, 0),
          },
        });

        markersRef.current.set(loc.userId, marker);
      }
    });
  }, [userLocations, currentUserId, currentUserOffRoute]);

  // 루트 표시
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 기존 폴리라인 제거
    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    routePolylinesRef.current = [];

    if (route && route.features && route.features.length > 0) {
      const allPoints: naver.maps.LatLng[] = [];

      route.features.forEach((feature) => {
        if (feature.geometry.type === 'LineString') {
          const path = (feature.geometry.coordinates as number[][]).map(
            ([lon, lat]) => {
              const latLng = new naver.maps.LatLng(lat, lon);
              allPoints.push(latLng);
              return latLng;
            }
          );

          const polyline = new naver.maps.Polyline({
            map: mapInstanceRef.current!,
            path,
            strokeColor: '#FF5722',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          });

          routePolylinesRef.current.push(polyline);
        }
      });

      // 경로가 있으면 전체 경로가 보이도록 지도 범위 조정
      if (allPoints.length > 0) {
        const bounds = new naver.maps.LatLngBounds(
          allPoints[0],
          allPoints[0]
        );

        allPoints.forEach((point) => {
          bounds.extend(point);
        });

        mapInstanceRef.current!.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        });
      }
    }
  }, [route]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {center && (
        <button
          onClick={handleMoveToCurrentLocation}
          className="absolute bottom-6 right-6 bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-colors"
          title="현재 위치로 이동"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default NaverMapView;
