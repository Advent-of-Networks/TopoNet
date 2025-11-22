import { Connection } from "./Connection";
import { NIC } from "./NIC";
import { Emulation } from "../engine/Emulation";
import { TransitUnit } from "./TransitUnit";
import { EthernetFrame } from "./EthernetFrame";

export enum PortSide {
    NORTH = "NORTH",
    EAST = "EAST",
    SOUTH = "SOUTH",
    WEST = "WEST",
}

interface PacketSentEventDetails {
    transitUnit: TransitUnit;
}

export type PacketSentEvent = CustomEvent<PacketSentEventDetails>;

export class Port {
    
    private static nextId: number = 1;
    id: number;

    emulation: Emulation;

    nic: NIC;
    side: PortSide;
    connection: Connection | null = null;
    offsetX: number = 0;
    offsetY: number = 0;
    height: number = 10;
    width: number = 10;

    constructor(emulation: Emulation, nic: NIC, side: PortSide) {
        this.nic = nic;
        this.side = side;
        this.id = Port.nextId++;
        this.emulation = emulation;
    }

    connect(connection: Connection) {
        this.connection = connection;
    }

    disconnect() {
        this.connection = null;
    }

    send(frame: EthernetFrame) {
        if (!this.connection) throw new Error("This port is not connected!");
        const transitUnit = new TransitUnit(frame, this.connection, this.connection.from === this);
        this.connection.addTransitUnit(transitUnit);
        this.emulation.emit(new CustomEvent<PacketSentEventDetails>("packetSent", {detail: { transitUnit }}));
    }

    receive(transitUnit: TransitUnit) {
        this.nic.receive(transitUnit.frame);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.nic.node.x - this.width/2 + this.offsetX, this.nic.node.y - this.height/2 + this.offsetY, 10, 10);
    }
}