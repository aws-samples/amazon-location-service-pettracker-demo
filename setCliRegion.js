// Script to set default region for AWS CLI based on instance placement
// Steps:
// 1. Retrieve token from IMDSv2
// 2. Use token to retrieve AWS Region (i.e. `eu-west-1`) from IMDSv2 using token
// 3. Write file to `/home/ec2-user/.aws/config` setting the region for the `default` profile 

const p = require("phin");
const fs = require("fs");

const getToken = async () => {
  const res = await p({
    url: "http://169.254.169.254/latest/api/token",
    method: "PUT",
    headers: {
      "X-aws-ec2-metadata-token-ttl-seconds": 21600,
    },
  });

  return res.body.toString("utf8");
};

const getRegion = async (token) => {
  const res = await p({
    url: "http://169.254.169.254/latest/meta-data/placement/region",
    method: "GET",
    headers: {
      "X-aws-ec2-metadata-token": token,
    },
  });

  return res.body.toString("utf8");
};

const writeAWSCliConfig = (region) => {
  fs.writeFileSync(
    `./config.tmp`,
    `[default]
output=json
region=${region}`,
    { format: "utf-8" }
  );
};

const main = async () => {
  console.log('Retrieving IMDSv2 token');
  const token = await getToken();
  console.log('Token retrieved successfully');
  const region = await getRegion(token);
  console.log(`Region retrieved successfully ${region}`);
  writeAWSCliConfig(region);
  console.log(`Wrote tmp config at ${process.cwd()}/config.tmp`);
};

main();
