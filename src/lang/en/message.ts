const message:{ [index: string]: string } = {
   NAME_REQUIRED:"name field is required.",
   EMAIL_REQUIRED:"email field is required.",
   CUSTOMERID_REQUIRED:"customerId field is required.",
   SUBSRCIPTIONID_REQUIRED:"subscriptionId field is required.",
   PRICEID_REQUIRED:"priceId field is required.",
   TOKEN_REQUIRED:"token field is required.",
   INVOICEID_REQUIRED:"invoiceId field is required.",
   PAYMENT_METHODID:"paymentMethodId field is required",
   MISMATCH_PAYMENTID:"User has different default payment method. Either attach new  payment method to user or change user default payment methodId.",
   SUBSCRIPTION_CANCELED:"Your subscription is already canceled(to use any feature first reactivate your subscription).",
   MISMATCH_CUSTOMERID:"CustomerId does not match with subscription customerId.",
   SAME_PRICE:'Cannot upgrade to same priceId.',
   AMOUNT_REQUIRED: "amount field is required.",
   INVOICE_OPEN:"Invoice status is not open.",
   DEFAULT_PAYMENT:"This customer has no default payment method set.",
   TRAIL_DAYS:"trialDays field must be a number."
}

export { message };