const router = require("express").Router();
const { Configuration, OpenAIApi } = require("openai");

const {
  gptInstructions,
  stylistMessages,
  summaryPrompt,
  recommendationPrompt,
} = require("../utilities/gpt-constants");

// stylist request
router.post("/stylist", async (req, res) => {
  try {
    // a list of all messages not yet included in the summary
    const messages = req.body.messages;

    // when there are no messages, we have not yet made any requests, so we return the default initial messages
    if (!messages?.length) {
      const parsedMessages = stylistMessages.map((m) => ({
        role: "assistant",
        content: m,
      }));
      res.send(parsedMessages);
    } else {
      // when there is a summary and messages we send them along for a GPT response
      const configuration = new Configuration({
        apiKey: apiKeyOpenAI,
      });
      const openai = new OpenAIApi(configuration);

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          // include our original instructions
          { role: "assistant", content: gptInstructions },
          ...messages,
        ],
        stop: ["user"],
      });

      // return the single response msg
      res.send([completion.data.choices[0].message]);
    }
  } catch (error) {
    console.log(error.response?.data);
    res.status(500).send(error.response?.data);
  }
});

// DO WE NEED A SUMMARY IF WE'RE SENDING THE ENTIRE CONVO
router.get("/stylist-summary", async (req, res) => {
  try {
    const prompt = `${summaryPrompt} ${
      req.query.summary
    }. Messages: ${req.query.messages.map((m) => `${m.role}: ${m.content}`)}`;

    const configuration = new Configuration({
      apiKey: apiKeyOpenAI,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0,
      max_tokens: 300,
    });

    res.send(completion.data.choices[0].text);
  } catch (error) {
    console.log(error.response?.data);
    res.status(500).send(error.response?.data);
  }
});

router.post("/stylist-recs", async (req, res) => {
  try {
    const messages = req.body.messages;
    // when there is a summary and messages we send them along for a GPT response

    if (messages.length < 5) {
      res.send("Insufficient Messages");
    } else {
      const configuration = new Configuration({
        apiKey: apiKeyOpenAI,
      });
      const openai = new OpenAIApi(configuration);

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          // include our original instructions
          { role: "assistant", content: recommendationPrompt },
          ...messages,
        ],
        stop: ["user"],
      });

      // return the single response msg
      res.send([completion.data.choices[0].message]);
    }
  } catch (error) {
    console.log(error.response?.data);
    res.status(500).send(error.response?.data);
  }
});

module.exports = router;
