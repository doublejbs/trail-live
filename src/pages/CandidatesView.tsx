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

type ViewMode = 'map' | 'list';

function CandidatesView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const candidateMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // 마커 아이콘 생성 함수
  const createMarkerIcon = (name: string, isSelected: boolean) => ({
    content: `
      <div style="
        background: ${isSelected ? '#10B981' : '#3B82F6'};
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        white-space: nowrap;
        cursor: pointer;
      ">
        ${name}
      </div>
    `,
    anchor: new naver.maps.Point(0, 0),
  });

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

  // 선택된 후보지 마커 색상 업데이트
  useEffect(() => {
    candidateMarkersRef.current.forEach((marker) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidateId = (marker as any).candidateId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidateName = (marker as any).candidateName;
      const isSelected = selectedCandidate?.id === candidateId;
      marker.setIcon(createMarkerIcon(candidateName, isSelected));
    });
  }, [selectedCandidate]);

  // 뷰 모드 변경 시 지도 크기 재조정
  useEffect(() => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      // 지도가 다시 표시될 때 크기 재조정
      setTimeout(() => {
        if (mapInstanceRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).naver.maps.Event.trigger(mapInstanceRef.current, 'resize');
        }
      }, 0);
    }
  }, [viewMode]);

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
        icon: createMarkerIcon(candidate.name, false),
        zIndex: 100,
      });

      // 마커에 후보지 정보 저장
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (marker as any).candidateId = candidate.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (marker as any).candidateName = candidate.name;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      naver.maps.Event.addListener(marker, 'click', () => {
        handleCandidateClick(candidate);
      });

      candidateMarkersRef.current.set(candidate.id, marker);
    });

    // 모든 마커가 보이도록 지도 범위 조정 (최초 1회만)
    if (candidates.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }
  }, [candidates]);

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
  };

  return (
    <div className="w-full h-screen relative">
      {/* 뷰 전환 버튼 */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-300 flex">
        <button
          onClick={() => setViewMode('map')}
          className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
            viewMode === 'map'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          🗺️ 지도
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          📋 리스트
        </button>
      </div>

      {/* 지도 뷰 */}
      <div className={viewMode === 'map' ? 'block w-full h-full' : 'hidden'}>
        <div ref={mapRef} className="w-full h-full" />
        
        {/* 후보지 없음 메시지 */}
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

        {/* 선택된 후보지 정보 (지도 위 오버레이) */}
        {selectedCandidate && (
          <div className="absolute bottom-6 left-6 right-6 bg-white rounded-lg shadow-xl border border-gray-300 p-6 max-w-md">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold">{selectedCandidate.name}</h2>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-gray-500 hover:text-black ml-2 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedCandidate.price && (
                <div>
                  <div className="text-sm text-gray-600 mb-1 font-medium">가격</div>
                  <div className="text-lg font-bold text-gray-900">{selectedCandidate.price}</div>
                </div>
              )}

              {selectedCandidate.link && (
                <div>
                  <div className="text-sm text-gray-600 mb-1 font-medium">링크</div>
                  <a
                    href={selectedCandidate.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:underline break-all"
                  >
                    {selectedCandidate.link}
                  </a>
                </div>
              )}

              {selectedCandidate.memo && (
                <div>
                  <div className="text-sm text-gray-600 mb-1 font-medium">메모</div>
                  <div className="text-base whitespace-pre-wrap text-gray-900 leading-relaxed">{selectedCandidate.memo}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 리스트 뷰 */}
      <div className={`w-full h-full bg-gray-50 overflow-y-auto ${viewMode === 'list' ? 'block' : 'hidden'}`}>
          <div className="max-w-4xl mx-auto p-6 pt-20">
            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4 text-lg">등록된 후보지가 없습니다</div>
                <a
                  href="/add-candidate"
                  className="text-blue-600 hover:underline"
                >
                  후보지 추가하기 →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{candidate.name}</h3>

                    <div className="space-y-3">
                      {candidate.price && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1 font-medium">가격</div>
                          <div className="text-lg font-bold text-gray-900">{candidate.price}</div>
                        </div>
                      )}

                      {candidate.link && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1 font-medium">링크</div>
                          <a
                            href={candidate.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base text-blue-600 hover:underline break-all"
                          >
                            {candidate.link}
                          </a>
                        </div>
                      )}

                      {candidate.memo && (
                        <div>
                          <div className="text-sm text-gray-600 mb-1 font-medium">메모</div>
                          <div className="text-base whitespace-pre-wrap text-gray-900 leading-relaxed">{candidate.memo}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

export default CandidatesView;

