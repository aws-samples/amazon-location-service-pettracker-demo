import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';

import Amplify, { Auth, API, graphqlOperation } from 'aws-amplify';
import * as subscriptions from './graphql/subscriptions';
import { withAuthenticator } from '@aws-amplify/ui-react'

import Location from "aws-sdk/clients/location";

import awsconfig from './aws-exports';

import Header from './components/Header';
import Map from './components/Map';

Amplify.configure(awsconfig);

let client;
const init = async () => {
  const credentials = await Auth.currentCredentials();

  client = new Location({
    credentials,
    region: awsconfig.aws_project_region,
  });
}

const Loader = ({ children }) => {
  const [initialised, setInitialised] = React.useState(false);

  React.useEffect(() => {
    init().then(() => setInitialised(true));
  }, []);

  if (!initialised) return <div>Please wait until initialization is complete</div>;

  return <>{children}</>;
};

const App = () => {

  const trackerName = 'PetTracker';
  const [credentials, setCredentials] = useState(null);
  const [devPosMarkers, setDevPosMarkers] = useState([]);

  const getDevicePosition = (itemData) => {
    console.log('itemData >>>', itemData);
    setDevPosMarkers([]);

  }


  useEffect(() => {
    // console.log('in useEffect');
    const fetchCredentials = async () => {
      setCredentials(await Auth.currentUserCredentials());
    };
    fetchCredentials();


    return () => {
      
    }

  }, []);

  const [viewport, setViewport] = useState({
    longitude: -97.6762,
    latitude: 30.4287,
    zoom: 10,
  });

  const [marker, setMarker] = useState({
    longitude: -97.72682189941406,
    latitude: 30.483000484352313,
  });

  return (
      <div className="App">
        <Loader>
          <Header />
          {credentials ? (
            <Map
              config={awsconfig}
              client={client}
              cred={credentials}
              marker={marker}
              devPosMarkers={devPosMarkers}
              viewport={viewport}
              setViewport={setViewport}
            />
          ) : (
            <h1>Loading...</h1>
          )}
        </Loader>
      </div>
  );

}

export default withAuthenticator(App);