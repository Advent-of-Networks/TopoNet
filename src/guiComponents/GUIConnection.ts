import { Port } from "../components/Ports";
import { TransmitUnit } from "../components/TransmitUnit";
import { Direction } from "../components/types";
import { GUIElement } from "./GUIElement";

export class GUIConnection extends GUIElement<Port, TransmitUnit> {
    
    getBezierCurve(reverse: boolean = false) {
        const ports = this.getParents();
        let from = ports[0];
        let to = ports[1];

        if (reverse) [from, to] = [to, from];

        const fromRect = from.getRect();
        const toRect = to.getRect();
        const fromNodeRect = from.getParent()!.getParent()!.getParent()!.getRect();
        const toNodeRect = to.getParent()!.getParent()!.getParent()!.getRect();
        
        const startX = fromNodeRect.x + fromRect.x;
        const startY = fromNodeRect.y + fromRect.y;
        const endX = toNodeRect.x + toRect.x;
        const endY = toNodeRect.y + toRect.y;

        let cp1X = startX;
        let cp1Y = startY;
        let cp2X = endX;
        let cp2Y = endY;

        const offset = 50;

        switch(from.side) {
            case Direction.NORTH: cp1Y -= offset; break;
            case Direction.SOUTH: cp1Y += offset; break;
            case Direction.WEST: cp1X -= offset; break;
            case Direction.EAST: cp1X += offset; break;
        }

        switch(to.side) {
            case Direction.NORTH: cp2Y -= offset; break;
            case Direction.SOUTH: cp2Y += offset; break;
            case Direction.WEST: cp2X -= offset; break;
            case Direction.EAST: cp2X += offset; break;
        }

        return [startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY];
    }

    render(ctx: CanvasRenderingContext2D) {
        const [startX, startY, cp1X, cp1Y, cp2X, cp2Y, endX, endY] = this.getBezierCurve();

        ctx.strokeStyle = "#3333aa";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
        ctx.stroke();
    }
}