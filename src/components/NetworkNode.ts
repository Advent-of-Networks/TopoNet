import { Port, PortSide } from "./Ports";

export class NetworkNode {
    private static nextId: number = 1;
    id: number;

    x: number;
    y: number;
    width: number;
    height: number;
    isHovered: boolean = false;
    ports: Port[] = [];

    constructor(x:number, y: number, width: number = 50, height: number = 50) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.id = NetworkNode.nextId++;
    }

    addPort(side: PortSide): Port {
        const port = new Port(this, side);
        this.ports.push(port);

        const portsOnSide = this.ports.filter(p => p.side === side);
        const numPorts = portsOnSide.length;

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

        return port;
    }

    update(deltaT: number) {
        const p = 6 * deltaT / 5000;
        for (const port of this.ports) {
            if (Math.random() < p) {
                port.send();
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
        for (const port of this.ports) {
            port.render(ctx);
        }
    }

    contains(px: number, py: number) {
        return (
            px >= this.x - this.width/2 &&
            px <= this.x + this.width/2 &&
            py >= this.y - this.height/2 &&
            py <= this.y + this.height/2
        );
    }
}