const awsmobile = {
  aws_project_region: "eu-west-1",
  Auth: {
    region: "eu-west-1",
    identityPoolId: "eu-west-1:5fd987d6-96a6-4525-8e68-9a281d8332b3",
    userPoolId: "eu-west-1_gGqJfc1xi",
    userPoolWebClientId: "75eckcmsn477ugh0o94aqse1u2",
  },
  aws_appsync_graphqlEndpoint:
    "https://wimombrwinclbhwtu6fy3mtcxy.appsync-api.eu-west-1.amazonaws.com/graphql",
  aws_appsync_region: "eu-west-1",
  aws_appsync_authenticationType: "API_KEY",
  aws_appsync_apiKey: "da2-473v6qhuqjhztgxscrghyb3g5y",
  geo: {
    AmazonLocationService: {
      maps: {
        items: {
          PetTrackerMap: {
            style: "VectorHereExplore",
          },
        },
        default: "PetTrackerMap",
      },
      geofenceCollections: {
        items: ["PetTrackerCollection"],
        default: "PetTrackerCollection",
      },
      routeCalculator: "PetTrackerRouteCalculator",
      region: "eu-west-1",
    },
  },
};
export default awsmobile;
