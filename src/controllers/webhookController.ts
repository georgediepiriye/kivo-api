import { Request, Response } from "express";
import httpStatus from "http-status";
import crypto from "crypto";
import * as ticketService from "./services/ticketService.js";
import config from "../config/config.js";

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  try {
    console.log("_____Received Paystack webhook:", req.body); // Log the raw body for debugging
    // 1. Verify the signature (Security: Ensure this actually came from Paystack)
    const hash = crypto
      .createHmac("sha512", config.payments.paystackSecret!)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());

    // 2. Handle successful payment
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      console.log("Webhook received for reference:", reference);
      // Pass the data to our service to finalize the ticket
      await ticketService.fulfillOrder(reference, metadata);
    }

    // 3. Always send 200 OK to Paystack immediately so they stop retrying
    res.status(httpStatus.OK).send("Webhook Received");
  } catch (error) {
    console.error("Webhook Error:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("Webhook processing failed");
  }
};
