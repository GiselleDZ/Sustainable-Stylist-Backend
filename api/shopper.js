const puppeteer = require("puppeteer");
const router = require("express").Router();

// scrape request
router.get("/scrape-depop", async (req, res) => {
  //define url
  const searchString = req.query.searchstring;
  const url = `https://www.depop.com/search/?q=${searchString}`;

  try {
    //open url
    const browser = await puppeteer.launch({ headless: true });
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
    // set status and element data
    res.status(200);
    res.json({ elements, numOfListings });
    //close the browser window
    await browser.close();
  } catch (error) {
    throw error;
  }
});

module.exports = router;
