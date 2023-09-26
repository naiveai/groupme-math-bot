const functions = require("@google-cloud/functions-framework");
const { convert } = require("convert-svg-to-png");

const mathRegex = /`(?<expression>.*?)`/g;

functions.http("mathRenderer", async (req, res) => {
    const message = req.body.text;
    const mathExpressions = Array.from(message.matchAll(mathRegex)).map(match => match.groups.expression);

    if (mathExpressions.length === 0) {
        res.sendStatus(204); // 204 is No Content
        return;
    }

    const MathJax = await require("mathjax").init({
        loader: {
            load: ['input/asciimath', 'output/svg']
        }
    });

    let renderedPngs = [];

    for (let mathExpression of mathExpressions) {
        const rendered_svg = MathJax.asciimath2svg(mathExpression);
        renderedPngs.push(await convert(MathJax.startup.adaptor.innerHTML(rendered_svg), { scale: 10 }));
    }

    await Promise.all(renderedPngs.map(async (renderedPng) => {
        const groupme_response = await fetch("https://image.groupme.com/pictures", {
            method: "POST",
            headers: {
                "X-Access-Token": process.env.GROUPME_TOKEN,
                "Content-Type": "image/png"
            },
            body: renderedPng
        });
        const groupme_response_json = await groupme_response.json();

        await fetch("https://api.groupme.com/v3/bots/post", {
            method: "POST",
            body: JSON.stringify({
                bot_id: process.env.GROUPME_BOT_ID,
                text: "",
                attachments: [{
                    type: "image",
                    url: groupme_response_json.payload.picture_url
                }, {
                    type: "reply",
                    reply_id: req.body.id,
                    base_reply_id: req.body.id
                }]
            })
        });
    }));

    res.sendStatus(200);
});
