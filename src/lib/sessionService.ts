/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './supabase';
import type { GpxData } from '@/types/gpx';
import GpxToGeojsonConverter from '@/utils/gpxToGeojson';

interface CreateSessionResult {
  sessionId: string;
  inviteCode: string;
  shareUrl: string;
}

class SessionService {
  private generateInviteCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  public async createSession(
    sessionName: string,
    hostId: string,
    hostNickname: string,
    gpxData?: GpxData | null
  ): Promise<CreateSessionResult> {
    try {
      console.log('Creating session with hostId:', hostId, 'nickname:', hostNickname);
      
      // hostId로 users 테이블에 사용자가 있는지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, nickname')
        .eq('id', hostId)
        .maybeSingle();

      console.log('User check result:', { existingUser });

      if (!existingUser) {
        console.log('User not found in public.users table, creating...');
        // public.users 테이블에 사용자가 없으면 생성
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: hostId,
            nickname: hostNickname,
            plan: 'free',
          } as any);

        if (insertError) {
          console.error('Failed to create user profile:', insertError);
          throw new Error(`사용자 프로필 생성 실패: ${insertError.message}`);
        }
        console.log('User profile created successfully');
      }

      // 1. 초대 코드 생성 (중복 체크)
      let inviteCode = this.generateInviteCode();
      let isUnique = false;

      while (!isUnique) {
        const { data: existing } = await supabase
          .from('sessions')
          .select('id')
          .eq('invite_code', inviteCode)
          .single();

        if (!existing) {
          isUnique = true;
        } else {
          inviteCode = this.generateInviteCode();
        }
      }

      // 2. 세션 생성
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          name: sessionName,
          host_id: hostId,
          invite_code: inviteCode,
          is_active: true,
        } as any)
        .select()
        .single();

      if (sessionError) {
        throw new Error(`세션 생성 실패: ${sessionError.message}`);
      }

      if (!session) {
        throw new Error('세션이 생성되지 않았습니다.');
      }

      // 3. 호스트를 세션 멤버로 추가
      const { error: memberError } = await supabase
        .from('session_members')
        .insert({
          session_id: (session as any).id,
          user_id: hostId,
        } as any);

      if (memberError) {
        throw new Error(`멤버 추가 실패: ${memberError.message}`);
      }

      // 4. GPX 데이터가 있으면 routes 테이블에 저장
      if (gpxData) {
        const converter = new GpxToGeojsonConverter();
        const geojson = converter.convertGpxToGeojson(gpxData);

        const { error: routeError } = await supabase
          .from('routes')
          .insert({
            session_id: (session as any).id,
            geojson: geojson as any,
          } as any);

        if (routeError) {
          console.error('경로 저장 실패:', routeError);
          // 경로 저장 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 5. 공유 URL 생성
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/?code=${inviteCode}`;

      return {
        sessionId: (session as any).id,
        inviteCode: inviteCode,
        shareUrl: shareUrl,
      };
    } catch (error) {
      console.error('세션 생성 중 오류:', error);
      throw error;
    }
  }

  public async getMyHostedSessions(userId: string): Promise<any[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, name, invite_code, created_at, is_active')
        .eq('host_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching hosted sessions:', error);
        return [];
      }

      return sessions || [];
    } catch (error) {
      console.error('Error in getMyHostedSessions:', error);
      return [];
    }
  }

  public async getMyJoinedSessions(userId: string): Promise<any[]> {
    try {
      const { data: sessionMembers, error } = await supabase
        .from('session_members')
        .select(`
          session_id,
          joined_at,
          sessions!inner (
            id,
            name,
            host_id,
            invite_code,
            created_at,
            is_active
          )
        `)
        .eq('user_id', userId)
        .eq('sessions.is_active', true)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching joined sessions:', error);
        return [];
      }

      // 내가 호스트가 아닌 세션만 필터링
      const joinedSessions = sessionMembers
        ?.filter((member: any) => member.sessions.host_id !== userId)
        .map((member: any) => ({
          ...member.sessions,
          joined_at: member.joined_at,
        })) || [];

      return joinedSessions;
    } catch (error) {
      console.error('Error in getMyJoinedSessions:', error);
      return [];
    }
  }

  public async joinSession(inviteCode: string, userId: string): Promise<string> {
    try {
      // 1. 초대 코드로 세션 찾기
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, is_active')
        .eq('invite_code', inviteCode)
        .single();

      if (sessionError || !session) {
        throw new Error('유효하지 않은 초대 코드입니다.');
      }

      if (!(session as any).is_active) {
        throw new Error('종료된 모임입니다.');
      }

      // 2. 이미 참가했는지 확인
      const { data: existing } = await supabase
        .from('session_members')
        .select('id')
        .eq('session_id', (session as any).id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return (session as any).id; // 이미 참가한 경우 세션 ID만 반환
      }

      // 3. 세션에 참가
      const { error: memberError } = await supabase
        .from('session_members')
        .insert({
          session_id: (session as any).id,
          user_id: userId,
        } as any);

      if (memberError) {
        throw new Error(`모임 참가 실패: ${memberError.message}`);
      }

      return (session as any).id;
    } catch (error) {
      console.error('모임 참가 중 오류:', error);
      throw error;
    }
  }

  public async getSessionRoute(sessionId: string): Promise<any | null> {
    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select('geojson')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('경로 조회 실패:', error);
        return null;
      }

      if (!routes || routes.length === 0) {
        return null;
      }

      return (routes[0] as any).geojson;
    } catch (error) {
      console.error('경로 조회 중 오류:', error);
      return null;
    }
  }
}

export default SessionService;

