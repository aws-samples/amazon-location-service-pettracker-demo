# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import sys
import cfnresponse
import boto3
from botocore.exceptions import ClientError
import json
import logging as log


def handler(event, context):

    log.getLogger().setLevel(log.INFO)
    responseData = {}

    try:
        log.info('Received event: {}'.format(json.dumps(event)))
        result = cfnresponse.FAILED
        iot = boto3.client('iot')
        secretsmanager = boto3.client('secretsmanager')

        thingName = event['ResourceProperties']['ThingName']
        certId = event.setdefault('PhysicalResourceId', '')

        if event['RequestType'] == 'Create':
            log.info('Creating certificate for thing: %s' % thingName)

            certId, certARN, secretARN = create(iot, secretsmanager, thingName)

            responseData['certificateId'] = certId
            responseData['certificateArn'] = certARN
            responseData['secretArn'] = secretARN
            result = cfnresponse.SUCCESS

        elif event['RequestType'] == 'Update':
            log.info('Updating certificate')

            delete(iot, secretsmanager, thingName, certId)
            certId, certARN, secretARN = create(iot, secretsmanager, thingName)

            responseData['certificateId'] = certId
            responseData['certificateArn'] = certARN
            responseData['secretArn'] = secretARN
            result = cfnresponse.SUCCESS

        elif event['RequestType'] == 'Delete':
            log.info('Deleting certificate')

            delete(iot, secretsmanager, thingName, certId)
            result = cfnresponse.SUCCESS

    except ClientError as e:
        log.error('Error: {}'.format(e))
        result = cfnresponse.FAILED

    log.info('Returning response of: {}, with result of: {}'.format(
        result, responseData))
    sys.stdout.flush()
    cfnresponse.send(event, context, result, responseData,
                     physicalResourceId=certId)

def create(iot, secretsmanager, thingName):
    iotCertResponse = iot.create_keys_and_certificate(
                setAsActive=True
            )

    certPem = iotCertResponse['certificatePem']
    privateKey = iotCertResponse['keyPair']['PrivateKey']
    publicKey = iotCertResponse['keyPair']['PublicKey']

    credentials = [{'certificatePem': certPem}, {
                'privateKey': privateKey}, {'publicKey': publicKey}]
    secretName = '{}-Credentials'.format(thingName)
    try:
        secretMgrResponse = secretsmanager.create_secret(
                    Name=secretName, SecretString=json.dumps(credentials))
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceExistsException':
            secretMgrResponse = secretsmanager.update_secret(
                        SecretId=secretName, SecretString=json.dumps(credentials))
                        
    return iotCertResponse['certificateId'], iotCertResponse['certificateArn'], secretMgrResponse['ARN']


def delete(iot, secretsmanager, thingName, certId):
    iot.update_certificate(
        certificateId=certId,
        newStatus='INACTIVE'
    )
    iot.delete_certificate(
        certificateId=certId,
        forceDelete=True
    )
    secretName = '{}-Credentials'.format(thingName)
    secretsmanager.delete_secret(
        SecretId=secretName, ForceDeleteWithoutRecovery=True)
