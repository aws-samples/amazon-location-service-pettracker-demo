import { Iot } from 'aws-sdk';
import { IotPort } from '../ports/iot';
import { getCertIdFromARN } from '../util/iot';

export const iotAdaptor = (iot: Iot): IotPort => {
  return {
    createThing: async (thingRequest) => {
      return iot.createThing(thingRequest).promise();
    },
    createKeysAndCertificates: async () => {
      return iot
        .createKeysAndCertificate({
          setAsActive: true,
        })
        .promise();
    },
    createPolicy: async (thingName) => {
      return iot
        .createPolicy({
          policyName: thingName,
          policyDocument: policyDoc,
        })
        .promise();
    },
    attachPrincipalPolicy: async (props) => {
      await iot.attachPrincipalPolicy(props).promise();
    },
    attachThingPrincipal: async (props) => {
      return iot.attachThingPrincipal(props).promise();
    },
    listThingPrincipals: async (thingName) => {
      return iot
        .listThingPrincipals({
          thingName: thingName,
        })
        .promise();
    },
    detachPrincipalPolicy: async (props) => {
      await iot.detachPrincipalPolicy(props).promise();
    },
    detachThingPrincipal: async (props) => {
      return iot.detachThingPrincipal(props).promise();
    },
    updateCertificateToInactive: async (certArn) => {
      await iot
        .updateCertificate({
          certificateId: getCertIdFromARN(certArn),
          newStatus: 'INACTIVE',
        })
        .promise();
    },
    deleteCertificate: async (certArn) => {
      await iot
        .deleteCertificate({
          certificateId: getCertIdFromARN(certArn),
        })
        .promise();
    },
    deletePolicy: async (policyName) => {
      await iot
        .deletePolicy({
          policyName: policyName,
        })
        .promise();
    },
    deleteThing: async (thingName) => {
      await iot
        .deleteThing({
          thingName: thingName,
        })
        .promise();
    },
  };
};

const policyDoc = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Publish",
        "iot:Subscribe",
        "iot:Connect",
        "iot:Receive"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "iot:GetThingShadow",
        "iot:UpdateThingShadow",
        "iot:DeleteThingShadow"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}`;