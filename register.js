const axios = require("axios");
const easyYopmail = require("easy-yopmail");
const fs = require("fs");

// Base email and domain
const quantity = 1;

const ref = "znQ3b";

// API details
const apiUrl = "https://ikknngrgxuxgjhplbpey.supabase.co/auth/v1/signup";
const apiKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";
const authToken =
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";

// Default password for all accounts
const defaultPassword = "01263500";

const outputFile = "accounts.js";

// Function to register an account
const registerAccount = async (email) => {
    const requestBody = {
        email: email,
        password: defaultPassword,
        data: {
            invited_by: ref,
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

        return { email, password: defaultPassword };
    } catch (error) {
        console.error(`Failed to register ${email}:`, error.response?.data || error.message);
        return null; // Return null if registration fails
    }
};
async function generateMultipleTempEmails() {
    const emails = [];
    try {
        for (let i = 0; i < quantity; i++) {
            const email = await easyYopmail.getMail();
            emails.push(email);
            console.log(`Email ${i + 1}:`, email);
        }
        return emails;
    } catch (error) {
        throw error;
    }
}

async function confirmSignUp(email) {
    try {
        // Đọc inbox của email
        const inbox = await easyYopmail.getInbox(email);
        if (inbox.length === 0) {
            console.log(`Hộp thư của ${email} trống.`);
            return false;
        }
        console.log(inbox.inbox[0].id);

        // Lấy nội dung của email đầu tiên
        const messageId = inbox.inbox[0].id; // Lấy ID của tin nhắn đầu tiên
        const message = await easyYopmail.readMessage(email, messageId, { format: 'HTML', selector: 'a', attribute: 'href' }); // Lấy nội dung HTML

        if (!message) {
            console.log('Không tìm thấy link trong button.');
            return false;
        }

        await axios.get(message.content[0]);
        return true
    } catch (error) {
        console.error('Lỗi khi nhấn vào button trong email:', error);
        return false
    }
}
// Main function to create 20 accounts and save to file
const main = async () => {
    const emails = await generateMultipleTempEmails(1);
    const accounts = [];
    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const account = await registerAccount(email);
        if (account) {
            const result = await confirmSignUp(email);
            if (result) {
                accounts.push(account); // Add successfully registered account to the list
            } else {
                console.log(`Failed to confirm sign up for ${email}`);
            }
        }
    }

    // Write account data to the file
    const fileContent = `module.exports = ${JSON.stringify(accounts, null, 2)};`;
    fs.writeFileSync(outputFile, fileContent, "utf8");
    console.log(`All accounts have been registered and saved to ${outputFile}`);
};

// Run the script
main()
