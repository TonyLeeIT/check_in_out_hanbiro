require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const PORT = process.env.PORT;
const app = express();
const cron = require("node-cron");
const cors = require("cors");

const https = require("https");
const axios = require("axios");
const chromium = require("chrome-aws-lambda");
app.use(cors());

const { exec } = require("child_process");

const sendMsgToTelegram = async (msg) => {
  const url =
    process.env.BASE_URL +
    process.env.TOKEN +
    `/sendmessage?chat_id=${process.env.CHAT_ID.toString()}&text=${msg.toString()}`;
  let uri = url.toString();
  // return await https.get(uri, (res) => {
  //   let data = [];
  //   const headerDate =
  //     res.headers && res.headers.date ? res.headers.date : "no response date";
  //   console.log("Status Code:", res.statusCode);
  //   console.log("Date in Response header:", headerDate);
  //   console.log("res :", res);
  //   res.on("data", (chunk) => {
  //     data.push(chunk);
  //     console.log("data ", data);
  //   });
  // });
  return await axios.get(uri);
};

const sendMsgTelegramByShellScrip = (msg) => {
  exec(`bash  ./app.sh "${msg}"`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

const checkInOut = async () => {
  const timeElapsed = Date.now();
  const today = new Date(timeElapsed);
  let IN_OR_OUT = "";
  const currentHours = today.getHours();
  if (currentHours == 9) {
    IN_OR_OUT = "in";
  } else if (currentHours == 18) {
    IN_OR_OUT = "out";
  }

  console.log("calling to my bot telegram ...............");
  console.log("bot said :");

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: await chromium.executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    await page.goto(process.env.URL);
    await delay(page);
    await page.waitForSelector("#log-userid");
    await page.focus("#log-userid");
    await page.type("#log-userid", process.env.USERID);

    // await autoScroll(page);
    await delay(page);

    const frameHandle = await page.$("iframe[id='iframeLoginPassword']");
    const frame = await frameHandle.contentFrame();
    await frame.type("input", process.env.PASS);

    await page.waitForSelector("#btn-log");
    await page.click("#btn-log");
    await page.waitForSelector("#user-toggler");
    await page.click("#user-toggler");
    await delay(page);
    await page.waitForSelector(
      ".btn.btn-danger.btn-round.no-border.width-100.btn-sm"
    );
    await page.click(".btn.btn-danger.btn-round.no-border.width-100.btn-sm");
    await delay(page);
    await browser.close();

    const msg = today.toUTCString().concat(`\t check ${IN_OR_OUT} sucess`);
    sendMsgTelegramByShellScrip(msg.toString());
    console.log(`check ${IN_OR_OUT} sucess`);
  } catch (error) {
    const msg = today.toUTCString().concat(`\t check ${IN_OR_OUT} fail`);
    sendMsgTelegramByShellScrip(msg);
    console.log(`check ${IN_OR_OUT} fail`);
    console.error(error);
  }
};

const delay = async (page) => {
  await page.evaluate(async (time) => {
    await new Promise(function (resolve) {
      setTimeout(resolve, 4000);
    });
  });
};

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

app.listen(PORT, () => {
  cron.schedule("0 0 9,18 * * 1-5", async () => {
    console.log("Scheduler running ............");
    await checkInOut();
    console.log(".......................end job");
  });
  console.log("server is running with port : " + PORT);
  // checkInOut();
});
