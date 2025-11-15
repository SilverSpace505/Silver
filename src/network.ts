import socket from '../../axion/socket';

export interface GameData {
  name: string;
  description: string;
  date: string;
  link: string;
  img: string;
  tags: string[];
  showTitle?: boolean;
  online?: boolean;
  github?: string;
}

export interface ClicksData {
  total: number;
  views: boolean;
}

interface Message {
  user: string;
  colour: string;
  text: string;
  time: string;
}

export { socket };

export function sendMsg(msg: object) {
  socket.sendMsg(msg);
}

export const nCallbacks = {
  loadGames: (games: Record<string, GameData>) => {
    void games;
  },
  loadClicks: (clicks: Record<string, ClicksData>) => {
    void clicks;
  },
  loadChat: (msgs: Message[]) => {
    void msgs;
  },
  loadMsg: (msg: Message) => {
    void msg;
  },
};

socket.connectToServer('silver', true);

socket.onConnect = () => {
  socket.sendMsg({ fetchGames: true });
  socket.sendMsg({ getClicks: true });
  socket.sendMsg({ getChat: true });
};

socket.onMsg = (msg) => {
  if ('games' in msg) {
    nCallbacks.loadGames(msg.games);
  }
  if ('getClicks' in msg) {
    nCallbacks.loadClicks(msg.getClicks);
  }
  if ('getChat' in msg) {
    nCallbacks.loadChat(msg.getChat);
  }
  if ('chat' in msg) {
    nCallbacks.loadMsg(msg.chat);
  }
};
