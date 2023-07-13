// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Marker as MapMarker } from "react-map-gl";
import { Hub } from "@aws-amplify/core";

export const Marker = () => {
  const [marker, setMarker] = useState();
  const hubRef = useRef();

  const onPetUpdate = useCallback(async (update) => {
    const {
      payload: { data, event },
    } = update;
    if (event === "positionUpdate") {
      setMarker(data);
    }
  }, []);

  useEffect(() => {
    hubRef.current = Hub.listen("petUpdates", onPetUpdate);

    // Clean up the hub listener when the component unmounts
    return () => hubRef.current();
  }, []);

  return (
    <>
      {marker ? (
        <MapMarker color="teal" latitude={marker.lat} longitude={marker.lng} />
      ) : null}
    </>
  );
};
