import { docClient, defaultParams } from "./DBService";

export default (attr: string, id: string) => {
  const request = docClient.get(
    {
      ...defaultParams,
      Key: { [attr]: id }
    }).promise();

  return request.then(data => data.Item)
}

