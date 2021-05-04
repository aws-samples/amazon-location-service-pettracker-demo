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
  // console.log('Map props >>>', props);

  const client = props.client;
  const credentials = props.cred;
  const marker = props.marker;
  const devPosMarkers = props.devPosMarkers;
  const viewport = props.viewport;
  const setViewport = props.setViewport;

  // Sign requests made by Mapbox GL using AWS SigV4.
  const transformRequest = (credentials) => (url, resourceType) => {
      // Resolve to an AWS URL
      if (resourceType === "Style" && !url?.includes("://")) {
          url = `https://maps.geo.${props.config.aws_project_region}.amazonaws.com/maps/v0/maps/${url}/style-descriptor`;
      }

      // Only sign AWS requests (with the signature as part of the query string)
      if (url?.includes("amazonaws.com")) {
          return {
          url: Signer.signUrl(url, {
              access_key: credentials.accessKeyId,
              secret_key: credentials.secretAccessKey,
              session_token: credentials.sessionToken,
          })
          };
      }

      // Don't sign
      return { url: url || "" };
  };

  const trackerMarkers = React.useMemo(() => devPosMarkers.map(
    pos => (
      <Marker 
        key={pos.index} 
        longitude={pos.long} 
        latitude={pos.lat} 
      >
        <Pin size={20}/>
      </Marker>
    )), [devPosMarkers]
  );

  const initialFeatures = {
    type: 'FeatureCollection',
    features: []
  };

/*
  var params = {
    CollectionName: geofenceCollectionName
  };

  client.listGeofences(params, (err, data) => {
    if (err) console.log(err, err.stack); 
    if (data) {
      console.log('listGeofences data >>> ', data);
      for (let Entry of data.Entries) {
        initialFeatures.features.push(
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                Entry.Geometry.Polygon    
              ]
            }            
          }
        )
      }
    }
  });
*/  

/*
  initialFeatures.features = [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-97.62332829589822, 30.57010128688382],
            [-97.56908330078119, 30.512737265368223],
            [-97.61989506835947, 30.43402845757275],
            [-97.53200444335933, 30.42514753323792],
            [-97.49492558593744, 30.565962749869065],
            [-97.62332829589822, 30.57010128688382]
          ]
        ]
      }
    }
  ];
*/  

  const layerStyle = {
    id: 'polygon',
    type: 'line',
    'paint': {
      'line-color': '#00ffff'
    }
  };  

  return (
    <div>
        <ReactMapGL
          {...viewport}
          width="100%"
          height="100vh"
          transformRequest={transformRequest(credentials)}
          mapStyle={mapName}
          onViewportChange={setViewport}
        >
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            offsetTop={-20}
            offsetLeft={-10}
          >
            <Pin size={20}/>
          </Marker>
          {trackerMarkers}
          <div style={{ position: "absolute", left: 20, top: 20 }}>
            <NavigationControl showCompass={false} />
          </div>  
          <Editor
            clickRadius={12}
            mode={new DrawPolygonMode()}
            onUpdate={e => {
              console.log(e);
              if (e.editType === 'addFeature') {
                console.log('adding a new geofence ...');
                var params = {
                  CollectionName: geofenceCollectionName,
                  Entries: [
                    {
                      GeofenceId: new Date().getTime().toString(),
                      Geometry: {
                        Polygon: [
                          e.data[e.data.length - 1].geometry.coordinates[0]
                        ]
                      }
                    }
                  ]
                };                  
                client.batchPutGeofence(params, function(err, data) {
                  if (err) console.log(err, err.stack); // an error occurred
                  else console.log(data);           // successful response
                });
              }
            }}
          />
        <Source id="existingGeofencesData" type="geojson" data={initialFeatures}>
          <Layer {...layerStyle} />
        </Source>
      </ReactMapGL>
    </div>
  )

};

  export default Map;