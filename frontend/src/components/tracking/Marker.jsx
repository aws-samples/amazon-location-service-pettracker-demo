// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Marker as MapMarker, Source, Layer } from "react-map-gl";
import { createGeoJSONCircle } from "./Marker.helpers";
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
      {marker?.accuracy ? (
        <Source
          type="geojson"
          data={createGeoJSONCircle(
            [marker.lng, marker.lat],
            marker.accuracy.horizontal,
            64
          )}
        >
          <Layer
            type="fill"
            paint={{
              // "circle-color": "hsla(0,0%,0%,0.75)",
              "fill-color": "blue",
              "fill-opacity": 0.3,
            }}
          />
        </Source>
      ) : null}
    </>
  );
};
