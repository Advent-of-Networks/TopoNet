import { NetworkNode } from "./NetworkNode";
import { Connection } from "./Connection";
import { TransitUnit } from "./TransitUnit";

export enum PortSide {
    NORTH = "NORTH",
    EAST = "EAST",
    SOUTH = "SOUTH",
    WEST = "WEST",
}

type MacAddress = [number, number, number, number, number, number];

export class Port {
    
    private static nextId: number = 1;
    id: number;
    mac: MacAddress;

    node: NetworkNode;
    side: PortSide;
    connection: Connection | null = null;
    offsetX: number = 0;
    offsetY: number = 0;
    height: number = 10;
    width: number = 10;

    constructor(node: NetworkNode, side: PortSide) {
        this.node = node;
        this.side = side;
        this.id = Port.nextId++;

        this.mac = [
            0x06, 
            0xCA, 
            0xFE, 
            ((this.id >> 16) & 0xFF) ^ 0x8A,
            ((this.id >> 8) & 0xFF) ^ 0x25,
            (this.id & 0xFF) ^ 0xC1,
        ];
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
        ctx.fillRect(this.node.x - this.width/2 + this.offsetX, this.node.y - this.height/2 + this.offsetY, 10, 10);
    }
}