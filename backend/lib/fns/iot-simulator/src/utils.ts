import { mqtt, iot } from "aws-iot-device-sdk-v2";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import intersect from "@turf/intersect";
import buffer from "@turf/buffer";
import bbox from "@turf/bbox";
import bboxPolygon from "@turf/bbox-polygon";
import { randomPosition } from "@turf/random";
import { point, BBox, Position } from "@turf/helpers";

class Simulator {
  private ioTtopic: string;
  private clientId: string;
  private endpoint: string;
  private isConnected: boolean = false;
  private secretClient: SecretsManagerClient;
  private secretId: string;
  private cert?: string;
  private key?: string;
  private ioTConnection?: mqtt.MqttClientConnection;

  constructor(
    clientId: string,
    endpoint: string,
    topic: string,
    secretId: string
  ) {
    this.ioTtopic = topic;
    this.clientId = clientId;
    this.endpoint = endpoint;
    this.secretId = secretId;
    this.secretClient = new SecretsManagerClient({});
  }

  private async getCertAndKey(): Promise<{
    cert: string;
    key: string;
  }> {
    if (!this.cert || !this.key) {
      const secret = await this.secretClient.send(
        new GetSecretValueCommand({
          SecretId: this.secretId,
        })
      );
      const { SecretString } = secret;
      if (!SecretString) {
        throw new Error("Could not find secret");
      }
      const { cert, keyPair } = JSON.parse(SecretString);

      this.cert = cert;
      this.key = keyPair;

      if (!this.cert || !this.key) {
        throw new Error("Could not find cert or key");
      }

      console.info("got cert and key from Secrets Manager");
    }

    return {
      cert: this.cert,
      key: this.key,
    };
  }

  private buildConnection = async (
    clientId: string,
    endpoint: string
  ): Promise<mqtt.MqttClientConnection> => {
    const { cert, key } = await this.getCertAndKey();
    let configBuilder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder(
      cert,
      key
    );
    configBuilder.with_clean_session(false);
    configBuilder.with_client_id(clientId);
    configBuilder.with_endpoint(endpoint);
    const config = configBuilder.build();
    const client = new mqtt.MqttClient();

    return client.new_connection(config);
  };

  private connect = async () => {
    try {
      this.ioTConnection = await this.buildConnection(
        this.clientId,
        this.endpoint
      );
    } catch (err) {
      console.log(err);
      console.log("Failed to build connection object");
      throw err;
    }

    try {
      console.info("Connecting to IoT Core");
      await this.ioTConnection.connect();
      console.info("Successfully connected to IoT Core");
      this.isConnected = true;
    } catch (err) {
      console.error("Error connecting to IoT Core", { err });
      throw err;
    }
  };

  private disconnect = async () => {
    await this.ioTConnection?.disconnect();
  };

  private publishUpdate = async (id: string, location: Position) => {
    if (!this.isConnected) {
      await this.connect();
    }

    const payload = {
      id: id,
      timestamp: new Date().getTime(),
      lng: location[0],
      lat: location[1],
    };

    await this.ioTConnection?.publish(
      this.ioTtopic,
      JSON.stringify({
        payload,
      }),
      mqtt.QoS.AtMostOnce
    );
  };

  /**
   * Generates a random point within the given bounding box and within the given radius.
   *
   * It takes the initial position and the map bounds as input. It then creates a buffer
   * around the point which represents the area that the device might end up in.
   *
   * To avoid generating a point that is outside of the map bounds, it then intersects the
   * buffer with the map bounds and then generates a random point within the intersection.
   *
   * Then it publishes the new position to the IoT Core.
   */
  public makeStep = async (id: string, position: Position, mapBounds: BBox) => {
    const currentPosition = point(position);
    // Create a buffer around the current position (i.e. a polygon 10m around the point)
    const bufferAroundPoint = buffer(currentPosition, 10, { units: "meters" });
    // Create a bounding box around the buffer
    const bboxAroundPoint = bbox(bufferAroundPoint);
    // Make it a polygon
    const bboxPolygonAroundPoint = bboxPolygon(bboxAroundPoint);
    console.debug("bboxPolygonAroundPoint");
    console.debug(JSON.stringify(bboxPolygonAroundPoint, null, 2));

    // Create a bounding box around the map bounds
    const mapBoundsPolygon = bboxPolygon(mapBounds);
    console.debug("mapBoundsPolygon");
    console.debug(JSON.stringify(mapBoundsPolygon, null, 2));

    // Intersect the two polygons and get only the part of the polygon that is
    // within the map bounds
    const diff = intersect(mapBoundsPolygon, bboxPolygonAroundPoint);

    // Create a bounding box around the intersection
    const availableBbox = bbox(diff);
    console.debug("availableBbox");
    console.debug(JSON.stringify(availableBbox, null, 2));

    // Generate a random point within the intersection bounding box
    const nextPosition = randomPosition(bboxAroundPoint);
    console.debug("position");
    console.debug(JSON.stringify(nextPosition, null, 2));

    await this.publishUpdate(id, nextPosition);

    return nextPosition;
  };
}

export default Simulator;
