export const SPORT_TYPES = [
  "football",
  "futsal",
  "basketball",
  "baseball",
  "volleyball",
  "tennis",
  "padel",
  "other",
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

const SPORT_TYPE_SET = new Set<string>(SPORT_TYPES);

const SPORT_TYPE_ALIASES: Record<string, SportType> = {
  football: "football",
  soccer: "football",
  futsal: "futsal",
  basketball: "basketball",
  baseball: "baseball",
  volleyball: "volleyball",
  tennis: "tennis",
  padel: "padel",
  other: "other",
};

export const normalizeSportType = (value?: unknown): SportType | undefined => {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;

  return SPORT_TYPE_ALIASES[normalized];
};

export const isValidSportType = (value: unknown): value is SportType =>
  typeof value === "string" && SPORT_TYPE_SET.has(value);

export const normalizeSportTypeOrThrow = (
  value: unknown,
  errorFactory: (message: string) => Error,
): SportType | undefined => {
  const normalized = normalizeSportType(value);
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (!normalized) {
    throw errorFactory(
      `sportType is invalid. Supported values: ${SPORT_TYPES.join(", ")}`,
    );
  }
  return normalized;
};
