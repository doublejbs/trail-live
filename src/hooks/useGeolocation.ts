import { useState, useEffect, useRef } from 'react';
import type { Location } from '@/types/map';

interface UseGeolocationReturn {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('브라우저에서 위치 정보를 지원하지 않습니다.');
      setLoading(false);
      return;
    }

    let watchId: number | null = null;

    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setError(null);
          setLoading(false);
          retryCountRef.current = 0; // 성공 시 재시도 카운트 초기화
        },
        (err) => {
          console.warn('Geolocation error:', err.code, err.message);
          
          // 위치를 찾을 수 없는 경우 (kCLErrorLocationUnknown)
          if (err.code === err.POSITION_UNAVAILABLE || err.code === 2) {
            // 최대 3번까지 재시도
            if (retryCountRef.current < 3) {
              retryCountRef.current++;
              setError(`위치 정보를 가져오는 중... (${retryCountRef.current}/3)`);
              
              // 5초 후 재시도
              retryTimeoutRef.current = window.setTimeout(() => {
                if (watchId !== null) {
                  navigator.geolocation.clearWatch(watchId);
                }
                startWatching();
              }, 5000);
            } else {
              setError('위치를 찾을 수 없습니다. GPS 신호를 확인해주세요.');
              setLoading(false);
            }
          } else if (err.code === err.PERMISSION_DENIED || err.code === 1) {
            setError('위치 정보 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.');
            setLoading(false);
          } else if (err.code === err.TIMEOUT || err.code === 3) {
            setError('위치 정보 요청 시간이 초과되었습니다. 다시 시도 중...');
            // 타임아웃은 자동으로 재시도
          } else {
            setError(err.message);
            setLoading(false);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 5초 → 10초로 증가
          maximumAge: 0,
        }
      );
    };

    startWatching();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return { location, error, loading };
}

export default useGeolocation;
