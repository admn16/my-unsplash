import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { S3 } from "aws-sdk";
import { v1 as uuidv1 } from "uuid";
import { STATUS_CODES } from "./types";
import "source-map-support/register";

const s3 = new S3();

export interface BodyModel {
  image?: string; // base64 image
  label?: string; // string
  extension?: string; // .jpg
}

export const uploadPhoto: APIGatewayProxyHandlerV2 = async (
  event,
  _context
) => {
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

    const filePath = `${
      process.env.PHOTO_BUCKET_FOLDER || ""
    }/${uuidv1()}.${extension}`;

    const s3Params: S3.PutObjectRequest = {
      Body: decodedImage,
      Bucket: process.env.PHOTO_BUCKET_NAME,
      Key: filePath,
      ContentType: `image/${extension}`,
      ACL: "public-read",
      Metadata: {
        "label": parsedBody.label,
      },
    };

    const data = await s3.upload(s3Params).promise();

    return {
      statusCode: STATUS_CODES.SUCCESS,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: STATUS_CODES.ERROR,
      body: JSON.stringify(event),
    };
  }
};
