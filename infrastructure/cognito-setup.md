# AWS Cognito Configuration Guide

## Step 1: Create User Pool

1. Go to AWS Console → Amazon Cognito
2. Click "Create user pool"
3. Configure as follows:

### Authentication Providers
- ✅ Cognito user pool
- Sign-in options: ✅ Email

### Security Requirements
- Password policy: Cognito defaults
- MFA: No MFA (development)
- Account recovery: ✅ Enable self-service

### Sign-up Experience
- ✅ Enable self-registration
- ✅ Send email verification
- Required attributes: email, name

### Message Delivery
- Use Cognito email (development)

### App Integration
- User pool name: `TaskManagerUserPool`
- App client name: `TaskManagerWebClient`
- Client secret: ❌ Don't generate

## Step 2: Get Configuration Values

After creating the user pool, collect these values:

### From User Pool Overview:
- **User Pool ID**: `us-east-1_xxxxxxxxx`
- **AWS Region**: `us-east-1` (or your chosen region)

### From App Integration Tab:
- **Client ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Update Environment Variables

Update your `.env` files with the actual values:

### Backend (.env)
```bash
# AWS Cognito
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Frontend (.env)
```bash
REACT_APP_AWS_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Create Test Users

### Option A: AWS Console
1. Go to your User Pool → Users tab
2. Click "Create user"
3. Fill in details:
   - Username: john@example.com
   - Email: john@example.com
   - Name: John Doe
   - Temporary password: TempPass123!
   - ❌ Uncheck "Mark phone number as verified"
   - ✅ Check "Mark email as verified"

### Option B: AWS CLI
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username john@example.com \
  --user-attributes Name=email,Value=john@example.com Name=name,Value="John Doe" Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS
```

## Step 5: Test Authentication

1. Start your application: `npm run dev`
2. Go to http://localhost:3000
3. Try signing in with:
   - Email: john@example.com
   - Password: TempPass123!
4. You'll be prompted to set a permanent password

## Troubleshooting

### Common Issues:
1. **Invalid credentials**: Check User Pool ID and Client ID
2. **User not found**: Ensure user is created and email is verified
3. **CORS errors**: Check that your app domain is configured in Cognito
4. **Password policy**: Ensure password meets requirements (8+ chars, uppercase, lowercase, number, special char)

### Useful AWS CLI Commands:
```bash
# List user pools
aws cognito-idp list-user-pools --max-results 10

# List users in pool
aws cognito-idp list-users --user-pool-id us-east-1_xxxxxxxxx

# Get user details
aws cognito-idp admin-get-user --user-pool-id us-east-1_xxxxxxxxx --username john@example.com
```