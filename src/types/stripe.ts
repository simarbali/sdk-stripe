interface CreateCustomers {
    name:string,
    email:string
}


interface InstantSubscription {
    customerId:string,
    priceId:string,
    paymentMethodId:string,
    userId:string,
    trialDays?:number

}



export {CreateCustomers,InstantSubscription}