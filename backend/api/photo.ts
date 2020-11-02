import { APIGatewayProxyHandler } from "aws-lambda";
import { S3 } from "aws-sdk";
import { v1 as uuidv1 } from "uuid";
import "source-map-support/register";

const s3 = new S3();

export enum STATUS_CODES {
  SUCCESS = 200,
  ERROR = 400,
}

export interface BodyModel {
  image?: string; // base64 image
  label?: string; // string
  extension?: string; // .jpg
}

export const upload: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const parsedBody: BodyModel =
      typeof event.body !== "object" ? JSON.parse(event.body) : event.body;
    const encodedImage: string = parsedBody.image;
    const decodedImage = Buffer.from(
      encodedImage.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const extension = encodedImage
      .match(/image\/\w+/)
      .join("")
      .replace("image/", "");

    const photoId = uuidv1();
    const filePath = `${
      process.env.PHOTO_BUCKET_FOLDER || ""
    }/${photoId}.${extension}`;

    const s3Params: S3.PutObjectRequest = {
      Body: decodedImage,
      Bucket: process.env.PHOTO_BUCKET_NAME,
      Key: filePath,
      ContentType: `image/${extension}`,
      ACL: "public-read",
      Metadata: {
        label: parsedBody.label,
        id: photoId,
      },
    };

    const data = await s3.upload(s3Params).promise();

    return {
      statusCode: STATUS_CODES.SUCCESS,
      body: data.Location,
    };
  } catch (ex) {
    return {
      statusCode: 200,
      body: JSON.stringify(ex),
    };
  }
};
