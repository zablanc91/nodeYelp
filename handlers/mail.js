const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

//need transport, a way of interfacing different ways of sending email
const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

//generate HTML from views/email/password-reset.pug
const generateHTML = (filename, options = {}) => {
    //renderFile takes the path of the pug file you need; __dirname is our current location @ handlers folder
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    const inline = juice(html);
    return inline;
};

exports.send = async ( options ) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);
    const mailOptions = {
        from: 'Carlo <zwebdev91@gmail.com>',
        to: options.user.email,
        subject: options.subject,
        html,
        text
    };

    //sendmail works as callback, will promisify
    const sendMail = promisify(transport.sendMail, transport);
    return sendMail(mailOptions);
};