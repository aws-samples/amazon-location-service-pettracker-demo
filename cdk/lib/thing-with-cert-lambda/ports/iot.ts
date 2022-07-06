import * as iot from 'aws-sdk/clients/iot';

export interface IotPort {
  createThing: (
    thingRequest: iot.CreateThingRequest
  ) => Promise<iot.CreateThingResponse>;
  createKeysAndCertificates: () => Promise<iot.CreateKeysAndCertificateResponse>;
  createPolicy: (thingName: string) => Promise<iot.CreatePolicyResponse>;
  attachPrincipalPolicy: (
    props: iot.AttachPrincipalPolicyRequest
  ) => Promise<void>;
  attachThingPrincipal: (
    props: iot.AttachThingPrincipalRequest
  ) => Promise<iot.AttachThingPrincipalResponse>;
  listThingPrincipals: (
    thingName: string
  ) => Promise<iot.ListThingPrincipalsResponse>;
  detachPrincipalPolicy: (
    props: iot.DetachPrincipalPolicyRequest
  ) => Promise<void>;
  detachThingPrincipal: (
    props: iot.DetachThingPrincipalRequest
  ) => Promise<iot.DetachThingPrincipalResponse>;
  updateCertificateToInactive: (certArn: string) => Promise<void>;
  deleteCertificate: (certArn: string) => Promise<void>;
  deletePolicy: (policyName: string) => Promise<void>;
  deleteThing: (thingName: string) => Promise<void>;
}