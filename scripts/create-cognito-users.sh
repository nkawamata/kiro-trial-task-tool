#!/bin/bash

# Create Cognito Users Script
# Make sure to replace USER_POOL_ID with your actual User Pool ID

USER_POOL_ID="us-east-1_xxxxxxxxx"  # Replace with your User Pool ID

echo "Creating test users in Cognito User Pool: $USER_POOL_ID"

# Create John Doe
echo "Creating user: john@example.com"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username john@example.com \
  --user-attributes Name=email,Value=john@example.com Name=name,Value="John Doe" Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

# Create Jane Smith
echo "Creating user: jane@example.com"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username jane@example.com \
  --user-attributes Name=email,Value=jane@example.com Name=name,Value="Jane Smith" Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

# Create Bob Johnson
echo "Creating user: bob@example.com"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username bob@example.com \
  --user-attributes Name=email,Value=bob@example.com Name=name,Value="Bob Johnson" Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

echo "✅ Users created successfully!"
echo ""
echo "Test credentials:"
echo "Email: john@example.com"
echo "Temporary Password: TempPass123!"
echo ""
echo "Note: Users will be prompted to set a permanent password on first login."