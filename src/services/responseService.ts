interface ResponseParams {
  statusCode?: number;
  body?: any;
  headers?: Record<string, string | boolean>;
}

/**
 * Procesa la respuesta y agrega los encabezados CORS adecuados.
 * @param params - Parámetros de la respuesta.
 * @param allowCredentials - Si se deben permitir credenciales en la respuesta.
 * @returns Objeto de respuesta con los encabezados CORS configurados.
 */
export const getProcessedResponse = (
  params: ResponseParams,
  allowCredentials: boolean = false
): ResponseParams => {
  return {
    ...params,
    headers: {
      ...(allowCredentials
        ? { "Access-Control-Allow-Credentials": "true" }
        : {}),
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      ...params.headers, // Permite sobrescribir encabezados si es necesario
    },
  };
};

/**
 * Convierte el `body` de la respuesta en JSON.
 * @param params - Parámetros de la respuesta.
 * @param allowCredentials - Si se deben permitir credenciales en la respuesta.
 * @returns Objeto de respuesta con el `body` en formato JSON.
 */
export const getStringifyResponse = (
  params: ResponseParams,
  allowCredentials: boolean = false
): ResponseParams => {
  return {
    ...getProcessedResponse(params, allowCredentials),
    body: JSON.stringify(params.body ?? {}),
  };
};
