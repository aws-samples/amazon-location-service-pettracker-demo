from datetime import datetime
import json
import os

import boto3

# Update this to match the name of your Tracker resource
TRACKER_NAME = os.environ['TRACKER_NAME']

# Expected event body:
#
#{ "deviceid": "thing123", 
#  "timestamp": 1604940328,
#  "location": {
#    "lat": 49.2819, 
#    "long": -123.1187
#   }
# }
#
def lambda_handler(event, context):
  # load the side-loaded Amazon Location Service model; needed during Public Preview
  os.environ["AWS_DATA_PATH"] = os.environ["LAMBDA_TASK_ROOT"]

  updates = [
    {
      "DeviceId": event["deviceid"],
      "SampleTime": datetime.fromtimestamp(event["timestamp"]).isoformat(),
      "Position": [
        event["location"]["long"],
        event["location"]["lat"]
      ]
    }
  ]

  client = boto3.client("location")
  response = client.batch_update_device_position(TrackerName=TRACKER_NAME, Updates=updates)

  return {
    "statusCode": 200,
    "body": json.dumps(response)
  }