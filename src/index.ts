
class NetworkNode {
    x: number;
    y: number;
    width: number;
    height: number;
    isHovered: boolean = false;

    constructor(x:number, y: number, width: number = 50, height: number = 50) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        if (this.isHovered) {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
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

const mouse = new Mouse();
const camera = new Camera();

const nodes: NetworkNode[] = [
    new NetworkNode(100, 100),
    new NetworkNode(300, 100),
    new NetworkNode(500, 200),
    new NetworkNode(300, 300),
];


function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(camera.x, camera.y);
    nodes.forEach(node => node.render(ctx));
    ctx.restore();
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

let lastFrameTime = performance.now();
let fps = 0;

function updateFPS() {
    const now = performance.now();
    const deltaT = now - lastFrameTime;
    fps = 1000 / (now - lastFrameTime);
    lastFrameTime = now;
    return deltaT / 1000;
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
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 10, 10 + i * 18);
    });

    ctx.restore();
}

function loop() {
    const deltaT = updateFPS();
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