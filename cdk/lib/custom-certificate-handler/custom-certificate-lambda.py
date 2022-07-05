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

        thingName = event['ResourceProperties']['thingName']
        certId = event.setdefault('PhysicalResourceId', '')

        response = iot.describe_endpoint(
            endpointType='iot:Data-ATS'
        )
        iotEndpoint = response['endpointAddress']
        responseData['iotEndpoint'] = iotEndpoint

        if event['RequestType'] == 'Create':
            response = iot.create_keys_and_certificate(
                setAsActive=True
            )
            certId = response['certificateId']
            certArn = response['certificateArn']
            certPem = response['certificatePem']
            privateKey = response['keyPair']['PrivateKey']
            publicKey = response['keyPair']['PublicKey']

            responseData['certificateId'] = certId
            responseData['certificateArn'] = certArn
            credentials = [{'certificatePem': certPem}, {
                'privateKey': privateKey}, {'publicKey': publicKey}]
            secretName = '{}-Credentials'.format(thingName)
            try:
                response = secretsmanager.create_secret(
                    Name=secretName, SecretString=json.dumps(credentials))
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceExistsException':
                    response = secretsmanager.update_secret(
                        SecretId=secretName, SecretString=json.dumps(credentials))
            responseData['secretArn'] = response['ARN']
            result = cfnresponse.SUCCESS
        elif event['RequestType'] == 'Update':
            log.info('Updating certificate: %s' % certId)
            result = cfnresponse.SUCCESS
        elif event['RequestType'] == 'Delete':
            response = iot.update_certificate(
                certificateId=certId,
                newStatus='INACTIVE'
            )
            response = iot.delete_certificate(
                certificateId=certId,
                forceDelete=True
            )
            secretName = '{}-Credentials'.format(thingName)
            secretsmanager.delete_secret(
                SecretId=secretName, ForceDeleteWithoutRecovery=True)
            result = cfnresponse.SUCCESS
    except ClientError as e:
        log.error('Error: {}'.format(e))
        result = cfnresponse.FAILED

    log.info('Returning response of: {}, with result of: {}'.format(
        result, responseData))
    sys.stdout.flush()
    cfnresponse.send(event, context, result, responseData,
                     physicalResourceId=certId)
