import type { Serverless } from "serverless/aws";

const serverlessConfiguration: Serverless = {
  service: {
    name: "my-unsplash",
  },
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
    baseName: "${self:service}-${self:provider.stage}",
    photoBucketName:
      "${self:custom.baseName}-${self:provider.region}-artifacts",
    photoBucketFolder: "photos",
  },
  // Add the serverless-webpack plugin
  plugins: ["serverless-webpack"],
  provider: {
    name: "aws",
    runtime: "nodejs12.x",
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      PHOTO_BUCKET_NAME: "${self:custom.photoBucketName}",
      PHOTO_BUCKET_FOLDER: "${self:custom.photoBucketFolder}",
    },
    memorySize: 128,
    timeout: 15,
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["s3:*"],
        Resource: "arn:aws:s3:::${self:custom.photoBucketName}/*",
      },
    ],
  },
  functions: {
    uploadPhoto: {
      handler: "./api/upload-photo.uploadPhoto",
      events: [
        {
          http: {
            method: "post",
            path: "photo",
            cors: true,
          },
        },
      ],
    },
  },
  resources: {
    Resources: {
      S3PhotosArtifacts: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:custom.photoBucketName}",
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
