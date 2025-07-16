export const grandTotalHandle = (
  cart: any[],
  discount = 0
): { amount: number; discountAmount: number } => {
  const amount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (amount * discount) / 100;
  const total = amount - discountAmount;
  return {
    amount: total,
    discountAmount,
  };
};



type BalanceCalcResult = {
  totalAfterDiscount: number;
  totalPaid: number;
  newBalance: number;
  overpaid: boolean;
};

export function calculateNewBalance({
  cartArray,
  appliedDiscount,
  payWithCash,
  receivedAmount,
  payWithCard,
  cardAmount,
  creditUsed,
  selectedLocation,
}: {
  cartArray: any[];
  appliedDiscount: number;
  payWithCash: boolean;
  receivedAmount: number;
  payWithCard: boolean;
  cardAmount: number;
  creditUsed: number;
  selectedLocation: { balance: number };
}): BalanceCalcResult {
  const totalAfterDiscount = grandTotalHandle(cartArray, appliedDiscount).amount;
  const totalPaid = (payWithCash ? receivedAmount : 0) + (payWithCard ? cardAmount : 0);

  let newBalance: number;
  let overpaid = false;

  if (totalPaid > totalAfterDiscount) {
    const newAmount = totalPaid - totalAfterDiscount;
    const newAmount2 = selectedLocation.balance - newAmount;
    newBalance = Number(newAmount2.toFixed(2));
    overpaid = true;
  } else {
    const amount = totalAfterDiscount - totalPaid;
    const creditUsedCalculated = creditUsed + amount;
    newBalance = Number((selectedLocation.balance + creditUsedCalculated).toFixed(2));
    overpaid = false;
  }

  return {
    totalAfterDiscount,
    totalPaid,
    newBalance,
    overpaid,
  };
}