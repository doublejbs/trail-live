import { useNavigate } from 'react-router-dom';
import type { SessionInfo } from '@/hooks/useSessionInfo';

interface Props {
  sessionInfo: SessionInfo;
  isHost: boolean;
}

function SessionHeaderView({ sessionInfo, isHost }: Props) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-black p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/join-session')}
          className="flex items-center gap-2 text-black hover:text-gray-600 transition-colors"
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          <span className="font-semibold">뒤로</span>
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">{sessionInfo.name}</h1>
          {isHost && (
            <p className="text-xs text-gray-600 mt-1">호스트</p>
          )}
        </div>
        <div className="w-16"></div>
      </div>
    </header>
  );
}

export default SessionHeaderView;

