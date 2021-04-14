# Setting up this demo

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Create the react app

`npx create-react-app mapdemo`

Make sure that you have Amplify configured in your computer. If not follow the instructions in the documentation.

[https://docs.amplify.aws/start/getting-started/installation/q/integration/react](https://docs.amplify.aws/start/getting-started/installation/q/integration/react)

Install bootstrap in your project

`npm install bootstrap`

Initialize the react app

`amplify init`

Add authentication and push the changes to the cloud
```
amplify add auth
amplify push
```

### Add a Map

Create a new map in the Amazon Location service.

Give permission to access the map by selecting Identity Pool, check the name of the auth role and add this inline policy to the role. Replace the information with your account information.

`amplify console auth`

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "geo:GetMap*",
            "Resource": "arn:aws:geo:<REGION>:<ACCOUNTNUMBER>:map/<NAMEOFMAP>"
        }
    ]
}
```

### Add a Tracker

Create a new tracker in the Amazon Location Service.

Modify the auth role for the Amplify application by adding this permission.

```
 {
    "Sid": "VisualEditor3",
    "Effect": "Allow",
    "Action": "geo:GetDevicePositionHistory",
    "Resource": "arn:aws:geo:<REGION>:<ACCOUNTNUMBER>:tracker/<TRACKERNAME>"
}
```

### Add dependencies

```
npm install aws-sdk
npm install @aws-amplify/core

npm install mapbox-gl@1.0.0
npm install react-map-gl@5.2.11
```

## Copy the application modules

```
src/App.js
src/components/Header.js
src/components/Map.js
src/components/Pin.js
```


## Running the demo

In the project directory, you can run:

`npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
