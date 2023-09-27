# GroupMe AsciiMath Bot

[![public domain](http://i.creativecommons.org/p/zero/1.0/88x31.png)](http://creativecommons.org/publicdomain/zero/1.0/)

I'm in a few math study group chats in GroupMe and the lack of math rendering
sometimes makes things difficult, especially when talking about complex
expressions involving matrices, integrals, long fractions, etc.
Taking photos of the textbook or your own written solutions is prone to
misinterpretation and is all around a hassle anyway.

If you feel this problem, add this bot to your group using the link
https://mebots.io/bot/math_bot. Though you have to log in with GroupMe this
merely allows me to add the bot, a separate user, to your group. The way the
GroupMe API works, I can't send messages on your behalf even if I wanted to.

The bot renders any expression it finds between two at signs (`@`) or backticks
(`` ` ``) using AsciiMath, a simplified math typesetting option that allows for
complex expressions to be written in a more mobile-friendly and intuitive way
than LaTeX. In general, most math expressions are written very similar to how
they look, with `^` for superscripts and `_` for subscripts being enough to
write most useful expressions. You can find a syntax reference for anything else
at http://asciimath.org/.

## Examples

Augmented matrices:

![augmented matrix](https://i.imgur.com/d3z4t2e.png)

Integrals:

![integrals](https://i.imgur.com/mRuVxe9.png)

Multiple equations (and limits):

![multiple equations and limits](https://i.imgur.com/mCprk93.png)

## Details

The bot is hosted on Google Cloud Functions and uses MathJax's built-in support
for AsciiMath to render expressions to SVG, then converts them to PNG and sends
them to GroupMe as a reply to the user whose message was posted.
