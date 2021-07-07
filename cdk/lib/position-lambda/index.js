const AWS = require('aws-sdk');
const AWSAppSyncClient = require('aws-appsync').default;
const gql = require('graphql-tag');
require('cross-fetch/polyfill');

const queryGQL = gql(require('./graphql/queries').getLocation);
const createGQL = gql(require('./graphql/mutations').createLocation);
const updateGQL = gql(require('./graphql/mutations').updateLocation);

const region = process.env.REGION

AWS.config.update({
    region
});
const SSM = new AWS.SSM();

const appsyncUrlSSM = SSM.getParameter('PetTrackerGraphQLEndpoint').promise();
const endpoint = appsyncUrlSSM.Parameter.Value;

const credentials = AWS.config.credentials;

const client = new AWSAppSyncClient({
    url: endpoint,
    region: region,
    auth: {
        type: 'AWS_IAM',
        credentials,
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
);

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
exports.handler = async (event) => {

    console.log('event received:' + JSON.stringify(event));

    client.hydrated().then(function (cl) {
        cl.query({
            query: queryGQL,
            variables: {
                deviceid: event.deviceid
            }
        }).then(function createOrUpdate(data) {
            console.log('Result of the query for device id: ' + event.deviceid + ', : ' + JSON.stringify(data));

            if (data) {
                cl.mutate({
                    mutation: updateGQL,
                    variables: {
                        id: event.deviceid,
                        deviceid: event.deviceid,
                        lat: event.location.lat,
                        long: event.location.long,
                        updatedAt: event.timestamp
                    }
                });
            } else {
                cl.mutate({
                    mutation: createGQL,
                    variables: {
                        deviceid: event.deviceid,
                        lat: event.location.lat,
                        long: event.location.long,
                        createdAt: event.timestamp
                    }
                });
            }
        }).catch(console.error);
    });

    console.log("Successful update");


    return {
        statusCode: 200
    };
}