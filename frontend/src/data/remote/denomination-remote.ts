import { api } from "../../services/http/client";
import type { Denomination } from "../../models/denomination";

export const DenominationRemote = {
    getAll: () => api.get<Denomination[]>("/denominations"),
    create: (value: number, type: string, active: boolean) =>
        api.post<Denomination>("/denominations", { value, type, active }),
    update: (id: number, active: boolean, updatedAt: string) =>
        api.patch<Denomination>(`/denominations/${id}`, { active, updatedAt }),
};
