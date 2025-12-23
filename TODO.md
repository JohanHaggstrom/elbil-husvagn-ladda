# TODO - Elbil-husvagn-ladda (EHL)

## Varumärke & Allmänt

-   [x] **Byta namn**: Ändra applikationens namn till "Elbil-husvagn-ladda" (EHL).
-   [ ] **Reklam**: Lägga till reklam på huvudsidan. Så att man kan få in pengar?
-   [x] **Patreon-ish**: Lägga till en Patreon-ish funktion där man kan stödja utvecklingen.

## Infrastruktur & DevOps

-   [x] **Taskar**: Skapa task(ar) för att förenkla utvecklingen.
-   [ ] **Hosting**: Utreda hur applikationen ska hostas.
-   [ ] **HTTPS Strategi**: Planera för reverse proxy (t.ex. Nginx/Traefik) för SSL-terminering i produktion.
-   [ ] **Docker**: Skapa Dockerfiles för frontend och backend, samt en docker-compose för att köra allt lokalt.
-   [ ] **CI/CD**: Implementera CI/CD-pipeline för automatisk deployment.

## Backend (.NET)

-   [x] **Databas**: Byta ut InMemory-databasen mot en riktig databas (t.ex. PostgreSQL eller SQL Server).
-   [x] **Data-modell**: Utöka modellen för laddstationer (fler fält, riktiga koordinater).
-   [x] **API-säkerhet (Läs)**: Implementera API-nyckel för att läsa laddstationer (konfigureras via miljövariabler).
-   [x] **Autentisering (Skriv)**: Implementera Login-funktionalitet för administrativa åtgärder.
-   [x] **Redigering**: Möjlighet att redigera laddstationer (kräver inloggning).
-   [x] **Skapa**: Möjlighet att lägga till nya laddstationer.
-   [x] **CRUD-operationer**:
    -   [x] Möjlighet att lägga till en punkt.
    -   [x] Möjlighet att editera en punkt.
    -   [x] Möjlighet att ta bort en punkt.
-   [x] **Sociala funktioner**:
    -   [x] Möjlighet att lägga till kommentarer på en punkt.
    -   [x] Möjlighet att ge tumme upp/ner på en punkt.
-   [x] **Användarhantering**: Möjlighet att hantera admin användare. Kunna byta psw, ta bort användare, etc. Spara i ny tabell. Obs saltat.
-   [x] **Backup**: Möjlighet att backup laddstationer till en json-fil.
-   [ ] **Restore**: Möjlighet att restore laddstationer från en json-fil.

## Frontend (Angular)

-   [x] **Karta - Sök**: Implementera sökfält för att hitta platser på kartan.
-   [x] **Karta - Styling**: Göra pins transparenta/snyggare.
-   [x] **API-koppling**: Koppla ihop frontend med backend på riktigt (ersätta hårdkodad data).
-   [x] **Säkerhet**: Hantera API-nyckel i anrop och Login-flöde i UI.
-   [x] **Admin UI**: Gränssnitt för att lägga till, redigera och ta bort punkter.
-   [x] **Social UI**: Gränssnitt för kommentarer och betyg.
-   [x] **Felhantering**: Hantera om backend är nere eller API-anrop misslyckas.
-   [x] **Lista/karta**: Lägg till möjlighet att visa en lista eller en karta.
-   [x] **Material icons**: Lägg till möjlighet att visa material icons.
-   [x] **Kunna föreslå förbättringar**: Lägg till möjlighet att kunna föreslå förbättringar. Med Captcha för att förhindra spam. Inklusive databas för det i backend.
-   [x] **Kunna enkelt föreslå en ny laddstation**: Lägg till möjlighet att kunna enkelt föreslå en ny laddstation. Med Captcha för att förhindra spam. Inklusive databas för det i backend.
-   [ ] **Kunna lägga in ungefärlig förbrukning för ekipage**: Lägg till möjlighet att kunna lägga in ungefärlig förbrukning för ekipage. Inklusive databas för det i backend.
-   [x] **Bild av laddstation**: Lägg till möjlighet att visa en bild av en laddstation.
-   [ ] **Runtime Config för Docker**: Implementera runtime configuration för API-nyckel i Docker
    -   Skapa `app.initializer.ts` som läser `/assets/config.json` vid app-start
    -   Skapa `docker-entrypoint.sh` som genererar `config.json` från miljövariabler
    -   Uppdatera Dockerfile att använda entrypoint-scriptet
    -   Flytta `apiKey` och `apiUrl` från `environment.ts` till runtime config
    -   Detta gör att samma Docker-image kan användas i olika miljöer
-   [ ] **Byt till riktig Captcha**: Byt till riktig Captcha, när det stöder Angular 21.
-   [x] **Exportera**: Möjlighet att exportera laddstationer till en json-fil.
-   [ ] **Importera**: Möjlighet att importera laddstationer från en json-fil.

## Dokumentation

-   [ ] **Uppdatera README**: Dokumentera nya funktioner och Docker-setup.
