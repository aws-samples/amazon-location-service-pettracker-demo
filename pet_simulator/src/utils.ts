// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { mqtt, iot } from "aws-iot-device-sdk-v2";
import { getSecret } from "@aws-lambda-powertools/parameters/secrets";
import { IoTClient, DescribeEndpointCommand } from "@aws-sdk/client-iot";
import { randomPosition } from "@turf/random";
import bbox from "@turf/bbox";
import buffer from "@turf/buffer";
import { point, Position } from "@turf/helpers";
import promiseRetry from "promise-retry";

const retryOptions = {
  retries: 10,
  minTimeout: 5_000,
  maxTimeout: 10_000,
  factor: 1.25,
};

class Simulator {
  private ioTtopic: string;
  private clientId: string;
  private isConnected: boolean = false;
  private iotCoreClient: IoTClient;
  private secretId: string;
  private currentPosition: Position;
  private stepDistance: number;
  private stepAccuracy: number;
  private cert?: string;
  private key?: string;
  private endpoint?: string;
  private ioTConnection?: mqtt.MqttClientConnection;

  constructor(
    clientId: string,
    topic: string,
    secretId: string,
    seed: Position,
    stepDistance: number,
    stepAccuracy: number
  ) {
    this.ioTtopic = topic;
    this.clientId = clientId;
    this.secretId = secretId;
    this.currentPosition = seed;
    this.stepDistance = stepDistance;
    this.stepAccuracy = stepAccuracy;
    this.iotCoreClient = new IoTClient({});
  }

  private async getEndpoint(): Promise<string> {
    return promiseRetry(async (retry: (err?: Error) => never, _: number) => {
      try {
        const endpoint = await this.iotCoreClient.send(
          new DescribeEndpointCommand({
            endpointType: "iot:Data-ATS",
          })
        );

        if (!endpoint.endpointAddress)
          throw new Error("Unable to get IoT Core Endpoint");

        console.info(`Got IoT Core Endpoint: ${endpoint.endpointAddress}`);
        return endpoint.endpointAddress;
      } catch (err) {
        retry(err as Error);
      }
    }, retryOptions);
  }

  private async getCertAndKey(): Promise<{
    cert: string;
    key: string;
  }> {
    if (!this.cert || !this.key) {
      const secret = await getSecret<{ cert: string; keyPair: string }>(
        this.secretId,
        {
          transform: "json",
          maxAge: 10000,
        }
      );
      if (!secret) {
        throw new Error("Could not find secret");
      }
      const { cert, keyPair } = secret;

      this.cert = cert;
      this.key = keyPair;

      if (!this.cert || !this.key) {
        throw new Error("Could not find cert or key");
      }

      console.info("Got cert and key from Secrets Manager");
    }

    return {
      cert: this.cert,
      key: this.key,
    };
  }

  private buildConnection = async (
    clientId: string
  ): Promise<mqtt.MqttClientConnection> => {
    if (!this.endpoint) {
      this.endpoint = await this.getEndpoint();
    }
    const { cert, key } = await this.getCertAndKey();
    let configBuilder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder(
      cert,
      key
    );
    configBuilder.with_clean_session(false);
    configBuilder.with_client_id(clientId);
    configBuilder.with_endpoint(this.endpoint);
    const config = configBuilder.build();
    const client = new mqtt.MqttClient();

    return client.new_connection(config);
  };

  private connect = async () => {
    try {
      this.ioTConnection = await this.buildConnection(this.clientId);
    } catch (err) {
      console.error(err);
      console.error("Failed to build connection object");
      throw err;
    }

    try {
      console.info("Connecting to IoT Core");
      await promiseRetry(async (retry: (err?: Error) => never, _: number) => {
        try {
          await this.ioTConnection?.connect();
        } catch (err) {
          console.error(err);
          retry(new Error("Connection failed, retrying."));
        }
      }, retryOptions);
      console.info("Successfully connected to IoT Core");
      this.isConnected = true;
    } catch (err) {
      console.error("Error connecting to IoT Core", { err });
      throw err;
    }
  };

  private publishUpdate = async (location: Position) => {
    if (!this.isConnected) {
      await this.connect();
    }

    const payload = {
      deviceId: this.clientId,
      timestamp: new Date().getTime(),
      longitude: location[0],
      latitude: location[1],
      positionProperties: {
        batteryLevel: 100,
      },
      accuracy: {
        horizontal: this.stepAccuracy,
      },
    };

    // Log update before publishing
    console.debug(JSON.stringify(payload, null, 2));

    await this.ioTConnection?.publish(
      this.ioTtopic,
      JSON.stringify({
        ...payload,
      }),
      mqtt.QoS.AtMostOnce
    );
  };

  /**
   * Generates a random point within a given radius from another point.
   *
   * It takes the initial position and the map bounds as input. It then creates a buffer
   * around the point which represents the area that the device might end up in.
   *
   * It then generates a random point within the area and publishes it to the IoT Core endpoint/topic.
   */
  public makeStep = async () => {
    const currentPosition = point(this.currentPosition);
    // Create a buffer around the current position (i.e. a polygon 10feet around the point)
    const bufferAroundPoint = buffer(currentPosition, this.stepDistance, {
      units: "feet",
    });
    // Create a bounding box around the buffer
    const bboxAroundPoint = bbox(bufferAroundPoint);
    // Generate a random point within the intersection bounding box
    const nextPosition = randomPosition(bboxAroundPoint);
    // Publish
    await this.publishUpdate(nextPosition);
  };
}

export default Simulator;
