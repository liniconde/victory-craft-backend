# Victory Craft - Esquema de Base de Datos (Mongoose)

Este diagrama representa los modelos actuales en `src/models/*`.

```mermaid
erDiagram
  USER {
    ObjectId _id
    string username UNIQUE
    string email UNIQUE
    string password
    string firstName
    string lastName
    string profileImage
    enum role "user|admin"
    date createdAt
    date updatedAt
  }

  FIELD {
    ObjectId _id
    string name
    enum type "football|padel|tennis"
    string location_name
    number location_lat
    number location_long
    number pricePerHour
    string imageS3Key
    string imageUrl
    ObjectId owner FK
    date createdAt
    date updatedAt
  }

  SLOT {
    ObjectId _id
    ObjectId field FK
    date startTime
    date endTime
    boolean isAvailable
    number value
    date createdAt
    date updatedAt
  }

  RESERVATION {
    ObjectId _id
    ObjectId user FK
    ObjectId slot FK
    date createdAt
    date updatedAt
  }

  VIDEO {
    ObjectId _id
    ObjectId fieldId FK "optional"
    ObjectId slotId FK "optional"
    enum videoType "field|library"
    enum sportType "football|padel|tennis (optional)"
    string s3Key
    string s3Url
    string googleAiFileId
    date uploadedAt
  }

  VIDEO_STATS {
    ObjectId _id
    ObjectId videoId FK UNIQUE
    enum sportType "football|padel|tennis"
    json teams
    string summary
    enum generatedByModel "manual|OpenPose|YOLOv8|DeepSportAnalyzer|BallTrackNet|Gemini-2.0-Flash"
    date createdAt
    date updatedAt
  }

  BOOKING {
    ObjectId _id
    date startTime
    date endTime
    number totalPrice
    ObjectId user FK
    ObjectId field FK
    date createdAt
    date updatedAt
  }

  CONCERT {
    ObjectId _id
    string name
    string ensemble
    string[] repertoire
    date date
    number location_latitude
    number location_longitude
    string venue
    number ticketPrice
    string description
    string imageUrl
    date createdAt
  }

  USER ||--o{ FIELD : owns
  FIELD ||--o{ SLOT : has
  USER ||--o{ RESERVATION : makes
  SLOT ||--o{ RESERVATION : reserved_in
  FIELD ||--o{ VIDEO : has
  SLOT ||--o{ VIDEO : recorded_in
  VIDEO ||--|| VIDEO_STATS : has_one
  USER ||--o{ BOOKING : creates
  FIELD ||--o{ BOOKING : booked_for
```

## Notas de lectura

- Aunque hablamos de "tablas", esto corre sobre MongoDB con colecciones/documentos.
- `VIDEO_STATS.videoId` es unico, por eso la relacion es 1:1 con `VIDEO`.
- `CONCERT` es independiente en este servicio (sin FKs a otros modelos).
- `BOOKING` existe como modelo, pero no tiene rutas activas en `src/routes` actualmente.
