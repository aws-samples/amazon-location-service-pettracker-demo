import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Cdk from '../lib/data-ingestion-stack';
import '@aws-cdk/assert/jest';

test('Exist a thing', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Cdk.PetTrackerDataIngestionStack(app, 'MyTestStack');
    // THEN

    expect(stack).toHaveResource('AWS::IoT::Thing', {
      ThingName: "PetTrackerThing"
    })
});
