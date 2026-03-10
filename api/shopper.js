const puppeteer = require("puppeteer");
const router = require("express").Router();

// scrape request
router.get("/scrape-depop", async (req, res) => {
  //define url
  const searchString = req.query.searchstring;
  const url = `https://www.depop.com/search/?q=${searchString}`;

  try {
    //open url
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();

    page.setViewport({ width: 1080, height: 720 });
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const pageNum = req.query.page;

    console.log("PAGE NUMBER IN EVAL FUNC", pageNum);

    await page.evaluate(async (pageNum) => {
      for (let i = 2; i <= pageNum; i++) {
        await window.scrollBy(0, 720);
      }
    }, pageNum);

    //make sure images load
    await page.waitForSelector("img");

    // get all the listings from the webpage
    const { elements, numOfListings } = await page.evaluate(async () => {
      const listItems = document
        .querySelector("[data-testid='search__results']")
        .querySelectorAll("li");
      // retrieve necessary data from elements
      let els = [];
      listItems.forEach((it) => {
        let image = it.querySelector("img").getAttribute("src");
        if (image?.length) {
          const alt = it.querySelector("img").alt;
          const price = it.querySelector("p").innerText;
          const link = it.querySelector("a").getAttribute("href");
          els.push({ image, alt, price, link });
        }
      });
      return { elements: els, numOfListings: listItems.length };
    });
    //close the browser window
    await browser.close();
    // set status and element data
    res.status(200).json({ elements, numOfListings });
  } catch (error) {
    console.error("Scraper error:", error.message);
    res.status(500).json({ error: "Failed to fetch listings. Please try again." });
  }
});

// eBay scrape request
router.get("/scrape-ebay", async (req, res) => {
  const searchString = req.query.searchstring;
  const url = `https://www.ebay.com/sch/i.html?_nkw=${searchString}`;

  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();

    page.setViewport({ width: 1080, height: 720 });
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("img");

    const { elements, numOfListings } = await page.evaluate(() => {
      const listItems = document.querySelectorAll("li.s-item");
      let els = [];
      listItems.forEach((it) => {
        const img = it.querySelector("img");
        const priceEl = it.querySelector(".s-item__price");
        const linkEl = it.querySelector("a.s-item__link");
        if (img && priceEl && linkEl) {
          const image = img.getAttribute("src");
          if (image && image.length) {
            els.push({
              image,
              alt: img.alt || "",
              price: priceEl.innerText,
              link: linkEl.getAttribute("href"),
            });
          }
        }
      });
      return { elements: els, numOfListings: listItems.length };
    });

    await browser.close();
    res.status(200).json({ elements, numOfListings });
  } catch (error) {
    console.error("eBay scraper error:", error.message);
    res.status(500).json({ error: "Failed to fetch eBay listings. Please try again." });
  }
});

// The Real Real scrape request
router.get("/scrape-realreal", async (req, res) => {
  const searchString = req.query.searchstring;
  const url = `https://www.therealreal.com/search?query=${searchString}`;

  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();

    page.setViewport({ width: 1080, height: 720 });
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForSelector("img");

    const { elements, numOfListings } = await page.evaluate(() => {
      const listItems = document.querySelectorAll("[data-testid='product-card'], .product-tile, .product-card");
      let els = [];
      listItems.forEach((it) => {
        const img = it.querySelector("img");
        const priceEl = it.querySelector("[data-testid='price'], .price, .product-price");
        const linkEl = it.querySelector("a");
        if (img && linkEl) {
          const image = img.getAttribute("src");
          if (image && image.length) {
            els.push({
              image,
              alt: img.alt || "",
              price: priceEl ? priceEl.innerText : "",
              link: linkEl.getAttribute("href"),
            });
          }
        }
      });
      return { elements: els, numOfListings: listItems.length };
    });

    await browser.close();
    res.status(200).json({ elements, numOfListings });
  } catch (error) {
    console.error("Real Real scraper error:", error.message);
    res.status(500).json({ error: "Failed to fetch The Real Real listings. Please try again." });
  }
});

module.exports = router;
