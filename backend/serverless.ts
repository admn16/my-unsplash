import type { Serverless } from "serverless/aws";

const serverlessConfiguration: Serverless = {
  service: {
    name: "unsplash",
    // app and org for use with dashboard.serverless.com
    // app: your-app-name,
    // org: your-org-name,
  },
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
    baseName: "${self:service}-${self:provider.stage}",
    photoBucketName: "${self:custom.baseName}-${self:provider.region}-files",
    photoBucketFolder: "photos",

    photoDbTable: "${self:service}-${self:provider.stage}-photos",
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
        Action: ["S3:*"],
        Resource: "arn:aws:s3:::${self:custom.photoBucketName}/*",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:*"],
        Resource: "*",
      },
    ],
  },
  functions: {
    uploadPhoto: {
      handler: "./api/admin/photo.upload",
      events: [
        {
          http: {
            method: "post",
            path: "admin/upload-photo",
          },
        },
      ],
    },
    getPhotos: {
      handler: "./api/client/photo.list",
      events: [
        {
          http: {
            method: "get",
            path: "client/photos",
          },
        },
      ],
      environment: {
        PHOTO_DB_TABLE: "${self:custom.photoDbTable}",
      },
    },
    photoToDb: {
      handler: "./triggers/photo.photoToDb",
      events: [
        {
          s3: {
            bucket: "${self:custom.photoBucketName}",
            event: "s3:ObjectCreated:*",
            rules: [
              {
                prefix: "${self:custom.photoBucketFolder}/",
                suffix: "*",
              },
            ],
            existing: true,
          },
        },
      ],
      environment: {
        PHOTO_DB_TABLE: "${self:custom.photoDbTable}",
      },
    },
  },
  resources: {
    Resources: {
      S3PhotoArtifacts: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:custom.photoBucketName}",
        },
      },
      DynamoPhotos: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${self:custom.photoDbTable}",
          AttributeDefinitions: [
            {
              AttributeName: "ID",
              AttributeType: "S",
            },
            {
              AttributeName: "description",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "ID",
              KeyType: "HASH",
            },
            {
              AttributeName: "description",
              KeyType: "RANGE",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
