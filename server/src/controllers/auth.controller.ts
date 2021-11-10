import DBService, { USER_TABLE_NAME } from '../services/DBService';
import { User } from '../models/user.model';
import authConfig from '../config/auth.config';
import dbConfig from '../config/db.config';
import AWS from 'aws-sdk';

// const db = require("../models");
// const Role = db.role;

let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');
let CUSTOMEPOCH = 1300000000000; // artificial epoch
function generateRowId(shardId /* range 0-64 for shard/slot */) {
  let ts = new Date().getTime() - CUSTOMEPOCH; // limit to recent
  let randid = Math.floor(Math.random() * 512);
  ts = (ts * 64);   // bit-shift << 6
  ts = ts + shardId;
  return (ts * 512) + randid;
}

const signup = async (req, res) => {
  try {
    const user: User = req.body;
    const item = {
      userId:  'user:' + generateRowId(4),
      email: user.email,
      password: bcrypt.hashSync(user.password, 8),
      createdTime: Date.now().toString()
    };
    console.log('about to add', user);
    const data = await DBService.addItem(item, USER_TABLE_NAME);
    res.json(data);
  } catch (error) {
    console.error('error in signup', error);
    res.status(400).json(error);
  }

};

const signin = async (req, res) => {
  try {
    console.log('attempting to login', req.body);
    console.log('db config', dbConfig.AWS);
    console.log('aws config', AWS.config);
    if (!req.body.email) { throw "Missing email" }
    const items = await DBService.query(req.body.email);
    console.info('user loggin in', items);
    const { userId, email, password } = items[0];
    console.log({ userId, email, password }, req.body);
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      password
    );
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: 'Invalid Password!'
      });
    }
    const token = jwt.sign({ userId }, authConfig.secret, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
      userId,
      email,
      accessToken: token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export default {
  signin,
  signup
};
