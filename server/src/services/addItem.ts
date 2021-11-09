import { Pwd } from "../models/pwd.model";
import { User } from "../models/user.model";
import { docClient, defaultParams } from "./DBService";
export default (item: User | Pwd, table: string) => {
  const request = docClient.put(
    {
      ...defaultParams,
      TableName: table,
      Item: item
    }).promise()
  return request.then(function (data) {
    console.log("data for put item", data);
    return data;
  })
}

