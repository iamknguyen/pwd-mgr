const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
import { User } from "./models/user.model";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import DBService from './services/DBService';
import bcrypt from 'bcryptjs';

const app = express();
var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));


// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome." });
});

// routes
authRoutes(app);
userRoutes(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}.`);
});
