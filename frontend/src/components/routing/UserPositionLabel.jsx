// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import { Text } from "@aws-amplify/ui-react";

export const UserPositionLabel = ({ position }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "0",
        left: "0",
      }}
    >
      <Text
        backgroundColor="rgba(255, 255, 255, 0.75)"
        size="small"
        paddingLeft={"5px"}
      >
        Position:{" "}
        {position ? `lng: ${position.lng} lat: ${position.lat}` : "N/A"}
      </Text>
    </div>
  );
};
