export type ServiceStatus = 'UP' | 'DOWN';

export interface Service {
  name: string;
  status: ServiceStatus;
}

export interface TraefikRouter {
  name: string;
  status: string;   // "enabled" | "disabled" | "warning"
  rule: string;
  service: string;
  entryPoints: string[];
}
