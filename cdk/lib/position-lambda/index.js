// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const AWSAppSyncClient = require('aws-appsync').default;
const gql = require('graphql-tag');
require('cross-fetch/polyfill');
require('isomorphic-fetch');

const queryGQL = gql(require('./graphql/queries').getLocation);
const createGQL = gql(require('./graphql/mutations').createLocation);
const updateGQL = gql(require('./graphql/mutations').updateLocation);

const region = process.env.REGION

AWS.config.update({
    region
});
const SSM = new AWS.SSM();

const parameterPromise = SSM.getParameter({Name: 'PetTrackerGraphQLEndpoint'}).promise();
const credentials = AWS.config.credentials;

/**
 *
 * @param {*} event event body, format:
 * { "deviceid": "thing123", 
 *  "timestamp": 1604940328,
 *  "location": {
 *   "lat": 49.2819, 
 *   "long": -123.1187
 *  }
 * }
 * @returns
 */
exports.handler = (event) => {
    console.log('event received:' + JSON.stringify(event));

    function retrievePetTrackeGraphQLEndpoint() {
        return parameterPromise.then(function (data, err) {
            if (err) {
                console.error(err)
                throw err
            } else return data.Parameter.Value;
        });
    }

    function createAppSyncClient() {
        return function (endpoint) {
            console.log('SSM Parameter value:' + endpoint);

            return new AWSAppSyncClient({
                    url: endpoint,
                    region: region,
                    auth: {
                        type: 'AWS_IAM',
                        credentials: credentials,
                    },
                    disableOffline: true,
                },
                {
                    defaultOptions: {
                        query: {
                            fetchPolicy: 'network-only',
                            errorPolicy: 'all',
                        },
                    },
                }
            ).hydrated();
        };
    }

    function updateExistingDevice(appSyncClient) {
        console.log('Updating existing device, id: ', event.deviceId);
        return appSyncClient.mutate({
            mutation: updateGQL,
            variables: {
                input: {
                    id: event.deviceId,
                    lat: event.location.lat,
                    long: event.location.long
                }
            }
        });
    }

    function createNewDevice(appSyncClient) {
        console.log('Creating new device, id:', event.deviceId);
        return appSyncClient.mutate({
            mutation: createGQL,
            variables: {
                input: {
                    id: event.deviceId,
                    lat: event.location.lat,
                    long: event.location.long
                }
            }
        });
    }

    function searchForExistingDevice(appSyncClient) {
        console.log('Searching for an existing device, id:', event.deviceId);
        return appSyncClient.query({
            query: queryGQL,
            variables: {
                id: event.deviceId
            }
        });
    }

    function createOrUpdateDevicePosition() {
        return function (appSyncClient) {
            return searchForExistingDevice(appSyncClient).then(function (queryResult) {
                console.log('Query result:' + JSON.stringify(queryResult.data));
                if (queryResult.data.getLocation) {
                    return updateExistingDevice(appSyncClient);
                } else {
                    return createNewDevice(appSyncClient);
                }
            })

        };
    }

    return retrievePetTrackeGraphQLEndpoint()
        .then(createAppSyncClient())
        .then(createOrUpdateDevicePosition())
        .then(() => {
            return {
                statusCode: 200
            }
        })
        .catch(error => {
            console.error(error)
            return {
                statusCode: error.statusCode ? error.statusCode : 500
            }
        });
}