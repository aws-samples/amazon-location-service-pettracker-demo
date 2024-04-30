// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { URL } from "node:url";
import {
  createHash,
  createHmac,
  type BinaryLike,
  type Hmac,
  type KeyObject,
} from "node:crypto";
import { logger } from "./powertools.js";

class Sha256 {
  private readonly hash: Hmac;

  public constructor(secret?: unknown) {
    this.hash = secret
      ? createHmac("sha256", secret as BinaryLike | KeyObject)
      : createHash("sha256");
  }

  public digest(): Promise<Uint8Array> {
    const buffer = this.hash.digest();

    return Promise.resolve(new Uint8Array(buffer.buffer));
  }

  public update(array: Uint8Array): void {
    this.hash.update(array);
  }
}

const signer = new SignatureV4({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!,
  },
  service: "appsync",
  region: process.env.AWS_REGION ?? "",
  sha256: Sha256,
});

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
export type MutationOperation = {
  query: string;
  operationName: string;
  variables: { input: Inputs };
};

/**
 * Executes a GraphQL mutation.
 *
 * @param mutation GraphQL mutation to execute
 */
const executeMutation = async <T>(mutation: MutationOperation): Promise<T> => {
  const APPSYNC_ENDPOINT = process.env.GRAPHQL_URL;
  if (!APPSYNC_ENDPOINT) {
    throw new Error("GRAPHQL_URL env var is not set");
  }
  const url = new URL(APPSYNC_ENDPOINT);

  logger.debug("Executing GraphQL mutation", { details: mutation });

  const httpRequest = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(mutation),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: url.hostname,
    },
  });

  const signedHttpRequest = await signer.sign(httpRequest);

  try {
    const result = await fetch(url, {
      headers: new Headers(signedHttpRequest.headers),
      body: signedHttpRequest.body,
      method: signedHttpRequest.method,
    });

    if (!result.ok) throw new Error(result.statusText);

    const body = (await result.json()) as {
      data: T;
      errors: { message: string; errorType: string }[];
    };
    const { data, errors } = body;

    if (errors) {
      throw new AppSyncError(errors);
    } else if (data === undefined) {
      throw new Error("AppSync returned an empty response");
    }

    logger.debug("Mutation executed", { details: data });

    return data;
  } catch (err) {
    logger.error("Failed to execute GraphQL mutation", err as Error);

    throw err;
  }
};

export { executeMutation };
