const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");
const accounts = require("./accounts.js"); // Import danh sách tài khoản
const fs = require("fs");

(async function automateAccounts() {
  // Đường dẫn thư mục lưu trữ profile Chrome
  const profileBasePath = path.resolve("./chrome_profiles");

  // Xóa thư mục profile cũ
  if (fs.existsSync(profileBasePath)) {
    fs.rmSync(profileBasePath, { recursive: true, force: true }); // Xóa toàn bộ thư mục
    console.log("Deleted old profiles.");
  }
  fs.mkdirSync(profileBasePath); // Tạo lại thư mục trống
  console.log("Created a new empty profile directory.");

  const windowWidth = 250; // Đặt chiều rộng cửa sổ nhỏ hơn
  const windowHeight = 400; // Đặt chiều cao cửa sổ nhỏ hơn
  let xOffset = 0; // Vị trí ngang ban đầu
  let yOffset = 0; // Vị trí dọc ban đầu
  const xStep = 200; // Khoảng cách ngang giữa các cửa sổ
  const yStep = 200; // Khoảng cách dọc giữa các cửa sổ

  for (const account of accounts.slice(0, 20)) {
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
            By.css('button.bg-blue-teneo.text-sm.mt-2.text-white.p-2.disabled\\:opacity-50')
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
          console.log(`Error checking Connect Node for account: ${email}`, error);
        }
      }, 10000); // Kiểm tra sau mỗi 10 giây
    } catch (error) {
      console.error(`An error occurred for account ${email}:`, error);
    }
  }

  console.log("All accounts processed! Windows are left open.");
})();
