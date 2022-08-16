import React, { useState, useEffect, useRef } from "react";
import { NavigationControl, Marker } from "maplibre-gl";
import MapboxDraw from "mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { createMap } from "maplibre-gl-js-amplify";
import { Location } from "./utils";
import { Auth } from "aws-amplify";
import awsconfig from "../aws-exports";

const geofenceCollectionName = "PetTrackerGeofenceCollection";

const PetTrackerMap = (props) => {
  const devPosMarkers = props.devPosMarkers;
  const mapRegion = props.config.aws_project_region;
  const mapRef = useRef(null);
  const [map, setMap] = useState();
  const locationUtils = useRef();

  useEffect(() => {
    const initLocation = async () => {
      const credentials = await Auth.currentCredentials();
      locationUtils.current = new Location(
        credentials,
        awsconfig.aws_project_region,
        geofenceCollectionName
      );
    };

    if (!locationUtils.current) {
      initLocation();
    }
  }, []);

  useEffect(() => {
    async function initializeMap() {
      if (mapRef.current == null) {
        return;
      }
      const map = await createMap({
        container: mapRef.current,
        center: [11.617745, 48.192459],
        zoom: 16,
        region: mapRegion,
      });

      map.addControl(new NavigationControl(), "top-left");

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: "draw_polygon",
      });
      map.addControl(draw);

      map.on("load", location.current.loadGeofence(draw));

      map.on("draw.create", location.current.createUpdateGeofence);
      map.on("draw.update", location.current.createUpdateGeofence);
      map.on("draw.delete", location.current.deleteGeofence);

      setMap(map);
    }

    initializeMap();
  }, [mapRef]);

  useEffect(() => {
    if (map == null) {
      return;
    }
    console.log("Set map center: ", mapCenter);
    map.setCenter(mapCenter);

    markers.forEach((marker) => marker.remove());
    setMarkers([]);

    setMarkers([
      new Marker({
        color: "red",
      })
        .setLngLat(mapCenter)
        .addTo(map),
    ]);
  }, [mapCenter]);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
};

export default PetTrackerMap;
