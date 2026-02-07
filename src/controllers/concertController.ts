import { Request, Response } from "express";
import Concert from "../models/Concert";

// Obtener todos los conciertos
export const getConcerts = async (req: Request, res: Response) => {
  try {
    const concerts = await Concert.find();
    res.json(concerts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Obtener un concierto por ID
export const getConcertById = async (req: Request, res: Response) => {
  try {
    const concert = await Concert.findById(req.params.id as string);
    if (!concert) {
      res.status(400).json({
        message: "Concert not found",
      });
    }
    res.json(concert);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Crear un nuevo concierto
export const createConcert = async (req: Request, res: Response) => {
  try {
    const newConcert = new Concert(req.body);
    await newConcert.save();
    res.status(201).json(newConcert);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Actualizar un concierto
export const updateConcert = async (req: Request, res: Response) => {
  try {
    const updatedConcert = await Concert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedConcert);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Eliminar un concierto
export const deleteConcert = async (req: Request, res: Response) => {
  try {
    await Concert.findByIdAndDelete(req.params.id as string);
    res.json({ message: "Concert deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
