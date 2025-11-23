import { subdivideBezier } from "../lib/bezier";
import { Port } from "./Ports";
import { TransitUnit } from "./TransitUnit";
import { Direction } from "./types";

export class Connection {
    from: Port;
    to: Port;

    transitUnits: TransitUnit[] = [];
    // TODO: realistic 
    delay: number = 1;
    speed: number = 1000;

    constructor(from: Port, to: Port) {
        this.from = from;
        this.to = to;
        this.from.connect(this);
        this.to.connect(this);
    }

    addTransitUnit(transitUnit: TransitUnit) {
        this.transitUnits.push(transitUnit);
    }

    removeTransitUnit(transitUnit: TransitUnit) {
        this.transitUnits = this.transitUnits.filter(t => t !== transitUnit);
    }

    update(deltaT: number) {
        this.transitUnits.forEach(t => t.update(deltaT));
    }

    render(ctx: CanvasRenderingContext2D) {
        const startX = this.from.nic.node.x + this.from.offsetX;
        const startY = this.from.nic.node.y + this.from.offsetY;
        const endX = this.to.nic.node.x + this.to.offsetX;
        const endY = this.to.nic.node.y + this.to.offsetY;

        let cp1X = startX;
        let cp1Y = startY;
        let cp2X = endX;
        let cp2Y = endY;

        const offset = 50;

        switch(this.from.side) {
            case Direction.NORTH: cp1Y -= offset; break;
            case Direction.SOUTH: cp1Y += offset; break;
            case Direction.WEST: cp1X -= offset; break;
            case Direction.EAST: cp1X += offset; break;
        }

        switch(this.to.side) {
            case Direction.NORTH: cp2Y -= offset; break;
            case Direction.SOUTH: cp2Y += offset; break;
            case Direction.WEST: cp2X -= offset; break;
            case Direction.EAST: cp2X += offset; break;
        }

        ctx.strokeStyle = "#3333aa";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
        ctx.stroke();
        this.transitUnits.forEach(t => t.render(ctx));
    }
}