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

    Auth.currentCredentials().then((credentials) => {
      const client = new Location({
        credentials: credentials,
        region: awsconfig.aws_project_region,
      });

      const params = {
        DeviceId: itemData.id,
        TrackerName: trackerName
      };

      client.getDevicePositionHistory(params, (err, data) => {
        if (err) console.log(err, err.stack);
        else if (data) {
          console.log('data >>>', data);
          const tempPosMarkers =  data.DevicePositions.map( function (devPos, index) {

            return {
              index: index,
              long: devPos.Position[0],
              lat: devPos.Position[1]
            }
          });

          setDevPosMarkers(tempPosMarkers);
        }
      });

    });
  }


  useEffect(() => {
    const onCreateSubscription = API.graphql(
      graphqlOperation(subscriptions.onCreateLocation)
    ).subscribe({
      next: (itemData) => {
        console.log('New item created', itemData);
        getDevicePosition(itemData.value.data.onCreateLocation);
      },
      error: error => console.warn(error)
    });

    const onUpdateSubscription = API.graphql(
      graphqlOperation(subscriptions.onUpdateLocation)
    ).subscribe({
      next: (itemData) => {
        console.log('Existinng item updated', itemData);
        getDevicePosition(itemData.value.data.onUpdateLocation);
      },
      error: error => console.warn(error)
    });

    return () => {
      onCreateSubscription.unsubscribe();
      onUpdateSubscription.unsubscribe();
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