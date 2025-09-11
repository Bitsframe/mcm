// export const grandTotalHandle = (
//   cart: any[],
//   discount = 0
// ): { amount: number; discountAmount: number; productTotal: number } => {
//   // Calculate product total without any discounts
//   const productTotal = cart.reduce((sum, item) => sum + item.original_price * item.quantity, 0);

//   // Calculate product-level discounts
//   const productLevelTotal = cart.reduce((sum, item) => {
//     const productDiscount = item.discount_percent ? (item.original_price * item.quantity * item.discount_percent) / 100 : 0;
//     const discountedProductTotal = (item.original_price * item.quantity) - productDiscount;
//     return sum + discountedProductTotal;
//   }, 0);

//   // Apply cart-level discount to the subtotal after product-level discounts
//   const discountAmount = (productLevelTotal * discount) / 100;
//   const total = productLevelTotal - discountAmount;
//   return {
//     amount: total,
//     discountAmount,
//     productTotal,
//   };
// };



// type BalanceCalcResult = {
//   totalAfterDiscount: number;
//   totalPaid: number;
//   newBalance: number;
//   overpaid: boolean;
// };

// export function calculateNewBalance({
//   cartArray,
//   appliedDiscount,
//   payWithCash,
//   receivedAmount,
//   payWithCard,
//   cardAmount,
//   creditUsed,
//   selectedLocation,
// }: {
//   cartArray: any[];
//   appliedDiscount: number;
//   payWithCash: boolean;
//   receivedAmount: number;
//   payWithCard: boolean;
//   cardAmount: number;
//   creditUsed: number;
//   selectedLocation: { balance: number };
// }): BalanceCalcResult {
//   const totalAfterDiscount = grandTotalHandle(cartArray, appliedDiscount).amount;
//   const totalPaid = (payWithCash ? receivedAmount : 0) + (payWithCard ? cardAmount : 0);

//   let newBalance: number;
//   let overpaid = false;

//   if (totalPaid > totalAfterDiscount) {
//     const newAmount = totalPaid - totalAfterDiscount;
//     const newAmount2 = selectedLocation.balance - newAmount;
//     newBalance = Number(newAmount2.toFixed(2));
//     overpaid = true;
//   } else {
//     const amount = totalAfterDiscount - totalPaid;
//     const creditUsedCalculated = creditUsed + amount;
//     newBalance = Number((selectedLocation.balance + creditUsedCalculated).toFixed(2));
//     overpaid = false;
//   }

//   return {
//     totalAfterDiscount,
//     totalPaid,
//     newBalance,
//     overpaid,
//   };
// }



export const grandTotalHandle = (
  cart: any[],
  discount = 0
): { amount: number; discountAmount: number; productTotal: number; productTotalOriginalPrice: number } => {
  // Calculate product total using the original price of the items, no discount applied
  const productTotalOriginalPrice = cart.reduce((sum, item) => sum + item.original_price * item.quantity, 0);

  // Calculate product-level discounts (this uses the original price to apply the discount)
  const productLevelTotal = cart.reduce((sum, item) => {
    const productDiscount = item.discount_percent
      ? (item.original_price * item.quantity * item.discount_percent) / 100
      : 0;
    const discountedProductTotal = (item.original_price * item.quantity) - productDiscount;
    return sum + discountedProductTotal;
  }, 0);

  // Apply cart-level discount to the subtotal after product-level discounts
  const discountAmount = (productLevelTotal * discount) / 100;
  const total = productLevelTotal - discountAmount;

  return {
    amount: total, // Total after cart-level discount
    discountAmount, // Amount of discount applied at the cart level
    productTotal: productLevelTotal, // Product total after product-level discount
    productTotalOriginalPrice, // Product total using original price (no discount)
  };
};
