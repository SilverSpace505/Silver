import 'highlight.js/styles/github-dark.css'

import { socket } from "./network";

import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';

import { markedHighlight } from "marked-highlight";

const devlogsPath = document.getElementById('devlogs-path') as HTMLDivElement;

const devlogsContainer = document.getElementById('devlogs-container') as HTMLDivElement;
const currentDevlog = document.getElementById('current-devlog') as HTMLDivElement;
const lastDevlog = document.getElementById('last-devlog') as HTMLDivElement;

const devlogElements: Record<string, HTMLDivElement> = {};

interface Devlog {
  id: string,
  name: string,
  date: Date
}

export const openDevlog: { v: null | string, i: number, initial: boolean } = { v: null, i: 0, initial: false }

currentDevlog.addEventListener('wheel', (e) => {
  e.stopPropagation();
}, { passive: false });

devlogsContainer.addEventListener('wheel', (e) => {
  e.stopPropagation();

  devlogsPath.style.backgroundPositionY = -devlogsContainer.scrollTop + 'px';
}, { passive: false });

hljs.registerLanguage('rust', rust);

marked.use(markedHighlight({
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

export function devlogs_init() {
  socket.emit('list_devlogs', (devlogs: Devlog[]) => {
    devlogsContainer.innerHTML = '';
    let i = 0;
    for (const devlog of devlogs) {
      const devlogE = document.createElement('div');
      devlogE.classList.add('devlog');
      devlogsContainer.appendChild(devlogE);
      const devlogTitle = document.createElement('span');
      devlogTitle.classList.add('devlog-title');
      devlogE.appendChild(devlogTitle);
      const devlogDate = document.createElement('span');
      devlogDate.classList.add('devlog-date')
      devlogE.appendChild(devlogDate);

      devlogTitle.textContent = devlog.name;
      devlog.date = new Date(devlog.date);
      devlogDate.textContent = `${devlog.date.getDate()}/${devlog.date.getMonth() + 1}/${devlog.date.getFullYear()}`;

      let devlogI = i;

      devlogE.onclick = () => {
        if (openDevlog.v == devlog.id && !openDevlog.initial) return;
        openDevlog.initial = false;

        if (openDevlog.v) {
          devlogElements[openDevlog.v].classList.remove('open');
        }
        devlogE.classList.add('open');

        lastDevlog.innerHTML = currentDevlog.innerHTML;
        currentDevlog.innerHTML = '';

        const isDown = devlogI <= openDevlog.i;

        currentDevlog.animate([
          { translate: `0 ${isDown ? '-' : ''}150rem`, opacity: 0 },
          { offset: 0.5, opacity: 0 },
          { translate: '0 0', opacity: 1 }
        ], {
          duration: 1000,
          easing: 'ease',
          fill: 'forwards'
        });
        if (openDevlog.v) {
          lastDevlog.animate([
            { translate: '0 0', opacity: 1 },
            { offset: 0.5, opacity: 0 },
            { translate: `0 ${isDown ? '' : '-'}150rem`, opacity: 0 }
          ], {
            duration: 1000,
            easing: 'ease',
            fill: 'forwards'
          })
        }

        socket.emit('devlog', devlog.id, async (content: string) => {
          currentDevlog.innerHTML = (await marked.parse(content));
          openDevlog.v = devlog.id;
          openDevlog.i = devlogI;
          history.pushState(null, '', `/devlogs/${devlog.id}`);
        })
      }

      if (openDevlog.v == devlog.id) devlogE.classList.add('open');
      
      if (openDevlog.v == devlog.id && openDevlog.initial) {
        setTimeout(() => {
          if (devlogE.onclick) devlogE.onclick(new PointerEvent(""));

          const divRect = devlogsContainer.getBoundingClientRect();
          const targetRect = devlogE.getBoundingClientRect();

          devlogsContainer.scrollTo({
            top: targetRect.top - divRect.top - (devlogsContainer.clientHeight / 2),
            behavior: 'instant'
          });
        });
      }

      devlogElements[devlog.id] = devlogE;

      i++
    }
  })
}