import { docClient, tableKeys, TABLE_NAME } from "./DBService";


/**
 * can only query on partnerId since it has an index
 */
export default async (email: string): Promise<any> => {
  const keysAsString = tableKeys.join(', ')
  let params = {
    TableName: TABLE_NAME,
    IndexName: "email-password-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email
    },
    ProjectionExpression: keysAsString
  }
  let result = [];
  const request = docClient.query(params).promise();

  return request.then(function (data) {
    result = [...data.Items];
    return result;
  })

}
