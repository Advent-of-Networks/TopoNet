import { MacAddress } from "./types";

export enum EthernetFrameType {
    ARP = 0x0806,
    IPv4 = 0x0800,
    IPv6 = 0x8600,
    WAKE_ON_LAN = 0x0842,
    LLDP = 0x88cc,
    EXPERIMENTAL1 = 0x88B5,
    EXPERIMENTAL2 = 0x88B6,
}

export const ethernetFrameTypeNames = {
    0x0806: "ARP",
    0x0800: "IPv4",
    0x8600: "IPv6",
    0x0842: "WAKE_ON_LAN",
    0x88cc: "LLDP",
    0x88B5: "EXPERIMENTAL1",
    0x88B6: "EXPERIMENTAL2",
};

export class EthernetFrame {

    dstMac: MacAddress;
    srcMac: MacAddress;
    // TODO: vlan tag
    type: EthernetFrameType;
    // TODO: payload
    // TODO: padding
    // TODO: checksum

    constructor(dstMac: MacAddress, srcMac: MacAddress, type: EthernetFrameType) {
        this.dstMac = dstMac;
        this.srcMac = srcMac;
        this.type = type;
    }
}