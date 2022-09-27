#!/bin/bash

set -e

# Install jq
# sudo yum -y -q install jq

# Change to the emulator directory
cd ./emulator

if [[ ! -d .pettracker ]]
then
    # First time executing script
    # Create a Python virtual environment
    virtualenv .pettracker
    
    source .pettracker/bin/activate
    
    # Install the required Python modules and libraries:
    pip3 install -r requirements.txt
fi

# Activate the virtual environment:
source .pettracker/bin/activate

# Execute the command below to set an environment variable with AWS IoT MQTT endpoint
IOT_ENDPOINT=`aws iot describe-endpoint --endpoint-type iot:Data-ATS --query endpointAddress --output text`

# Save the Amazon Root CA in the "certs" folder:
[[ ! -f certs/AmazonRootCA1.pem ]] && curl https://www.amazontrust.com/repository/AmazonRootCA1.pem --output certs/AmazonRootCA1.pem

# Save the device certificate in the "certs" folder:
[[ ! -f certs/device.pem.crt ]] && aws secretsmanager get-secret-value --secret-id pettracker/iot-cert --query SecretString --output text | jq -r '.cert' > certs/device.pem.crt

# Save the device private key in the "certs" folder:
[[ ! -f certs/private.pem.key ]] && aws secretsmanager get-secret-value --secret-id pettracker/iot-cert --query SecretString --output text | jq -r '.keyPair' > certs/private.pem.key


python3 pet.py --lat $1 --long $2 --root-ca "$PWD/certs/AmazonRootCA1.pem" --cert "$PWD/certs/device.pem.crt" --key "$PWD/certs/private.pem.key" --endpoint $IOT_ENDPOINT