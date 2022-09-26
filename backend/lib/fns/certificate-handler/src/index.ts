// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceDeleteEvent,
} from "aws-lambda";
import {
  IoTClient,
  CreateKeysAndCertificateCommand,
  UpdateCertificateCommand,
  DeleteCertificateCommand,
} from "@aws-sdk/client-iot";
import {
  SecretsManagerClient,
  CreateSecretCommand,
  DeleteSecretCommand,
} from "@aws-sdk/client-secrets-manager";

const onCreate = async (_event: CloudFormationCustomResourceCreateEvent) => {
  const { certificateId, certificatePem, keyPair } = await iot.send(
    new CreateKeysAndCertificateCommand({
      setAsActive: true,
    })
  );

  if (!certificateId || !certificatePem || !keyPair) {
    throw new Error("Failed to create keys and certificate");
  }

  await secretsManager.send(
    new CreateSecretCommand({
      Name: "pettracker/iot-cert",
      SecretString: JSON.stringify({
        cert: certificatePem,
        keyPair: keyPair.PrivateKey,
      }),
    })
  );

  return {
    PhysicalResourceId: certificateId,
    Data: {
      certificateId,
    },
  };
};

const onDelete = async (event: CloudFormationCustomResourceDeleteEvent) => {
  await secretsManager.send(
    new DeleteSecretCommand({
      SecretId: "pettracker/iot-cert",
      ForceDeleteWithoutRecovery: true,
    })
  );
  const certificateId = event.PhysicalResourceId;
  await iot.send(
    new UpdateCertificateCommand({
      certificateId,
      newStatus: "INACTIVE",
    })
  );
  await iot.send(new DeleteCertificateCommand({ certificateId }));
};

const iot = new IoTClient({});
const secretsManager = new SecretsManagerClient({});

export const handler = async (event: CloudFormationCustomResourceEvent) => {
  console.log(event);
  if (event.RequestType === "Create") {
    return await onCreate(event);
  } else if (event.RequestType === "Update") {
    return;
  } else if (event.RequestType === "Delete") {
    return await onDelete(event);
  }
  throw new Error("Unknown request type");
};
