import * as cdk from '@aws-cdk/core';
import * as cstar from '@aws-cdk/aws-codestarnotifications';
import { constants } from './constants';

export function addPipelineNotification(scope: cdk.Construct, accountId: string, name: string, pipelineArn: string, chatbotChannelName: string) {
  new cstar.CfnNotificationRule(scope, 'NotificationRule', {
    detailType: 'BASIC',
    eventTypeIds: constants.CODEPIPELINE_EVENTTYPE_IDS,
    //has max 64 characters
    name: name.length > 64 ? name.substring(name.length - 64) : name,
    resource: pipelineArn,
    targets: [
      {
        targetAddress: `arn:aws:chatbot::${accountId}:chat-configuration/slack-channel/${chatbotChannelName}`,
        targetType: 'AWSChatbotSlack'
      }
    ],
    status: 'ENABLED'
  });
}