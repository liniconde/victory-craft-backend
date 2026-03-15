import mongoose from "mongoose";
import { TournamentsDomainError } from "./errors";

export const assertObjectId = (value: string, field: string) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new TournamentsDomainError(400, `invalid_${field}`, `${field} is invalid`);
  }
};

export const parseOptionalDate = (value: string | Date | undefined) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new TournamentsDomainError(400, "invalid_date", "date value is invalid");
  }
  return parsed;
};

export const buildPairKey = (firstTeamId: string, secondTeamId: string) =>
  [firstTeamId, secondTeamId].sort().join("::");
