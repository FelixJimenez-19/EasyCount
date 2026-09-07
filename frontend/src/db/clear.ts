import { DenominationsRepo } from "./repositories/denominations";
import { OperationsRepo } from "./repositories/operations";
import { SyncMetaRepo } from "./repositories/sync-meta";
import { TransactionsRepo } from "./repositories/transactions";

export async function clearAllLocalData(): Promise<void> {
    await OperationsRepo.clearAll();
    await TransactionsRepo.clearAll();
    await DenominationsRepo.clearAll();
    await SyncMetaRepo.clearAll();
}
