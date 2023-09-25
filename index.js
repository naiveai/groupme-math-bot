const functions = require("@google-cloud/functions-framework");

functions.http("mathRenderer", async (req, res) => {
    const MathJax = await require("mathjax").init({
        loader: {
            load: ['input/asciimath', 'output/svg']
        }
    });

    const svg = MathJax.asciimath2svg("x^2 + y^2 = z^2");
    res.send(MathJax.startup.adaptor.outerHTML(svg));
});
