import AWS from 'aws-sdk'
import dotenv from 'dotenv';
import getItem from './getItem';
import deleteItem from './deleteItem';
import query from './query';
import addItem from './addItem';
import dbConfig from '../config/db.config';

dotenv.config();
// Set the region
AWS.config.update({
  ...dbConfig.AWS.aws_remote_config
  // endpoint: 'http://localhost:8080',
});

// Create DynamoDB document client
export const USER_TABLE_NAME = 'pwd-mgr-table';
export const PWD_TABLE_NAME = 'usr-pwd-table';
export const defaultParams = {
  TableName: USER_TABLE_NAME
};
export const tableKeys = [
  'userId',
  'email',
  'password',
  'createdTime'
];
export const docClient = new AWS.DynamoDB.DocumentClient({ ...dbConfig.AWS.aws_remote_config });
export default {
  getItem,
  addItem,
  deleteItem,
  query
};
