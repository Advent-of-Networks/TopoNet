import { pointOnBezier } from "../lib/bezier";
import { Connection } from "./Connection";
import { PortSide } from "./Ports";

export class TransitUnit {

    progress: number = 0;
    
    constructor(
        public connection: Connection,
        public forward: boolean = true
    ) {}

    update(deltaT: number) {
        const deltaP = (deltaT) / this.connection.delay;
        this.progress += deltaP;
        if (this.progress > 1) {
            const receiver = this.forward ? this.connection.to : this.connection.from;
            this.connection.removeTransitUnit(this);
            receiver.receive();
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
            case PortSide.NORTH: cp1Y -= offset; break;
            case PortSide.SOUTH: cp1Y += offset; break;
            case PortSide.WEST:  cp1X -= offset; break;
            case PortSide.EAST:  cp1X += offset; break;
        }

        switch(end.side) {
            case PortSide.NORTH: cp2Y -= offset; break;
            case PortSide.SOUTH: cp2Y += offset; break;
            case PortSide.WEST:  cp2X -= offset; break;
            case PortSide.EAST:  cp2X += offset; break;
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