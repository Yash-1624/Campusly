const crypto = require("crypto");
const razorpay = require("../config/razorpay");

// ========================================
// CREATE RAZORPAY ORDER
// ========================================
const createRazorpayOrder = async ({
    amount,
    receipt,
    notes = {},
}) => {
    const numericAmount = Number(amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {
        throw new Error(
            "A valid payment amount greater than zero is required."
        );
    }

    const amountInPaise = Math.round(numericAmount * 100);

    const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: String(receipt).slice(0, 40),
        notes,
    });

    return order;
};

// ========================================
// VERIFY RAZORPAY PAYMENT
// ========================================
const verifyRazorpayPayment = ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
}) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (
        !secret ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
    ) {
        return false;
    }

    const body =
        `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    const expectedBuffer = Buffer.from(
        expectedSignature,
        "hex"
    );

    const receivedBuffer = Buffer.from(
        razorpay_signature,
        "hex"
    );

    return (
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(
            expectedBuffer,
            receivedBuffer
        )
    );
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
};