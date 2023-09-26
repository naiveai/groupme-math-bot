import functions from "@google-cloud/functions-framework";
import convertPkg from "convert-svg-to-png";
const { convert } = convertPkg;

const mathRegex = /`(?<expression>.*?)`/g;
const MathJax = await (await import("mathjax")).init({
    loader: {
        load: ['input/asciimath', 'output/svg']
    }
});

functions.http("mathRenderer", async (req, res) => {
    const message = req.body.text;
    const mathExpressions = Array.from(message.matchAll(mathRegex)).map(match => match.groups.expression);

    if (mathExpressions.length === 0) {
        res.sendStatus(204); // 204 is No Content
        return;
    }

    let renderedPngs = [];

    for (const mathExpression of mathExpressions) {
        const renderedSvg = MathJax.asciimath2svg(mathExpression);
        renderedPngs.push(await convert(MathJax.startup.adaptor.innerHTML(renderedSvg), { scale: 10 }));
    }

    const imageUrls = await Promise.all(renderedPngs.map(groupmeUploadImage));

    // We send these sequentially because it's easier for the users to see
    // equations in the order they're seen in the message.
    for (const [index, imageUrl] of imageUrls.entries()) {
        const attachments = [{
            type: "image",
            url: imageUrl
        }];

        // If and only if this is the first image, we want to show context
        // by replying to the original message. Repeated replies are clutter.
        if (index === 0) {
            attachments.push({
                type: "reply",
                reply_id: req.body.id,
                base_reply_id: req.body.id
            });
        }

        const body = JSON.stringify({
            bot_id: process.env.GROUPME_BOT_ID,
            text: "",
            attachments
        });

        await fetch("https://api.groupme.com/v3/bots/post", { method: "POST", body });
    }

    res.sendStatus(200);
});

async function groupmeUploadImage(image) {
    const groupme_response = await fetch("https://image.groupme.com/pictures", {
        method: "POST",
        headers: {
            "X-Access-Token": process.env.GROUPME_TOKEN,
            "Content-Type": "image/png"
        },
        body: image
    });
    const groupme_response_json = await groupme_response.json();

    return groupme_response_json.payload.picture_url;
}
