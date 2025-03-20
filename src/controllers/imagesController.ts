import { Request, Response } from "express";
import {
  getUploadS3SignedUrl,
  getObjectS3SignedUrl,
} from "../services/s3FilesService";

/**
 * Genera una URL firmada para subir una imagen a S3.
 * @param req - Request de Express con el `objectKey` en el body.
 * @param res - Response de Express.
 */
export const handleUploadImage = async (req: Request, res: Response) => {
  try {
    const { objectKey } = req.body;
    if (!objectKey) {
      res.status(400).json({ message: "objectKey is required" });
    }

    const { url, s3Url } = await getUploadS3SignedUrl(objectKey);
    res.status(200).json({ uploadUrl: url, s3Url, objectKey });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error generating upload URL" });
  }
};

/**
 * Genera una URL firmada para obtener una imagen desde S3.
 * @param req - Request de Express con el `objectKey` en el body.
 * @param res - Response de Express.
 */
export const handleGetImage = async (req: Request, res: Response) => {
  try {
    const { objectKey } = req.body;
    if (!objectKey) {
      res.status(400).json({ message: "objectKey is required" });
    }

    const url = await getObjectS3SignedUrl(objectKey);
    res.status(200).json({ downloadUrl: url, objectKey });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error generating download URL" });
  }
};
