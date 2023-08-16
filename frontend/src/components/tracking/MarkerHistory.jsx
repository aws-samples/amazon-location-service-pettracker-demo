// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "@aws-amplify/api";
import { getDeviceHistory as getDeviceHistoryQuery } from "../common/queries";
import { Marker as MapMarker } from "react-map-gl";

export const MarkerHistory = ({ isShowingHistory, span, setError }) => {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await API.graphql(
          graphqlOperation(getDeviceHistoryQuery, {
            deviceId: "pettracker",
            span,
          })
        );

        const { getDeviceHistory } = history.data;
        setMarkers(getDeviceHistory);
      } catch (error) {
        if (error.errors && error.errors.length > 0) {
          error = error.errors[0].message;
          console.error(error);
          setError(error);
        } else {
          setError("Error fetching device history");
        }
      }
    };

    if (isShowingHistory) {
      fetchHistory();
    }
  }, [isShowingHistory, span]);

  if (!isShowingHistory) {
    return null;
  }

  return (
    <>
      {markers.length > 0
        ? markers.map((marker, index) => {
            return (
              <MapMarker
                key={index}
                color="gray"
                latitude={marker.lat}
                longitude={marker.lng}
              />
            );
          })
        : null}
    </>
  );
};
