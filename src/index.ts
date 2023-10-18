import Stripe from "stripe";
import { CreateCustomers, InstantSubscription } from "./types/stripe"
import {message} from "./lang/en/message";

let stripe: any;
const stripeSdk = {
  connectStripe: async (stripeKey: string):Promise<void> => {
    stripe = new Stripe(stripeKey, {
      apiVersion: '2023-08-16',
    });
  },
  createCustomer: async (data: CreateCustomers):Promise<object> => {
    try {
      if (data.name == "" || data.name == null) {
        return { status: false, error: message.NAME_REQUIRED }
      }
      if (data.email == "" || data.email == null) {
        return { status:false, error:message.EMAIL_REQUIRED}
      }
      const customer = await stripe.customers.create(data);
      return { status:true,customerId: customer.id };
    } catch (error: any) {
      return { status:false,error: error.message };
    }
  },
  getCustomer: async (customerId: string):Promise<object> => {
    try {
      if (customerId == "") {
        return { status:false,error: message.CUSTOMERID_REQUIRED }
      }
      const customer = await stripe.customers.retrieve(customerId);
      return {status:true,data:customer};
    } catch (error: any) {
      return { status:false,error: error.message };
    }
  },
  deleteCustomer: async (customerId: string):Promise<object> => {
    try {
      if (customerId == "") {
        return { status:false,name: message.CUSTOMERID_REQUIRED }
      }
      const customer = await stripe.customers.del(customerId);
      return {status:true,data:customer};
    } catch (error: any) {
      return { error: error.message };
    }
  },
  attachPayment: async (token: string, customerId: string):Promise<object> => {
    try {
      if(!token){
        return {status:false,error:message.TOKEN_REQUIRED}
      }
      if(!customerId){
        return {status:false,error:message.CUSTOMERID_REQUIRED}
      }
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token },
      });
      const futurePayment = await stripe.paymentMethods.attach(
        paymentMethod.id,
        { customer: customerId }
      );
      const customerpayment = await stripe.customers.update(customerId, {
        invoice_settings: {
            default_payment_method:futurePayment.id,
        },
    });
      return {status:true,data:customerpayment};
    } catch (error: any) {
      return { status:false,error: error.message }
    }
  },
  subscription: async (data: InstantSubscription):Promise<object> => {
    try {
      if(!data.customerId){
          return {status:false,error:message.CUSTOMERID_REQUIRED}
      }
      if(!data.paymentMethodId){
        return {status:false,error:message.PAYMENT_METHODID}
      }
      if(!data.priceId){
         return {status:false,error:message.PRICEID_REQUIRED}
      }
      if(data.trialDays && (typeof data.trialDays != "number") && data.trialDays>0){
          return {status:false,error:message.TRAIL_DAYS}
      }
      const customer = await stripe.customers.retrieve(data.customerId);
      const customerPaymentMethod = customer?.invoice_settings?.default_payment_method;
      if (customerPaymentMethod != data.paymentMethodId) {
        return { error: message.MISMATCH_PAYMENTID + customerPaymentMethod }
      }
      //create subscription
      let trialDate = new Date();
      let unixTimestamp: number | undefined;
      if (data.trialDays) {
        trialDate.setDate(trialDate.getDate() + data.trialDays);
        unixTimestamp = Math.floor(trialDate.getTime() / 1000);
      }
      const request:any = {
        customer: data.customerId,
        items: [{ price: data.priceId }],
        expand: ["latest_invoice.payment_intent"]
      }
      if(unixTimestamp){
        request.trial_end = unixTimestamp;
      }
      const subscription = await stripe.subscriptions.create(request);
      return {status:true,data:subscription};
    } catch (error: any) {
      return { status:false,error: error.message }
    }
  },
  getSubscriptionData: async (subscriptionId: string):Promise<object> => {
    try {
      let response = await stripe.subscriptions.retrieve(subscriptionId);
      return { status: true, data: response }
    } catch (error: any) {
      return { status: false, error: error.message }
    }
  },
  upgradeSubscription: async (subscriptionId: string, customerId: string, priceId: string):Promise<object> => {
    try {
      const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription.cancel_at_period_end === true) {
        return { status:false,error:message.SUBSCRIPTION_CANCELED };
      }
      if (subscription.customer != customerId) {
        return { status:false,error:message.MISMATCH_CUSTOMERID };
      }
      if (subscription.items.data[0].plan.id == priceId) {
        return { status:false,error: message.SAME_PRICE }
      }
      const updatedsubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription?.items?.data[0]?.id,
          price: priceId
        }],
        proration_behavior: 'always_invoice',
      });
      return {status:true,data:updatedsubscription};
    } catch (error: any) {
      return {status:false,error: error.message }
    }
  },

  cancelSubscription: async (customerId: string, subscriptionId: string):Promise<object> => {
    try {
      if (!customerId){
        return { status: false, error: message.CUSTOMERID_REQUIRED };
      }
      if(!subscriptionId) {
        return { status: false, error: message.SUBSRCIPTIONID_REQUIRED };
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription.cancel_at_period_end === true) {
        return { status: false, error:message.SUBSCRIPTION_CANCELED };
      }
      if (subscription.customer != customerId) {
        return { status: false, error:message.MISMATCH_CUSTOMERID };
      }
      let response = await stripe.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: true }
      );
      return { status: true, data: response }
    } catch (error: any) {
      return { status: false, error: error.message }
    }
  },

  reactivateSubscription: async (subscriptionId: string):Promise<object> => {
    try {
      if (!subscriptionId) {
        return { status: false, error: message.SUBSRCIPTIONID_REQUIRED};
      }
      const subscriptionUpdate = await stripe.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: false }
      );
      return { status: true, data: subscriptionUpdate }
    } catch (error: any) {
      return { status: false, error: error.message }
    }
  },

  oneTimePayment: async (token: string, amount: number):Promise<object> => {
    try {
      if(!token){
        return {status:false,error:message.TOKEN_REQUIRED};
      }
      if(!amount){
        return {status:false,error:message.AMOUNT_REQUIRED};
      }
      const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: { token },
      });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        payment_method: paymentMethod.id,
        currency: 'usd',
        confirm: true,
        payment_method_types: ["card"]
      });
      return { status: true, data: paymentIntent }
    } catch (error: any) {
      return { status: false, error: error.message }
    }
  },
  getInvoicesForSubscription: async (subscriptionId: string):Promise<object> => {
    try {
      if (!subscriptionId) {
        return { status: false, error:message.SUBSRCIPTIONID_REQUIRED };
      }
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
      });
      return { status: true, invoices: invoices.data };
    } catch (error: any) {
      return { status: false, error: error.message };
    }
  },
  getInvoice: async (invoiceId: string):Promise<object> => {
    try {
      if (!invoiceId) {
        return { status: false, error: message.INVOICEID_REQUIRED };
      }
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return { status: true, data: invoice }
    } catch (error: any) {
      return { status: false, error: error.message };
    }
  },
  subscriptionAddons: async (customerId: string, priceId: string, subscriptionId: string):Promise<object> => {
    try {
        if(!customerId){
          return {status:false,error:message.CUSTOMERID_REQUIRED};
        }
        if(!priceId){
          return {status:false,error:message.PRICEID_REQUIRED};
        }
        if(!subscriptionId){
          return {status:false,error:message.SUBSRCIPTIONID_REQUIRED};
        }
        const customer = await stripe.customers.retrieve(customerId);
        const subsData = await stripe.subscriptions.retrieve(subscriptionId);
        if(customer.id != subsData.customer){
            return {status:false,error:message.MISMATCH_CUSTOMERID}
        }
        const customerDefaultPaymentMethod = customer.invoice_settings.default_payment_method;
        if (!customerDefaultPaymentMethod) {
          return { status:false,error:message.DEFAULT_PAYMENT};
        }
        if (subsData.cancel_at_period_end === true || subsData.status !== "active") {
                return { status:false,error:message.SUBSCRIPTION_CANCELED };
        }
        const createNewInvoice = await stripe.invoices.create({
          customer: customerId,
          subscription: subscriptionId,
        });

        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: createNewInvoice.id,
          price: priceId,
          quantity: 1,
        });
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(createNewInvoice.id);
        if (finalizedInvoice.status === "open") {
          const paymentConfirm = await stripe.paymentIntents.confirm(finalizedInvoice.payment_intent);
          return {status:true,data:paymentConfirm}
      } else {
          return { status:false,error:message.INVOICE_OPEN };
      }

    } catch (error: any) {
      return { status: false, error: error.message }
    }
  }





}

export { stripeSdk };