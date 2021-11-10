import React, { useState } from "react";
import PasswordDataService from "../services/password.service";

const AddPassword = () => {
  const initialPasswordState = {
    appName: "",
    passKey: ""
  };
  const [password, setPassword] = useState(initialPasswordState);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = event => {
    const { name, value } = event.target;
    setPassword({ ...password, [name]: value });
  };

  const savePassword = () => {
    var data = {
      appName: password.appName,
      password: password.passKey
    };

    PasswordDataService.add(data)
      .then(response => {
        setPassword({
          appName: response.data.appName,
          passKey: response.data.passKey
        });
        setSubmitted(true);
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  };

  const newPassword = () => {
    setPassword(initialPasswordState);
    setSubmitted(false);
  };

  return (
    <div className="submit-form">
      {submitted ? (
        <div>
          <h4>You submitted successfully!</h4>
          <button className="btn btn-success" onClick={newPassword}>
            Add
          </button>
        </div>
      ) : (
        <div>
          <div className="form-group">
            <label htmlFor="appName">AppName</label>
            <input
              type="text"
              className="form-control"
              id="appName"
              required
              value={password.appName}
              onChange={handleInputChange}
              name="appName"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passKey">Password</label>
            <input
              type="text"
              className="form-control"
              id="passKey"
              required
              value={password.passKey}
              onChange={handleInputChange}
              name="passKey"
            />
          </div>

          <button onClick={savePassword} className="btn btn-success">
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default AddPassword;
