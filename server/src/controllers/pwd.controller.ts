import DBService, { docClient, PWD_TABLE_NAME } from "../services/DBService";
import authConfig from "../config/auth.config";
import CryptoService from "../services/cryptoService";
import { Pwd } from "../models/pwd.model";

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const cryptr = new CryptoService(authConfig.secret);

const addPwd = async (req, res) => {
  try {
    const { userId } = req;
    if (!req.body.password || !req.body.appName) throw "Missing password"
    const item: Pwd = {
      userId,
      appName: req.body.appName,
      password: cryptr.encrypt(req.body.password),
      createdTime: Date.now().toString()
    }
    console.log('about to add password', item)
    const data = await DBService.addItem(item, PWD_TABLE_NAME)
    res.json(data);
  } catch (error) {
    console.error('error in adding password', error)
    res.status(400).json(error)
  }

};

const removePwd = async (req, res) => {
  try {
    if (!req.body.email) throw "Missing email"
    const items = await DBService.query(req.body.email);
    console.info('user loggin in', items)
    const { userId, email, password } = items[0]
    console.log({ userId, email, password }, req.body)
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      password
    );
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }
    var token = jwt.sign({ userId }, authConfig.secret, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
      userId,
      email,
      accessToken: token
    });

  } catch (error) {
    console.error(error)
    res.status(400).json(error)
  }
};

const getPwd = async (req, res) => {
  try {
    const { userId } = req;
    console.log('getting passwords for', userId)
    // if (!req.body.appName) throw "Missing appName"
    let params = {
      TableName: PWD_TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ProjectionExpression: 'userId, appName, password'
    }
    let result = [];
    const request = docClient.query(params).promise();

    const data = await request.then(function (data) {
      result = [...data.Items];
      return result;
    })
    console.log('got password', data)

    // res.status(200).send({
    //   password: cryptr.decrypt(data[0].password),
    // });
    res.status(200).send({
      data: data
    });

  } catch (error) {
    console.error(error)
    res.status(400).json(error)
  }
};

const getOnePwd = async (req, res) => {
  try {
    const { userId } = req;
    console.log('getting passwords for', userId, req.params.appName)
    // if (!req.body.appName) throw "Missing appName"
    let params = {
      TableName: PWD_TABLE_NAME,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      },
      ProjectionExpression: 'userId, appName, password'
    }
    let result = [];
    const request = docClient.query(params).promise();

    const data = await request.then(function (data) {
      result = [...data.Items];
      return result;
    })
    let obj = data.find(o => o.appName ===  req.params.appName);
    console.log('filtered item', obj)
    res.status(200).send({
      password: cryptr.decrypt(obj.password),
    });


  } catch (error) {
    console.error(error)
    res.status(400).json(error)
  }
};

export default {
  removePwd,
  getPwd,
  getOnePwd,
  addPwd
}
