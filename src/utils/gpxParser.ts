import type { GpxData, GpxPoint, GpxTrack, GpxRoute, GpxWaypoint } from '@/types/gpx';

class GpxParser {
  public parseGpxFile(file: File): Promise<GpxData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const gpxData = this.parseGpxText(text);
          resolve(gpxData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };

      reader.readAsText(file);
    });
  }

  private parseGpxText(text: string): GpxData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('GPX 파일 형식이 올바르지 않습니다.');
    }

    const gpxData: GpxData = {
      tracks: [],
      routes: [],
      waypoints: [],
      metadata: this.parseMetadata(xmlDoc),
    };

    gpxData.tracks = this.parseTracks(xmlDoc);
    gpxData.routes = this.parseRoutes(xmlDoc);
    gpxData.waypoints = this.parseWaypoints(xmlDoc);

    return gpxData;
  }

  private parseMetadata(xmlDoc: Document) {
    const metadata = xmlDoc.querySelector('metadata');
    if (!metadata) return undefined;

    return {
      name: metadata.querySelector('name')?.textContent || undefined,
      desc: metadata.querySelector('desc')?.textContent || undefined,
      time: metadata.querySelector('time')?.textContent || undefined,
    };
  }

  private parseTracks(xmlDoc: Document): GpxTrack[] {
    const tracks: GpxTrack[] = [];
    const trkElements = xmlDoc.querySelectorAll('trk');

    trkElements.forEach((trkElement) => {
      const track: GpxTrack = {
        name: trkElement.querySelector('name')?.textContent || undefined,
        segments: [],
      };

      const trkSegElements = trkElement.querySelectorAll('trkseg');
      trkSegElements.forEach((segElement) => {
        const points = this.parseTrackPoints(segElement);
        if (points.length > 0) {
          track.segments.push({ points });
        }
      });

      if (track.segments.length > 0) {
        tracks.push(track);
      }
    });

    return tracks;
  }

  private parseTrackPoints(segElement: Element): GpxPoint[] {
    const points: GpxPoint[] = [];
    const trkptElements = segElement.querySelectorAll('trkpt');

    trkptElements.forEach((trkptElement) => {
      const lat = parseFloat(trkptElement.getAttribute('lat') || '0');
      const lon = parseFloat(trkptElement.getAttribute('lon') || '0');
      const ele = trkptElement.querySelector('ele')?.textContent;
      const time = trkptElement.querySelector('time')?.textContent;

      points.push({
        lat,
        lon,
        ele: ele ? parseFloat(ele) : undefined,
        time: time || undefined,
      });
    });

    return points;
  }

  private parseRoutes(xmlDoc: Document): GpxRoute[] {
    const routes: GpxRoute[] = [];
    const rteElements = xmlDoc.querySelectorAll('rte');

    rteElements.forEach((rteElement) => {
      const route: GpxRoute = {
        name: rteElement.querySelector('name')?.textContent || undefined,
        points: [],
      };

      const rteptElements = rteElement.querySelectorAll('rtept');
      rteptElements.forEach((rteptElement) => {
        const lat = parseFloat(rteptElement.getAttribute('lat') || '0');
        const lon = parseFloat(rteptElement.getAttribute('lon') || '0');
        const ele = rteptElement.querySelector('ele')?.textContent;
        const time = rteptElement.querySelector('time')?.textContent;

        route.points.push({
          lat,
          lon,
          ele: ele ? parseFloat(ele) : undefined,
          time: time || undefined,
        });
      });

      if (route.points.length > 0) {
        routes.push(route);
      }
    });

    return routes;
  }

  private parseWaypoints(xmlDoc: Document): GpxWaypoint[] {
    const waypoints: GpxWaypoint[] = [];
    const wptElements = xmlDoc.querySelectorAll('wpt');

    wptElements.forEach((wptElement) => {
      const lat = parseFloat(wptElement.getAttribute('lat') || '0');
      const lon = parseFloat(wptElement.getAttribute('lon') || '0');
      const name = wptElement.querySelector('name')?.textContent;
      const ele = wptElement.querySelector('ele')?.textContent;
      const time = wptElement.querySelector('time')?.textContent;

      waypoints.push({
        lat,
        lon,
        name: name || undefined,
        ele: ele ? parseFloat(ele) : undefined,
        time: time || undefined,
      });
    });

    return waypoints;
  }
}

export default GpxParser;

