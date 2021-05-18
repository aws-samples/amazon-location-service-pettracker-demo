/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getLocation = /* GraphQL */ `
  query GetLocation($id: ID!) {
    getLocation(id: $id) {
      createdAt
      deviceid
      id
      lat
      long
      result
      updatedAt
    }
  }
`;
export const listLocations = /* GraphQL */ `
  query ListLocations(
    $filter: ModelLocationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLocations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        createdAt
        deviceid
        id
        lat
        long
        result
        updatedAt
      }
      nextToken
    }
  }
`;
export const testPublishLocation = /* GraphQL */ `
  query TestPublishLocation($deviceid: String, $lat: Float, $long: Float) {
    testPublishLocation(deviceid: $deviceid, lat: $lat, long: $long) {
      createdAt
      deviceid
      id
      lat
      long
      result
      updatedAt
    }
  }
`;
