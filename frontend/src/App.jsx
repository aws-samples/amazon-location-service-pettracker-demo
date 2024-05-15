// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import { MapView } from "@aws-amplify/ui-react-geo";
import { NavigationControl } from "react-map-gl";
import { GeofencesControl } from "./components/geofences/GeofencesControl";
import { TrackerControl } from "./components/tracking/TrackerControl";
import { DistanceControl } from "./components/routing/DistanceControl";

const coordinates = {
  longitude: -115.17077150978058,
  latitude: 36.12309017212961,
};

const App = () => {
  return (
    <MapView
      initialViewState={{
        ...coordinates,
        zoom: 15,
      }}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <NavigationControl position={"top-left"} />
      <TrackerControl />
      <GeofencesControl />
      <DistanceControl />
    </MapView>
  );
};

export default App;
