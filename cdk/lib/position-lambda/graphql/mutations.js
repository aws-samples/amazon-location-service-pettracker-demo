/* eslint-disable */
// this is an auto generated file. This will be overwritten

module.exports.createLocation = /* GraphQL */ `
  mutation CreateLocation(
    $condition: ModelLocationConditionInput
    $input: CreateLocationInput!
  ) {
    createLocation(condition: $condition, input: $input) {
      createdAt
      id
      lat
      long
      updatedAt
    }
  }
`;
module.exports.deleteLocation = /* GraphQL */ `
  mutation DeleteLocation(
    $condition: ModelLocationConditionInput
    $input: DeleteLocationInput!
  ) {
    deleteLocation(condition: $condition, input: $input) {
      createdAt
      id
      lat
      long
      updatedAt
    }
  }
`;
module.exports.updateLocation = /* GraphQL */ `
  mutation UpdateLocation(
    $condition: ModelLocationConditionInput
    $input: UpdateLocationInput!
  ) {
    updateLocation(condition: $condition, input: $input) {
      createdAt
      id
      lat
      long
      updatedAt
    }
  }
`;
