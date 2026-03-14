import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const s3 = new AWS.S3({
  signatureVersion: "v4",
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.BUCKET_NAME || "victory-craft";

export const getUploadS3SignedUrl = (objectKey: string) => {
  // Configura las opciones para obtener la URL firmada para subir
  const url = s3.getSignedUrl("putObject", {
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Expires: 600, // Tiempo en segundos antes de que la URL expire
  });

  const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectKey}`;

  // Devuelve la URL firmada
  return { s3Url, objectKey, url };
};

export const getObjectS3SignedUrl = (objectKey: string, expiresInSeconds = 60 * 5) => {
  const url = s3.getSignedUrl("getObject", {
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Expires: expiresInSeconds,
  });

  return url;
};

export const deleteObjectS3 = async (objectKey: string) => {
  await s3
    .deleteObject({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    })
    .promise();
};
