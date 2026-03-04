# Streaming Schema Migration (MongoDB/Mongoose)

Colecciones nuevas:
- `matchsessions`
- `streamrooms`
- `roomparticipants`
- `videosegments`

Indice unico requerido:
- `videosegments`: `{ matchSessionId: 1, sequence: 1 }`, `unique: true`

Notas:
- Al iniciar la app, Mongoose crea/actualiza indices del schema.
- Si prefieres control manual, ejecuta `db.videosegments.createIndex({ matchSessionId: 1, sequence: 1 }, { unique: true })`.
