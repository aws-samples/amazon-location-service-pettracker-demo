// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useRef } from "react";
import { Marker } from "./Marker";
import { MarkerHistory } from "./MarkerHistory";
import { TrackerButton } from "./TrackerButton";
import { Notifications } from "./Notifications";
import { TrackingPanel } from "./TrackingPanel";
import { subscribe, unsubscribe } from "./TrackerControl.helpers";

export const TrackerControl = () => {
  const [isOpenedPanel, setIsOpenedPanel] = useState(false);
  const [isTrackingChecked, setIsTrackingChecked] = useState(false);
  const [isShowingHistory, setIsShowingHistory] = useState(false);
  const [span, setSpan] = useState("hour");
  const [error, setError] = useState(null);
  const subscriptionsRef = useRef({});

  const disableTracking = () => {
    // Unsubscribe from all subscriptions
    unsubscribe(subscriptionsRef);
    // Restore the subscriptionsRef to an empty object & set isSubscribed to false
    subscriptionsRef.current = {};
    setIsTrackingChecked(false);
  };

  const enableTracking = () => {
    subscribe(subscriptionsRef, setError);
    setIsTrackingChecked(true);
  };

  const disableHistory = () => {
    setIsShowingHistory(false);
  };

  const enableHistory = () => {
    setIsShowingHistory(true);
  };

  const handleChangeMode = (mode, checked) => {
    setError(null);
    if (mode === "tracking") {
      if (checked) {
        enableTracking();
        disableHistory();
      } else {
        disableTracking();
      }
    } else if (mode === "history") {
      if (checked) {
        enableHistory();
        disableTracking();
      } else {
        disableHistory();
      }
    }
  };

  return (
    <>
      <Notifications />
      <TrackerButton
        onClick={() => setIsOpenedPanel(!isOpenedPanel)}
        isSubscribed={subscriptionsRef.current.positionUpdates}
      />
      <Marker isShowingHistory={isShowingHistory} />
      <MarkerHistory
        isShowingHistory={isShowingHistory}
        span={span}
        setError={setError}
      />
      {isOpenedPanel && (
        <TrackingPanel
          onClose={() => setIsOpenedPanel(!isOpenedPanel)}
          isTrackingChecked={isTrackingChecked}
          isHistoryChecked={isShowingHistory}
          changeMode={handleChangeMode}
          changeSpan={(span) => {
            setSpan(span);
            setError(null);
          }}
          error={error}
          setError={setError}
        />
      )}
    </>
  );
};
