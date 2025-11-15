import {
  nCallbacks,
  sendMsg,
  socket,
  type ClicksData,
  type GameData,
} from './network';
import utils from './utils';

const gamesContainer = document.getElementById(
  'games-container',
) as HTMLDivElement;

const gameElements: Record<
  string,
  { text: HTMLSpanElement; icon: HTMLImageElement; div: HTMLAnchorElement }
> = {};

let gameList: string[] = [];

const search = document.getElementById('search') as HTMLInputElement;
const filter = document.getElementById('filter') as HTMLSelectElement;
const sort = document.getElementById('sort') as HTMLSelectElement;

let gameData: Record<string, GameData> = {};
let clickData: Record<string, ClicksData> = {};

nCallbacks.loadGames = (games) => {
  gameData = games;
  for (const game in games) {
    const link = document.createElement('a');
    link.href = games[game].link;
    link.target = '_blank';

    link.addEventListener('click', () => {
      if (socket.connected) {
        let day = Math.floor(Date.now() / 1000 / 60 / 60 / 24) - 20102 + 382;
        let clicked: null | { day: number; games: string[] } = null;
        let clickedL = localStorage.getItem('clicked');
        if (clickedL) clicked = JSON.parse(clickedL);
        if (!clicked || clicked.day != day) {
          clicked = { day, games: [] };
        }
        if (!clicked.games.includes(game)) {
          clicked.games.push(game);
          sendMsg({ click: game });
          sendMsg({ getClicks: true });
        }
        localStorage.setItem('clicked', JSON.stringify(clicked));
      }
      sendMsg({ aclick: game });
    });

    const element = document.createElement('div');
    element.classList.add('game');

    const clicksIcon = document.createElement('img');
    clicksIcon.classList.add('game-clicks-icon');
    element.appendChild(clicksIcon);

    const clicks = document.createElement('span');
    clicks.classList.add('game-clicks');
    clicks.textContent = 'clicks';
    element.appendChild(clicks);

    const date = document.createElement('span');
    date.classList.add('game-date');
    date.textContent = games[game].date;
    element.appendChild(date);

    if (games[game].github) {
      const githubBtn = document.createElement('a');
      githubBtn.classList.add('game-github');
      githubBtn.href = games[game].github;
      githubBtn.target = '_blank';

      element.appendChild(githubBtn);
    }

    const textContainer = document.createElement('div');
    textContainer.classList.add('game-text');
    element.appendChild(textContainer);

    const description = document.createElement('span');
    description.classList.add('game-description');
    description.textContent = games[game].description;
    textContainer.appendChild(description);

    const title = document.createElement('span');
    title.classList.add(
      games[game].showTitle ? 'game-title' : 'game-title-hide',
    );
    title.textContent = games[game].name;
    textContainer.appendChild(title);

    element.style.backgroundImage = `url(${games[game].img})`;

    gameElements[game] = { div: link, text: clicks, icon: clicksIcon };
    gameList.push(game);

    link.appendChild(element);
    gamesContainer.appendChild(link);
  }
};

nCallbacks.loadClicks = (clicks) => {
  clickData = clicks;
  for (const game in clicks) {
    if (game in gameElements) {
      gameElements[game].icon.src = clicks[game].views
        ? '/view-2.png'
        : '/click-2.png';
      gameElements[game].text.textContent = clicks[game].total + '';
    }
  }
  manageGames();
};

const mouse = { x: 0, y: 0 };

const ps: Record<string, { x: number; y: number }> = {};

export function anticlick(game: string, scale: number, delta: number) {
  if (!(game in gameElements)) return;
  gameElements[game].div.style.zIndex = '1';

  if (!(game in ps)) ps[game] = { x: 0, y: 0 };

  const mx = mouse.x / scale;
  const my = mouse.y / scale;

  const p = gameElements[game].div.getBoundingClientRect();
  const px = (p.left + p.right) / 2 / scale;
  const py = (p.bottom + p.top) / 2 / scale;

  const dx = px - mx;
  const dy = py - my;
  const d = Math.sqrt((px - mx) ** 2 + (py - my) ** 2);

  if (d < 200) {
    ps[game].x += dx * (1 - d / 200) * delta * 75;
    ps[game].y += dy * (1 - d / 200) * delta * 75;
  }

  ps[game].x = utils.lerp5(ps[game].x, 0, delta * 10);
  ps[game].y = utils.lerp5(ps[game].y, 0, delta * 10);

  gameElements[game].div.style.translate = `${ps[game].x}rem ${ps[game].y}rem`;
}

document.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

search.addEventListener('input', () => {
  manageGames();
});

filter.addEventListener('change', () => {
  manageGames();
});

sort.addEventListener('change', () => {
  manageGames();
});

function manageGames() {
  gamesContainer.innerHTML = '';

  gameList = Object.keys(gameElements);
  if (sort.value == 'views') {
    gameList.sort(
      (a, b) => (clickData[b].total ?? 0) - (clickData[a].total ?? 0),
    );
  }
  if (sort.value == 'new') {
    gameList.sort(
      (a, b) =>
        new Date(gameData[b].date).getTime() -
        new Date(gameData[a].date).getTime(),
    );
  }
  if (sort.value == 'old') {
    gameList.sort(
      (a, b) =>
        new Date(gameData[a].date).getTime() -
        new Date(gameData[b].date).getTime(),
    );
  }

  for (const game of gameList) {
    if (!gameData[game].name.toLowerCase().includes(search.value.toLowerCase()))
      continue;
    if (!gameData[game].tags.includes(filter.value) && filter.value != 'all')
      continue;
    gamesContainer.appendChild(gameElements[game].div);
  }
}
