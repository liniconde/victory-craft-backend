import AWS from "aws-sdk";

const s3 = new AWS.S3({
    signatureVersion: 'v4'
});
const BUCKET_NAME = 'djfieldsking';

export const getUploadS3SignedUrl = (objectKey: string) => {
    
    // Configura las opciones para obtener la URL firmada para subir
    const url = s3.getSignedUrl('putObject', {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Expires: 600 // Tiempo en segundos antes de que la URL expire
    });

    const s3Url = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectKey}`;

    // Devuelve la URL firmada
    return  { s3Url, objectKey, url };
};

export const getObjectS3SignedUrl = (objectKey: string) => {
    

    console.log('object keyy',objectKey )
    const signedUrlExpireSeconds = 60 * 5; // URL válida por 5 minutos

    // Obtiene la URL firmada
    const url = s3.getSignedUrl('getObject', {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Expires: signedUrlExpireSeconds
    });

    return url;
};