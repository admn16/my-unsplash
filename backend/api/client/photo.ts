import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { STATUS_CODES } from "../../types";

const dynamoDb = new DynamoDB.DocumentClient();

export const list: APIGatewayProxyHandlerV2 = async (event, _context) => {
  try {
    const { PHOTO_DB_TABLE: photoDbTable } = process.env;

    const data = await dynamoDb
      .query({
        TableName: photoDbTable,
        Limit: 5,
      })
      .promise();

    return {
      statusCode: STATUS_CODES.SUCCESS,
      body: JSON.stringify({
        data,
      }),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};
