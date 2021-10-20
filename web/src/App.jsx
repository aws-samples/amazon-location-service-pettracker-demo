import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';

import Amplify, { Auth, API, graphqlOperation } from 'aws-amplify';
import * as subscriptions from './graphql/subscriptions';
import { withAuthenticator } from '@aws-amplify/ui-react'

import Location from "aws-sdk/clients/location";

import awsconfig from './aws-exports';

import Header from './components/Header';
import PetTrackerMap from './components/PetTrackerMap';

Amplify.configure(awsconfig);

const init = async () => {
  await Auth.currentCredentials();
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
  const [devPosMarkers, setDevPosMarkers] = useState([]);

  const getDevicePosition = (itemData) => {
    console.log('itemData >>>', itemData);
    setDevPosMarkers([]);
  }


  useEffect(() => {
    return () => {

    }

  }, []);

  return (
      <div className="App">
        <Loader>
          <Header />
            <PetTrackerMap
              config={awsconfig}
              devPosMarkers={devPosMarkers}
            />
        </Loader>
      </div>
  );

}

export default withAuthenticator(App);