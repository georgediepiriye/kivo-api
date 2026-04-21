import axios from "axios";
import config from "../config/config.js";

const PAYSTACK_BASE_API = config.payments.paystackBaseApi;

interface TransactionPayload {
  email: string;
  amount: number; // in Kobo
  metadata: Record<string, any>;
  callback_url: string;
  subaccount?: string;
}

export class PaystackService {
  private static async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const res = await axios({
      method,
      url: `${PAYSTACK_BASE_API}${endpoint}`,
      data,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  }

  static async initializeTransaction(payload: TransactionPayload) {
    return this.makeRequest<any>("POST", "/transaction/initialize", payload);
  }

  static async createSubaccount(payload: {
    business_name: string;
    settlement_bank: string;
    account_number: string;
    percentage_charge: number;
  }) {
    return this.makeRequest<any>("POST", "/subaccount", payload);
  }
}
