import { pointOnBezier } from "../lib/bezier";
import { Connection } from "./Connection";
import { EthernetFrame } from "./EthernetFrame";
import { Direction } from "./types";

export class TransitUnit {

    private static nextId: number = 0;
    id: number;

    progress: number = 0;
    
    constructor(
        public frame: EthernetFrame,
        public connection: Connection,
        public forward: boolean = true
    ) {
        this.id = TransitUnit.nextId++;
    }

    update(deltaT: number) {
        const deltaP = (deltaT) / this.connection.delay;
        this.progress += deltaP;
        if (this.progress > 1) {
            const receiver = this.forward ? this.connection.to : this.connection.from;
            this.connection.removeTransitUnit(this);
            receiver.receive(this);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        const start = this.forward ? this.connection.from : this.connection.to;
        const end   = this.forward ? this.connection.to : this.connection.from;

        const x1 = start.nic.node.x + start.offsetX;
        const y1 = start.nic.node.y + start.offsetY;
        const x4 = end.nic.node.x   + end.offsetX;
        const y4 = end.nic.node.y   + end.offsetY;

        let cp1X = x1, cp1Y = y1;
        let cp2X = x4, cp2Y = y4;

        const offset = 50;

        switch(start.side) {
            case Direction.NORTH: cp1Y -= offset; break;
            case Direction.SOUTH: cp1Y += offset; break;
            case Direction.WEST:  cp1X -= offset; break;
            case Direction.EAST:  cp1X += offset; break;
        }

        switch(end.side) {
            case Direction.NORTH: cp2Y -= offset; break;
            case Direction.SOUTH: cp2Y += offset; break;
            case Direction.WEST:  cp2X -= offset; break;
            case Direction.EAST:  cp2X += offset; break;
        }

        const t = this.progress;

        const px = pointOnBezier(t, x1, cp1X, cp2X, x4);
        const py = pointOnBezier(t, y1, cp1Y, cp2Y, y4);

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}