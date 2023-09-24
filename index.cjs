require("mathjax").init({
    loader: {
        load: ['input/asciimath', 'output/svg']
    }
}).then((MathJax) => {
    const svg = MathJax.asciimath2svg("[[cos theta, -sin theta], [sin theta, cos theta]]");
    require("fs").writeFileSync("test.svg", MathJax.startup.adaptor.outerHTML(svg));
}).catch((err) => console.error(err));
