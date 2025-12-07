# E-postkonfiguration för Feedback-svar

## Översikt
När en admin svarar på feedback och användaren har angett en e-postadress, skickas svaret automatiskt via e-post.

## Konfiguration

### 1. Uppdatera appsettings.json
Lägg till dina SMTP-inställningar i `appsettings.json` eller `appsettings.Production.json`:

```json
{
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "din-email@gmail.com",
    "SmtpPassword": "ditt-app-lösenord",
    "FromEmail": "din-email@gmail.com",
    "FromName": "Elbil. Husvagn. Ladda.",
    "EnableSsl": true
  }
}
```

### 2. SMTP-leverantörer

#### Gmail
- **SMTP Server**: `smtp.gmail.com`
- **Port**: 587
- **SSL**: true
- **Krav**: Du måste skapa ett "App Password" i ditt Google-konto
  - Gå till: https://myaccount.google.com/apppasswords
  - Skapa ett nytt app-lösenord för "Mail"
  - Använd det genererade lösenordet i `SmtpPassword`

#### SendGrid
- **SMTP Server**: `smtp.sendgrid.net`
- **Port**: 587
- **Username**: `apikey`
- **Password**: Din SendGrid API-nyckel

#### Outlook/Hotmail
- **SMTP Server**: `smtp-mail.outlook.com`
- **Port**: 587
- **SSL**: true

#### Lokal utveckling (MailHog)
För lokal testning kan du använda MailHog:
```bash
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```
Konfiguration:
```json
{
  "EmailSettings": {
    "SmtpServer": "localhost",
    "SmtpPort": 1025,
    "SmtpUsername": "",
    "SmtpPassword": "",
    "FromEmail": "noreply@localhost",
    "FromName": "Elbil. Husvagn. Ladda.",
    "EnableSsl": false
  }
}
```
Öppna http://localhost:8025 för att se skickade e-postmeddelanden.

### 3. Miljövariabler (Produktion)
För produktion, använd miljövariabler istället för att lagra känslig information i appsettings.json:

```bash
export EmailSettings__SmtpServer="smtp.gmail.com"
export EmailSettings__SmtpPort="587"
export EmailSettings__SmtpUsername="din-email@gmail.com"
export EmailSettings__SmtpPassword="ditt-app-lösenord"
export EmailSettings__FromEmail="din-email@gmail.com"
export EmailSettings__FromName="Elbil. Husvagn. Ladda."
export EmailSettings__EnableSsl="true"
```

## Funktionalitet

### Automatisk e-postutskick
När en admin svarar på feedback:
1. Systemet kontrollerar om användaren har angett en e-postadress
2. Om e-post finns, skickas ett formaterat HTML-e-postmeddelande
3. E-postmeddelandet innehåller:
   - Användarens ursprungliga feedback-titel
   - Admin-svaret
   - Professionell HTML-formatering med applikationens branding

### Felhantering
- Om e-postkonfigurationen saknas eller är felaktig, loggas en varning men API-anropet misslyckas inte
- E-postfel påverkar inte själva feedback-svaret som sparas i databasen
- Alla e-postfel loggas för felsökning

## Testning

### Testa e-postfunktionalitet
1. Konfigurera SMTP-inställningar (använd MailHog för lokal testning)
2. Skapa en feedback med en giltig e-postadress
3. Logga in som admin
4. Svara på feedbacken
5. Kontrollera att e-postmeddelandet skickades (kolla MailHog eller din inkorg)

### Loggar
Kontrollera loggarna för e-poststatus:
- `Email notification sent to {Email} for feedback {Id}` - Lyckad utskick
- `Email settings not configured. Skipping email send.` - Konfiguration saknas
- `Failed to send feedback response email to {Email}` - Fel vid utskick

## Säkerhet

⚠️ **Viktigt:**
- Lagra ALDRIG SMTP-lösenord i versionskontroll
- Använd miljövariabler eller Azure Key Vault för produktion
- Använd app-specifika lösenord för Gmail
- Överväg att använda en dedikerad e-posttjänst som SendGrid för produktion
