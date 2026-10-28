export interface HealthStatus {
    status: "ok";
}

export class HealthService {
    public getStatus(): HealthStatus {
        return { status: "ok" };
    }
}
