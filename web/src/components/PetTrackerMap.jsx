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
      if (mapRef.current == null) {
        return;
      }
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

      map.on('load', () => {
        client.listGeofences({
          CollectionName: geofenceCollectionName
        }, (err, data) => {
          if (err) console.log(err, err.stack);
          if (data && data.Entries.length > 0) {
            console.log('Geofence stored:', data);
            draw.set({
              type: 'FeatureCollection',
              features: data.Entries.map((entry) => {
                return {
                  id: entry.GeofenceId,
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'Polygon', coordinates: entry.Geometry.Polygon }
                }
              })
            });
          }
        });
      });

      const createGeofence = (e) => {
        console.log('Geofence event object', e);
        if (e.features.length > 0) {
          const params = {
            CollectionName: geofenceCollectionName,
            GeofenceId: e.features[e.features.length - 1].id,
              Geometry: {
                Polygon: e.features[e.features.length - 1].geometry.coordinates
              }
          };
          client.putGeofence(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data);           // successful response
          });
        }

      }

      map.on('draw.create', createGeofence);

      setMap(map);
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