
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

export enum Direction {
    NORTH = "NORTH",
    EAST = "EAST",
    SOUTH = "SOUTH",
    WEST = "WEST",
}


export type Rect = {
    x: number;
    y: number;
    witdh: number;
    height: number;
};