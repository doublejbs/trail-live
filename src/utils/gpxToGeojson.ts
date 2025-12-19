import type { GpxData } from '@/types/gpx';

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  properties: {
    name?: string;
  };
}

interface GeoJson {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

class GpxToGeojsonConverter {
  public convertGpxToGeojson(gpxData: GpxData): GeoJson {
    const features: GeoJsonFeature[] = [];

    // 트랙을 GeoJSON LineString으로 변환
    gpxData.tracks.forEach((track) => {
      track.segments.forEach((segment) => {
        if (segment.points.length > 0) {
          const coordinates = segment.points.map((point) => [
            point.lon,
            point.lat,
            point.ele || 0,
          ]);

          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates,
            },
            properties: {
              name: track.name,
            },
          });
        }
      });
    });

    // 경로를 GeoJSON LineString으로 변환
    gpxData.routes.forEach((route) => {
      if (route.points.length > 0) {
        const coordinates = route.points.map((point) => [
          point.lon,
          point.lat,
          point.ele || 0,
        ]);

        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {
            name: route.name,
          },
        });
      }
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}

export default GpxToGeojsonConverter;

