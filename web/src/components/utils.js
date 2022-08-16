import polygonArea from "area-polygon";
import {
  LocationClient,
  ListGeofencesCommand,
  BatchDeleteGeofenceCommand,
  PutGeofenceCommand,
} from "@aws-sdk/client-location";

export class Location {
  constructor(credentials, awsRegion, geofenceCollectionName) {
    this.client = new LocationClient({
      credentials: credentials,
      region: awsRegion,
    });
    this.geofenceCollectionName = geofenceCollectionName;
  }

  ccwPolygon(coordinates) {
    const area = polygonArea(coordinates, true);
    //if area is negative, polygon is drawn in clockwise orientation
    //else area is positive, polygon is drawn in counter-clockwise orientation
    if (area < 0) {
      //return the reversed array of coordinates
      //since reversing clockwise coordinates will make them counter-clockwise
      return coordinates.slice().reverse();
    }
    return coordinates;
  }

  async deleteGeofence(e) {
    console.log("Geofence delete event object", e);
    if (e.features.length > 0) {
      const params = {
        CollectionName: this.geofenceCollectionName,
        GeofenceIds: [e.features[e.features.length - 1].id],
      };
      const res = await this.client.send(
        new BatchDeleteGeofenceCommand(params)
      );
      console.debug(res);
    }
  }

  async createUpdateGeofence(e) {
    console.log("Geofence create event object", e);
    if (e.features.length > 0) {
      const params = {
        CollectionName: this.geofenceCollectionName,
        GeofenceId: e.features[e.features.length - 1].id,
        Geometry: {
          Polygon:
            e.features[e.features.length - 1].geometry.coordinates.map(
              ccwPolygon
            ),
        },
      };
      const res = await this.client.send(new PutGeofenceCommand(params));
      console.debug(res);
    }
  }

  async loadGeofence(draw) {
    const res = await this.client.send(
      new ListGeofencesCommand({
        CollectionName: this.geofenceCollectionName,
      })
    );

    if (res && res.Entries.length > 0) {
      console.log("Geofence stored:", res);
      draw.set({
        type: "FeatureCollection",
        features: res.Entries.map((entry) => {
          return {
            id: entry.GeofenceId,
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: entry.Geometry.Polygon },
          };
        }),
      });
    }
  }
}
