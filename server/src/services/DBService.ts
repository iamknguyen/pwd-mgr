import AWS from "aws-sdk"
import dotenv from 'dotenv'
import getItem from './getItem'
import deleteItem from './deleteItem'
import query from './query'
import addItem from './addItem'
import config from '../config/db.config'
dotenv.config();
// Set the region 
AWS.config.update({
  ...config.AWS.aws_remote_config,
  // endpoint: 'http://localhost:8080',
});

// Create DynamoDB document client
export const USER_TABLE_NAME = 'pwd-mgr-table'
export const PWD_TABLE_NAME = 'usr-pwd-table'
export const defaultParams = {
  TableName: USER_TABLE_NAME
};
export const tableKeys = [
  'userId',
  'email',
  'password',
  'createdTime',
]
export const docClient = new AWS.DynamoDB.DocumentClient();
export default {
  getItem: getItem,
  addItem: addItem,
  deleteItem: deleteItem,
  query: query,
}