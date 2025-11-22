
type byte = number;

export type MacAddress = [byte, byte, byte, byte, byte, byte];

export enum IPType {
    IPv4,
    IPv6,
}

export type IPv4 = [byte, byte, byte, byte];
export type IPv6 = [byte, byte, byte, byte, byte, byte, byte, byte, byte, byte, byte, byte, byte, byte, byte, byte];

export type NetworkMask = number;


export interface IPConfig {
    type: IPType;
    ip: IPv4;
    netmask: NetworkMask;
}