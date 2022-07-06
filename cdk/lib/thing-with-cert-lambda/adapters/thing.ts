import { StandardLogger } from 'aws-cloudformation-custom-resource';
import { IotPort } from '../ports/iot';
import { ThingPort } from '../ports/thing';

const logger = new StandardLogger();

export const thingAdaptor = (iotAdaptor: IotPort): ThingPort => {
  return {
    create: async (thingName) => {
      const { thingArn } = await iotAdaptor.createThing({
        thingName: thingName,
      });
      logger.info(`Thing created with ARN: ${thingArn}`);
      const { certificateId, certificateArn, certificatePem, keyPair } =
        await iotAdaptor.createKeysAndCertificates();
      const { PrivateKey } = keyPair!;
      const { policyArn } = await iotAdaptor.createPolicy(thingName);
      logger.info(`Policy created with ARN: ${policyArn}`);
      await iotAdaptor.attachPrincipalPolicy({
        policyName: thingName,
        principal: certificateArn!,
      });
      logger.info('Policy attached to certificate');
      await iotAdaptor.attachThingPrincipal({
        principal: certificateArn!,
        thingName: thingName,
      });
      logger.info('Certificate attached to thing');
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
        logger.info(`Policy detached from certificate for ${thingName}`);
        await iotAdaptor.detachThingPrincipal({
          principal: certificateArn,
          thingName: thingName,
        });
        logger.info(`Certificate detached from thing for ${certificateArn}`);
        await iotAdaptor.updateCertificateToInactive(certificateArn);
        logger.info(`Certificate marked as inactive for ${certificateArn}`);

        await iotAdaptor.deleteCertificate(certificateArn);
        logger.info(`Certificate deleted from thing for ${certificateArn}`);
        await iotAdaptor.deleteThing(thingName);
        logger.info(`Thing deleted with name: ${thingName}`);
      }
      await iotAdaptor.deletePolicy(thingName);
      logger.info(`Policy deleted: ${thingName}`);
    },
  };
};