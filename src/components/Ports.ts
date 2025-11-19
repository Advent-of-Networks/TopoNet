import { NetworkNode } from "./NetworkNode";
import { Connection } from "./Connection";
import { TransitUnit } from "./TransitUnit";
import { NIC } from "./NIC";

export enum PortSide {
    NORTH = "NORTH",
    EAST = "EAST",
    SOUTH = "SOUTH",
    WEST = "WEST",
}

export class Port {
    
    private static nextId: number = 1;
    id: number;

    nic: NIC;
    side: PortSide;
    connection: Connection | null = null;
    offsetX: number = 0;
    offsetY: number = 0;
    height: number = 10;
    width: number = 10;

    constructor(nic: NIC, side: PortSide) {
        this.nic = nic;
        this.side = side;
        this.id = Port.nextId++;
    }

    connect(connection: Connection) {
        this.connection = connection;
    }

    disconnect() {
        this.connection = null;
    }

    send() {
        if (!this.connection) throw new Error("This port is not connected!");
        this.connection.addTransitUnit(new TransitUnit(this.connection, this.connection.from === this));
    }

    receive() {

    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.nic.node.x - this.width/2 + this.offsetX, this.nic.node.y - this.height/2 + this.offsetY, 10, 10);
    }
}