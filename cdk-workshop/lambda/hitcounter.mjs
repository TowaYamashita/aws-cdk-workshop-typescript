import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const dynamodb = new DynamoDBClient();
const lambda = new LambdaClient();

export const handler =  async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/updateitemcommand.html
  const upodateCommand = new UpdateItemCommand({
    TableName: process.env.HITS_TABLE_NAME,
    Key: { path: { S: event.path } },
    UpdateExpression: 'ADD hits \:incr',
    ExpressionAttributeValues: { '\:incr': { N: '1' } }
  });

  await dynamodb.send(upodateCommand);

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/classes/invokecommand.html
  const invokeCommand = new InvokeCommand({
    FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
    Payload: JSON.stringify(event)
  });

  const { Payload } = await lambda.send(invokeCommand);
  const result = Buffer.from(Payload).toString();
  console.log('downstream response:', JSON.stringify(result, undefined, 2));

  return JSON.parse(result);
};
