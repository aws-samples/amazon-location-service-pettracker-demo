# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from datetime import datetime
import json
import os
import logging

import boto3

# Update this to match the name of your Tracker resource
TRACKER_NAME = os.environ['TRACKER_NAME']

client = boto3.client("location")
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Expected event body:
#
#{ "deviceId": "thing123", 
#  "timestamp": 1604940328,
#  "location": {
#    "lat": 49.2819, 
#    "long": -123.1187
#   }
# }
#
def lambda_handler(event, context):


  logger.info('Received event: %s.', event)

  response = {}

  return {
    "statusCode": 200,
    "body": json.dumps(response)
  }