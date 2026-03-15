import { Response } from "express";
import { TournamentsDomainError } from "../services/errors";

export const handleTournamentsError = (res: Response, error: any) => {
  if (error instanceof TournamentsDomainError) {
    res.status(error.status).json({ message: error.message, code: error.code });
    return;
  }

  if (error?.code === 11000) {
    res.status(409).json({ message: "Duplicated resource", code: "duplicate_resource" });
    return;
  }

  res.status(500).json({ message: error?.message || "Internal server error", code: "internal_error" });
};
