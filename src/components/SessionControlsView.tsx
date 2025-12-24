import type { SessionInfo } from '@/hooks/useSessionInfo';

interface Props {
  sessionInfo: SessionInfo;
  isHost: boolean;
  leaving: boolean;
  onCopyInviteCode: () => void;
  onLeaveSession: () => void;
}

function SessionControlsView({
  isHost,
  leaving,
  onCopyInviteCode,
  onLeaveSession,
}: Props) {
  return (
    <div className="bg-white p-4 border-t border-black space-y-2">
      {isHost && (
        <button
          onClick={onCopyInviteCode}
          className="w-full border border-black text-black py-3 px-4 font-semibold hover:bg-gray-100 transition"
        >
          초대 링크 복사
        </button>
      )}
      <button
        onClick={onLeaveSession}
        disabled={leaving}
        className="w-full border border-black text-black py-3 px-4 font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {leaving ? '나가는 중...' : '모임 나가기'}
      </button>
    </div>
  );
}

export default SessionControlsView;

