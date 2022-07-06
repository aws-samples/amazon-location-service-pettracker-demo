export type CreateThingResponse = {
    certId: string;
    certPem: string;
    privKey: string;
    thingArn: string;
  };
  
  export interface ThingPort {
    create: (thingName: string) => Promise<CreateThingResponse>;
    delete: (thingName: string) => Promise<void>;
  }