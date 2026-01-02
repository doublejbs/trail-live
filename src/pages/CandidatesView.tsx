import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Candidate {
  id: string;
  name: string;
  lat: number;
  lon: number;
  link: string | null;
  price: string | null;
  memo: string | null;
  created_at: string;
}

function CandidatesView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const candidateMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = new naver.maps.LatLng(37.5665, 126.978);

    const map = new naver.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
      mapTypeControl: true,
    });

    mapInstanceRef.current = map;
  }, []);

  // 후보지 목록 불러오기
  useEffect(() => {
    loadCandidates();
  }, []);

  // 후보지 마커 표시
  useEffect(() => {
    if (!mapInstanceRef.current || candidates.length === 0) return;

    // 기존 마커 제거
    candidateMarkersRef.current.forEach(marker => marker.setMap(null));
    candidateMarkersRef.current.clear();

    // 지도 범위 계산을 위한 bounds
    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(candidates[0].lat, candidates[0].lon),
      new naver.maps.LatLng(candidates[0].lat, candidates[0].lon)
    );

    // 새 마커 추가
    candidates.forEach((candidate) => {
      const position = new naver.maps.LatLng(candidate.lat, candidate.lon);
      bounds.extend(position);

      const marker = new naver.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        icon: {
          content: `
            <div style="
              background: #3B82F6;
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              white-space: nowrap;
              cursor: pointer;
            ">
              ${candidate.name}
            </div>
          `,
          anchor: new naver.maps.Point(0, 0),
        },
        zIndex: 100,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      naver.maps.Event.addListener(marker, 'click', () => {
        handleCandidateClick(candidate);
      });

      candidateMarkersRef.current.set(candidate.id, marker);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (candidates.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: selectedCandidate ? 250 : 50,
        left: 50,
      });
    }
  }, [candidates, selectedCandidate]);

  const loadCandidates = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCandidates(data || []);
    } catch (error) {
      console.error('후보지 불러오기 오류:', error);
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);

    if (mapInstanceRef.current) {
      const position = new naver.maps.LatLng(candidate.lat, candidate.lon);
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(16);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-black p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1">후보지 목록</h1>
            <p className="text-sm text-gray-600">
              총 {candidates.length}개의 후보지
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="text-sm px-4 py-2 border border-black hover:bg-gray-100 transition"
          >
            ← 뒤로
          </button>
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        
        {candidates.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-4 rounded-lg shadow-lg border border-gray-200">
            <div className="text-center">
              <div className="text-gray-500 mb-2">등록된 후보지가 없습니다</div>
              <a
                href="/add-candidate"
                className="text-sm text-blue-600 hover:underline"
              >
                후보지 추가하기 →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 선택된 후보지 정보 */}
      {selectedCandidate && (
        <div className="bg-white border-t border-black p-4">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-bold">{selectedCandidate.name}</h2>
            <button
              onClick={() => setSelectedCandidate(null)}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {selectedCandidate.price && (
              <div>
                <div className="text-xs text-gray-500 mb-1">가격</div>
                <div className="text-sm font-semibold">{selectedCandidate.price}</div>
              </div>
            )}

            {selectedCandidate.link && (
              <div>
                <div className="text-xs text-gray-500 mb-1">링크</div>
                <a
                  href={selectedCandidate.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {selectedCandidate.link}
                </a>
              </div>
            )}

            {selectedCandidate.memo && (
              <div>
                <div className="text-xs text-gray-500 mb-1">메모</div>
                <div className="text-sm whitespace-pre-wrap">{selectedCandidate.memo}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidatesView;

