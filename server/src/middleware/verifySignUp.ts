import DBService from "../services/DBService";
import { User } from "../models/user.model";

// const db = require("../models");
// const ROLES = db.ROLES;
// const User = db.user;

export const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    if(!req.body.username || !req.body.email) throw 'Invalid object'
    const userItem: User = req.body
    console.log('about to do things', req.body)
    const item = await DBService.getItem('email', userItem.email);
    console.log('item: ', item);
    const username = await DBService.getItem('username', userItem.username);
    console.log('username: ', username);
  } catch (error) {
    res.status(400).json(error)
  }

};

// export const checkRolesExisted = (req, res, next) => {
//   if (req.body.roles) {
//     for (let i = 0; i < req.body.roles.length; i++) {
//       if (!ROLES.includes(req.body.roles[i])) {
//         res.status(400).send({
//           message: "Failed! Role does not exist = " + req.body.roles[i]
//         });
//         return;
//       }
//     }
//   }
  
//   next();
// };



