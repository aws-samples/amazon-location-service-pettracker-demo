import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React, { useState, useEffect } from 'react';

import Amplify, { Auth } from 'aws-amplify';
import { AmplifyAuthenticator } from '@aws-amplify/ui-react';

import Location from "aws-sdk/clients/location";

import awsconfig from './aws-exports';

import Header from './components/Header';
import Map from './components/Map';
// import Search from './components/Search';

Amplify.configure(awsconfig);

const App = () => {

  const trackerName = 'PetTracker';
  const deviceID = 'Device1';

  const [credentials, setCredentials] = useState(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      setCredentials(await Auth.currentUserCredentials());
    };

    fetchCredentials();

    const createClient = async () => {
      const credentials = await Auth.currentCredentials();
      const client = new Location({
          credentials,
          region: awsconfig.aws_project_region,
     });
     setClient(client);
    }

    createClient();  
  }, []);

  // const [viewport, setViewport] = useState({
  //   longitude: -123.1187,
  //   latitude: 49.2819,
  //   zoom: 10,
  // });

  const [viewport, setViewport] = useState({
    longitude: -97.6762,
    latitude: 30.4287,
    zoom: 10,
  });

  // const [marker, setMarker] = useState({
  //   longitude: -123.1187,
  //   latitude: 49.2819,
  // });

  const [marker] = useState({
    longitude: -97.72682189941406,
    latitude: 30.483000484352313,
  });

  const [devPosMarkers, setDevPosMarkers] = useState([]);

  const getDevicePosition = () => {
     // console.log('in getDevicePosition');

    setDevPosMarkers([]);

    var params = {
        DeviceId: deviceID,
        TrackerName: trackerName,
        StartTimeInclusive:"2020-11-02T19:05:07.327Z" ,
        EndTimeExclusive: new Date()
    };

    client.getDevicePositionHistory(params, (err, data) => {
        if (err) console.log(err, err.stack); 
        if (data) { 
          // console.log('getDevicePositionHistory data >>> ', data);
          const tempPosMarkers =  data.DevicePositions.map(function (devPos, index) {
              return {
                index: index,
                long: devPos.Position[0],
                lat: devPos.Position[1]
              } 
          });
          // console.log('getDevicePositionHistory tempPosMarkers >>> ', tempPosMarkers);

          setDevPosMarkers(tempPosMarkers);

          const pos = tempPosMarkers.length -1;
          
          setViewport({
            longitude: tempPosMarkers[pos].long,
            latitude: tempPosMarkers[pos].lat, 
            zoom: 5});
        }
    });
  }

  const Track = (props) => {
    // console.log('Track props >>>', props);
  
    const handleClick = (event) => {
      event.preventDefault();
      props.trackDevice()
    }
  
    return (
      <div className="container">
        <div className="input-group">
          <div className="input-group-append">
            <button onClick={ handleClick } className="btn btn-primary" type="submit">Track It!</button>
          </div>
        </div>
      </div>
    )
  };

  return (
    <AmplifyAuthenticator>
    <div className="App">
      <Header />
      <div>
        <Track trackDevice = {getDevicePosition}/>
      </div>
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
    </div>
    </AmplifyAuthenticator>
  );

}

export default App;