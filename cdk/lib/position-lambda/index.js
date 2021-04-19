const https = require('https');
const AWS = require('aws-sdk');
const urlParse = require("url").URL;

//environment variables
const region = process.env.REGION
const appsyncUrl = process.env.API_GRAPHQLAPIENDPOINT
const endpoint = new urlParse(appsyncUrl).hostname.toString();

exports.handler = async (event) => {

    console.log('event received:' + JSON.stringify(event));

    const appsync = new AWS.HttpRequest(appsyncUrl, region);

    //define the graphql mutation to create the sensor values
    const mutationName = 'UpdateItem';
    const mutation = require('./mutations').updateItem;

    const updateAtDate = new Date(event.data.updatedAt)
    let [month, date, year] = updateAtDate.toLocaleDateString("en-US").split("/")

    //create the mutation input from the sensor event data
    const item = {
        input: {
            id: event.data.id,
            lat: event.lat,
            long: event.long
        }
    };

    //execute the mutation
    try {

        appsync.method = "POST";
        appsync.headers.host = endpoint;
        appsync.headers["Content-Type"] = "application/json";
        appsync.body = JSON.stringify({
            query: mutation,
            operationName: mutationName,
            variables: item
        });

        const signer = new AWS.Signers.V4(appsync, "appsync", true);
        signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());

        const data = await new Promise((resolve, reject) => {
            const httpRequest = https.request({ ...appsync, host: endpoint }, (result) => {
                result.on('data', (data) => {
                    resolve(JSON.parse(data.toString()));
                });
            });

            httpRequest.write(appsync.body);
            httpRequest.end();

        });

        console.log("Successful mutation");

    } catch (error) {
        console.log(error);
        return;
    }

    return {
        statusCode: 200,
        body: data
    };
}