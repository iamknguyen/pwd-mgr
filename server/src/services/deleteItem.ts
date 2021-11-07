import { docClient, defaultParams } from "./DBService";

export default (attr: string, id: string) => {
  docClient.delete(
    {
      ...defaultParams,
      Key: { [attr]: id }
    },
    function (err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data);
      }
    });
}

