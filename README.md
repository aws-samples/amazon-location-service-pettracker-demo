# Amazon Location Service PetTracker Demo

The **PetTracker Demo** is a cloud native application built using an serverless architecture based on AWS services to show case [AWS IoT](https://aws.amazon.com/iot/) integrations for geospatial use cases in conjuction with the [Amazon Location Services](https://aws.amazon.com/location/) to help Solution Architects around the world to make use of it in their demos and workshops.

## Architecture Diagram

![PetTracker Architecture](docs/PetTrackerArchitecture.png "PetTracker Architecture")

## How to install

1. In the AWS Management Console on the Services menu, navigate to [CloudShell](https://console.aws.amazon.com/cloudshell/home).
2. Copy and past the following commands into the terminal:

```shell
curl -O https://raw.githubusercontent.com/aws-samples/amazon-location-service-pettracker-demo/main/cloud9-cfn.yaml

aws cloudformation create-stack --stack-name C9-ALS-Workshop --template-body file://cloud9-cfn.yaml --capabilities CAPABILITY_NAMED_IAM

aws cloudformation wait stack-create-complete --stack-name C9-ALS-Workshop && echo 'Cloud9 IDE created sucessfully!'
```
3. When the last command returns with the success message, navigate to [Cloud9](https://console.aws.amazon.com/cloud9) and click on the "Open IDE" link on the newly created environment.

4. Execute the following command in the terminal:

```shell
curl -sSL https://raw.githubusercontent.com/aws-samples/amazon-location-service-pettracker-demo/main/envsetup.sh | bash -s stable
```

5. Wait for the setup, go take a coffee! And happy coding!

## How to test

1. Execute the pet emulator. It will emulate a pet running around a initial geolocation:

```shell
./run_emulator.sh 48.192459 11.617745 
```

## How to clean up

1. In the AWS Management Console on the Services menu, navigate to [CloudShell](https://console.aws.amazon.com/cloudshell/home).
2. Copy and past the following commands into the terminal:

```shell
curl -sSL https://raw.githubusercontent.com/aws-samples/amazon-location-service-pettracker-demo/main/envcleanup.sh | bash -s stable
```


## Technology Stack

* [IoT Core](https://aws.amazon.com/iot-core/)
* [IoT Analytics](https://aws.amazon.com/iot-analytics/)
* [AWS Lambda](https://aws.amazon.com/lambda/)
* [Amazon Location Service](https://aws.amazon.com/location/)
* [AWS AppSync](https://aws.amazon.com/appsync/)
* [AWS Amplify](https://aws.amazon.com/amplify/)
* [Amazon DynamoDB](https://aws.amazon.com/dynamodb/)
* [Amazon EventBridge](https://aws.amazon.com/eventbridge/)
* [Amazon Simple Notification Service](https://aws.amazon.com/sns/)

## Contributions

To contribute with improvements and bug fixes, see [CONTRIBUTING](CONTRIBUTING.md).

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.
