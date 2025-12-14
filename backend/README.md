# ElbilHusvagnLadda Backend

.NET 8 REST API för laddstationer för elbilar med husvagn.

## Teknologi

-   .NET 8
-   ASP.NET Core Web API
-   Entity Framework Core (InMemory Database)

## Kom igång

### Förutsättningar

-   .NET 8 SDK

### Köra backend

```bash
cd backend/ElbilHusvagnLadda.WebApi
dotnet run
```

API:et kommer att köras på `http://localhost:5171` (eller annan port som visas i terminalen).

### API Endpoints

-   `GET /api/chargingpoints` - Hämta alla laddstationer
-   `GET /api/chargingpoints/{id}` - Hämta en specifik laddstation

### Swagger

När applikationen körs i development-läge kan du komma åt Swagger UI på:
`http://localhost:5171/swagger`

## Databashantering

För närvarande använder API:et en InMemory-databas med hårdkodad seed-data.
I framtiden kan detta bytas ut mot en riktig databas (SQL Server, PostgreSQL, etc.).

## CORS

API:et är konfigurerat att tillåta requests från Angular-frontend på `http://localhost:4200`.

Verify: You should be able to access the admin routes.
