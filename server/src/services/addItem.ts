import { User } from "../models/user.model";
import { docClient, defaultParams } from "./DBService";

export default (user: User) => {
  const request = docClient.put(
    {
      ...defaultParams,
      Item: user
    }).promise()
  return request.then(function (data) {
    console.log("data for put item", data);
    return data;
  })
}

