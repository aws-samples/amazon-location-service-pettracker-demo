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
  const deviceID = 'Device1';

  const [credentials, setCredentials] = useState(null);
  const [devPosMarkers, setDevPosMarkers] = useState([]);

  const getDevicePosition = () => {
    setDevPosMarkers([]);

    const params = {
      DeviceId: deviceID,
      TrackerName: trackerName,
      StartTimeInclusive: new Date('2020-11-02T19:05:07.327Z'),
      EndTimeExclusive: new Date()
    };

    client.getDevicePositionHistory(params, (err, data) => {
      if (err) console.log(err, err.stack); 
      if (data) { 
        // console.log('data >>>', data);
        const tempPosMarkers =  data.DevicePositions.map( function (devPos, index) {

          return {
            index: index,
            long: devPos.Position[0],
            lat: devPos.Position[1]
          } 
        });

        setDevPosMarkers(tempPosMarkers);

        const pos = tempPosMarkers.length -1;
        
        setViewport({
          longitude: tempPosMarkers[pos].long,
          latitude: tempPosMarkers[pos].lat, 
          zoom: 5});
      }
    });
  }


  useEffect(() => {
    // console.log('in useEffect');
    const fetchCredentials = async () => {
      setCredentials(await Auth.currentUserCredentials());
    };
    fetchCredentials();

    const subscription = API.graphql(
      graphqlOperation(subscriptions.onCreateLocation)
    ).subscribe({
      next: (itemData) => {
        // console.log('subscribe next - itemData >>>', itemData);
        getDevicePosition();
      },
      error: error => console.warn(error)
    });

    return () => {
      subscription.unsubscribe();
    }

  }, []);

  const [viewport, setViewport] = useState({
    longitude: -97.6762,
    latitude: 30.4287,
    zoom: 10,
  });

  const [marker] = useState({
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