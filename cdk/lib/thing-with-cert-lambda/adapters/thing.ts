// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { IotPort } from '../ports/iot';
import { ThingPort } from '../ports/thing';

export const thingAdaptor = (iotAdaptor: IotPort): ThingPort => {
  return {
    create: async (thingName) => {
      const { thingArn } = await iotAdaptor.createThing({
        thingName: thingName,
      });
      console.info(`Thing created with ARN: ${thingArn}`);
      const { certificateId, certificateArn, certificatePem, keyPair } =
        await iotAdaptor.createKeysAndCertificates();
      const { PrivateKey } = keyPair!;
      const { policyArn } = await iotAdaptor.createPolicy(thingName);
      console.info(`Policy created with ARN: ${policyArn}`);
      await iotAdaptor.attachPrincipalPolicy({
        policyName: thingName,
        principal: certificateArn!,
      });
      console.info('Policy attached to certificate');
      await iotAdaptor.attachThingPrincipal({
        principal: certificateArn!,
        thingName: thingName,
      });
      console.info('Certificate attached to thing');
      return {
        certId: certificateId!,
        certPem: certificatePem!,
        privKey: PrivateKey!,
        thingArn: thingArn!,
      };
    },
    delete: async (thingName) => {
      const { principals } = await iotAdaptor.listThingPrincipals(thingName);
      for await (const certificateArn of principals!) {
        await iotAdaptor.detachPrincipalPolicy({
          policyName: thingName,
          principal: certificateArn,
        });
        console.info(`Policy detached from certificate for ${thingName}`);
        await iotAdaptor.detachThingPrincipal({
          principal: certificateArn,
          thingName: thingName,
        });
        console.info(`Certificate detached from thing for ${certificateArn}`);
        await iotAdaptor.updateCertificateToInactive(certificateArn);
        console.info(`Certificate marked as inactive for ${certificateArn}`);

        await iotAdaptor.deleteCertificate(certificateArn);
        console.info(`Certificate deleted from thing for ${certificateArn}`);
        await iotAdaptor.deleteThing(thingName);
        console.info(`Thing deleted with name: ${thingName}`);
      }
      await iotAdaptor.deletePolicy(thingName);
      console.info(`Policy deleted: ${thingName}`);
    },
  };
};