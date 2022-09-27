import React, { useState, useEffect, useCallback, useRef } from "react";
import { Geo, Hub, Auth, BrowserStorageCache } from "aws-amplify";
import {
  CalculateRouteCommand,
  LocationClient,
} from "@aws-sdk/client-location";
import { GeolocateControl } from "react-map-gl";

const getCredentials = async () => {
  const cachedCredentials = BrowserStorageCache.getItem(
    "temporary_credentials"
  );
  if (!cachedCredentials || cachedCredentials.expiration === undefined) {
    const credentials = await Auth.currentCredentials();
    BrowserStorageCache.setItem("temporary_credentials", credentials);
    return credentials;
  }
  // If credentials are expired or about to expire, refresh them
  if ((cachedCredentials.expiration.getTime() - Date.now()) / 1000 < 60) {
    const credentials = await Auth.currentCredentials();
    BrowserStorageCache.setItem("temporary_credentials", credentials);
    return credentials;
  }

  return cachedCredentials;
};

const refreshOrInitLocationClient = async (clientRef) => {
  const credentials = await getCredentials();
  if (!client || credentials.accessKeyId !== credentials.accessKeyId) {
    clientRef.current = new LocationClient({
      credentials,
      region: Geo.getDefaultMap().region,
    });

    return clientRef;
  }

  return clientRef;
};

export const DistanceControl = () => {
  const locationClientRef = useRef();
  const [userLocation, setUserLocation] = useState();
  const [petLocation, setPetLocation] = useState();

  const onPetUpdate = useCallback(async (update) => {
    const { payload: data } = update;
    locationClientRef.current = await refreshOrInitLocationClient(
      locationClientRef
    );
    try {
      const res = await locationClientRef.send(
        new CalculateRouteCommand({
          CalculatorName: "routecalculator_supplychain",
          TravelMode: "Walking",
          DeparturePosition: [userLocation.lng, userLocation.lat],
          DestinationPosition: [data.lng, data.lat],
        })
      );
      setPetLocation({
        lng: data.lng,
        lat: data.lat,
        distance: res.Summary?.Distance,
        duration: res.Summary?.DurationSeconds,
      });
    } catch (err) {
      console.error(err);
    }
  });

  useEffect(() => {
    Hub.listen("petUpdates", onPetUpdate);

    return () => Hub.remove("petUpdates", onPetUpdate);
  }, []);

  return (
    <>
      <GeolocateControl
        position="top-left"
        trackUserLocation={true}
        onGeolocate={(e) => {
          setUserLocation({
            lng: e.coords.longitude,
            lat: e.coords.latitude,
          });
        }}
      />
      {petLocation ? (
        <>
          {petLocation?.distance || null} - {petLocation?.duration || null}
        </>
      ) : null}
    </>
  );
};
