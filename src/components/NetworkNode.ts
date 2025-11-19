import { NIC } from "./NIC";
import { Port, PortSide } from "./Ports";

export class NetworkNode {
    private static nextId: number = 1;
    id: number;

    x: number;
    y: number;
    width: number;
    height: number;
    isHovered: boolean = false;
    nics: NIC[] = [];
    // ports: Port[] = [];

    constructor(x:number, y: number, width: number = 50, height: number = 50) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = NetworkNode.nextId++;
    }

    

    update(deltaT: number) {
        const p = 6 * deltaT / 5000;
        for(const nic of this.nics) {
            if (Math.random() < p) {
                if (nic.ports[0].connection) {
                    nic.send();
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
        for (const nic of this.nics) {
            for (const port of nic.ports) {
                port.render(ctx);
            }
        }
    }

    addNIC(nic: NIC) {
        this.nics.push(nic);
    }

    contains(px: number, py: number) {
        return (
            px >= this.x - this.width/2 &&
            px <= this.x + this.width/2 &&
            py >= this.y - this.height/2 &&
            py <= this.y + this.height/2
        );
    }

    adjustPortsOnSide(side: PortSide) {

        const portsOnSide: Port[] = [];
        for (let nic of this.nics) {
            for(let port of nic.ports) {
                if (port.side != side) continue;
                portsOnSide.push(port);
            }
        }
        let numPorts = portsOnSide.length;


        switch (side) {
            case PortSide.NORTH: {
                const dx = this.width/(numPorts+1);
                let x = -this.width/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].offsetX = x + (i+1) * dx;
                    portsOnSide[i].offsetY = -this.height/2;
                }
                break;
            }
        case PortSide.EAST: {
                const dy = this.height/(numPorts+1);
                let y = -this.height/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].offsetX = this.width/2;
                    portsOnSide[i].offsetY = y + (i+1) * dy;
                }
                break;
            }
            case PortSide.SOUTH: {
                const dx = this.width/(numPorts+1);
                let x = -this.width/2;
                for (let i = 0; i < numPorts; i++) {
                    portsOnSide[i].offsetX = x + (i+1) * dx;
                    portsOnSide[i].offsetY = this.height/2;
                }
                break;
            }
        case PortSide.WEST: {
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