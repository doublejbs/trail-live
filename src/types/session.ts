export interface Session {
  id: string;
  name: string;
  hostId: string;
  inviteCode: string;
  createdAt: string;
  isActive: boolean;
}

export interface SessionMember {
  id: string;
  sessionId: string;
  userId: string;
  nickname: string;
  joinedAt: string;
}

export interface CreateSessionParams {
  name: string;
  hostId: string;
}

export interface JoinSessionParams {
  inviteCode: string;
  userId: string;
}
