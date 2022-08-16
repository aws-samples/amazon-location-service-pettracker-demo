import React, { useEffect, useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { Marker } from "react-map-gl";
import { onUpdateLocation } from "../graphql/subscriptions";

export const DeviceTracker = () => {
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    const onUpdateSubscription = API.graphql(
      graphqlOperation(onUpdateLocation)
    ).subscribe({
      next: (itemData) => {
        console.log("Existing item updated", itemData);
        console.log(itemData.value.data.onUpdateLocation);
        setMarker({
          latitude: itemData.value.data.onUpdateLocation.lat,
          longitude: itemData.value.data.onUpdateLocation.long,
        });
      },
      error: (error) => console.warn(error),
    });

    return () => {
      onUpdateSubscription.unsubscribe();
    };
  }, []);

  return marker ? (
    <>
      <Marker
        color="teal"
        latitude={marker.latitude}
        longitude={marker.longitude}
      />
    </>
  ) : null;
};
