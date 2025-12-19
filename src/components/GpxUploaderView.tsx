import { useRef, useState } from 'react';
import GpxParser from '@/utils/gpxParser';
import type { GpxData } from '@/types/gpx';

interface Props {
  onGpxLoaded: (gpxData: GpxData) => void;
}

function GpxUploaderView({ onGpxLoaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('GPX 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parser = new GpxParser();
      const gpxData = await parser.parseGpxFile(file);

      console.log('GPX 파일 로드 완료:', gpxData);

      const totalPoints = 
        gpxData.tracks.reduce((sum, track) => 
          sum + track.segments.reduce((segSum, seg) => segSum + seg.points.length, 0), 0) +
        gpxData.routes.reduce((sum, route) => sum + route.points.length, 0);

      if (totalPoints === 0) {
        setError('GPX 파일에 유효한 경로 데이터가 없습니다.');
        setIsLoading(false);
        return;
      }

      setLoadedFileName(file.name);
      onGpxLoaded(gpxData);
    } catch (err) {
      console.error('GPX 파일 로드 실패:', err);
      setError(err instanceof Error ? err.message : 'GPX 파일을 로드하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleFileSelect}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-black text-black hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent"></div>
              <span>GPX 파일 로딩 중...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span>GPX 파일 선택</span>
            </>
          )}
        </button>

      </div>

      {loadedFileName && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-white border border-black">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-black flex-shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-black font-semibold">{loadedFileName}</span>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-white border border-black">
          <p className="text-sm text-black">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}

export default GpxUploaderView;

