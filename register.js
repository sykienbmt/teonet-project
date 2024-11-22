const axios = require("axios");
const easyYopmail = require("easy-yopmail");
const fs = require("fs");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");
const accounts = require("./accounts.js");

// Base email and domain
const quantity = 1;

const ref = "POsPr";

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
  const profileBasePath = path.resolve("./chrome_profiles");

  // Xóa thư mục profile cũ
  if (fs.existsSync(profileBasePath)) {
    fs.rmSync(profileBasePath, { recursive: true, force: true }); // Xóa toàn bộ thư mục
    console.log("Deleted old profiles.");
  }
  fs.mkdirSync(profileBasePath); // Tạo lại thư mục trống
  console.log("Created a new empty profile directory.");

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
        "accept-language":
          "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
        apikey: apiKey,
        authorization: authToken,
        "content-type": "application/json;charset=UTF-8",
        "x-client-info": "supabase-js-web/2.45.4",
        "x-supabase-api-version": "2024-01-01",
      },
    });

    return { email, password: defaultPassword };
  } catch (error) {
    console.error(
      `Failed to register ${email}:`,
      error.response?.data || error.message
    );
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

const functionWait5Seconds = async () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('resolved');
        }, 2000);
    });
}

async function confirmSignUp(email) {
  try {
    //wait 10 seconds
    await functionWait5Seconds()
    // Đọc inbox của email
    const inbox = await easyYopmail.getInbox(email);
    if (inbox.length === 0) {
      console.log(`Hộp thư của ${email} trống.`);
      return false;
    }
    console.log(inbox.inbox[0].id);

    // Lấy nội dung của email đầu tiên
    const messageId = inbox.inbox[0].id; // Lấy ID của tin nhắn đầu tiên
    const message = await easyYopmail.readMessage(email, messageId, {
      format: "HTML",
      selector: "a",
      attribute: "href",
    }); // Lấy nội dung HTML

    if (!message) {
      console.log("Không tìm thấy link trong button.");
      return false;
    }

    await axios.get(message.content[0]);
    return true;
  } catch (error) {
    console.error("Lỗi khi nhấn vào button trong email:", error);
    return false;
  }
}

const automateAccounts = async (account) => {
    // Đường dẫn thư mục lưu trữ profile Chrome
    console.log(account);
    const profileBasePath = path.resolve("./chrome_profiles");
  
    const windowWidth = 250; // Đặt chiều rộng cửa sổ nhỏ hơn
    const windowHeight = 400; // Đặt chiều cao cửa sổ nhỏ hơn
    let xOffset = 0; // Vị trí ngang ban đầu
    let yOffset = 0; // Vị trí dọc ban đầu
    const xStep = 200; // Khoảng cách ngang giữa các cửa sổ
    const yStep = 200; // Khoảng cách dọc giữa các cửa sổ
  
  
      // Chỉ xử lý 20 tài khoản
      const { email, password } = account;
  
      // Đường dẫn tới file .crx của extension đã tải về
      const crxPath = path.resolve("./emcclcoaglgcpoognfiggmhnhgabppkm.crx"); // Thay bằng đường dẫn file .crx
  
      // Tạo profile Chrome mới (mỗi tài khoản có 1 profile riêng)
      const profilePath = path.resolve(
        `${profileBasePath}/${email.replace(/[@.]/g, "_")}`
      );
  
      // Cấu hình trình duyệt Chrome
      const options = new chrome.Options()
        .addArguments(`--user-data-dir=${profilePath}`) // Tạo profile mới
        .addArguments("--no-first-run") // Bỏ qua thiết lập ban đầu
        .addExtensions(crxPath) // Thêm extension từ file .crx
        .windowSize({ width: windowWidth, height: windowHeight }); // Đặt kích thước cửa sổ
  
      // Khởi tạo trình điều khiển Chrome
      const driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();
  
      // Đặt vị trí cửa sổ
      try {
        console.log(`Processing account: ${email}`);
  
        // Đặt vị trí cửa sổ trình duyệt
        await driver.manage().window().setRect({
          x: xOffset,
          y: yOffset,
          width: windowWidth,
          height: windowHeight,
        });
  
        // Tính toán vị trí cửa sổ tiếp theo
        xOffset += xStep;
        if (xOffset + windowWidth > 1920) {
          // Nếu vượt qua chiều ngang màn hình, chuyển xuống hàng mới
          xOffset = 0;
          yOffset += yStep;
        }
  
        // Mở extension qua URL
        const extensionUrl =
          "chrome-extension://emcclcoaglgcpoognfiggmhnhgabppkm/index.html";
        await driver.get(extensionUrl);
  
        console.log("Extension loaded!");
  
        // 1. Nhấn nút "Continue"
        const continueButton = await driver.wait(
          until.elementLocated(
            By.css(
              "button.bg-blue-teneo.text-sm.font-semibold.text-white.mt-4.p-2"
            )
          ),
          5000
        );
        await continueButton.click();
        console.log("Clicked 'Continue' button!");
  
        // 2. Nhập email
        const emailField = await driver.wait(
          until.elementLocated(By.css('input[type="email"]')),
          5000
        );
        await emailField.sendKeys(email);
        console.log("Entered email!");
  
        // 3. Nhập password
        const passwordField = await driver.wait(
          until.elementLocated(By.css('input[type="password"]')),
          5000
        );
        await passwordField.sendKeys(password);
        console.log("Entered password!");
  
        // 4. Nhấn nút "Login"
        const loginButton = await driver.wait(
          until.elementLocated(
            By.css(
              "button.w-full.font-semibold.bg-blue-teneo.text-sm.text-white.p-2"
            )
          ),
          5000
        );
        await loginButton.click();
        console.log("Clicked 'Login' button!");
  
        // 5. Nhấn nút "Connect Node" sau khi đăng nhập
        const connectNodeButton = await driver.wait(
          until.elementLocated(
            By.css(
              "button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50"
            )
          ),
          5000
        );
        await connectNodeButton.click();
        console.log("Clicked 'Connect Node' button!");
  
        // 6. Kiểm tra trạng thái nút "Connect Node"
        setInterval(async () => {
          try {
            // Kiểm tra sự tồn tại của nút Connect Node
            const connectNodeButton = await driver.findElement(
              By.css(
                "button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50"
              )
            );
  
            // Lấy nội dung text của nút
            const buttonText = await connectNodeButton.getText();
            // console.log(`Button text for account ${email}: ${buttonText}`);
  
            if (buttonText === "Connect Node") {
              await connectNodeButton.click();
              console.log(`Reconnected Node for account: ${email}`);
            } else {
              console.log(`Node is already connected for account: ${email}`);
            }
          } catch (error) {
            console.log(
              `Error checking Connect Node for account: ${email}`,
              error
            );
          }
        }, 10000); // Kiểm tra sau mỗi 10 giây
      } catch (error) {
        console.error(`An error occurred for account ${email}:`, error);
      }
    
  
    console.log("All accounts processed! Windows are left open.");
  }
// Main function to create 20 accounts and save to file
const main = async () => {
  const emails = await generateMultipleTempEmails(1);
  console.log(emails);
  const accounts = [];
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const account = await registerAccount(email);
    console.log(account)
    if (account) {
      const result = await confirmSignUp(email);
      if (result) {
        // accounts.push(account); // Add successfully registered account to the list
        automateAccounts(account);
      } else {
        console.log(`Failed to confirm sign up for ${email}`);
      }
    }
  }

  // Write account data to the file
//   const fileContent = `module.exports = ${JSON.stringify(accounts, null, 2)};`;
//   fs.writeFileSync(outputFile, fileContent, "utf8");
//   console.log(`All accounts have been registered and saved to ${outputFile}`);

//   automateAccounts();
};



// Run the script
main();
