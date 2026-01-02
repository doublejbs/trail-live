import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

interface CandidateData {
  lat: number;
  lon: number;
  name: string;
  link: string;
  price: string;
  memo: string;
}

function AddCandidateView() {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const candidateMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [clickedPosition, setClickedPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [candidateData, setCandidateData] = useState<CandidateData>({
    lat: 0,
    lon: 0,
    name: '',
    link: '',
    price: '',
    memo: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = new naver.maps.LatLng(37.5665, 126.978);

    const map = new naver.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.TOP_RIGHT,
      },
      mapTypeControl: true,
    });

    mapInstanceRef.current = map;

    // 지도 클릭 이벤트
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver.maps.Event.addListener(map, 'click', (e: any) => {
      const latlng = e.coord;
      const lat = latlng.lat ? latlng.lat() : latlng.y;
      const lng = latlng.lng ? latlng.lng() : latlng.x;
      
      handleMapClick(lat, lng);
    });
  }, []);

  // 후보지 목록 불러오기
  useEffect(() => {
    loadCandidates();
  }, []);

  // 후보지 마커 표시
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 기존 마커 제거
    candidateMarkersRef.current.forEach(marker => marker.setMap(null));
    candidateMarkersRef.current.clear();

    // 새 마커 추가
    candidates.forEach((candidate) => {
      const position = new naver.maps.LatLng(candidate.lat, candidate.lon);
      const marker = new naver.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        icon: {
          content: `
            <div style="
              background: #10B981;
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
    setClickedPosition(null);
    setIsEditing(true);
    setCandidateData({
      lat: candidate.lat,
      lon: candidate.lon,
      name: candidate.name,
      link: candidate.link || '',
      price: candidate.price || '',
      memo: candidate.memo || '',
    });

    // 선택 마커 표시
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const position = new naver.maps.LatLng(candidate.lat, candidate.lon);
    const marker = new naver.maps.Marker({
      position,
      map: mapInstanceRef.current!,
      icon: {
        content: `
          <div style="
            background: #EF4444;
            color: white;
            padding: 10px 16px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(239,68,68,0.4);
            white-space: nowrap;
          ">
            📍 선택됨
          </div>
        `,
        anchor: new naver.maps.Point(0, 0),
      },
      zIndex: 1000,
    });

    markerRef.current = marker;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(17);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    if (!mapInstanceRef.current) return;

    // 기존 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 새 마커 추가
    const position = new naver.maps.LatLng(lat, lon);
    const marker = new naver.maps.Marker({
      position,
      map: mapInstanceRef.current,
      icon: {
        content: `
          <div style="
            background: #EF4444;
            color: white;
            padding: 10px 16px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(239,68,68,0.4);
            white-space: nowrap;
          ">
            📍 선택된 위치
          </div>
        `,
        anchor: new naver.maps.Point(0, 0),
      },
      zIndex: 1000,
    });

    markerRef.current = marker;
    setSelectedCandidate(null);
    setClickedPosition({ lat, lon });
    setIsEditing(false);
    setCandidateData({
      lat,
      lon,
      name: '',
      link: '',
      price: '',
      memo: '',
    });
  };

  const handleSaveCandidate = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!candidateData.name.trim()) {
      alert('후보지 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && selectedCandidate) {
        // 수정
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('candidates')
          .update({
            name: candidateData.name.trim(),
            link: candidateData.link.trim() || null,
            price: candidateData.price.trim() || null,
            memo: candidateData.memo.trim() || null,
          })
          .eq('id', selectedCandidate.id);

        if (error) throw error;

        alert('후보지가 수정되었습니다.');
      } else if (clickedPosition) {
        // 추가
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from('candidates')
          .insert({
            name: candidateData.name.trim(),
            lat: clickedPosition.lat,
            lon: clickedPosition.lon,
            link: candidateData.link.trim() || null,
            price: candidateData.price.trim() || null,
            memo: candidateData.memo.trim() || null,
          });

        if (error) throw error;

        alert('후보지가 추가되었습니다.');
      }

      // 초기화
      await loadCandidates();
      setClickedPosition(null);
      setSelectedCandidate(null);
      setIsEditing(false);
      setCandidateData({
        lat: 0,
        lon: 0,
        name: '',
        link: '',
        price: '',
        memo: '',
      });
      
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    } catch (error) {
      console.error('후보지 저장 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`후보지 저장 실패: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate || !user) {
      alert('삭제할 후보지를 선택해주세요.');
      return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    setIsSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('candidates')
        .delete()
        .eq('id', selectedCandidate.id);

      if (error) throw error;

      alert('후보지가 삭제되었습니다.');
      
      // 초기화
      await loadCandidates();
      setSelectedCandidate(null);
      setIsEditing(false);
      setCandidateData({
        lat: 0,
        lon: 0,
        name: '',
        link: '',
        price: '',
        memo: '',
      });
      
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    } catch (error) {
      console.error('후보지 삭제 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`후보지 삭제 실패: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-black p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1">후보지 추가</h1>
            <p className="text-sm text-gray-600">지도를 클릭하여 후보지 위치를 선택하세요</p>
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
      </div>

      {/* 후보지 정보 입력 */}
      {(clickedPosition || selectedCandidate) && (
        <div className="bg-white border-t border-black p-4">
          <div className="space-y-3">
            {isEditing && selectedCandidate && (
              <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded mb-2">
                <div className="text-sm font-semibold text-blue-800">후보지 수정 중</div>
                <div className="text-xs text-blue-600 mt-1">
                  위치: {selectedCandidate.lat.toFixed(6)}, {selectedCandidate.lon.toFixed(6)}
                </div>
              </div>
            )}
            {clickedPosition && !isEditing && (
              <div className="text-xs text-gray-500 mb-2">
                선택 위치: {clickedPosition.lat.toFixed(6)}, {clickedPosition.lon.toFixed(6)}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1">
                후보지 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={candidateData.name}
                onChange={(e) => setCandidateData({ ...candidateData, name: e.target.value })}
                placeholder="예: 강남 아파트, 서초 오피스텔"
                className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">링크</label>
              <input
                type="url"
                value={candidateData.link}
                onChange={(e) => setCandidateData({ ...candidateData, link: e.target.value })}
                placeholder="https://..."
                className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">가격</label>
              <input
                type="text"
                value={candidateData.price}
                onChange={(e) => setCandidateData({ ...candidateData, price: e.target.value })}
                placeholder="예: 5억, 50,000만원, 500"
                className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">메모</label>
              <textarea
                value={candidateData.memo}
                onChange={(e) => setCandidateData({ ...candidateData, memo: e.target.value })}
                placeholder="후보지에 대한 메모를 입력하세요"
                rows={3}
                className="w-full border border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setClickedPosition(null);
                  setSelectedCandidate(null);
                  setIsEditing(false);
                  setCandidateData({
                    lat: 0,
                    lon: 0,
                    name: '',
                    link: '',
                    price: '',
                    memo: '',
                  });
                  if (markerRef.current) {
                    markerRef.current.setMap(null);
                    markerRef.current = null;
                  }
                }}
                className="flex-1 border border-black text-black px-6 py-3 font-semibold hover:bg-gray-100 transition"
              >
                취소
              </button>
              
              {isEditing && selectedCandidate && (
                <button
                  onClick={handleDeleteCandidate}
                  disabled={isSaving}
                  className="border border-red-500 text-red-500 px-6 py-3 font-semibold hover:bg-red-50 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  삭제
                </button>
              )}
              
              <button
                onClick={handleSaveCandidate}
                disabled={isSaving || !candidateData.name.trim()}
                className="flex-1 bg-black text-white px-6 py-3 font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {isSaving ? '저장 중...' : isEditing ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddCandidateView;

