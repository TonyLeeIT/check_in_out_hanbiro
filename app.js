require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");
const PORT = process.env.PORT;
const app = express();
const cron = require("node-cron");

const https = require("https");
const axios = require("axios");
const chromium = require("chrome-aws-lambda");

const sendMsgToTelegram = async (msg) => {
  const url =
    process.env.BASE_URL +
    process.env.TOKEN +
    `/sendmessage?chat_id=${process.env.CHAT_ID.toString()}&text=${msg.toString()}`;
  const uri = url.toString();
  return await https.get(uri);
  // return await axios.get(uri);
};

const checkInOut = async () => {
  const timeElapsed = Date.now();
  const today = new Date(timeElapsed);
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

    await autoScroll(page);
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
    //await page.click(".btn.btn-danger.btn-round.no-border.width-100.btn-sm");
    await browser.close();
    console.log("calling to my bot telegram ...............");
    console.log("bot said :");
    const msg = today.toUTCString().concat("\tcheck in-out sucess");
    await sendMsgToTelegram(msg)
      .then(() => console.log("check in-out sucess"))
      .catch((error) => console.log("send message to telegram false :", error));
  } catch (error) {
    const msg = today.toUTCString().concat("\tcheck in-out fail");
    await sendMsgToTelegram(msg)
      .then(() => console.log("check in-out fail"))
      .catch((error) => console.log("send message to telegram false :", error));
  }
};

const delay = async (page) => {
  await page.evaluate(async (time) => {
    await new Promise(function (resolve) {
      setTimeout(resolve, 3000);
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
  cron.schedule("0 0 15,18 * * 1-5", () => {
    console.log("Scheduler running ............");
    checkInOut();
    console.log(".......................end job");
  });
  // checkInOut();
  console.log("server is running with port : " + PORT);
});
