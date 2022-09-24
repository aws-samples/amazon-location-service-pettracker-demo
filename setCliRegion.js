// Script to set default region for AWS CLI based on instance placement
// Steps:
// 1. Retrieve token from IMDSv2
// 2. Use token to retrieve AZ (i.e. `eu-west-1a`) from IMDSv2 using token, return region (i.e. `eu-west-1`)
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

const getRegionFromAz = async (token) => {
  const res = await p({
    url: "http://169.254.169.254/latest/metadata/placement/availability-zone",
    method: "GET",
    headers: {
      "X-aws-ec2-metadata-token": token,
    },
  });

  const az = res.body.toString("utf8");
  return az.substring(0, az.length - 1);
};

const writeAWSCliConfig = (region) => {
  fs.writeFileSync(
    `/home/ec2-user/.aws/config`,
    `[default]
output=json
region=${region}`,
    { format: "utf-8" }
  );
};

const main = async () => {
  const token = await getToken();
  const region = await getRegionFromAz(token);
  writeAWSCliConfig(region);
};

main();
