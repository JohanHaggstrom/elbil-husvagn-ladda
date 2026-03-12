# Driftsättning och Miljövariabler

Detta projekt driftsätts med hjälp av Docker och Docker Compose. CI/CD-flödet bygger automatiskt Docker-images och pushar dem till GitHub Container Registry (ghcr.io) vid push till `main`-branchen.

## Miljövariabler

Följande miljövariabler måste konfigureras i din driftsmiljö (t.ex. i Portainer eller din `.env`-fil) för att applikationen ska fungera korrekt.

### Backend

| Variabel | Beskrivning | Exempelvärde |
| :--- | :--- | :--- |
| `API_KEY` | En hemlig nyckel för att säkra kommunikationen mellan frontend och backend. | `en-super-hemlig-nyckel` |
| `ConnectionStrings__DefaultConnection` | Anslutningssträng till databasen. | `Server=db;Database=charge_ev;User=root;Password=hemligt;` |
| `Nobil__ApiKey` | **NY!** API-nyckel för Nobil (laddstationsdata). Detta krävs för att kunna importera stationer. | `din-nobil-api-nyckel` |
| `DB_ROOT_PASSWORD` | Lösenord för databasens root-användare (används ofta för att konstruera connection string). | `hemligt-db-losenord` |

### Frontend

| Variabel | Beskrivning | Exempelvärde |
| :--- | :--- | :--- |
| `API_KEY` | Samma nyckel som i backend. Används för att autentisera anrop. | `en-super-hemlig-nyckel` |
| `RECAPTCHA_SITE_KEY` | Site key för Google reCAPTCHA. | `din-recaptcha-site-key` |

### Infrastruktur (Cloudflare/Tunnel)

| Variabel | Beskrivning | Exempelvärde |
| :--- | :--- | :--- |
| `TUNNEL_TOKEN` | Token för Cloudflare Tunnel om du använder det för extern åtkomst. | `eyAh...` |

## Driftsättning via Portainer

1.  **Uppdatera Stack/Compose-filen:** Se till att din `docker-compose.yml` (eller Stack definition i Portainer) använder de senaste images från `ghcr.io`.
2.  **Lägg till Miljövariabler:**
    *   Gå till din Stack/Container-konfiguration.
    *   Lägg till/uppdatera `Nobil__ApiKey` under `backend`-servicens environment-sektion. Notera att `.NET` använder dubbla understreck (`__`) för kapslade konfigurationer (motsvarar `Nobil:ApiKey` i `appsettings.json`).
3.  **Deploy the stack:**
    *   Klicka på "Update the stack" (och välj "Re-pull image" om du vill hämta den senaste versionen).

## Lokal Utveckling

För lokal utveckling, använd **User Secrets** för känsliga värden som `Nobil:ApiKey` för att undvika att checka in dem i git.

```bash
cd backend/ElbilHusvagnLadda.WebApi
dotnet user-secrets set "Nobil:ApiKey" "DIN_NYCKEL"
```
