#!/bin/bash

# This script replaces placeholders in HTML files with actual API keys 
# from environment variables during the build process.

# Target files
FILES=("netlify-deploy/index.html")

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "Injecting keys into $FILE..."
    # Using | as delimiter to handle URLs in webhook values
    sed -i "s|___FIREBASE_API_KEY___|${FIREBASE_API_KEY}|g" "$FILE"
    sed -i "s|___FIREBASE_AUTH_DOMAIN___|${FIREBASE_AUTH_DOMAIN}|g" "$FILE"
    sed -i "s|___FIREBASE_PROJECT_ID___|${FIREBASE_PROJECT_ID}|g" "$FILE"
    sed -i "s|___FIREBASE_STORAGE_BUCKET___|${FIREBASE_STORAGE_BUCKET}|g" "$FILE"
    sed -i "s|___FIREBASE_MESSAGING_SENDER_ID___|${FIREBASE_MESSAGING_SENDER_ID}|g" "$FILE"
    sed -i "s|___FIREBASE_APP_ID___|${FIREBASE_APP_ID}|g" "$FILE"
    sed -i "s|___FIREBASE_MEASUREMENT_ID___|${FIREBASE_MEASUREMENT_ID}|g" "$FILE"
    sed -i "s|___EMAILJS_PUBLIC_KEY___|${EMAILJS_PUBLIC_KEY}|g" "$FILE"
    sed -i "s|___N8N_CHAT_WEBHOOK_URL___|${N8N_CHAT_WEBHOOK_URL}|g" "$FILE"
  else
    echo "Warning: $FILE not found, skipping."
  fi
done

echo "Key injection complete."
