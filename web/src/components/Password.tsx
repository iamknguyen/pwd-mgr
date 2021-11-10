import React, { useState, useEffect } from "react";
import PasswordDataService from "../services/password.service";

const Password = props => {
  const initialPasswordState = {
    id: null,
    appName: "",
    passKey: "",
    published: false
  };
  const [currentPassword, setCurrentPassword] = useState(initialPasswordState);
  const [message, setMessage] = useState("");

  const getPassword = id => {
    PasswordDataService.get(id)
      .then(response => {
        setCurrentPassword({...currentPassword, id, appName: id, passKey: response.data.password});
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  };

  useEffect(() => {
    console.log('TODO', props.match.params)
    getPassword(props.match.params.id);
  }, [props.match.params.id]);

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentPassword({ ...currentPassword, [name]: value });
  };

  const updatePublished = status => {
    var data = {
      id: currentPassword.id,
      appName: currentPassword.appName,
      passKey: currentPassword.passKey,
      published: status
    };

    // PasswordDataService.update(currentPassword.id, data)
    //   .then(response => {
    //     setCurrentPassword({ ...currentPassword, published: status });
    //     console.log(response.data);
    //     setMessage("The status was updated successfully!");
    //   })
    //   .catch(e => {
    //     console.log(e);
    //   });
  };

  const updatePassword = () => {
    // PasswordDataService.update(currentPassword.id, currentPassword)
    //   .then(response => {
    //     console.log(response.data);
    //     setMessage("The password was updated successfully!");
    //   })
    //   .catch(e => {
    //     console.log(e);
    //   });
  };

  const deletePassword = () => {
    // PasswordDataService.remove(currentPassword.id)
    //   .then(response => {
    //     console.log(response.data);
    //     props.history.push("/passwords");
    //   })
    //   .catch(e => {
    //     console.log(e);
    //   });
  };

  return (
    <div>
      {currentPassword ? (
        <div className="edit-form">
          <h4>Password</h4>
          <form>
            <div className="form-group">
              <label htmlFor="appName">AppName</label>
              <input
                type="text"
                className="form-control"
                id="appName"
                name="appName"
                value={currentPassword.appName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="passKey">Password</label>
              <input
                type="text"
                className="form-control"
                id="passKey"
                name="passKey"
                value={currentPassword.passKey}
                onChange={handleInputChange}
              />
            </div>

          </form>

          {currentPassword.published ? (
            <button
              className="badge badge-primary mr-2"
              onClick={() => updatePublished(false)}
            >
              UnPublish
            </button>
          ) : (
            <button
              className="badge badge-primary mr-2"
              onClick={() => updatePublished(true)}
            >
              Publish
            </button>
          )}

          <button className="badge badge-danger mr-2" onClick={deletePassword}>
            Delete
          </button>

          <button
            type="submit"
            className="badge badge-success"
            onClick={updatePassword}
          >
            Update
          </button>
          <p>{message}</p>
        </div>
      ) : (
        <div>
          <br />
          <p>Please click on a Password...</p>
        </div>
      )}
    </div>
  );
};

export default Password;
