// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { useState } from "react";
import {
  Heading,
  Button,
  SwitchField,
  SelectField,
  Alert,
} from "@aws-amplify/ui-react";
import Panel from "../common/Panel";
import styles from "./TrackingPanel.module.css";

// Popup panel for Tracking
export const TrackingPanel = ({
  onClose,
  isTrackingChecked,
  isHistoryChecked,
  changeMode,
  changeSpan,
  error,
  setError,
}) => {
  return (
    <Panel
      header={
        <div className={styles.header}>
          <Heading level={4}>Tracking</Heading>
        </div>
      }
      footer={
        <>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <SwitchField
        label="Live Tracking"
        labelPosition="right"
        onChange={(e) => {
          changeMode("tracking", e.target.checked);
        }}
        isChecked={isTrackingChecked}
      />
      <SwitchField
        label="Show History"
        labelPosition="right"
        onChange={(e) => {
          changeMode("history", e.target.checked);
        }}
        isChecked={isHistoryChecked}
      />
      <SelectField
        descriptiveText="Select a time span"
        disabled={!isHistoryChecked}
        defaultValue="hour"
        onChange={(e) => {
          changeSpan(e.target.value);
        }}
      >
        <option value="hour">Last Hour</option>
        <option value="day">Last 24hrs</option>
        <option value="week">Last 7days</option>
      </SelectField>
      {error && (
        <Alert
          variation="error"
          isDismissible="true"
          onDismiss={() => setError(null)}
          marginTop={"1rem"}
        >
          {error}
        </Alert>
      )}
    </Panel>
  );
};
