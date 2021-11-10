# Password Manager
A password manager written in typescript, node, react with a dynamo db

## Table of Contents

- [Password Manager](#password-manager)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Starting server](#starting-server)
  - [Usage](#usage)
  - [Support](#support)
  - [Contributing](#contributing)

## Installation

Download to your project directory, add `README.md`, and commit:

```
yarn install
yarn build
```
*Note that this project is using yarn workspaces so yarn is required

## Starting server
After building, start the server 

```
yarn start-server
```
[and go to localhost:8080/app](http://localhost:8080/app)
sign up, log in and go to the passwords tab to view your passwords


## Usage 
Sign up and login via the web browser

Add a password

![Add a Password](docs/pwd-mgr-add-password.png?raw=true)

View all passwords in your account
![View all passwords in your account](docs/pwd-mgr-passwords-page.png?raw=true)
```Click on the edit button to view more details```

View a single password
![View a single Password](docs/pwd-mgr-password-page.png?raw=true)

## Support

Please [open an issue](https://github.com/iamknguyen/pwd-mgr/issues) for support.

## Contributing

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and open a pull request