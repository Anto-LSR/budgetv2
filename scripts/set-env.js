const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const targetPath = path.join(__dirname, '../src/environments/environment.ts');

const envConfigFile = `export const environment = {
  production: false,
  firebase: {
    apiKey: "${process.env.FIREBASE_API_KEY || ''}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${process.env.FIREBASE_APP_ID || ''}",
    measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || ''}"
  }
};
`;

console.log('Generating environment file...');

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.error('Error while generating environment file:', err);
  } else {
    console.log(`Environment file generated at ${targetPath}`);
  }
});
