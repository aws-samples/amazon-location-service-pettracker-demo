/* eslint-disable */
// this is an auto generated file. This will be overwritten

module.exports.getLocation = /* GraphQL */ `
  query GetLocation($id: ID!) {
    getLocation(id: $id) {
      createdAt
      id
      lat
      long
      updatedAt
    }
  }
`;
module.exports.listLocations = /* GraphQL */ `
  query ListLocations(
    $filter: ModelLocationFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLocations(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        createdAt
        id
        lat
        long
        updatedAt
      }
      nextToken
    }
  }
`;
