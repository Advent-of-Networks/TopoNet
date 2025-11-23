import { Connection } from "./Connection";
import { NIC } from "./NIC";
import { Emulation } from "../engine/Emulation";
import { TransitUnit } from "./TransitUnit";
import { EthernetFrame } from "./EthernetFrame";
import { Direction } from "./types";
interface PacketSentEventDetails {
    transitUnit: TransitUnit;
}

export type PacketSentEvent = CustomEvent<PacketSentEventDetails>;

export class Port {
    
    private static nextId: number = 1;
    id: number;

    emulation: Emulation;

    nic: NIC;
    side: Direction;
    connection: Connection | null = null;
    offsetX: number = 0;
    offsetY: number = 0;
    height: number = 10;
    width: number = 10;

    sendingTransitUnit: TransitUnit | null = null;

    constructor(emulation: Emulation, nic: NIC, side: Direction) {
        this.nic = nic;
        this.side = side;
        this.id = Port.nextId++;
        this.emulation = emulation;
    }

    update(_deltaT: number) {
        if (this.sending() && this.sendingTransitUnit!.isSent()) {
            this.sendingTransitUnit = null;
        }
    }

    connect(connection: Connection) {
        this.connection = connection;
    }

    disconnect() {
        this.connection = null;
    }

    sending() {
        return !!this.sendingTransitUnit;
    }

    corrupt() {
        this.sendingTransitUnit?.corrupt();
    }

    jam() {

    }

    send(frame: EthernetFrame) {
        if (!this.connection) throw new Error("This port is not connected!");
        this.sendingTransitUnit = new TransitUnit(frame, this.connection, this.connection.from === this);
        this.connection.addTransitUnit(this.sendingTransitUnit);
        this.emulation.emit(new CustomEvent<PacketSentEventDetails>("packetSent", {detail: { transitUnit: this.sendingTransitUnit }}));
    }

    receive(transitUnit: TransitUnit) {
        this.nic.receive(transitUnit);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.nic.node.x - this.width/2 + this.offsetX, this.nic.node.y - this.height/2 + this.offsetY, 10, 10);
    }
}