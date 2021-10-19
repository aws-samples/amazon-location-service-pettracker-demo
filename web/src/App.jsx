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

        setMarker({
          longitude: itemData.long,
          latitude: itemData.lat
        });

        setDevPosMarkers(tempPosMarkers);
        
        setViewport({
          longitude: itemData.long,
          latitude: itemData.lat, 
          zoom: 15
        });
      }
    });
  }


  useEffect(() => {
    // console.log('in useEffect');
    const fetchCredentials = async () => {
      setCredentials(await Auth.currentUserCredentials());
    };
    fetchCredentials();

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
            <PetTrackerMap
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