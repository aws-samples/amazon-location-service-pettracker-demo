// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useRef } from "react";
import { Hub, API, graphqlOperation } from "aws-amplify";
import { Marker } from "react-map-gl";
import { TrackerButton } from "./TrackerButton";

export const TrackerControl = () => {
  const [marker, setMarker] = useState();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionRef = useRef();

  const handleSubscriptionToggle = () => {
    if (isSubscribed) {
      subscriptionRef.current.unsubscribe();
      console.info("Unsubscribed from onUpdatePosition AppSync mutation");
      setIsSubscribed(false);
    } else {
      subscriptionRef.current = API.graphql(
        graphqlOperation(`
        subscription OnUpdatePosition {
          onUpdatePosition {
            id
            lng
            lat
            updatedAt
          }
        }
        `)
      ).subscribe({
        next: ({ value: { data } }) => {
          const { onUpdatePosition } = data;
          console.debug("Position updated", onUpdatePosition);
          const { lng, lat } = onUpdatePosition;
          Hub.dispatch("petUpdates", { data: { lng, lat } });
          setMarker({
            lng,
            lat,
          });
        },
        error: (err) => console.error(err),
      });
      console.info("Subscribed to onUpdatePosition AppSync mutation");
      setIsSubscribed(true);
    }
  };

  return (
    <>
      <TrackerButton
        onClick={handleSubscriptionToggle}
        isSubscribed={isSubscribed}
      />
      {marker ? (
        <Marker color="teal" latitude={marker.lat} longitude={marker.lng} />
      ) : null}
    </>
  );
};
