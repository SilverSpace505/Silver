import { socket } from './network';
import './games';
import { anticlick } from './games';

import './devlogs';
import './chat';

const targetSize = { x: 1250, y: 1000 };

const pages = ['silver', 'games', 'info', 'devlogs', 'chat', 'extra'];

const pageDivs: Record<string, HTMLDivElement> = {};

const buttons: Record<string, HTMLButtonElement> = {};

let currentPage = '';

for (const page of pages) {
  buttons[page] = document.getElementById(page + 'Btn') as HTMLButtonElement;
  pageDivs[page] = document.getElementById(page) as HTMLDivElement;

  const elements: HTMLElement[] = Array.from(
    pageDivs[page].querySelectorAll('*'),
  );
  elements.forEach((el) => {
    el.classList.add('hide');
    el.style.transition = 'none';
    void el.offsetHeight;
    setTimeout(() => (el.style.transition = ''));
  });
}

for (const page of pages) {
  buttons[page].addEventListener('click', () => {
    buttons[page].classList.remove('sideClick');
    void buttons[page].offsetWidth;
    buttons[page].classList.add('sideClick');
    switchPage(page);
  });
}

function switchPage(target: string) {
  if (currentPage) {
    buttons[currentPage].disabled = false;
    pageDivs[currentPage].classList.add('out');
    pageDivs[currentPage].classList.remove('in');
    const elements = pageDivs[currentPage].querySelectorAll('*');
    elements.forEach((el) => el.classList.add('hide'));

    buttons[currentPage].style.animation = 'none';
    void buttons[currentPage].offsetHeight;
    setTimeout(() => (buttons[currentPage].style.animation = ''));
  }
  currentPage = target;
  pageDivs[target].classList.remove('out');
  pageDivs[target].classList.add('in');
  buttons[currentPage].disabled = true;
  const elements = pageDivs[currentPage].querySelectorAll('*');
  elements.forEach((el) => el.classList.remove('hide'));
}

let scale = 1;

window.onresize = () => {
  scale = Math.min(
    window.innerWidth / targetSize.x,
    window.innerHeight / targetSize.y,
  );
  document.documentElement.style.fontSize = scale + 'px';
  document.documentElement.style.setProperty(
    '--width',
    window.innerWidth / scale + 'rem',
  );
  document.documentElement.style.setProperty(
    '--height',
    window.innerHeight / scale + 'rem',
  );
};

window.dispatchEvent(new Event('resize'));

setTimeout(() => {
  switchPage('silver');
});

let lastTime = 0;

function animate() {
  socket.maintainConnection();

  const delta = (performance.now() - lastTime) / 1000;
  lastTime = performance.now();

  anticlick('pyramids-of-giza', scale, delta);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
