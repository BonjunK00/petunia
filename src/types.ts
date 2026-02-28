export type ServiceStatus = 'UP' | 'DOWN';

export interface Service {
  name: string;
  status: ServiceStatus;
}

export interface TraefikRouter {
  name: string;
  status: string;      // "enabled" | "disabled" | "warning"
  rule: string;
  service: string;
  entryPoints: string[];
  provider: string;    // "docker" | "internal" | ...
  error?: string[];
}

export interface TraefikOverview {
  http: {
    routers:     { total: number; warnings: number; errors: number };
    services:    { total: number; warnings: number; errors: number };
    middlewares: { total: number; warnings: number; errors: number };
  };
}

export interface TraefikService {
  name: string;
  status: string;
  provider: string;
  usedBy?: string[];
  serverStatus?: Record<string, string>; // { "http://ip:port": "UP" | "DOWN" }
  type?: string;
}
