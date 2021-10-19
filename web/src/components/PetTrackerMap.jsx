import React, {useState, useEffect, useRef} from 'react';
import {NavigationControl, Marker} from "maplibre-gl";
import MapboxDraw from "mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {createMap} from "maplibre-gl-js-amplify";

const geofenceCollectionName = 'PetTrackerGeofenceCollection';

const PetTrackerMap = (props) => {

  const client = props.client;
  const credentials = props.cred;
  const marker = props.marker;
  const devPosMarkers = props.devPosMarkers;
  const viewport = props.viewport;
  const setViewport = props.setViewport;
  const mapRegion = props.config.aws_project_region;
  const mapRef = useRef(null);
  const [map, setMap] = useState();

  useEffect(() => {
    async function initializeMap() {
      if (mapRef.current != null) {
        const map = await createMap({
          container: mapRef.current,
          center: [48.192459, 11.617745],
          zoom: 16,
          region: mapRegion
        });

        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          },
          defaultMode: 'draw_polygon'
        });

        map.addControl(draw);

        setMap(map);
      }
    }

    initializeMap();
  }, [mapRef]);

  React.useMemo(() => devPosMarkers.map(
    pos => (
      new Marker({
        color: "red"
      })
        .setLngLat([pos.long, pos.lat])
        .addTo(map)
    )), [devPosMarkers]
  );

  useEffect(() => {
    if (map != null) {
      // configure the Map instance with controls, custom layers, behaviors, etc.
      map.addControl(new NavigationControl(), "top-left");
    }
  }, [map]);

  return (
    <div ref={mapRef} style={{width: "100%", height: "100vh"}}/>
  )

};

export default PetTrackerMap;