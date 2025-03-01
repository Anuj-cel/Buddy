const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "ajkumarmahto001.com@gmail.com",
    pass: "fnja mbiv jzdo ljnj", //  google app password
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function main(obj) {
  // send mail with defined transport object
  const receivers = await transporter.sendMail({
    from: "ajkumarmahto001.com@gmail.com", // sender address
    to:obj.to, // list of receivers
    subject:obj.subject, // Subject line
    html:obj.html,
    text: "Hello world?", // plain text body 
  });

  console.log("Message sent: %s", receivers.message);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

// main().catch(console.error);
module.exports=main;

//"fnja mbiv jzdo ljnj"  --> google app password
