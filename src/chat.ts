import { nCallbacks, sendMsg } from './network';

const chatContainer = document.getElementById(
  'chat-container',
) as HTMLDivElement;

const username = document.getElementById('username') as HTMLInputElement;
const message = document.getElementById('message') as HTMLInputElement;
const colour = document.getElementById('colour') as HTMLInputElement;

const loadedUsername = localStorage.getItem('username');
if (loadedUsername) username.value = loadedUsername;

const loadedColour = localStorage.getItem('colour');
if (loadedColour) colour.value = loadedColour;

username.addEventListener('input', () => {
  localStorage.setItem('username', username.value);
});

colour.addEventListener('change', () => {
  localStorage.setItem('colour', colour.value);
});

interface Message {
  user: string;
  colour: string;
  text: string;
  time: Date;
}

let lastUser = '';
let lastMsg: HTMLDivElement | null = null;
let lastMsgTime: Date | null = null;

function halfColour(hex: string) {
  hex = hex.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const newR = Math.floor(r / 3);
  const newG = Math.floor(g / 3);
  const newB = Math.floor(b / 3);

  const newHex = `#${newR.toString(16).padStart(2, '0')}${newG
    .toString(16)
    .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;

  return newHex;
}

function loadMessage(msg: Message) {
  if (
    msg.user + msg.colour == lastUser &&
    lastMsg &&
    lastMsgTime &&
    msg.time.getTime() - lastMsgTime.getTime() < 1000 * 60 * 5
  ) {
    const text = document.createElement('p');
    text.classList.add('msg-text');
    text.textContent = msg.text;

    lastMsg.appendChild(text);

    lastMsgTime = msg.time;
  } else {
    const element = document.createElement('div');
    element.classList.add('msg');

    const user = document.createElement('span');
    user.classList.add('msg-user');
    user.textContent = msg.user;
    user.style.color = msg.colour;
    user.style.textShadow = `0 3rem ${halfColour(msg.colour)}, 0 0 6rem black, 0 3rem 6rem black`;

    const time = document.createElement('span');
    time.classList.add('msg-time');
    time.textContent = formatDate(msg.time);

    const text = document.createElement('p');
    text.classList.add('msg-text');
    text.textContent = msg.text;

    element.appendChild(user);
    element.appendChild(time);
    element.appendChild(text);

    chatContainer.appendChild(element);

    lastMsg = element;
    lastUser = msg.user + msg.colour;
    lastMsgTime = msg.time;
  }

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth',
  });
}

function loadChat(msgs: Message[]) {
  chatContainer.innerHTML = '';
  for (const msg of msgs) {
    loadMessage(msg);
  }
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate()).padStart(2, '0');

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12; // convert to 12-hour format
  const hourStr = String(hours);

  return `${year}/${month}/${day}, ${hourStr}:${minutes}${ampm}`;
}

message.addEventListener('keydown', (event) => {
  if (event.key == 'Enter') {
    if (username.value.length < 1) return;
    if (message.value.length < 1) return;
    loadMessage({
      user: username.value,
      text: message.value,
      colour: colour.value,
      time: new Date(),
    });

    sendMsg({
      chat: {
        user: username.value,
        text: message.value,
        colour: colour.value,
      },
    });

    message.value = '';
  }
});

nCallbacks.loadChat = (msgs) => {
  loadChat(
    msgs.map((a) => {
      return { ...a, time: new Date(a.time) };
    }),
  );
};

nCallbacks.loadMsg = (msg) => {
  loadMessage({ ...msg, time: new Date(msg.time) });
};
