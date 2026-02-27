import { Request, Response } from "express";
import {
  createLibraryVideo,
  createVideo,
  getLibraryVideosPaginated,
  updateVideo,
  getVideosByField,
} from "../services/videoService";
import { getUploadS3SignedUrl } from "../services/s3FilesService";

export const getVideosByFieldController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { fieldId } = req.params;
    const videos = await getVideosByField(fieldId as string);

    if (!fieldId) {
      res
        .status(400)
        .json({ error: "Field ID is required" });
      return;
    }
    res.status(200).json(videos);
  } catch (error: any) {
    console.error("error", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 📌 Crea un nuevo video asociado a una campo y opcionalmente a un partido.
 * Recibe `fieldId`, `matchId` (opcional) y `s3Key` desde el cuerpo de la solicitud.
 */
export const handleCreateVideo = async (req: Request, res: Response) => {
  try {
    const { fieldId, matchId, s3Key, slotId } = req.body;

    console.log(req.body);

    if (!fieldId || !s3Key || !slotId) {
      res
        .status(400)
        .json({ error: "Field ID and S3 key and SlotId are required" });
      return;
    }

    const video = await createVideo({ fieldId, matchId, s3Key, slotId });
    res.status(201).json(video);
  } catch (error: any) {
    console.error("error", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo video de biblioteca.
 * Solo requiere `s3Key`, y opcionalmente `sportType` para facilitar analisis.
 */
export const handleCreateLibraryVideo = async (req: Request, res: Response) => {
  try {
    const { s3Key, sportType, s3Url } = req.body;

    if (!s3Key) {
      res.status(400).json({ error: "S3 key is required" });
      return;
    }

    const video = await createLibraryVideo({ s3Key, sportType, s3Url });
    res.status(201).json(video);
  } catch (error: any) {
    console.error("error", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene videos de biblioteca paginados para render de listado.
 */
export const handleGetLibraryVideos = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (!Number.isFinite(page) || !Number.isFinite(limit)) {
      res
        .status(400)
        .json({ message: "page and limit must be valid numbers" });
      return;
    }

    const result = await getLibraryVideosPaginated(page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("error", error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un video
export const handleUpdateVideo = async (req: Request, res: Response) => {
  try {
    const updatedVideo = await updateVideo(req.params.id as string, req.body);
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
      return;
    }

    const { url, s3Url } = getUploadS3SignedUrl(objectKey);
    res.status(200).json({ uploadUrl: url, s3Url, objectKey });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Error generating upload URL" });
  }
};
