# Location Sharing API

AWS SAM backend for the Location Sharing App — a real-time location sharing system similar to "Find My Friends".

## Architecture

- **Runtime:** Node.js 24 (Lambda, ARM64)
- **Language:** TypeScript
- **API:** API Gateway HTTP API with JWT authorizer
- **Auth:** Cognito User Pool (email/password + Google login)
- **IaC:** AWS SAM

## Project Structure

```
api/
├── src/
│   └── handlers/
│       └── health.ts          # GET /health Lambda handler
├── dist/                      # Compiled JavaScript (generated)
├── template.yaml              # SAM template
├── samconfig.toml             # SAM deployment config
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Node.js 24+](https://nodejs.org/)
- A Google Cloud project with OAuth 2.0 credentials

---

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials → OAuth client ID**
3. Select **Web application** as the application type
4. Set the **Authorized redirect URI** to:

   ```
   https://location-sharing-<env>-<aws-account-id>.auth.<region>.amazoncognito.com/oauth2/idpresponse
   ```

   Replace `<env>` with your environment name (e.g., `dev`), `<aws-account-id>` with your AWS account ID, and `<region>` with your AWS region.

5. Save and note the **Client ID** and **Client Secret**

### 2. Configure OAuth Consent Screen

1. Go to [Google Cloud Console → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select **External** user type
3. Fill in:
   - **App name:** Location Sharing App
   - **User support email:** your email
   - **Developer contact email:** your email
4. Add scopes: `openid`, `email`, `profile`
5. Add test users if in testing mode

### 3. How It Connects to Cognito

The SAM template automatically:
- Creates a Google Identity Provider in Cognito with your Client ID and Secret
- Maps Google `email` and `name` attributes to Cognito attributes
- Configures the User Pool Client to support Google as an identity provider
- Sets up the Hosted UI domain for the OAuth redirect

---

## Build & Deploy

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile TypeScript

```bash
npm run build
```

### 3. Build SAM Application

```bash
sam build
```

### 4. Deploy (Guided — First Time)

```bash
sam deploy --guided
```

You will be prompted for:

| Parameter           | Description                              | Example                                          |
|---------------------|------------------------------------------|--------------------------------------------------|
| `GoogleClientId`    | Google OAuth Client ID                   | `1234567890-abc.apps.googleusercontent.com`       |
| `GoogleClientSecret`| Google OAuth Client Secret               | *(entered securely, not echoed)*                  |
| `CallbackURL`       | Mobile app OAuth callback                | `myapp://auth/callback`                           |
| `LogoutURL`         | Mobile app logout redirect               | `myapp://auth/logout`                             |
| `EnvironmentName`   | Deployment environment                   | `dev`                                             |

### 5. Deploy (Subsequent Deploys)

```bash
sam deploy --config-env dev
```

---

## Local Development

### Start Local API

> **Note:** JWT authorization is not enforced when running locally with `sam local`.

```bash
# Compile TypeScript
npm run build

# Build SAM
sam build

# Start local API
sam local start-api
```

The API will be available at `http://127.0.0.1:3000`.

### Test the Health Endpoint

```bash
curl http://127.0.0.1:3000/health
```

---

## API Endpoints

| Method | Path      | Description                  | Auth Required |
|--------|-----------|------------------------------|---------------|
| GET    | `/health` | Health check / auth verify   | Yes (JWT)     |

### Example Response (Authenticated)

```json
{
  "message": "Authorized",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Example Response (Unauthorized / Missing sub)

```json
{
  "message": "Unauthorized: missing sub claim"
}
```

---

## Stack Outputs

After deployment, the following outputs are available:

| Output              | Description                          |
|---------------------|--------------------------------------|
| `UserPoolId`        | Cognito User Pool ID                 |
| `UserPoolClientId`  | Cognito User Pool Client ID          |
| `CognitoDomain`     | Cognito Hosted UI URL                |
| `JwksIssuerUrl`     | JWKS Issuer URL for JWT validation   |
| `HttpApiEndpoint`   | API Gateway HTTP API endpoint URL    |

Retrieve outputs after deploy:

```bash
aws cloudformation describe-stacks \
  --stack-name location-sharing-app-dev \
  --query "Stacks[0].Outputs" \
  --output table
```

---

## Environment Strategy

The project supports multiple isolated environments via the `EnvironmentName` parameter:

- **dev** — Development and testing
- **staging** — Pre-production validation
- **prod** — Production

Each environment gets its own Cognito User Pool, API Gateway, and Lambda functions, named with the environment prefix.
