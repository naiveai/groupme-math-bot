const functions = require("@google-cloud/functions-framework");
const { convert } = require("convert-svg-to-png");

functions.http("mathRenderer", async (req, res) => {
    const MathJax = await require("mathjax").init({
        loader: {
            load: ['input/asciimath', 'output/svg']
        }
    });

    const rendered_svg = MathJax.asciimath2svg(req.body.text);
    const rendered_png = await convert(MathJax.startup.adaptor.innerHTML(rendered_svg), { scale: 10 });

    const groupme_response = await fetch("https://image.groupme.com/pictures", {
        method: "POST",
        headers: {
            "X-Access-Token": process.env.GROUPME_TOKEN,
            "Content-Type": "image/png"
        },
        body: rendered_png
    });
    const groupme_response_json = await groupme_response.json();
    const groupme_image_url = groupme_response_json.payload.picture_url;

    await fetch("https://api.groupme.com/v3/bots/post", {
        method: "POST",
        body: JSON.stringify({
            bot_id: process.env.GROUPME_BOT_ID,
            text: "",
            attachments: [{
                type: "image",
                url: groupme_image_url
            }, {
                type: "reply",
                reply_id: req.body.id,
                base_reply_id: req.body.id
            }]
        })
    });

    res.sendStatus(200);
});
