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

Tillåtna origins läses från konfigurationen `Cors:AllowedOrigins` (array av URL:er).

```json
"Cors": {
    "AllowedOrigins": [
        "https://elbil.exempel.se",
        "http://localhost:4200"
    ]
}
```

Om listan är tom faller policyn tillbaka till `AllowAnyOrigin` — bekvämt för utveckling, men sätt alltid explicita origins i produktion.

I en Portainer-stack kan värden sättas via miljövariabler (ASP.NET-konfigurationsbindning):

```
Cors__AllowedOrigins__0=https://elbil.husvagn.ladda.com
```

Med Cloudflare framför API:et: ange den publika domän browsern faktiskt skickar i `Origin`-headern, inte intern container-adress. Cloudflare vidarebefordrar `Origin` oförändrad. Använd inte `AllowCredentials()` ihop med `AllowAnyOrigin()` (browsern blockerar det); eftersom auth sker via JWT i `Authorization`-headern och inte cookies behövs inte credentials här.
