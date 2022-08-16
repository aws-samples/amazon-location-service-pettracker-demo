import { useRef } from "react";
import { useControl } from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { Location } from "./utils";

const draw = new MapboxDraw({
  displayControlsDefault: false,
  defaultMode: "draw_polygon",
  controls: {
    polygon: true,
    trash: true,
  },
  styles: [
    {
      id: "gl-draw-line",
      type: "line",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#636363",
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-point",
      type: "circle",
      paint: {
        "circle-radius": 6,
        "circle-color": "#7AC943",
      },
    },
  ],
});

export const GeofenceControl = ({ geofenceCollectionName }) => {
  const locationUtils = useRef();

  locationUtils.current = new Location(geofenceCollectionName);

  useControl(
    ({ map }) => {
      map.on("load", locationUtils.current.loadGeofence(draw));
      map.on(
        "draw.create",
        locationUtils.current.createUpdateGeofence.bind(locationUtils.current)
      );
      map.on(
        "draw.update",
        locationUtils.current.createUpdateGeofence.bind(locationUtils.current)
      );
      map.on(
        "draw.delete",
        locationUtils.current.deleteGeofence.bind(locationUtils.current)
      );

      return draw;
    },
    ({ map }) => {
      map.off("load", locationUtils.current.loadGeofence(draw));
      map.off(
        "draw.create",
        locationUtils.current.createUpdateGeofence.bind(locationUtils.current)
      );
      map.off(
        "draw.update",
        locationUtils.current.createUpdateGeofence.bind(locationUtils.current)
      );
      map.off(
        "draw.delete",
        locationUtils.current.deleteGeofence.bind(locationUtils.current)
      );
    }
  );

  return null;
};
