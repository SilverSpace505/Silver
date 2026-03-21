import { socket } from "./network";
import utils from "./utils";

let sendCooldown = 0;
let current = '';

export function extratick(currentPage: string, delta: number) {
    
    // if (currentPage == 'extra') {
    //     sendCooldown -= delta;
    // } else {
    //     cursor.v = false;
    //     if (current) {
    //         socket.emit('remove_cursor');
    //     }
    // }
    current = currentPage;
    sendCooldown -= delta;

    // current = currentPage == 'extra';

    if (sendCooldown <= 0) {
        cursor.page = currentPage;
        socket.emit('cursor', cursor);
        sendCooldown = 1 / 20;
    }

    for (const cursor in cursorElements) {
        const cursorE = cursorElements[cursor];

        cursorE[0][0] = utils.lerp5(cursorE[0][0], cursorE[1][0], delta * 10)
        cursorE[0][1] = utils.lerp5(cursorE[0][1], cursorE[1][1], delta * 10)

        cursorE[2].style.left = `${cursorE[0][0] * 100}%`;
        cursorE[2].style.top = `${cursorE[0][1] * 100}%`;

        // if (currentPage != 'extra') {
        //     cursorE[2].remove();
        //     delete cursorElements[cursor];
        // }
    }
}

interface Cursor {
    x: number,
    y: number,
    v: boolean
    page: string,
}

const cursor: Cursor = {x: 0, y: 0, v: false, page: ''};

document.onmousemove = (event) => {
    cursor.x = event.clientX / window.innerWidth;
    cursor.y = event.clientY / window.innerHeight;
    cursor.v = event.clientX >= 0 && event.clientX <= window.innerWidth && event.clientY >= 0 && event.clientY <= window.innerHeight;
};

document.onmouseover = () => {
    cursor.v = true;
};
document.onmouseenter = () => {
    cursor.v = true;
};

document.onmouseout = () => {
    cursor.v = false;
};
document.onmouseleave = () => {
    cursor.v = false;
};

const cursorElements: Record<string, [[number, number], [number, number], HTMLDivElement]> = {};

socket.on('cursors', (cursors: Record<string, Cursor>) => {
    for (const cursor in cursorElements) {
        if (!(cursor in cursors)) {
            cursorElements[cursor][2].remove();
            delete cursorElements[cursor];
        }
    }

    for (const cursor in cursors) {
        if (cursor == socket.id) continue;

        if (!(cursor in cursorElements)) {
            const element = document.createElement('div');
            element.classList.add('cursor');
            document.body.appendChild(element);
            cursorElements[cursor] = [[cursors[cursor].x, cursors[cursor].y], [cursors[cursor].x, cursors[cursor].y], element];
        }

        cursorElements[cursor][1] = [cursors[cursor].x, cursors[cursor].y];

        cursorElements[cursor][2].style.display = (cursors[cursor].v && cursors[cursor].page == current) ? 'block' : 'none';
    }
});