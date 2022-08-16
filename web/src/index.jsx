import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "@aws-amplify/ui-react/styles.css";
import awsmobile from "./aws-exports";

import Header from "./components/Header";
import Map from "./components/Map";

Amplify.configure(awsmobile);

ReactDOM.render(
  <React.StrictMode>
    <Authenticator>
      {({ signOut }) => (
        <>
          <Header signOut={signOut} />
          <Map />
        </>
      )}
    </Authenticator>
  </React.StrictMode>,
  document.getElementById("root")
);
