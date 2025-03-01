const Razorpay = require('razorpay');
const {RAZORPAY_ID,RAZORPAY_SECRET_KEY}=process.env;
var instance = new Razorpay({
  key_id: RAZORPAY_ID,
  key_secret: RAZORPAY_SECRET_KEY,
});

