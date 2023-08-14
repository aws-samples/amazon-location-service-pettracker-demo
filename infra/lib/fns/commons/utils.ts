// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import p from "phin";
import { URL } from "url";
import { logger } from "./powertools";

/**
 * Error thrown when AppSync returns an error.
 *
 * It formats the errors returned by AppSync into a single error message.
 */
class AppSyncError extends Error {
  constructor(
    errors: {
      message: string;
      errorType: string;
    }[]
  ) {
    const message = errors
      .map((e) => `${e.errorType}: ${e.message}`)
      .join("\n");
    super(message);
    this.name = "AppSyncError";
  }
}

type Inputs = {
  [key: string]: string | number | Inputs;
};

/**
 * Body of a GraphQL mutation.
 */
export type Operation = {
  query: string;
  operationName: string;
  variables: { input: Inputs };
};

/**
 * Executes a GraphQL operation.
 *
 * @param operation GraphQL operation to execute
 */
const executeGraphQlOperation = async <T>(operation: Operation): Promise<T> => {
  const APPSYNC_ENDPOINT = process.env.GRAPHQL_URL;
  if (!APPSYNC_ENDPOINT) {
    throw new Error("GRAPHQL_URL env var is not set");
  }
  const url = new URL(APPSYNC_ENDPOINT);

  logger.debug("Executing GraphQL operation", { details: operation });

  const request = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(operation),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: url.hostname,
    },
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    service: "appsync",
    region: process.env.AWS_REGION as string,
    sha256: Sha256,
  });

  const { headers, body, method } = await signer.sign(request);

  try {
    const result = await p<{
      errors?: { message: string; errorType: string }[];
      data?: T;
    }>({
      url: APPSYNC_ENDPOINT,
      headers,
      data: body,
      method,
      timeout: 5000,
      parse: "json",
    });

    if (result.body.errors) {
      throw new AppSyncError(result.body.errors);
    } else if (result.body.data === undefined) {
      throw new Error("AppSync returned an empty response");
    }

    logger.debug("Operation executed", { details: result.body.data });

    return result.body.data;
  } catch (err) {
    logger.error("Failed to execute GraphQL operation", err as Error);

    throw err;
  }
};

export { executeGraphQlOperation };
