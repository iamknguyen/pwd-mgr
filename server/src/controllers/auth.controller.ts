import DBService from "../services/DBService";
import { User } from "../models/user.model";

// const db = require("../models");
const config = require("../config/auth.config");
// const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

const signup = async (req, res) => {
  try {
    const user: User = req.body;
    user.createdTime = new Date().toString()
    const item = {
      username: user.username,
      email: user.email,
      password: bcrypt.hashSync(user.password, 8),
      createdTime: Date.toString()
    }
    console.log('about to add', user)
    const data = await DBService.addItem(item)
    res.json(data);
  } catch (error) {
    console.error('error in signup', error)
    res.status(400).json(error)
  }

};

const signin = async (req, res) => {
  try {
    if (!req.params.username) throw "Missing username"
    const items = await DBService.getItem('username', req.body.username);

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      items.password
    );
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }
    var token = jwt.sign({ id: items.id }, config.secret, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
      id: items.id,
      username: items.username,
      email: items.email,
      accessToken: token
    });

  } catch (error) {
    res.status(400).json(error)
  }

  // User.findOne({
  //   where: {
  //     username: req.body.username
  //   }
  // })
  //   .then(user => {
  //     if (!user) {
  //       return res.status(404).send({ message: "User Not found." });
  //     }

  //     var passwordIsValid = bcrypt.compareSync(
  //       req.body.password,
  //       user.password
  //     );

  //     if (!passwordIsValid) {
  //       return res.status(401).send({
  //         accessToken: null,
  //         message: "Invalid Password!"
  //       });
  //     }

  //     var token = jwt.sign({ id: user.id }, config.secret, {
  //       expiresIn: 86400 // 24 hours
  //     });

  //     var authorities = [];
  //     user.getRoles().then(roles => {
  //       for (let i = 0; i < roles.length; i++) {
  //         authorities.push("ROLE_" + roles[i].name.toUpperCase());
  //       }
  //       res.status(200).send({
  //         id: user.id,
  //         username: user.username,
  //         email: user.email,
  //         roles: authorities,
  //         accessToken: token
  //       });
  //     });
  //   })
  //   .catch(err => {
  //     res.status(500).send({ message: err.message });
  //   });
};

export default {
  signin,
  signup
}
