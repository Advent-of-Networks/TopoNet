import { Connection } from "../components/Connection";
import { NIC } from "../components/NIC";
import { Direction } from "../components/types";
import { Emulation } from "../engine/Emulation";
import { GUIElement } from "./GUIElement";

export class GUIPort extends GUIElement<NIC, Connection> {


    side: Direction;

    constructor(emulation: Emulation, nic: NIC, side: Direction) {
        super(nic, emulation, 0, 0, 10, 10);
        this.side = side;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'black';
        const rect = this.getParent()!.getParent()!.getParent()!.getRect();
        ctx.fillRect(rect.x - this.width/2 + this.x, rect.y - this.height/2 + this.y, 10, 10);
    }
}