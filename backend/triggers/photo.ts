import { S3EventRecord, S3Handler } from "aws-lambda";
import { DynamoDB, S3 } from "aws-sdk";

const s3 = new S3();
const dynamoDb = new DynamoDB.DocumentClient();

async function getFileInfo(s3Record: S3EventRecord) {
  const file = s3Record.s3;
  const srcBucket = file.bucket.name;
  const srcKey = decodeURIComponent(file.object.key.replace(/\+/g, " "));
  const getObjParams = {
    Bucket: srcBucket,
    Key: srcKey,
  };

  const origimage = await s3.getObject(getObjParams).promise();
  const fileName = origimage.Metadata["label"];
  const photoId = origimage.Metadata["id"];
  const url = `https://${file.bucket.name}.s3.amazonaws.com/${file.object.key}`;

  return {
    fileName,
    getObjParams,
    id: photoId,
    image: origimage,
    s3File: file,
    srcBucket,
    srcKey,
    url,
  };
}

export const photoToDb: S3Handler = async (event, _context) => {
  const { PHOTO_DB_TABLE: photoDbTable } = process.env;
  const [firstFile] = event.Records;

  if (!photoDbTable) {
    console.error("Photo DB table not declared");
    return null;
  }

  if (!firstFile) {
    console.error("File doesn't exist!");
    return null;
  }

  try {
    const { fileName, id, s3File } = await getFileInfo(firstFile);

    await dynamoDb
      .put({
        TableName: photoDbTable,
        Item: {
          ID: id,
          url: `https://${s3File.bucket.name}.s3.amazonaws.com/${s3File.object.key}`,
          description: fileName,
        },
      })
      .promise();
  } catch (error) {
    console.error(error);
    return null;
  }
};
