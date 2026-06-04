import { create } from 'zustand'

export interface AnalyticsEvent {
    id: string;
    path: string;
    method: string;
    status_code: number;
    ip_hash: string;
    created_at: string;
}

export interface StatusCodeDistribution {
    status_code: number;
    count :string;
}

interface AnalyticsState {
    tenantName: string,
    tenantId: string,
    totalRequests: number,
    avgLatency: number,
    uniqueVisitor: number,
    statusCodes: StatusCodeDistribution[];
    recentEvents: AnalyticsEvent[];
    loading: boolean;
    error: string | null;

    fetchStats: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
    tenantName: '',
    tenantId: '',
    totalRequests: 0,
    avgLatency: 0,
    uniqueVisitor: 0,
    statusCodes: [],
    recentEvents: [],
    loading: false,
    error: null,

    fetchStats: async () => {
        set({ loading: true });

        try{
            const response = await fetch('/api/analytics');
            if(!response.ok){
            throw new Error(`Failed to fetch analytics data`);
            }
            const data = await response.json();

            set({
                tenantName: data.tenantName,
                tenantId: data.tenantId,
                totalRequests: data.totalRequests,
                avgLatency: data.avgLatency,
                uniqueVisitor: data.uniqueVisitors,
                statusCodes: data.statusCodes,
                recentEvents: data.recentEvents,
                loading: false,
                error: null,
            })
        }catch(err: any){
            set({
                error: err.message || "an error occured",loading: false
            })
        }
    }
}))
