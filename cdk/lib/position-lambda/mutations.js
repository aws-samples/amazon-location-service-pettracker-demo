"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateItem = exports.createItem = void 0;

/* eslint-disable */
// this is an auto generated file. This will be overwritten
const createItem =
/* GraphQL */
`
  mutation CreateItem(
    $input: CreateItemInput!
    $condition: ModelItemConditionInput
  ) {
    createItem(input: $input, condition: $condition) {
      id
      lat
      long
      createdAt
      updatedAt
    }
  }
`;
exports.createItem = createItem;
const updateItem =
/* GraphQL */
`
  mutation UpdateItem(
    $input: UpdateItemInput!
    $condition: ModelItemConditionInput
  ) {
    updateItem(input: $input, condition: $condition) {
      id
      lat
      long
      updatedAt
    }
  }
`;
exports.updateItem = updateItem;

