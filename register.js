const axios = require("axios");
const easyYopmail = require("easy-yopmail");
const fs = require("fs");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");

const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";
const authToken =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlra25uZ3JneHV4Z2pocGxicGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0MzgxNTAsImV4cCI6MjA0MTAxNDE1MH0.DRAvf8nH1ojnJBc3rD_Nw6t1AV8X_g6gmY_HByG2Mag";
const accountRun = 1;

class AccountManager {
  constructor() {
    this.quantity = accountRun;
    this.ref = "POsPr";
    this.apiUrl = "https://ikknngrgxuxgjhplbpey.supabase.co/auth/v1/signup";
    this.apiKey = apiKey;
    this.authToken = authToken;
    this.defaultPassword = "01263500";
    this.pointThreshold = 2500;
  }

  async generateEmails() {
    const emails = [];
    for (let i = 0; i < accountRun; i++) {
      try {
        const email = await easyYopmail.getMail();
        console.log(`[AccountManager] Generated email ${i + 1}: ${email}`);
        emails.push(email);
      } catch (error) {
        console.error(
          `[AccountManager] Error generating email ${i + 1}:`,
          error
        );
      }
    }
    return emails;
  }

  async registerAccount(email, index) {
    console.log(
      `\n[AccountManager] Starting registration for ${email} [${
        index + 1
      }/${accountRun}]`
    );
    const requestBody = {
      email,
      password: this.defaultPassword,
      data: { invited_by: this.ref },
      gotrue_meta_security: {},
      code_challenge: null,
      code_challenge_method: null,
    };

    try {
      await axios.post(this.apiUrl, requestBody, {
        headers: {
          accept: "*/*",
          "accept-language":
            "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
          apikey: this.apiKey,
          authorization: this.authToken,
          "content-type": "application/json;charset=UTF-8",
          "x-client-info": "supabase-js-web/2.45.4",
          "x-supabase-api-version": "2024-01-01",
        },
      });
      console.log(
        `[AccountManager] Successfully registered account for ${email} [${
          index + 1
        }/${accountRun}]`
      );
      return { email, password: this.defaultPassword };
    } catch (error) {
      console.error(
        `[AccountManager] Registration failed for ${email} [${
          index + 1
        }/${accountRun}]:`,
        error.response?.data || error.message
      );
      return null;
    }
  }

  async confirmSignUp(email, index) {
    console.log(
      `[AccountManager] Waiting for confirmation email for ${email} [${index + 1}/${accountRun}]`
    );
  
    const maxRetries = 60; // Maximum of 60 retries (e.g., 60 seconds)
    const delay = 1000; // 1 second delay between retries
    let retries = 0;
  
    while (retries < maxRetries) {
      try {
        const mailInbox = await easyYopmail.getInbox(email);
        console.log("🚀 ~ AccountManager ~ confirmSignUp ~ mailInbox:", email);
        console.log("🚀 ~ AccountManager ~ confirmSignUp ~ mailInbox:", mailInbox);
        
        if (mailInbox.inbox.length > 0) {
          console.log(
            `[AccountManager] Found confirmation email for ${email} [${index + 1}/${accountRun}]`
          );
          const messageId = mailInbox.inbox[0].id;
          const message = await easyYopmail.readMessage(email, messageId, {
            format: "HTML",
            selector: "a",
            attribute: "href",
          });
          if (message && message.content.length > 0) {
            await axios.get(message.content[0]);
            console.log(
              `[AccountManager] Successfully confirmed account for ${email} [${index + 1}/${accountRun}]`
            );
            return true;
          } else {
            console.log(
              `[AccountManager] No confirmation link found in email for ${email} [${index + 1}/${accountRun}]`
            );
            return false;
          }
        }
        console.log(
          `[AccountManager] No confirmation email yet for ${email} [${index + 1}/${accountRun}], waiting...`
        );
      } catch (error) {
        console.error(
          `[AccountManager] Confirmation error for ${email} [${index + 1}/${accountRun}]:`,
          error
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      retries++;
    }
  
    console.error(
      `[AccountManager] Timeout waiting for confirmation email for ${email} [${index + 1}/${accountRun}]`
    );
    return false;
  }
}

class BrowserAutomation {
  constructor() {
    this.windowWidth = 250;
    this.windowHeight = 400;
    this.xOffset = 0;
    this.yOffset = 0;
    this.xStep = 200;
    this.yStep = 200;
  }

  async setupDriver(email, index) {
    console.log(
      `[BrowserAutomation] Setting up driver for ${email} [${
        index + 1
      }/${accountRun}]`
    );
    const profileBasePath = path.resolve("./chrome_profiles");
    const profilePath = path.resolve(
      `${profileBasePath}/${email.replace(/[@.]/g, "_")}`
    );
    const crxPath = path.resolve("./emcclcoaglgcpoognfiggmhnhgabppkm.crx");

    if (!fs.existsSync(profileBasePath)) {
      fs.mkdirSync(profileBasePath);
      console.log("[BrowserAutomation] Created chrome_profiles directory.");
    }

    const options = new chrome.Options()
      .addArguments(`--user-data-dir=${profilePath}`)
      .addArguments("--no-first-run")
      .addExtensions(crxPath)
      .windowSize({ width: this.windowWidth, height: this.windowHeight });

    const driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
    await this.positionWindow(driver, index);
    console.log(
      `[BrowserAutomation] Driver setup completed for ${email} [${
        index + 1
      }/${accountRun}]`
    );
    return driver;
  }

  async positionWindow(driver, index) {
    await driver.manage().window().setRect({
      x: this.xOffset,
      y: this.yOffset,
      width: this.windowWidth,
      height: this.windowHeight,
    });

    console.log(
      `[BrowserAutomation] Positioned window at (${this.xOffset}, ${
        this.yOffset
      }) for account [${index + 1}]`
    );
    this.xOffset += this.xStep;
    if (this.xOffset + this.windowWidth > 1920) {
      this.xOffset = 0;
      this.yOffset += this.yStep;
      console.log(
        `[BrowserAutomation] Resetting xOffset and incrementing yOffset to ${this.yOffset}`
      );
    }
  }

  async loginAndConnect(driver, account, index) {
    const { email, password } = account;
    console.log(
      `\n[BrowserAutomation] Logging in with account: ${email} [${
        index + 1
      }/${accountRun}]`
    );

    try {
      await driver.get(
        "chrome-extension://emcclcoaglgcpoognfiggmhnhgabppkm/index.html"
      );
      console.log(
        `[BrowserAutomation] Loaded extension page for ${email} [${
          index + 1
        }/${accountRun}]`
      );

      const continueButton = await driver.wait(
        until.elementLocated(
          By.css(
            "button.bg-blue-teneo.text-sm.font-semibold.text-white.mt-4.p-2"
          )
        ),
        5000
      );
      await continueButton.click();
      console.log(
        `[BrowserAutomation] Clicked 'Continue' button for ${email} [${
          index + 1
        }/${accountRun}]`
      );

      const emailField = await driver.wait(
        until.elementLocated(By.css('input[type="email"]')),
        5000
      );
      await emailField.sendKeys(email);
      console.log(
        `[BrowserAutomation] Entered email for ${email} [${
          index + 1
        }/${accountRun}]`
      );

      const passwordField = await driver.wait(
        until.elementLocated(By.css('input[type="password"]')),
        5000
      );
      await passwordField.sendKeys(password);
      console.log(
        `[BrowserAutomation] Entered password for ${email} [${
          index + 1
        }/${accountRun}]`
      );

      const loginButton = await driver.wait(
        until.elementLocated(
          By.css(
            "button.w-full.font-semibold.bg-blue-teneo.text-sm.text-white.p-2"
          )
        ),
        5000
      );
      await loginButton.click();
      console.log(
        `[BrowserAutomation] Clicked 'Login' button for ${email} [${
          index + 1
        }/${accountRun}]`
      );

      const connectNodeButton = await driver.wait(
        until.elementLocated(
          By.css(
            "button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50"
          )
        ),
        5000
      );
      await connectNodeButton.click();
      console.log(
        `[BrowserAutomation] Clicked 'Connect Node' button for ${email} [${
          index + 1
        }/${accountRun}]`
      );
    } catch (error) {
      console.error(
        `[BrowserAutomation] Failed to login/connect for ${email} [${
          index + 1
        }/${accountRun}]:`,
        error
      );
      throw error;
    }
  }

  async checkPointsAndRotate(driver, accountManager, currentAccount, index) {
    try {
      // Sử dụng :last-of-type để chọn div cuối cùng
      const pointsElement = await driver.findElement(
        By.css(
          "div.flex.p-1.text-sm.w-full.items-center.justify-between:last-of-type p"
        )
      );
      const pointsText = await pointsElement.getText();
      // Làm sạch text trước khi chuyển đổi
      const sanitizedPointsText = pointsText.trim().replace(/[^0-9]/g, "");
      const points = parseInt(sanitizedPointsText, 10);
      console.log(
        `[BrowserAutomation] Current points for ${currentAccount.email} [${
          index + 1
        }/${accountManager.quantity}]: ${points}`
      );

      if (isNaN(points)) {
        console.error(
          `[BrowserAutomation] Failed to parse points for ${
            currentAccount.email
          } [${index + 1}/${
            accountManager.quantity
          }]. Points text: "${pointsText}"`
        );
        return;
      }

      if (points > accountManager.pointThreshold) {
        console.log(
          `[BrowserAutomation] Points threshold exceeded for ${
            currentAccount.email
          } [${index + 1}/${accountManager.quantity}]. Initiating rotation...`
        );

        // Quá trình quay vòng tài khoản
        // Click menu button
        const menuButton = await driver.findElement(
          By.css("div.relative button")
        );
        await menuButton.click();
        console.log(
          `[BrowserAutomation] Clicked menu button for ${
            currentAccount.email
          } [${index + 1}/${accountManager.quantity}]`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Click logout button
        const logoutButton = await driver.findElement(
          By.xpath("//button[contains(text(), 'Logout')]")
        );
        await logoutButton.click();
        console.log(
          `[BrowserAutomation] Clicked 'Logout' button for ${
            currentAccount.email
          } [${index + 1}/${accountManager.quantity}]`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Click 'Continue' button to go back to login screen
        const continueButton = await driver.wait(
          until.elementLocated(
            By.css(
              "button.bg-blue-teneo.text-sm.font-semibold.text-white.mt-4.p-2"
            )
          ),
          5000
        );
        await continueButton.click();
        console.log(
          `[BrowserAutomation] Clicked 'Continue' button to return to login for ${
            currentAccount.email
          } [${index + 1}/${accountManager.quantity}]`
        );

        // Register new account
        const newEmail = await accountManager.generateEmail();
        const newAccount = await accountManager.registerAccount(
          newEmail,
          index
        );
        if (
          newAccount &&
          (await accountManager.confirmSignUp(newEmail, index))
        ) {
          console.log(
            `[BrowserAutomation] Successfully registered and confirmed new account: ${newEmail} [${
              index + 1
            }/${accountManager.quantity}]`
          );
          await this.loginAndConnect(driver, newAccount, index);
          console.log(
            `[BrowserAutomation] Switched to new account: ${newEmail} [${
              index + 1
            }/${accountManager.quantity}]`
          );
        } else {
          console.error(
            `[BrowserAutomation] Failed to register or confirm new account: ${newEmail} [${
              index + 1
            }/${accountManager.quantity}]`
          );
        }
      }
    } catch (error) {
      console.error(
        `[BrowserAutomation] Error during points check or rotation for ${
          currentAccount.email
        } [${index + 1}/${accountManager.quantity}]:`,
        error
      );
    }
  }
}

async function main() {
  const accountManager = new AccountManager();
  const browserAutomation = new BrowserAutomation();

  // Xoá tất cả các profile trước đó
  const profileBasePath = path.resolve("./chrome_profiles");
  try {
    await fs.promises.rm(profileBasePath, { recursive: true, force: true });
    console.log("[Main] Deleted existing chrome_profiles directory.");
  } catch (error) {
    console.error("[Main] Error deleting chrome_profiles directory:", error);
  }

  try {
    // Generate multiple emails based on quantity
    console.log(`[Main] Generating ${accountManager.quantity} emails...`);
    const emails = await accountManager.generateEmails();

    // Register and confirm accounts
    const accounts = [];
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const account = await accountManager.registerAccount(email, i);
      if (account && (await accountManager.confirmSignUp(email, i))) {
        console.log(
          `[Main] Successfully created and confirmed account: ${
            account.email
          } [${i + 1}/${accountManager.quantity}]`
        );
        accounts.push({ ...account, index: i });
      } else {
        console.error(
          `[Main] Account creation or confirmation failed for ${email} [${
            i + 1
          }/${accountManager.quantity}]`
        );
      }
    }

    // Setup drivers and login
    const drivers = [];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const driver = await browserAutomation.setupDriver(account.email, i);
      await browserAutomation.loginAndConnect(driver, account, i);
      console.log(
        `[Main] Logged in and connected node for account: ${account.email} [${
          i + 1
        }/${accountManager.quantity}]`
      );
      drivers.push(driver);
    }

    // Start monitoring points and rotating accounts for each driver
    for (let i = 0; i < drivers.length; i++) {
      const driver = drivers[i];
      const account = accounts[i];
      setInterval(async () => {
        await browserAutomation.checkPointsAndRotate(
          driver,
          accountManager,
          account,
          i
        );
      }, 10000);
      console.log(
        `[Main] Started monitoring points for account: ${account.email} [${
          i + 1
        }/${accountManager.quantity}]`
      );

      // Kiểm tra trạng thái nút "Connect Node"
      setInterval(async () => {
        try {
          const connectNodeButton = await driver.findElement(
            By.css(
              "button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50"
            )
          );

          const buttonText = await connectNodeButton.getText();

          if (buttonText === "Connect Node") {
            await connectNodeButton.click();
            console.log(`Reconnected Node for account: ${account.email}`);
          } else {
            console.log(
              `Node is already connected for account: ${account.email}`
            );
          }
        } catch (error) {
          console.log(
            `Error checking Connect Node for account: ${account.email}`,
            error
          );
        }
      }, 10000); // Kiểm tra sau mỗi 10 giây
    }
  } catch (error) {
    console.error("[Main] An unexpected error occurred:", error);
  }
}

main().catch(console.error);

