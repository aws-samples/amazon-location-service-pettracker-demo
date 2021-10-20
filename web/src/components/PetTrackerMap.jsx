import React, {useState, useEffect, useRef} from 'react';
import {NavigationControl, Marker} from "maplibre-gl";
import MapboxDraw from "mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {createMap} from "maplibre-gl-js-amplify";
import polygonArea from 'area-polygon';
import {Auth} from "aws-amplify";
import Location from "aws-sdk/clients/location";
import awsconfig from "../aws-exports";

const geofenceCollectionName = 'PetTrackerGeofenceCollection';

const PetTrackerMap = (props) => {
  const devPosMarkers = props.devPosMarkers;
  const mapRegion = props.config.aws_project_region;
  const mapRef = useRef(null);
  const [map, setMap] = useState();

  return (
    <div ref={mapRef} style={{width: "100%", height: "100vh"}}/>
  )

};

export default PetTrackerMap;