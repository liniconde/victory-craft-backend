import AWS from 'aws-sdk';
const s3 = new AWS.S3();

export const getBase64DataFromJpegFile = async (bucketName: string, objectKey: string) => {
    const params = {
        Bucket: bucketName,
        Key: objectKey,
    };
    const data = await s3.getObject(params).promise();
    return data.Body.toString('binary');
}

