import { useEffect, useRef } from 'react';
import type { GpxData, GpxPoint } from '@/types/gpx';

interface Props {
  gpxData: GpxData;
}

function GpxPreviewMapView({ gpxData }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const polylinesRef = useRef<naver.maps.Polyline[]>([]);
  const markersRef = useRef<naver.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // 기본 중심점 (서울)
    const defaultCenter = new naver.maps.LatLng(37.5665, 126.978);

    mapInstanceRef.current = new naver.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
    });
  }, []);

  useEffect(() => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance || !gpxData) return;

    // 기존 폴리라인 제거
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    // 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const allPoints: naver.maps.LatLng[] = [];
    let firstPoint: GpxPoint | null = null;
    let lastPoint: GpxPoint | null = null;

    // 트랙 그리기
    gpxData.tracks.forEach((track) => {
      track.segments.forEach((segment) => {
        if (segment.points.length > 0) {
          // 첫 번째 포인트 저장
          if (!firstPoint) {
            firstPoint = segment.points[0];
          }
          // 마지막 포인트 업데이트
          lastPoint = segment.points[segment.points.length - 1];

          const path = segment.points.map((point) => {
            const latLng = new naver.maps.LatLng(point.lat, point.lon);
            allPoints.push(latLng);
            return latLng;
          });

          const polyline = new naver.maps.Polyline({
            map: mapInstance,
            path: path,
            strokeColor: '#FF5722',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          });

          polylinesRef.current.push(polyline);
        }
      });
    });

    // 경로 그리기
    gpxData.routes.forEach((route) => {
      if (route.points.length > 0) {
        // 첫 번째 포인트 저장
        if (!firstPoint) {
          firstPoint = route.points[0];
        }
        // 마지막 포인트 업데이트
        lastPoint = route.points[route.points.length - 1];

        const path = route.points.map((point) => {
          const latLng = new naver.maps.LatLng(point.lat, point.lon);
          allPoints.push(latLng);
          return latLng;
        });

        const polyline = new naver.maps.Polyline({
          map: mapInstance,
          path: path,
          strokeColor: '#2196F3',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        });

        polylinesRef.current.push(polyline);
      }
    });

    // 웨이포인트 마커 추가
    gpxData.waypoints.forEach((waypoint) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(waypoint.lat, waypoint.lon),
        map: mapInstance,
        title: waypoint.name || '웨이포인트',
        icon: {
          content: `
            <div style="
              background: #4CAF50;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              white-space: nowrap;
            ">
              ${waypoint.name || '📍'}
            </div>
          `,
          anchor: new naver.maps.Point(0, 0),
        },
      });
      markersRef.current.push(marker);
    });

    // 시작점과 종료점 마커 추가
    if (firstPoint) {
      const startPos: GpxPoint = firstPoint;
      
      // 시작점 마커
      const startMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(startPos.lat, startPos.lon),
        map: mapInstance,
        title: '시작',
        icon: {
          content: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
            ">
              <div style="
                background: #4CAF50;
                color: white;
                padding: 6px 12px;
                font-size: 12px;
                font-weight: bold;
                box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                border: 2px solid white;
                white-space: nowrap;
                margin-bottom: 4px;
              ">
                시작
              </div>
              <div style="
                background: #4CAF50;
                color: white;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.4);
                border: 2px solid white;
              "></div>
            </div>
          `,
          anchor: new naver.maps.Point(8, 40),
        },
        zIndex: 100,
      });
      markersRef.current.push(startMarker);

      // 종료점 마커
      if (lastPoint) {
        const endPos: GpxPoint = lastPoint;
        
        // 시작점과 위치가 다른 경우에만 표시
        if (endPos.lat !== startPos.lat || endPos.lon !== startPos.lon) {
        
        const endMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(endPos.lat, endPos.lon),
          map: mapInstance,
          title: '종료',
          icon: {
            content: `
              <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
              ">
                <div style="
                  background: #F44336;
                  color: white;
                  padding: 6px 12px;
                  font-size: 12px;
                  font-weight: bold;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                  border: 2px solid white;
                  white-space: nowrap;
                  margin-bottom: 4px;
                ">
                  종료
                </div>
                <div style="
                  background: #F44336;
                  color: white;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
                  border: 2px solid white;
                "></div>
              </div>
            `,
            anchor: new naver.maps.Point(8, 40),
          },
          zIndex: 100,
        });
        markersRef.current.push(endMarker);
        }
      }
    }

    // 모든 포인트가 보이도록 지도 범위 조정
    if (allPoints.length > 0) {
      const bounds = new naver.maps.LatLngBounds(
        allPoints[0],
        allPoints[0]
      );

      allPoints.forEach((point) => {
        bounds.extend(point);
      });

      mapInstance.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }

    // cleanup
    return () => {
      polylinesRef.current.forEach((polyline) => polyline.setMap(null));
      polylinesRef.current = [];
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [gpxData]);

  return (
    <div className="w-full h-80 border border-black">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

export default GpxPreviewMapView;

