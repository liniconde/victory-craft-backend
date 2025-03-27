import { Request, Response } from "express";
import { createVideo, updateVideo } from "../services/videoService";
import { getUploadS3SignedUrl } from "../services/s3FilesService";

/**
 * 📌 Crea un nuevo video asociado a una campo y opcionalmente a un partido.
 * Recibe `fieldId`, `matchId` (opcional) y `s3Key` desde el cuerpo de la solicitud.
 */
export const handleCreateVideo = async (req: Request, res: Response) => {
  try {
    const { fieldId, matchId, s3Key, slotId } = req.body;

    if (!fieldId || !s3Key || !slotId) {
      res.status(400).json({ error: "Field ID and S3 key and SlotId are required" });
    }

    const video = await createVideo({ fieldId, matchId, s3Key });
    res.status(201).json(video);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un video
export const handleUpdateVideo = async (req: Request, res: Response) => {
  try {
    const updatedVideo = await updateVideo(req.params.id, req.body);
    if (!updatedVideo) {
      res.status(404).json({ message: "Video not found" });
    }
    res.json(updatedVideo);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Genera una URL firmada para subir una imagen a S3.
 * @param req - Request de Express con el `objectKey` en el body.
 * @param res - Response de Express.
 */
export const handleUploadVideo = async (req: Request, res: Response) => {
  try {
    console.log("entro acca", req.body);
    const { objectKey } = req.body;
    if (!objectKey) {
      res.status(400).json({ message: "objectKey is required" });
    }

    const { url, s3Url } = getUploadS3SignedUrl(objectKey);
    res.status(200).json({ uploadUrl: url, s3Url, objectKey });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error generating upload URL" });
  }
};
