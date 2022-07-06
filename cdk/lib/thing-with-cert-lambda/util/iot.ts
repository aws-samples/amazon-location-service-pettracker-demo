export const getCertIdFromARN = (arn: string) => {
    return arn.split('/')[1];
  };