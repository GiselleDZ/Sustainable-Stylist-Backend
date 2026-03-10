const router = require("express").Router();
const Anthropic = require("@anthropic-ai/sdk");

const {
  gptInstructions,
  stylistMessages,
  summaryPrompt,
  recommendationPrompt,
} = require("../utilities/gpt-constants");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// stylist request
router.post("/stylist", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!messages?.length) {
      const parsedMessages = stylistMessages.map((m) => ({
        role: "assistant",
        content: m,
      }));
      res.send(parsedMessages);
    } else {
      // Claude requires messages to start with a user turn
      const firstUserIdx = messages.findIndex((m) => m.role === "user");
      const apiMessages = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: gptInstructions,
        messages: apiMessages,
      });

      res.send([{ role: "assistant", content: response.content[0].text }]);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/stylist-summary", async (req, res) => {
  try {
    const prompt = `${summaryPrompt} ${
      req.query.summary
    }. Messages: ${req.query.messages.map((m) => `${m.role}: ${m.content}`)}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    res.send(response.content[0].text);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post("/stylist-recs", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (messages.length < 5) {
      res.send("Insufficient Messages");
    } else {
      const firstUserIdx = messages.findIndex((m) => m.role === "user");
      const apiMessages = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: recommendationPrompt,
        messages: apiMessages,
      });

      res.send([{ role: "assistant", content: response.content[0].text }]);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = router;
