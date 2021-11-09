import dotenv from 'dotenv'
dotenv.config();
export default {
  AWS: {
    aws_local_config: {
      region: 'local',
      endpoint: 'http://localhost:8080',
    },
    aws_remote_config: {
      region: 'us-west-2',
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey:  process.env.AWS_SECRET
    },
    aws_table_name: 'pwd-mgr-table'
  }
};