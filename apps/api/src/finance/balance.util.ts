export interface BalanceTxShape {
  type: "expense" | "income" | "transfer";
  amount: number;
  accountId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
}

/** Account id → paise balance change to apply (negative = money out). */
export function balanceChanges(tx: BalanceTxShape): Map<string, number> {
  const changes = new Map<string, number>();
  const addChange = (accountId: string, balanceChange: number): void => {
    changes.set(accountId, (changes.get(accountId) ?? 0) + balanceChange);
  };

  switch (tx.type) {
    case "expense":
      if (tx.accountId) addChange(tx.accountId, -tx.amount);
      break;
    case "income":
      if (tx.accountId) addChange(tx.accountId, tx.amount);
      break;
    case "transfer":
      if (tx.fromAccountId) addChange(tx.fromAccountId, -tx.amount);
      if (tx.toAccountId) addChange(tx.toAccountId, tx.amount);
      break;
  }

  return changes;
}
