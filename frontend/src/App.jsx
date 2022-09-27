// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import { MapView } from "@aws-amplify/ui-react";
import { NavigationControl } from "react-map-gl";
import GeofencesLayer from "./components/geofences/GeofencesLayer";
import { TrackerControl } from "./components/tracking/TrackerControl";
import { DistanceControl } from "./components/routing/DistanceControl";

const App = () => {
  return (
    <>
      <MapView
        initialViewState={{
          latitude: 48.192459,
          longitude: 11.617745,
          zoom: 14,
        }}
        style={{
          width: "100vw",
          height: "100vh",
        }}
      >
        <NavigationControl position={"top-left"} />
        <GeofencesLayer />
        <TrackerControl />
        <DistanceControl />
      </MapView>
    </>
  );
};

export default App;
