import { Emulation } from "../engine/Emulation";
import { Iface } from "./Iface";
import { Port } from "./Ports";
import { Direction } from "./types";

export class NetworkNode {
    private static nextId: number = 1;
    id: number;

    emulation: Emulation;

    x: number;
    y: number;
    width: number;
    height: number;
    isHovered: boolean = false;
    interfaces: Iface[] = [];

    name: string;
    labelDirection: Direction;

    constructor(emulation: Emulation, name: string, x:number, y: number, width: number = 50, height: number = 50, labelDirection = Direction.SOUTH) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = NetworkNode.nextId++;
        this.emulation = emulation;
        this.name = name;
        this.labelDirection = labelDirection;
    }

    

    update(deltaT: number) {
        const p = 6 * deltaT / 50;
        for(const iface of this.interfaces) {
            iface.update(deltaT);
            const nic = iface.nic;
            if (Math.random() < p) {
                if (nic.ports[0].connection) {
                    const connection = nic.ports[0].connection;
                    const dstMac = connection.from === nic.ports[0] ? connection.to.nic.mac : connection.from.nic.mac;
                    nic.send(dstMac);
                }
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
        for (const iface of this.interfaces) {
            const nic = iface.nic;
            for (const port of nic.ports) {
                port.render(ctx);
            }
        }
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

    addInterface(iface: Iface) {
        this.interfaces.push(iface);
    }

    contains(px: number, py: number) {
        return (
            px >= this.x - this.width/2 &&
            px <= this.x + this.width/2 &&
            py >= this.y - this.height/2 &&
            py <= this.y + this.height/2
        );
    }

    adjustPortsOnSide(side: Direction) {

        const portsOnSide: Port[] = [];
        for (let iface of this.interfaces) {
            const nic = iface.nic;
            for(let port of nic.ports) {
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
                    portsOnSide[i].offsetX = x + (i+1) * dx;
                    portsOnSide[i].offsetY = -this.height/2;
                }
                break;
            }
            case Direction.EAST: {
                const dy = this.height/(numPorts+1);
                let y = -this.height/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].offsetX = this.width/2;
                    portsOnSide[i].offsetY = y + (i+1) * dy;
                }
                break;
            }
            case Direction.SOUTH: {
                const dx = this.width/(numPorts+1);
                let x = -this.width/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].offsetX = x + (i+1) * dx;
                    portsOnSide[i].offsetY = this.height/2;
                }
                break;
            }
        case Direction.WEST: {
                const dy = this.height/(numPorts+1);
                let y = -this.height/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].offsetX = -this.width/2;
                    portsOnSide[i].offsetY = y + (i+1) * dy;
                }
                break;
            }
        }
    }
}