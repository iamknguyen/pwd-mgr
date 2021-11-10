import React, { useState, useEffect, useMemo } from "react";
import PasswordDataService from "../services/password.service";
import { useTable } from "react-table";
import { MdEdit, MdDeleteOutline } from 'react-icons/md';
const PasswordsList = (props) => {
  const [passwords, setPasswords] = useState([]);
  const [searchAppName, setSearchAppName] = useState("");

  const passwordsRef = passwords || [];

  useEffect(() => {
    retrievePasswords();
  }, []);

  const retrievePasswords = () => {
    PasswordDataService.getAll()
      .then((response) => {
        console.log('response', response)
        setPasswords(response.data.data);
      })
      .catch((e) => {
        console.log(e);
      });
  };


  const findByAppName = () => {
    // PasswordDataService.findByAppName(searchAppName)
    //   .then((response) => {
    //     setPasswords(response.data);
    //   })
    //   .catch((e) => {
    //     console.log(e);
    //   });
  };

  const openPassword = (rowIndex) => {
    const id = passwordsRef[rowIndex].id;

    props.history.push("/passwords/" + id);
  };

  const deletePassword = (rowIndex) => {
    const id = passwordsRef[rowIndex].id;

    PasswordDataService.remove(id)
      .then((response) => {
        props.history.push("/passwords");

        let newPasswords = [...passwordsRef];
        newPasswords.splice(rowIndex, 1);

        setPasswords(newPasswords);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const columns = useMemo(
    () => [
      {
        Header: "AppName",
        accessor: "appName",
      },
      {
        Header: "Password",
        accessor: "passKey",
        Cell: (props) => {
          return (<div>******</div>)
        }
      },
      {
        Header: "Actions",
        accessor: "actions",
        Cell: (props) => {
          const rowIdx = props.row.id;
          return (
            <div>
              <span onClick={() => openPassword(rowIdx)}>
                <MdEdit />
              </span>

              <span onClick={() => deletePassword(rowIdx)}>
                <MdDeleteOutline />
              </span>
            </div>
          );
        },
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data: passwords,
  });

  return (
    <div className="list row">
      <div className="col-md-8">
        {/* <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by appName"
            value={searchAppName}
            onChange={onChangeSearchAppName}
          />
          <div className="input-group-append">
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={findByAppName}
            >
              Search
            </button>
          </div>
        </div> */}
      </div>
      <div className="col-md-12 list">
        <table
          className="table table-striped table-bordered"
          {...getTableProps()}
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()}>
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PasswordsList;
