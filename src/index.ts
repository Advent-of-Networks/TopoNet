function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
    const u = 1 - t;
    return u*u*u*p0
         + 3*u*u*t*p1
         + 3*u*t*t*p2
         + t*t*t*p3;
}

enum PortSide {
    NORTH,
    EAST,
    SOUTH,
    WEST,
}

class Port {
    node: NetworkNode;
    side: PortSide;
    connection: Connection | null = null;
    offsetX: number = 0;
    offsetY: number = 0;
    height: number = 10;
    width: number = 10;

    constructor(node: NetworkNode, side: PortSide) {
        this.node = node;
        this.side = side;
    }

    connect(connection: Connection) {
        this.connection = connection;
    }

    disconnect() {
        this.connection = null;
    }

    send() {
        if (!this.connection) throw new Error("This port is not connected!");
        this.connection.addTransitUnit(new TransitUnit(this.connection, this.connection.from === this));
    }

    receive() {

    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.node.x - this.width/2 + this.offsetX, this.node.y - this.height/2 + this.offsetY, 10, 10);
    }
}

class NetworkNode {
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

class Connection {
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

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
        ctx.stroke();

        this.transitUnits.forEach(t => t.render(ctx));
    }
}

class TransitUnit {

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

        // const x1 = start.node.x + start.offsetX;
        // const y1 = start.node.y + start.offsetY;
        // const x2 = end.node.x + end.offsetX;
        // const y2 = end.node.y + end.offsetY;

        // const px = x1 + (x2 - x1) * this.progress;
        // const py = y1 + (y2 - y1) * this.progress;

        const x1 = start.node.x + start.offsetX;
        const y1 = start.node.y + start.offsetY;
        const x4 = end.node.x   + end.offsetX;
        const y4 = end.node.y   + end.offsetY;

        // --- Compute control points identical to Connection.render() ---
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

        // --- Compute point on cubic Bézier ---
        const t = this.progress;

        const px = cubicBezier(t, x1, cp1X, cp2X, x4);
        const py = cubicBezier(t, y1, cp1Y, cp2Y, y4);

        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Mouse {
    x: number = 0;
    y: number = 0;
    buttons: number = 0;
}

class Camera {
    x: number = 0;
    y: number = 0;
    zoom: number = 1;

    isPanning: boolean = false;
    panStartX = 0;
    panStartY = 0;
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

let hoveringNode: NetworkNode | null = null;
let draggingNode: NetworkNode | null = null;
let offsetX = 0;
let offsetY = 0;
let speedFactor: number = 0.1;

const mouse = new Mouse();
const camera = new Camera();

const nodes: NetworkNode[] = [
    new NetworkNode(-100, -100),
    new NetworkNode(100, -100),
    new NetworkNode(300, 0),
    new NetworkNode(100, 100),
];

const ports: Port[] = [];

ports.push(nodes[0].addPort(PortSide.EAST));
ports.push(nodes[0].addPort(PortSide.EAST));
ports.push(nodes[0].addPort(PortSide.EAST));
ports.push(nodes[1].addPort(PortSide.WEST));
ports.push(nodes[1].addPort(PortSide.WEST));
ports.push(nodes[1].addPort(PortSide.EAST));
ports.push(nodes[2].addPort(PortSide.NORTH));
ports.push(nodes[2].addPort(PortSide.WEST));
ports.push(nodes[3].addPort(PortSide.WEST));
ports.push(nodes[3].addPort(PortSide.WEST));

const connections: Connection[] = [
    new Connection(ports[0], ports[3]),
    new Connection(ports[1], ports[7]),
    new Connection(ports[2], ports[9]),
    new Connection(ports[4], ports[8]),
    new Connection(ports[5], ports[6]),
];

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(camera.x, camera.y);
    nodes.forEach(node => node.render(ctx));
    connections.forEach(connection => connection.render(ctx));
    ctx.restore();
}

const chance = 500;

function update(deltaT: number) {

    for (const port of ports) {
        const rand = Math.floor(Math.random()*chance);
        if (rand ===0) {
            port.send();
        }
    }

    connections.forEach(connection => connection.update(deltaT));
}

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

function eventToCoords(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const mouseX = (screenX - canvas.width/2) / camera.zoom - camera.x;
    const mouseY = (screenY - canvas.height/2) / camera.zoom - camera.y;
    return [mouseX, mouseY, screenX, screenY];
}

function mousemove(e: MouseEvent) {
    let screenX, screenY;
    [mouse.x, mouse.y, screenX, screenY] = eventToCoords(e);

    if (draggingNode) {
        draggingNode.x = mouse.x - offsetX;
        draggingNode.y = mouse.y - offsetY;
        return;
    }
    
    if (camera.isPanning) {
        const dx = (screenX - camera.panStartX) / camera.zoom;
        const dy = (screenY - camera.panStartY) / camera.zoom;
        camera.x += dx;
        camera.y += dy;
        camera.panStartX = screenX;
        camera.panStartY = screenY;
        return;
    }

    if (hoveringNode) {
        hoveringNode.isHovered = false;
        hoveringNode = null;
    }

    for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].contains(mouse.x, mouse.y)) {
            hoveringNode = nodes[i];
            hoveringNode.isHovered = true;
            break;
        }
    }
}

function mousedown(e: MouseEvent) {
    mouse.buttons = e.buttons;

    let screenX, screenY;
    [mouse.x, mouse.y, screenX, screenY] = eventToCoords(e);
    if (hoveringNode) {
        draggingNode = hoveringNode;
        offsetX = mouse.x - draggingNode.x;
        offsetY = mouse.y - draggingNode.y;

        const index = nodes.indexOf(draggingNode);
        if (index > -1) {
            nodes.splice(index, 1);
            nodes.push(draggingNode);
        }
    } else {
        camera.isPanning = true;
        camera.panStartX = screenX;
        camera.panStartY = screenY;
    }
}

function mouseup(e: MouseEvent) {
    mouse.buttons = e.buttons;
    draggingNode = null;
    camera.isPanning = false;
}

function mouseleave(e: MouseEvent) {
    mouse.buttons = e.buttons;
    draggingNode = null;
    camera.isPanning = false;
}

function wheel(e: WheelEvent) {
    e.preventDefault();

    let screenX, screenY;
    [mouse.x, mouse.y, screenX, screenY] = eventToCoords(e);
    
    const sx = (screenX - canvas.width/2);
    const sy = (screenY - canvas.height/2);
    const oldZoom = camera.zoom;
    
    const zoomFactor = 1.001;
    camera.zoom *= Math.pow(zoomFactor, -e.deltaY);
    camera.zoom = Math.min(5, Math.max(0.1, camera.zoom));
    
    camera.x += sx * (1 / camera.zoom - 1 / oldZoom);
    camera.y += sy * (1 / camera.zoom - 1 / oldZoom);
    

}

const startTime = performance.now();
let lastFrameTime = startTime;
let fps = 0;

function updateFPS() {
    const now = performance.now();
    const deltaT = now - lastFrameTime;
    fps = 1000 / (now - lastFrameTime);
    lastFrameTime = now;
    return deltaT;
}

function debug(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.resetTransform();
    ctx.fillStyle = 'black';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const lines = [
        `FPS: ${fps}`,
        `Mouse`,
        `  Position: ${mouse.x} ${mouse.y}`,
        `  Buttons: ${mouse.buttons}`,
        `Camera`,
        `  Position: ${camera.x} ${camera.y}`,
        `  isPanning: ${camera.isPanning}`,
        `  Panning Start: ${camera.panStartX} ${camera.panStartY}`,
        `  Zoom: ${camera.zoom}`,
        `Time`,
        `  Start: ${startTime}`,
        `  Last Frame: ${lastFrameTime}`,
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 10, 10 + i * 18);
    });

    ctx.restore();
}

function loop() {
    const deltaT = updateFPS();
    update(deltaT * speedFactor);
    render();
    debug(ctx);
    requestAnimationFrame(loop);
}

function main() {
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', mousemove);
    canvas.addEventListener('mousedown', mousedown);
    canvas.addEventListener('mouseup', mouseup);
    canvas.addEventListener('mouseleave', mouseleave);
    canvas.addEventListener('wheel', wheel, {passive: false});
    resize();
    loop();
}

main();