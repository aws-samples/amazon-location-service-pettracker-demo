import logging as log

"""
Receiver Lambda.

- Receives MQTT message from device.
- Parses MQTT message topic and payload (containing position).
- Sends position to AWS AppSync endpoint
- Sends postision to ALS tracker
"""

def handler(event, context):
    log.getLogger().setLevel(log.INFO)

    log.info('Hello from our position Lambda!')