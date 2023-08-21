// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "@aws-amplify/api";
import { getDeviceHistory as getDeviceHistoryQuery } from "../common/queries";
import { Marker as MapMarker, Source, Layer } from "react-map-gl";
import { featureCollection, point } from "@turf/helpers";
import combine from "@turf/combine";

export const MarkerHistory = ({ isShowingHistory, span, setError }) => {
  const [markers, setMarkers] = useState([]);
  const [pointsLine, setPointsLine] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await API.graphql(
          graphqlOperation(getDeviceHistoryQuery, {
            deviceId: "pettracker",
            span,
          })
        );

        const { getDeviceHistory: points } = history.data;
        setMarkers(points);

        // Combine all points into a single line
        const lineFeature = combine(
          featureCollection(points.map((p) => point([p.lng, p.lat], p))),
          { mutate: true }
        );
        setPointsLine({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: lineFeature.features[0].geometry.coordinates,
              },
            },
          ],
        });
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
      {pointsLine ? (
        <Source type="geojson" data={pointsLine}>
          <Layer
            type="line"
            paint={{
              "line-color": "gray",
              "line-opacity": 0.75,
              "line-width": 3,
            }}
          />
        </Source>
      ) : null}
    </>
  );
};
