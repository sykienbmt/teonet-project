const axios = require("axios");
const fs = require("fs");

// Base email and domain
const baseEmail = "bronze.hmt";
const domain = "@gmail.com";

const startIndex = 1;
const endIndex = 20;

// API details
const apiUrl = "https://ikknngrgxuxgjhplbpey.supabase.co/auth/v1/signup";
const apiKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";
const authToken =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";

// Default password for all accounts
const defaultPassword = "01263500";

// File to save the account data
const outputFile = "accounts.js";

// Function to register an account
const registerAccount = async (email) => {
    const requestBody = {
        email: email,
        password: defaultPassword,
        data: {
            invited_by: "znQ3b",
        },
        gotrue_meta_security: {},
        code_challenge: null,
        code_challenge_method: null,
    };

    try {
        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                accept: "*/*",
                "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
                apikey: apiKey,
                authorization: authToken,
                "content-type": "application/json;charset=UTF-8",
                "x-client-info": "supabase-js-web/2.45.4",
                "x-supabase-api-version": "2024-01-01",
            },
        });

        console.log(`Account registered successfully: ${email}`);
        return { email, password: defaultPassword };
    } catch (error) {
        console.error(`Failed to register ${email}:`, error.response?.data || error.message);
        return null; // Return null if registration fails
    }
};

// Main function to create 20 accounts and save to file
const main = async () => {
    const accounts = [];
    for (let i = startIndex; i <= endIndex; i++) {
        const email = `${baseEmail}+${i}${domain}`;
        console.log(`Registering account: ${email}`);
        const account = await registerAccount(email);
        if (account) {
            accounts.push(account); // Add successfully registered account to the list
        }
    }

    // Write account data to the file
    const fileContent = `module.exports = ${JSON.stringify(accounts, null, 2)};`;
    fs.writeFileSync(outputFile, fileContent, "utf8");
    console.log(`All accounts have been registered and saved to ${outputFile}`);
};

// Run the script
main();
