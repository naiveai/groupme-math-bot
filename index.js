import functions from "@google-cloud/functions-framework";
import sharp from "sharp";

const mathRegex = /(`|@)(?<expression>.*?)\1/gis;
const MathJax = await (await import("mathjax")).init({
    loader: {
        load: ['input/asciimath', 'output/svg']
    }
});
const svgStylesheet = MathJax.svgStylesheet();

const lerp = (x, y, a) => x * (1 - a) + y * a;
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));

functions.http("mathRenderer", async (req, res) => {
    const message = req.body.text;
    const mathExpressions = Array.from(message.matchAll(mathRegex)).map(match => match.groups.expression);

    if (mathExpressions.length === 0) {
        res.sendStatus(204); // 204 is No Content
        return;
    }

    const imageUrls = await Promise.all(mathExpressions.map(async (mathExpression) => {
        let svg = MathJax.asciimath2svg(mathExpression);

        // The actual SVG element is the first child of the MathML container,
        // and we need to add a stylesheet *inside* it for certain specifics
        // to render correctly, e.g. augmented matrices.
        svg.children[0].children.push(svgStylesheet);

        const innerSvg = MathJax.startup.adaptor.innerHTML(svg);

        const density = range(0, 50, 120, 200, mathExpression.length);
        const renderedPng = await sharp(Buffer.from(innerSvg), { density })
            .png()
            // Remove transparency (so it'll render visibly on GroupMe in dark mode)
            .flatten({ background: "#FFFFFF" })
            // Add some padding so the equation isn't right up against the edge of the image
            .extend({ top: 10, bottom: 10, left: 10, right: 10, background: "#FFFFFF" })
            .toBuffer();

        return groupmeUploadImage(renderedPng, req.body.token);
    }));

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
            bot_id: req.body.bot_id,
            text: "",
            attachments
        });

        await fetch("https://api.groupme.com/v3/bots/post", { method: "POST", body });
    }

    res.sendStatus(200);
});

async function groupmeUploadImage(image, token) {
    const groupme_response = await fetch("https://image.groupme.com/pictures", {
        method: "POST",
        headers: {
            "X-Access-Token": token,
            "Content-Type": "image/png"
        },
        body: image
    });
    const groupme_response_json = await groupme_response.json();

    return groupme_response_json.payload.picture_url;
}
