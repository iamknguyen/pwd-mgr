const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import pwdRoutes from "./routes/pwd.routes";

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
pwdRoutes(app);
userRoutes(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}.`);
});
