import { socket } from './network';

interface ServerMessage {
  user: string;
  colour: string;
  text: string;
  time: string;
}

const chatContainer = document.getElementById(
  'chat-container',
) as HTMLDivElement;

chatContainer.addEventListener('wheel', (e) => {
  e.stopPropagation();
}, { passive: false })

chatContainer.onscroll = () => {
  if ((chatContainer.scrollTop < 500 || chatContainer.scrollHeight <= chatContainer.clientHeight) && !fetching) {
    page++
    fetching = true;
    const beforeHeight = chatContainer.scrollHeight;
    const beforeTop = chatContainer.scrollTop;
    socket.emit('get_chat', page, (msgs: ServerMessage[]) => {
      loadChat(
        msgs.map((a) => {
          return { ...a, time: new Date(a.time) };
        }),
      );
      fetching = false;
      chatContainer.scrollTop = beforeTop + (chatContainer.scrollHeight - beforeHeight);

      if (chatContainer.onscroll) chatContainer.onscroll(new Event(""));
    });
  }
}

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
let page = 0;
let fetching = false;

let allChat: Message[] = [];

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
  if (currentPage == "chat") lastViewed = new Date().getTime();
  updateNewChat(msg.time.getTime());

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
  allChat = [...msgs, ...allChat];
  for (const msg of allChat) {
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

    socket.emit('chat', username.value, message.value, colour.value);

    message.value = '';
  }
});

export function chat_init() {
  page = 0;
  allChat = [];
  lastUser = '';
  lastMsg = null;
  lastMsgTime = null;
  fetching = false;
  socket.emit('get_chat', page, (msgs: ServerMessage[]) => {
    loadChat(
      msgs.map((a) => {
        return { ...a, time: new Date(a.time) };
      }),
    );
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (chatContainer.onscroll) chatContainer.onscroll(new Event(""));
  });
}

socket.on('chat', (msg: ServerMessage) => {
  loadMessage({ ...msg, time: new Date(msg.time + "Z") });
});

//

//

//

let currentPage = ""

export function pageChanged(target: string) {
    currentPage = target;
}

socket.on('connect', () => {
  socket.emit('get_chat', 0, (msgs: ServerMessage[]) => {
    const newest = Math.max(...msgs.map(m => new Date(m.time).getTime()));
    
    updateNewChat(newest);
  });
});

const chatBtn = document.getElementById('chatBtn') as HTMLButtonElement;

let lastViewed: number = 0;
let initialiseViewed = false;

let loadedLastViewed = localStorage.getItem("lastViewedChat");
if (loadedLastViewed) {
  lastViewed = JSON.parse(loadedLastViewed);
} else {
  initialiseViewed = true;
}

function updateNewChat(newest: number) {
  if (initialiseViewed) {
    lastViewed = new Date().getTime()
  }

  if (newest > lastViewed) {
    chatBtn.classList.add("new-page")
  } else {
    chatBtn.classList.remove("new-page")
  }

  initialiseViewed = false;

  localStorage.setItem("lastViewedChat", JSON.stringify(lastViewed));
}