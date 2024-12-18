const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");
const accounts = require("./accounts.js");
const fs = require("fs");
const selectedAccounts = 100;
const pointThreshold = 2750;

(async function automateAccounts() {
  // Đường dẫn thư mục lưu trữ profile Chrome
  const profileBasePath = path.resolve("./chrome_profiles");

  // Xóa thư mục profile cũ
  if (fs.existsSync(profileBasePath)) {
    fs.rmSync(profileBasePath, { recursive: true, force: true });
    console.log("Deleted old profiles.");
  }
  fs.mkdirSync(profileBasePath);
  console.log("Created a new empty profile directory.");

  const windowWidth = 250;
  const windowHeight = 400;
  let xOffset = 0;
  let yOffset = 0;
  const xStep = 50;
  const yStep = 200;

  // Lấy danh sách account đầu tiên và cập nhật file
  const selectedAccountsList = accounts.slice(0, selectedAccounts);
  const remainingAccounts = accounts.slice(selectedAccounts);
  fs.writeFileSync(
    "./account.js",
    `module.exports = ${JSON.stringify(remainingAccounts, null, 2)};`
  );

  for (const account of selectedAccountsList) {
    const { email, password } = account;

    const crxPath = path.resolve("./emcclcoaglgcpoognfiggmhnhgabppkm.crx");
    const profilePath = path.resolve(
      `${profileBasePath}/${email.replace(/[@.]/g, "_")}`
    );

    const options = new chrome.Options()
      .addArguments(`--user-data-dir=${profilePath}`)
      .addArguments("--no-first-run")
      .addExtensions(crxPath)
      .windowSize({ width: windowWidth, height: windowHeight });

    const driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    try {
      console.log(`Processing account: ${email}`);

      await driver.manage().window().setRect({
        x: xOffset,
        y: yOffset,
        width: windowWidth,
        height: windowHeight,
      });

      xOffset += xStep;
      if (xOffset + windowWidth > 1920) {
        xOffset = 0;
        yOffset += yStep;
      }

      const extensionUrl = "chrome-extension://emcclcoaglgcpoognfiggmhnhgabppkm/index.html";
      await driver.get(extensionUrl);
      console.log("Extension loaded!");

      const continueButton = await driver.wait(
        until.elementLocated(By.css("button.bg-blue-teneo.text-sm.font-semibold.text-white.mt-4.p-2")),
        5000
      );
      await continueButton.click();
      console.log("Clicked 'Continue' button!");

      const emailField = await driver.wait(
        until.elementLocated(By.css('input[type="email"]')),
        5000
      );
      await emailField.sendKeys(email);
      console.log("Entered email!");

      const passwordField = await driver.wait(
        until.elementLocated(By.css('input[type="password"]')),
        5000
      );
      await passwordField.sendKeys(password);
      console.log("Entered password!");

      const loginButton = await driver.wait(
        until.elementLocated(By.css("button.w-full.font-semibold.bg-blue-teneo.text-sm.text-white.p-2")),
        5000
      );
      await loginButton.click();
      console.log("Clicked 'Login' button!");

      const connectNodeButton = await driver.wait(
        until.elementLocated(By.css("button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50")),
        5000
      );
      await connectNodeButton.click();
      console.log("Clicked 'Connect Node' button!");

      // Check reconnect node
      setInterval(async () => {
        try {
          const connectNodeButton = await driver.findElement(
            By.css("button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50")
          );
          const buttonText = await connectNodeButton.getText();
          if (buttonText === "Connect Node") {
            await connectNodeButton.click();
            console.log(`Reconnected Node for account: ${email}`);
          }
        } catch (error) {
          console.log(`Error checking Connect Node for account: ${email}`, error);
        }
      }, 10000);

      // Check points and switch account
      setInterval(async () => {
        await checkPointsAndSwitch(driver, account);
      }, 10000);

    } catch (error) {
      console.error(`An error occurred for account ${email}:`, error);
    }
  }

  console.log("All accounts processed! Windows are left open.");
})();

async function checkPointsAndSwitch(driver, account) {
    try {
      const pointsElement = await driver.findElement(
        By.css("div.flex.p-1.text-sm.w-full.items-center.justify-between:last-of-type p")
      );
      const pointsText = await pointsElement.getText();
      const sanitizedPointsText = pointsText.trim().replace(/[^0-9]/g, "");
      const points = parseInt(sanitizedPointsText, 10);
  
      console.log(`Points for ${account.email}: ${points} (Threshold: ${pointThreshold})`);
  
      if (points >= pointThreshold) {
        // Đọc danh sách account hiện tại từ file
        delete require.cache[require.resolve('./account.js')];
        const currentAccounts = require('./account.js');
        if (currentAccounts.length === 0) {
          console.log(`No more accounts available in account.js!`);
          return;
        }
  
        // Lấy account đầu tiên và cập nhật file
        const nextAccount = currentAccounts[0];
        const remainingAccounts = currentAccounts.slice(1);
        fs.writeFileSync(
          './account.js',
          `module.exports = ${JSON.stringify(remainingAccounts, null, 2)};`
        );
  
        // Logout current account
        const menuButton = await driver.findElement(By.css("div.relative button"));
        await menuButton.click();
        
        const firstLogoutButton = await driver.findElement(By.xpath("//button[contains(text(), 'Logout')]"));
        await firstLogoutButton.click();
  
        // Handle confirm logout popup
        const confirmLogoutButton = await driver.wait(
          until.elementLocated(By.css("button.px-4.py-1\\.5.text-sm.focus\\:outline-none.text-white.bg-red-500")),
          5000
        );
        await confirmLogoutButton.click();
  
        // Wait for and click Continue button after logout
        const continueButton = await driver.wait(
          until.elementLocated(By.css("button.bg-blue-teneo.text-sm.font-semibold.text-white.mt-4.p-2")),
          5000
        );
        await continueButton.click();
  
        // Login with next account
        const emailField = await driver.wait(
          until.elementLocated(By.css('input[type="email"]')),
          5000
        );
        await emailField.sendKeys(nextAccount.email);
  
        const passwordField = await driver.wait(
          until.elementLocated(By.css('input[type="password"]')),
          5000
        );
        await passwordField.sendKeys(nextAccount.password);
  
        const loginButton = await driver.wait(
          until.elementLocated(By.css("button.w-full.font-semibold.bg-blue-teneo.text-sm.text-white.p-2")),
          5000
        );
        await loginButton.click();
  
        // Connect node for new account
        const connectNodeButton = await driver.wait(
          until.elementLocated(By.css("button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50")),
          5000
        );
        await connectNodeButton.click();
  
        console.log(`Switched to new account: ${nextAccount.email}`);
      }
    } catch (error) {
      console.error(`Error for ${account.email}:`, error.message);
    }
  }