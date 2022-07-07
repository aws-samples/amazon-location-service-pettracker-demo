// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

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