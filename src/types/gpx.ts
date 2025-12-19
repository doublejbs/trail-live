export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

export interface GpxTrackSegment {
  points: GpxPoint[];
}

export interface GpxTrack {
  name?: string;
  segments: GpxTrackSegment[];
}

export interface GpxRoute {
  name?: string;
  points: GpxPoint[];
}

export interface GpxWaypoint {
  lat: number;
  lon: number;
  name?: string;
  ele?: number;
  time?: string;
}

export interface GpxData {
  tracks: GpxTrack[];
  routes: GpxRoute[];
  waypoints: GpxWaypoint[];
  metadata?: {
    name?: string;
    desc?: string;
    time?: string;
  };
}

