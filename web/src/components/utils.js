import polygonArea from "area-polygon";
import { Auth } from "aws-amplify";
import {
  LocationClient,
  ListGeofencesCommand,
  BatchDeleteGeofenceCommand,
  PutGeofenceCommand,
} from "@aws-sdk/client-location";
import awsconfig from "../aws-exports";

export class Location {
  constructor(geofenceCollectionName) {
    this.client = null;
    this.geofenceCollectionName = geofenceCollectionName;
  }

  async buildClient() {
    const credentials = await Auth.currentCredentials();
    this.client = new LocationClient({
      credentials: credentials,
      region: awsconfig.aws_project_region,
    });
    return this.client;
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
    if (!this.client) {
      await this.buildClient();
    }
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
    if (!this.client) {
      await this.buildClient();
    }
    console.log("Geofence create event object", e);
    if (e.features.length > 0) {
      const params = {
        CollectionName: this.geofenceCollectionName,
        GeofenceId: e.features[e.features.length - 1].id,
        Geometry: {
          Polygon: e.features[e.features.length - 1].geometry.coordinates.map(
            this.ccwPolygon
          ),
        },
      };
      const res = await this.client.send(new PutGeofenceCommand(params));
      console.debug(res);
    }
  }

  async loadGeofence(draw) {
    if (!this.client) {
      await this.buildClient();
    }
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
