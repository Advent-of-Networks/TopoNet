import { NetworkNode } from "./NetworkNode";
import { Connection } from "./Connection";
import { TransitUnit } from "./TransitUnit";

export enum PortSide {
    NORTH,
    EAST,
    SOUTH,
    WEST,
}

export class Port {
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