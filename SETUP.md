# Environment Setup Guide

## Backend Setup

### Prerequisites
- .NET 8.0 SDK
- SQL Server (or use localdb)

### Steps

1. **Copy environment file:**
   ```bash
   cp Backend/.env.example Backend/.env
   cp Backend/appsettings.example.json Backend/appsettings.json
   ```

2. **Configure the values:**

   **Backend/.env:**
   - `JWT_KEY`: Generate a strong random string (min 32 chars)
   - `APP_PEPPER`: Generate a strong random string for password hashing
   
   **Backend/appsettings.json:**
   - `ConnectionStrings.DefaultConnection`: Your SQL Server connection string
   - `EmailSettings`: Your Gmail SMTP credentials (use app password, not regular password)
   - `Gemini.ApiKey`: Get from https://aistudio.google.com/app/apikey
   - `Payment.PayPal.*`: Get credentials from https://developer.paypal.com/
   - `Payment.VietQR.*`: Configure if using VietQR payment

3. **Run migrations:**
   ```bash
   cd Backend
   dotnet ef database update
   ```

4. **Start the server:**
   ```bash
   dotnet run
   ```

## Frontend Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser

### Steps

1. **Copy environment file:**
   ```bash
   cp Frontend/.env.example Frontend/.env
   ```

2. **Configure API URLs:**
   - `VITE_API_BASE_URL_DEV`: Your local backend API (e.g., http://localhost:5000/core/api)
   - `VITE_API_BASE_URL_PROD`: Your production backend API

3. **Install dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Security Checklist

- [ ] Never commit `.env` or `appsettings.json` files
- [ ] All sensitive keys should be stored in environment variables (production)
- [ ] Use app-specific passwords for Gmail (not your main password)
- [ ] Regenerate all API keys and tokens if they were ever exposed
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Use environment-specific configuration for staging and production

## Generating Secure Keys

### JWT Secret (Node.js):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### JWT Secret (PowerShell):
```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### JWT Secret (.NET):
```csharp
Convert.ToBase64String(new byte[32].Select(x => (byte)new Random().Next(256)).ToArray())
```

## Support

For issues or questions, please check the project README or contact the development team.
