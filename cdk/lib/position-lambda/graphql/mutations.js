/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createLocation = /* GraphQL */ `
  mutation CreateLocation(
    $condition: ModelLocationConditionInput
    $input: CreateLocationInput!
  ) {
    createLocation(condition: $condition, input: $input) {
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
export const deleteLocation = /* GraphQL */ `
  mutation DeleteLocation(
    $condition: ModelLocationConditionInput
    $input: DeleteLocationInput!
  ) {
    deleteLocation(condition: $condition, input: $input) {
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
export const updateLocation = /* GraphQL */ `
  mutation UpdateLocation(
    $condition: ModelLocationConditionInput
    $input: UpdateLocationInput!
  ) {
    updateLocation(condition: $condition, input: $input) {
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
