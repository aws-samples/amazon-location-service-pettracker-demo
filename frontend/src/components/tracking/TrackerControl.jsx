// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useRef } from "react";
import { Marker } from "./Marker";
import { TrackerButton } from "./TrackerButton";
import { Notifications } from "./Notifications";
import { subscribe, unsubscribe } from "./TrackerControl.helpers";

export const TrackerControl = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionsRef = useRef({});

  const handleSubscriptionToggle = () => {
    if (isSubscribed) {
      // Unsubscribe from all subscriptions
      unsubscribe(subscriptionsRef);
      // Restore the subscriptionsRef to an empty object & set isSubscribed to false
      subscriptionsRef.current = {};
      setIsSubscribed(false);
    } else {
      subscribe(subscriptionsRef);
      // Set the isSubscribed state to true
      setIsSubscribed(true);
    }
  };

  return (
    <>
      <Notifications />
      <TrackerButton
        onClick={handleSubscriptionToggle}
        isSubscribed={subscriptionsRef.current.positionUpdates}
      />
      <Marker />
    </>
  );
};
