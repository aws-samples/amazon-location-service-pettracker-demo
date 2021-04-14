import React from 'react';
import { Signer } from "@aws-amplify/core";

import ReactMapGL, {
  Marker,
  NavigationControl
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import Pin from './Pin';

const mapName = 'PetTrackerMap';

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
    )), [devPosMarkers]);

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
          </ReactMapGL>
      </div>
    )

};

  export default Map;