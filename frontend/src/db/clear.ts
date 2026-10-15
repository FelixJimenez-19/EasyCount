import { DenominationsRepo } from "./repositories/denominations";
import { TransactionsRepo } from "./repositories/transactions";

export async function clearAllLocalData(): Promise<void> {
    await TransactionsRepo.clearAll();
    await DenominationsRepo.clearAll();
}
