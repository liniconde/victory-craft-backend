# Agent Planner V2

## Objetivo

La `v2` del planner mueve la logica del agente a `agents-ms` y reduce latencia/coste del LLM con una arquitectura hibrida:

- resolucion deterministica para navegacion frecuente,
- fallback al LLM solo cuando hay ambiguedad,
- validacion y reparacion post-LLM,
- cache global persistida en Mongo,
- sincronizacion del catalogo de navegacion desde frontend.

El endpoint legacy `POST /agent/plan` sigue funcionando para compatibilidad.

## Endpoints

- `POST /agent/plan`
  Planner legacy.
- `POST /agent/v2/plan`
  Planner optimizado.
- `PUT /agent/v2/navigation-catalogs/:version`
  Guarda o actualiza un catalogo de navegacion.
- `POST /agent/v2/cache/invalidate`
  Invalida cache global.
- `POST /agent/v2/cache/refresh`
  Precalienta o regenera cache de prompts frecuentes.

Los endpoints de gestion requieren `Bearer token` con rol `admin`.

## Flujo de la v2

1. Frontend envia `prompt`, `currentPath`, `actions`, `navigationCatalogVersion` y opcionalmente `navigationCatalog`.
2. Backend intenta cargar el catalogo por version.
3. Si el catalogo viene embebido en la request, se persiste para reutilizarlo.
4. Backend normaliza el prompt y busca primero una entrada de cache global.
5. Si no hay cache, ejecuta ranking deterministico sobre el catalogo.
6. Si hay ganador claro, devuelve `navigation.go_to` sin llamar al LLM.
7. Si hay ambiguedad, llama al LLM con un conjunto reducido de candidatos.
8. El plan recibido se valida y, si hace falta, se repara para evitar rutas genericas o inexistentes.
9. El resultado final se guarda en cache Mongo para reutilizarlo entre usuarios.

## Catalogo de navegacion recomendado

El frontend es la fuente de verdad. El backend no debe duplicar manualmente el mapa.

Formato recomendado por entrada:

```json
{
  "route": "/videos/subpages/streaming/recording",
  "actionName": "navigation.go_to",
  "title": "Recording",
  "section": "videos",
  "page": "streaming",
  "subpage": "recording",
  "aliases": ["grabaciones", "recording", "recordings"],
  "breadcrumbs": ["videos", "streaming", "recording"],
  "parents": ["/videos", "/videos/subpages/streaming"],
  "intentTags": ["streaming", "recording"],
  "isLanding": false,
  "popularity": 80
}
```

Campos importantes:

- `aliases`: principal fuente para resolver frases cortas sin LLM.
- `breadcrumbs`: ayuda a desambiguar por contexto.
- `section/page/subpage`: permite scoring simple y robusto.
- `isLanding`: evita inferencias erraticas para paginas raiz.
- `version`: hash estable del catalogo generado por frontend.

## Estrategia de cache

La cache se persiste en Mongo a traves de puertos/adaptadores.

Clave de cache:

- `normalizedPrompt`
- `navigationCatalogVersion`
- `locale`
- `currentPathScope` basado en el primer segmento del path
- `actionsFingerprint`

Esto hace la cache suficientemente reutilizable entre usuarios sin mezclar prompts incompatibles.

### Que se cachea

- respuestas deterministicas,
- respuestas provenientes del LLM,
- metadata de confianza, planner mode y trazabilidad.

### Cuando invalidar

- cuando cambia un catalogo de navegacion,
- cuando se agregan o renombran rutas/aliases,
- cuando cambia el conjunto de acciones registradas de forma incompatible.

## Gestion del catalogo

### Alta o actualizacion

`PUT /agent/v2/navigation-catalogs/:version`

Comportamiento:

- guarda el catalogo,
- invalida automaticamente la cache de esa misma version.

Esto evita devolver rutas resueltas con un catalogo viejo.

## Gestion de cache

### Invalida toda la cache

```json
{
  "all": true
}
```

### Invalida por version de catalogo

```json
{
  "catalogVersion": "nav-2026-03-22"
}
```

### Invalida por prompt

```json
{
  "prompt": "llévame a grabaciones"
}
```

### Precalentamiento

`POST /agent/v2/cache/refresh`

Casos de uso:

- precalentar prompts frecuentes tras desplegar frontend,
- regenerar cache tras cambiar aliases o rutas,
- preparar versiones nuevas de catalogo antes de abrir trafico real.

## Planner modes

La respuesta de `v2` incluye `meta.plannerMode`:

- `deterministic`: se resolvio sin LLM.
- `llm`: el LLM devolvio un plan valido sin reparaciones.
- `llm_repaired`: el backend ajusto una ruta generica o invalida.
- `fallback`: no se pudo producir un plan util.
- `cache_hit`: la respuesta vino de cache.

## Ejemplos

### 1. Primer request con catalogo embebido

```json
{
  "prompt": "llévame a grabaciones",
  "currentPath": "/videos",
  "locale": "es",
  "actions": [
    {
      "name": "navigation.go_to",
      "description": "Navigate to route",
      "parameters": [
        {
          "name": "path",
          "type": "string",
          "description": "Target path",
          "required": true
        }
      ],
      "returns": [],
      "tags": ["navigation"]
    }
  ],
  "navigationCatalogVersion": "nav-v2026-03-22",
  "navigationCatalog": {
    "version": "nav-v2026-03-22",
    "locale": "es",
    "entries": []
  }
}
```

### 2. Requests siguientes usando solo version

```json
{
  "prompt": "abre el timeline del streaming",
  "currentPath": "/videos",
  "locale": "es",
  "actions": [
    {
      "name": "navigation.go_to",
      "description": "Navigate to route",
      "parameters": [
        {
          "name": "path",
          "type": "string",
          "description": "Target path",
          "required": true
        }
      ],
      "returns": [],
      "tags": ["navigation"]
    }
  ],
  "navigationCatalogVersion": "nav-v2026-03-22"
}
```

## Observabilidad

Eventos de log actuales:

- `agent_plan_v2_cache_hit`
- `agent_plan_v2_provider_response`
- `agent_plan_v2_provider_error`
- `agent_plan_v2_parse_failed`

Recomendaciones:

- medir ratio `deterministic` vs `llm`,
- medir `cache_hit_rate`,
- medir latencia por etapa,
- auditar prompts con `llm_repaired`,
- revisar prompts fallback mas repetidos para añadir aliases.

## Estructura interna

Modulo nuevo:

- `src/agents-ms/domain`
- `src/agents-ms/application`
- `src/agents-ms/infrastructure`
- `src/agents-ms/presentation`

Persistencia abstracta:

- `NavigationCatalogRepository`
- `AgentPlanCacheRepository`

Adaptadores actuales:

- Mongo para catalogos,
- Mongo para cache de planes.

Esto permite cambiar mas adelante a Redis, Postgres o cualquier otro storage sin tocar la logica del planner.
