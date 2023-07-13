// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useCallback, useRef } from "react";
import { Card, Text } from "@aws-amplify/ui-react";
import toast, { Toaster } from "react-hot-toast";
import { Hub } from "@aws-amplify/core";

export const Notifications = () => {
  const hubRef = useRef();

  const onPetUpdate = useCallback(async (update) => {
    const {
      payload: { data, event },
    } = update;
    if (event === "geofenceUpdate") {
      const icon = data.type === "EXIT" ? "⬅️" : "➡️";
      const verb = data.type === "EXIT" ? "left" : "entered";
      const message = `Your pet ${verb} geofence ${data.geofenceId}`;
      toast.custom(
        <Card variation="outlined">
          <Text fontWeight={600} fontSize={"1em"}>
            {icon} {message}
          </Text>
        </Card>,
        {
          icon,
          duration: 3500,
        }
      );
    }
  }, []);

  useEffect(() => {
    hubRef.current = Hub.listen("petUpdates", onPetUpdate);

    // Clean up the hub listener when the component unmounts
    return () => hubRef.current();
  }, []);

  return <Toaster position="top-right" />;
};
