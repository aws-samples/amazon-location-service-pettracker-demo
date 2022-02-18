#
# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#

#title           envsetup.sh
#description     This script will setup the Cloud9 IDE with the prerequisite packages and code for the Amazon Location Service workshop.
#author          Fabio Oliveira (@fabiool)
#contributors    @fabiool
#date            2021-04-21
#version         0.1
#usage           curl -sSL https://raw.githubusercontent.com/fbdo/iot-workshop-for-pet-tracking-and-geofencing/develop/envcleanup.sh | bash -s stable
#==============================================================================

for appId in "$(aws amplify list-apps --query 'apps[?name == `pettrackerapp`].appId' --output text)"; do if [[ $appId ]]; then aws amplify delete-app --app-id $appId; fi; done
aws cloudformation delete-stack --stack-name C9-ALS-Workshop
aws cloudformation delete-stack --stack-name PetTrackerStack
aws cloudformation wait stack-delete-complete --stack-name PetTrackerStack && aws cloudformation delete-stack --stack-name CDKToolkit
