import { socket } from './network';
import './projects';
import { anticlick, projects_init } from './projects';

import './devlogs';
import './chat';
import './me';
import { extratick } from './extra';
import utils from './utils';
import { devlogs_init, openDevlog } from './devlogs';
import { chat_init, pageChanged } from './chat';

const targetSize = { x: 1600, y: 1000 };

const pages = ['silver', 'projects', 'me', 'devlogs', 'chat', 'extra'];

const inits: Record<string, { fn: () => void, connect: boolean }> = {
  'devlogs': {
    fn: devlogs_init,
    connect: true
  },
  'projects': {
    fn: projects_init,
    connect: true
  },
  'chat': {
    fn: chat_init,
    connect: true
  }
}

const pageDivs: Record<string, HTMLDivElement> = {};

const buttons: Record<string, HTMLButtonElement> = {};

const pageDiv = document.getElementById('page') as HTMLDivElement;

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
  pageChanged(target);

  if (target == 'devlogs' && openDevlog.v) {
    history.pushState(null, '', `/${target}/${openDevlog.v}`);
  } else {
    history.pushState(null, '', target == 'silver' ? '/' : `/${target}`);
  }
  
  if (currentPage) {
    buttons[currentPage].disabled = false;
    pageDivs[currentPage].classList.add('out');
    pageDivs[currentPage].classList.remove('in');
    const elements = pageDivs[currentPage].querySelectorAll('*');
    elements.forEach((el) => el.classList.add('hide'));

    // buttons[currentPage].style.animation = 'none';
    void buttons[currentPage].offsetHeight;
    // setTimeout(() => (buttons[currentPage].style.animation = ''));
  }
  currentPage = target;
  pageDivs[target].classList.remove('out');
  pageDivs[target].classList.add('in');
  buttons[currentPage].disabled = true;
  const elements = pageDivs[currentPage].querySelectorAll('*');
  elements.forEach((el) => el.classList.remove('hide'));

  if (currentPage in inits) {
    const init = inits[currentPage];
    if (socket.connected || !init.connect) init.fn();
  }
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
  const path = location.pathname.slice(1).split('/')[0];
  if (path && pages.includes(path) && path != 'silver') {
    if (path == 'devlogs') {
      let devlog = location.pathname.slice(1).split('/')[1];
      if (devlog) {
        openDevlog.v = devlog;
        openDevlog.initial = true;
      }
    }
    switchPage(path);
    buttons['silver'].disabled = false;
    buttons[path].disabled = true;
  } else {
    switchPage('silver');
  }
});

let lastTime = 0;

function animate() {
  socket.maintainConnection();

  const delta = (performance.now() - lastTime) / 1000;
  lastTime = performance.now();

  anticlick('pyramids_of_giza', scale, delta);

  extratick(currentPage, delta);

  if (scrollable <= 0) {
    scrolling = utils.lerp5(scrolling, 0, delta * 10);
  } else if (scrollable <= 0.2) {
    scrolling = utils.lerp5(scrolling, 0, delta * 10);
  }
  scrollable -= delta;
  // console.log(scrolling, (1 - Math.abs(scrolling) / 50) ** 5 * 100);

  // let scrolled = Math.max(0, Math.abs(scrolling) / 50 - 0.5);

  // pageDiv.style.opacity = `${(1 - scrolled) ** 5 * 100}%`;

  for (const page in pageDivs) {
    pageDivs[page].style.translate = `0 ${scrolling}rem`;
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

let scrolling = 0;
let scrollable = 0;

pageDiv.onwheel = (event) => {
  if (scrollable > 0) {
    return;
  }

  scrolling -= event.deltaY;

  const currentI = pages.indexOf(currentPage);

  if (scrolling < -300 && currentI < pages.length - 1) {
    switchPage(pages[currentI + 1]);
    scrolling = 1000;
    scrollable = 0.5;
  }
  else if (scrolling > 300 && currentI > 0) {
    switchPage(pages[currentI - 1]);
    scrolling = -1000;
    scrollable = 0.5;
  }
}

socket.on('connect', () => {
  if (currentPage in inits) {
    const init = inits[currentPage];
    if (init.connect) init.fn();
  }
})