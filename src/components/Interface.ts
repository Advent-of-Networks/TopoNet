import { NIC } from "./NIC";
import { IPConfig } from "./types";

class Iface {
    
    nic: NIC;
    ips: IPConfig[] = [];

    constructor(nic: NIC) {
        this.nic = nic;
    }

}