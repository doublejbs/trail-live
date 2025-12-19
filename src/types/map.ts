export interface Location {
  lat: number;
  lon: number;
}

export interface UserLocation extends Location {
  userId: string;
  nickname: string;
  updatedAt: string;
}

export interface RouteData {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString' | 'Point' | 'Polygon';
    coordinates: number[][] | number[];
  };
  properties: Record<string, any>;
}
