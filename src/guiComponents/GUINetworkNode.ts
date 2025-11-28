import { Iface } from "../components/Iface";
import { Port } from "../components/Ports";
import { Direction } from "../components/types";
import { Emulation } from "../engine/Emulation";
import { GUIElement } from "./GUIElement";
import { GUIInterface } from "./GUIInterface";


export class GUINetworkNode extends GUIElement<never, Iface> {

    // protected interfaces: Iface[] = [];

    private name: string;
    private labelDirection: Direction;

    constructor(emulation: Emulation, name: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        super(null, emulation, x, y, width, height);
        this.name = name;
        this.labelDirection = labelDirection;
    }

    getName() {
        return this.name;
    }

    adjustPortsOnSide(side: Direction) {

        const portsOnSide: Port[] = [];
        for (let iface of this.getChildren()) {
            const nic = iface.nic;
            for(let port of nic.getChildren()) {
                if (port.side != side) continue;
                portsOnSide.push(port);
            }
        }
        let numPorts = portsOnSide.length;


        switch (side) {
            case Direction.NORTH: {
                const dx = this.width/(numPorts+1);
                let x = -this.width/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].setX(x + (i+1) * dx);
                    portsOnSide[i].setY(-this.height/2);
                }
                break;
            }
            case Direction.EAST: {
                const dy = this.height/(numPorts+1);
                let y = -this.height/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].setX(this.width/2);
                    portsOnSide[i].setY(y + (i+1) * dy);
                }
                break;
            }
            case Direction.SOUTH: {
                const dx = this.width/(numPorts+1);
                let x = -this.width/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].setX(x + (i+1) * dx);
                    portsOnSide[i].setY(this.height/2);
                }
                break;
            }
        case Direction.WEST: {
                const dy = this.height/(numPorts+1);
                let y = -this.height/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].setX(-this.width/2);
                    portsOnSide[i].setY(y + (i+1) * dy);
                }
                break;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        if (this.isHovered) {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
        // for (const iface of this.interfaces) {
        //     const nic = iface.nic;
        //     for (const port of nic.ports) {
        //         port.render(ctx);
        //     }
        // }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = "bold 10pt Arial";
        switch (this.labelDirection) {
            case Direction.NORTH:
                ctx.fillText(this.name, this.x, this.y - this.height/2 - 10);
                break;
            case Direction.SOUTH:
                ctx.fillText(this.name, this.x, this.y + this.height/2 + 10);
                break;
            case Direction.EAST:
            case Direction.WEST:
                ctx.fillText(this.name, this.x, this.y);
        }
    }

}