const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
import { User } from "./models/user.model";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import DBService from './services/DBService';

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
app.listen(PORT, async() => {
  console.log(`Server is running on port ${PORT}.`);
  try {
    const data = await DBService.addItem({id: 'something', email: 'somethingelse', password: 'something else'} as User)
    console.log('done', data)
  } catch (error) {
    console.error('you suck', error)    
  }
});

/**
 * TO DO
import db from "./models/index";
const Role = db.role;

// db.sequelize.sync();
// force: true will drop the table if it already exists
db.sequelize.sync({force: true}).then(() => {
  console.log('Drop and Resync Database with { force: true }');
  initial();
});
function initial() {
  Role.create({
    id: 1,
    name: "user"
  });
 
  Role.create({
    id: 2,
    name: "moderator"
  });
 
  Role.create({
    id: 3,
    name: "admin"
  });
}
 */
