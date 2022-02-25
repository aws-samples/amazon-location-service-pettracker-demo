import React, {useState, useEffect, useRef} from 'react';
import {NavigationControl, Marker} from "maplibre-gl";
import MapboxDraw from "mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {createMap} from "maplibre-gl-js-amplify";
import polygonArea from 'area-polygon';
import {Auth} from "aws-amplify";
import Location from "@aws-sdk/client-location";
import awsconfig from "../aws-exports";

const geofenceCollectionName = 'PetTrackerGeofenceCollection';

const PetTrackerMap = (props) => {
  const devPosMarkers = props.devPosMarkers;
  const mapRegion = props.config.aws_project_region;
  const mapRef = useRef(null);
  const [map, setMap] = useState();
  const client = Auth.currentCredentials().then(credentials =>
    new Location({
        credentials: credentials,
        region: awsconfig.aws_project_region,
      }
    ));

  const ccwPolygon = (coordinates) => {
    const area = polygonArea(coordinates, true);
    //if area is negative, polygon is drawn in clockwise orientation
    //else area is positive, polygon is drawn in counter-clockwise orientation
    if (area < 0) {
      //return the reversed array of coordinates
      //since reversing clockwise coordinates will make them counter-clockwise
      return coordinates.slice().reverse();
    }
    return coordinates;
  }

  const deleteGeofence = (e) => {
    console.log('Geofence delete event object', e);
    if (e.features.length > 0) {
      const params = {
        CollectionName: geofenceCollectionName,
        GeofenceIds: [e.features[e.features.length - 1].id]
      };
      client.then(c => c.batchDeleteGeofence(params, function (err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else console.log(data);           // successful response
        }
      ));
    }
  }

  const createUpdateGeofence = (e) => {
    console.log('Geofence create event object', e);
    if (e.features.length > 0) {
      const params = {
        CollectionName: geofenceCollectionName,
        GeofenceId: e.features[e.features.length - 1].id,
        Geometry: {
          Polygon: e.features[e.features.length - 1].geometry.coordinates.map(ccwPolygon)
        }
      };
      client.then(c => c.putGeofence(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data);           // successful response
      }));
    }
  }

  useEffect((type, listener) => {
    async function initializeMap() {
      if (mapRef.current == null) {
        return;
      }
      const map = await createMap({
        container: mapRef.current,
        center: [11.617745, 48.192459],
        zoom: 16,
        region: mapRegion
      });

      map.addControl(new NavigationControl(), "top-left");

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
        client.then(c => c.listGeofences({
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
                  geometry: {type: 'Polygon', coordinates: entry.Geometry.Polygon}
                }
              })
            });
          }
        }));
      });

      map.on('draw.create', createUpdateGeofence);
      map.on('draw.update', createUpdateGeofence);
      map.on('draw.delete', deleteGeofence);

      setMap(map);
    }

    initializeMap();
  }, [mapRef]);

  React.useEffect(() => {
      devPosMarkers.slice(-1).forEach(last =>
        new Marker({
          color: "red"
        })
          .setLngLat([last.long, last.lat])
          .addTo(map)
      );
    }
    , [devPosMarkers]
  );

  return (
    <div ref={mapRef} style={{width: "100%", height: "100vh"}}/>
  )

};

export default PetTrackerMap;