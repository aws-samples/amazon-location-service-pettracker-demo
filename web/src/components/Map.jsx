import React, { useState, useEffect } from 'react';
import { Signer } from "@aws-amplify/core";

import ReactMapGL, {
  Marker,
  NavigationControl,
  Layer,
  Source
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { Editor, DrawPolygonMode } from 'react-map-gl-draw';

import Pin from './Pin';

const mapName = 'PetTrackerMap';
const geofenceCollectionName = 'PetTrackerGeofenceCollection';

const Map = (props) => {

  const client = props.client;
  const credentials = props.cred;
  const marker = props.marker;
  const devPosMarkers = props.devPosMarkers;
  const viewport = props.viewport;
  const setViewport = props.setViewport;


  return (
    <div>
        {/* Map placeholder */}
    </div>
  )

};

export default Map;