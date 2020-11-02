import { S3Handler } from "aws-lambda";
import { DynamoDB, S3 } from "aws-sdk";

const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();

export const photoToDb: S3Handler = async (event, _context) => {
  const [firstFile] = event.Records;
  const file = firstFile.s3;
  const srcBucket = file.bucket.name;
  const srcKey = decodeURIComponent(file.object.key.replace(/\+/g, " "));

  const { PHOTO_DB_TABLE: photoDbTable } = process.env;

  if (!photoDbTable) {
    console.error("Photo DB table not declared");
    return null;
  }

  // Download image from S3 bucket
  const params = {
    Bucket: srcBucket,
    Key: srcKey,
  };
  const origimage = await s3.getObject(params).promise();
  const filename = origimage.Metadata["label"];
  const photoId = origimage.Metadata["id"];

  try {
    await dynamoDb
      .put({
        TableName: photoDbTable,
        Item: {
          ID: photoId,
          url: `https://${file.bucket.name}.s3.amazonaws.com/${file.object.key}`,
          description: filename,
        },
      })
      .promise();
  } catch (error) {
    console.error(error);
    return null;
  }
};
