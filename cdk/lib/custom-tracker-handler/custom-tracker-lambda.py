import sys
import cfnresponse
import boto3
from botocore.exceptions import ClientError
import json
import logging as log


def handler(event, context):

    log.getLogger().setLevel(log.INFO)
    responseData = {}
    result = cfnresponse.FAILED

    try:
        client = boto3.client("location")
        trackerName = event['ResourceProperties']['TrackerName']

        if event['RequestType'] == 'Create':
            log.info('Creating tracker: %s' % trackerName)
            response = client.create_tracker(
                TrackerName=trackerName,
                PricingPlan='RequestBasedUsage'
            )

            responseData['CreateTime'] = response['CreateTime']
            responseData['TrackerArn'] = response['TrackerArn']
            responseData['TrackerName'] = response['TrackerName']
            result = cfnresponse.SUCCESS

        elif event['RequestType'] == 'Update':
            log.info('Updating tracker: %s' % trackerName)
            result = cfnresponse.SUCCESS
        elif event['RequestType'] == 'Delete':
            log.info('Deleting tracker: %s' % trackerName)

            response = client.delete_tracker(
                TrackerName=trackerName
            )

            result = cfnresponse.SUCCESS
    except ClientError as e:
        log.error('Error: {}'.format(e))
        result = cfnresponse.FAILED

    log.info('Returning response of: {}, with result of: {}'.format(
        result, responseData))
    sys.stdout.flush()
    cfnresponse.send(event, context, result, responseData)