# Dev Container Setup Guide

Den här guiden förklarar hur du sätter upp din utvecklingsmiljö med dev container för Elbil. Husvagn. Ladda.

## Förutsättningar

- **Docker Desktop** installerad och igång (eller Docker + Docker Compose)
- **VS Code** med **Dev Containers** extension installerad
- **Git** för att klona repot

## Installation

### 1. Klona repot

```bash
git clone https://github.com/your-repo/elbil-husvagn-ladda.git
cd elbil-husvagn-ladda
```

### 2. Skapa `.env`-filen

Kopiera `.env.example` och fyll i dina hemliga API-nycklar:

```bash
cp .env.example .env
```

Redigera `.env` och lägg in:
- **Nobil API Key** - Hämta från https://www.nobil.no/api/

Exempel:
```env
# Database connection string
ConnectionStrings__DefaultConnection=Server=db;Port=3306;Database=ElbilHusvagnLadda;User=root;Password=dev_password_123;

# Nobil API key - get from https://www.nobil.no/api/
Nobil__ApiKey=din-verkliga-api-nyckel-här
```

⚠️ **VIKTIGT:** `.env`-filen är i `.gitignore` och ska ALDRIG checkas in i git!

### 3. Öppna i Dev Container

1. Öppna mappen i VS Code:
   ```bash
   code .
   ```

2. VS Code ska fråga om du vill öppna mappen i dev container. Klicka **"Reopen in Container"**

   Eller använd Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
   - Kör: **"Dev Containers: Reopen in Container"**

3. VS Code startar dev containern (detta kan ta några minuter första gången)

### 4. Verifiera miljövariablerna

När containern är startad, öppna en terminal och verifiera att hemlig API-nyckeln är inladdad:

```bash
# Ska visa din Nobil API-nyckel
echo $Nobil__ApiKey

# Ska visa databasanslutningen
echo $ConnectionStrings__DefaultConnection
```

## Starta tjänsterna

Dev containern innehåller:
- **.NET 8 SDK** för backend
- **Node.js** för frontend
- **MariaDB** för databasen (startas separat via docker-compose)

### Option 1: Starta allt tillsammans

Använd VS Code-tasken:
1. Öppna Command Palette (`Ctrl+Shift+P`)
2. Kör: **"Tasks: Run Task"**
3. Välj **"Run All (with DB)"**

Detta startar:
- MariaDB-databasen
- Frontend (Angular) - http://localhost:4200
- Backend (.NET API) - http://localhost:5000

### Option 2: Starta tjänsterna separat

**I dev containern-terminalen:**

```bash
# Terminal 1: Backend
cd backend/ElbilHusvagnLadda.WebApi
dotnet run

# Terminal 2: Frontend
cd frontend
npm install  # Första gången endast
npm start

# Terminal 3: Database (från workspace root)
docker-compose -f docker-compose.db.yml up -d
```

## Åtkomst

- **Frontend:** http://localhost:4200
- **Backend/Swagger:** http://localhost:5000/swagger
- **MariaDB:** localhost:3306 (från inside container, eller 127.0.0.1:3306 från host)

## Troubleshooting

### Nobil API fungerar inte

**Symptom:** `echo $Nobil__ApiKey` visar ingenting

**Lösning:**
1. Kontrollera att `.env`-filen har värdet:
   ```bash
   cat .env | grep Nobil__ApiKey
   ```

2. Rebuild containern:
   - Öppna Command Palette
   - Kör: **"Dev Containers: Rebuild Container"**

3. Om det fortfarande inte fungerar, ta bort containern helt:
   ```bash
   docker rm -f elbil-husvagn-ladda-dev
   docker network rm dev-network || true
   ```
   Sedan öppna workspace igen.

### Databas anslutning misslyckas

**Symptom:** "Cannot connect to database" i backend-logs

**Lösning:**
1. Verifiera att MariaDB är igång:
   ```bash
   docker ps | grep mariadb
   ```

2. Om MariaDB inte körs, starta den:
   ```bash
   docker-compose -f docker-compose.db.yml up -d
   ```

3. Kontrollera connection string i `.env`:
   ```bash
   echo $ConnectionStrings__DefaultConnection
   ```
   Den ska vara: `Server=db;Port=3306;Database=ElbilHusvagnLadda;User=root;Password=dev_password_123;`

### Port redan i bruk

**Symptom:** "Address already in use"

**Lösning:**
```bash
# Hitta och döda process som använder porten (t.ex. 5000)
lsof -i :5000
kill -9 <PID>

# Eller byt port i devcontainer.json
```

### Bygget av dev container misslyckas

**Lösning:**
1. Kontrollera Docker Desktop är igång
2. Rensa Docker-cache:
   ```bash
   docker system prune -a
   ```
3. Rebuild:
   - Command Palette → **"Dev Containers: Rebuild Container"**

## Utveckling

### Struktur

```
/workspace/
├── backend/                    # .NET 8 Web API
│   └── ElbilHusvagnLadda.WebApi/
│       ├── Program.cs
│       ├── Controllers/
│       ├── Models/
│       ├── Services/
│       └── Data/
├── frontend/                   # Angular 21 App
│   ├── src/
│   │   ├── app/
│   │   └── main.ts
│   └── package.json
└── .devcontainer/              # Dev container config
    └── docker-compose.yml
```

### Database Migrations

.NET Entity Framework migrationer körs automatiskt vid startup. För att skapa nya migrations:

```bash
cd backend/ElbilHusvagnLadda.WebApi
dotnet ef migrations add NamPåMigration
dotnet ef database update
```

### Stänga ner

```bash
# Stäng dev container från VS Code
# Eller manuellt:
docker-compose -f .devcontainer/docker-compose.yml down
```

## Miljövariabler

Alla miljövariabler definieras i `.env`-filen. Dessa läses av Docker Compose och passeras till containern.

### Tillgängliga variabler

| Variabel | Syfte | Exempel |
|----------|-------|---------|
| `ConnectionStrings__DefaultConnection` | Databasanslutning | `Server=db;...` |
| `Nobil__ApiKey` | Nobil API-nyckel | `abc123xyz...` |

## Nästa steg

- Läs [README.md](./README.md) för allmän projektinfo
- Läs [SECURITY.md](./SECURITY.md) för säkerhetsprinciper
- Se [backend/README.md](./backend/README.md) för backend-specifika instruktioner
