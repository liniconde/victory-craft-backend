import { Request, Response } from "express";
import { createVideo } from "../services/videoService";
import { getUploadS3SignedUrl } from "../services/s3FilesService";

/**
 * 📌 Crea un nuevo video asociado a una cancha y opcionalmente a un partido.
 * Recibe `fieldId`, `matchId` (opcional) y `s3Key` desde el cuerpo de la solicitud.
 */
export const handleCreateVideo = async (req: Request, res: Response) => {
  try {
    const { fieldId, matchId, s3Key } = req.body;

    if (!fieldId || !s3Key) {
      res.status(400).json({ error: "Field ID and S3 key are required" });
    }

    const video = await createVideo({ fieldId, matchId, s3Key });
    res.status(201).json(video);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Genera una URL firmada para subir una imagen a S3.
 * @param req - Request de Express con el `objectKey` en el body.
 * @param res - Response de Express.
 */
export const handleUploadVideo = async (req: Request, res: Response) => {
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
