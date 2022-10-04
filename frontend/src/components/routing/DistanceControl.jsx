import React, { useState, useEffect, useCallback, useRef } from "react";
import { Geo, Hub, Auth, Cache } from "aws-amplify";
import {
  CalculateRouteCommand,
  LocationClient,
} from "@aws-sdk/client-location";
import { GeolocateControl } from "react-map-gl";
import awsmobile from "../../aws-exports";
import { DistanceButton } from "./DistanceButton";
import { UserPositionLabel } from "./UserPositionLabel";

const checkCredentials = async (cachedCredentials) => {
  if (!cachedCredentials || cachedCredentials.expiration === undefined) {
    const credentials = await Auth.currentCredentials();
    Cache.setItem("temporary_credentials", credentials);
    return credentials;
  }
  // If credentials are expired or about to expire, refresh them
  if (
    (new Date(cachedCredentials.expiration).getTime() - Date.now()) / 1000 <
    60
  ) {
    const credentials = await Auth.currentCredentials();
    Cache.setItem("temporary_credentials", credentials);
    return credentials;
  }

  return cachedCredentials;
};

const refreshOrInitLocationClient = async (client) => {
  const cachedCredentials = Cache.getItem("temporary_credentials");
  const credentials = await checkCredentials(cachedCredentials);
  if (!client || credentials.accessKeyId !== cachedCredentials.accessKeyId) {
    client = new LocationClient({
      credentials,
      region: Geo.getDefaultMap().region,
    });

    return client;
  }

  return client;
};

export const DistanceControl = () => {
  const locationClientRef = useRef();
  const [userLocation, setUserLocation] = useState();
  const [petLocation, setPetLocation] = useState();

  const onPetUpdate = useCallback(
    async (update) => {
      const {
        payload: { data },
      } = update;
      if (!userLocation) return;
      locationClientRef.current = await refreshOrInitLocationClient(
        locationClientRef.current
      );
      try {
        const res = await locationClientRef.current.send(
          new CalculateRouteCommand({
            CalculatorName: awsmobile.geo.AmazonLocationService.routeCalculator,
            TravelMode: "Walking",
            DeparturePosition: [userLocation.lng, userLocation.lat],
            DestinationPosition: [data.lng, data.lat],
          })
        );
        setPetLocation({
          lng: data.lng,
          lat: data.lat,
          distance: res.Summary?.Distance,
        });
      } catch (err) {
        console.error(err);
      }
    },
    [userLocation]
  );

  useEffect(() => {
    Hub.listen("petUpdates", onPetUpdate);

    return () => Hub.remove("petUpdates", onPetUpdate);
  }, [userLocation]);

  return (
    <>
      <GeolocateControl
        position="top-left"
        trackUserLocation={true}
        positionOptions={{
          enableHighAccuracy: true,
        }}
        onGeolocate={(e) => {
          setUserLocation({
            lng: e.coords.longitude,
            lat: e.coords.latitude,
          });
        }}
        onTrackUserLocationStart={(e) => {
          console.log("onTrackStart", e);
        }}
      />
      {userLocation ? <UserPositionLabel position={userLocation} /> : null}
      {petLocation ? <DistanceButton distance={petLocation?.distance} /> : null}
    </>
  );
};
