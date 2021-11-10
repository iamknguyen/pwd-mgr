const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import pwdRoutes from "./routes/pwd.routes";
const path = require("path");
const app = express();
var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));



// routes
authRoutes(app);
pwdRoutes(app);
userRoutes(app);
// simple route
app.use(express.static(path.join(__dirname, "..", "build")));
app.use(express.static("public"));
/* GET home page. */
app.get('/', function (req, res, next) {
  res.json({ message: "Welcome to the password manager!" });
});
/* GET React App */
app.get(['/app', '/app/*'], function (req, res, next) {
  console.log('serving', path.join(__dirname, '../public', 'app.html'))
  res.sendFile(path.join(__dirname, '../public', 'app.html'));
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}.`);
});
