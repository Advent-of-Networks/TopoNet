import { Port, PortSide } from "./Ports";
import { TransitUnit } from "./TransitUnit";

export class Connection {
    from: Port;
    to: Port;

    transitUnits: TransitUnit[] = [];
    delay: number = 200;

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
        const startX = this.from.node.x + this.from.offsetX;
        const startY = this.from.node.y + this.from.offsetY;
        const endX = this.to.node.x + this.to.offsetX;
        const endY = this.to.node.y + this.to.offsetY;

        let cp1X = startX;
        let cp1Y = startY;
        let cp2X = endX;
        let cp2Y = endY;

        const offset = 50;

        switch(this.from.side) {
            case PortSide.NORTH: cp1Y -= offset; break;
            case PortSide.SOUTH: cp1Y += offset; break;
            case PortSide.WEST: cp1X -= offset; break;
            case PortSide.EAST: cp1X += offset; break;
        }

        switch(this.to.side) {
            case PortSide.NORTH: cp2Y -= offset; break;
            case PortSide.SOUTH: cp2Y += offset; break;
            case PortSide.WEST: cp2X -= offset; break;
            case PortSide.EAST: cp2X += offset; break;
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