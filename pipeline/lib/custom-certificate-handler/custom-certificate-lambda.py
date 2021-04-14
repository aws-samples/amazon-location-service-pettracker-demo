#  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
#  Permission is hereby granted, free of charge, to any person obtaining a copy of
#  this software and associated documentation files (the "Software"), to deal in
#  the Software without restriction, including without limitation the rights to
#  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
#  the Software, and to permit persons to whom the Software is furnished to do so.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
#  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
#  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
#  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
#  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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
