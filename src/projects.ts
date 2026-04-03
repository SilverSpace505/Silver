import { socket } from './network';
import utils from './utils';

interface ProjectData {
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

interface ClicksData {
  total: number;
  views: boolean;
}

const projectsContainer = document.getElementById(
  'projects-container',
) as HTMLDivElement;

projectsContainer.addEventListener('wheel', (e) => {
  e.stopPropagation();
}, { passive: false })

const projectElements: Record<
  string,
  { text: HTMLSpanElement; icon: HTMLImageElement; div: HTMLAnchorElement }
> = {};

let projectList: string[] = [];

const search = document.getElementById('search') as HTMLInputElement;
const filter = document.getElementById('filter') as HTMLSelectElement;
const sort = document.getElementById('sort') as HTMLSelectElement;

let ProjectData: Record<string, ProjectData> = {};
let clickData: Record<string, ClicksData> = {};

const mouse = { x: 0, y: 0 };

const ps: Record<string, { x: number; y: number }> = {};

export function anticlick(project: string, scale: number, delta: number) {
  if (!(project in projectElements)) return;
  projectElements[project].div.style.zIndex = '1';

  if (!(project in ps)) ps[project] = { x: 0, y: 0 };

  const mx = mouse.x / scale;
  const my = mouse.y / scale;

  const p = projectElements[project].div.getBoundingClientRect();
  const px = (p.left + p.right) / 2 / scale;
  const py = (p.bottom + p.top) / 2 / scale;

  const dx = px - mx;
  const dy = py - my;
  const d = Math.sqrt((px - mx) ** 2 + (py - my) ** 2);

  if (d < 200) {
    ps[project].x += dx * (1 - d / 200) * delta * 75;
    ps[project].y += dy * (1 - d / 200) * delta * 75;
  }

  ps[project].x = utils.lerp5(ps[project].x, 0, delta * 10);
  ps[project].y = utils.lerp5(ps[project].y, 0, delta * 10);

  projectElements[project].div.style.translate = `${ps[project].x}rem ${ps[project].y}rem`;
}

document.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

search.addEventListener('input', () => {
  manageProjects();
});

filter.addEventListener('change', () => {
  manageProjects();
});

sort.addEventListener('change', () => {
  manageProjects();
});

function manageProjects() {
  projectsContainer.innerHTML = '';

  projectList = Object.keys(projectElements);
  if (sort.value == 'views') {
    projectList.sort(
      (a, b) => (clickData[b].total ?? 0) - (clickData[a].total ?? 0),
    );
  }
  if (sort.value == 'new') {
    projectList.sort(
      (a, b) =>
        new Date(ProjectData[b].date).getTime() -
        new Date(ProjectData[a].date).getTime(),
    );
  }
  if (sort.value == 'old') {
    projectList.sort(
      (a, b) =>
        new Date(ProjectData[a].date).getTime() -
        new Date(ProjectData[b].date).getTime(),
    );
  }

  for (const project of projectList) {
    if (!ProjectData[project].name.toLowerCase().includes(search.value.toLowerCase()))
      continue;
    if (!ProjectData[project].tags.includes(filter.value) && filter.value != 'all')
      continue;
    projectsContainer.appendChild(projectElements[project].div);
  }
}

socket.on('connect', () => {
  socket.emit('fetch_projects', (projects: [string, ProjectData][]) => {
    const projectsO: Record<string, ProjectData> = {};
    for (const project of projects) {
      projectsO[project[0]] = project[1]
    }
    ProjectData = projectsO;
    for (const project in projectsO) {
      const link = document.createElement('a');
      link.href = projectsO[project].link;
      link.target = '_blank';

      link.addEventListener('click', () => {
        if (socket.connected) {
          let day = Math.floor(Date.now() / 1000 / 60 / 60 / 24) - 20102 + 382;
          let clicked: null | { day: number; projects: string[] } = null;
          let clickedL = localStorage.getItem('clicked');
          if (clickedL) clicked = JSON.parse(clickedL);
          if (!clicked || clicked.day != day || !('projects' in clicked)) {
            clicked = { day, projects: [] };
          }
          if (!clicked.projects.includes(project)) {
            socket.emit('uclick', project, () => {
              socket.emit('get_clicks');
              clicked.projects.push(project);
              localStorage.setItem('clicked', JSON.stringify(clicked));
            });
          } else {
            socket.emit('click', project);
          }
        }
      });

      const element = document.createElement('div');
      element.classList.add('project');

      const clicksIcon = document.createElement('img');
      clicksIcon.classList.add('project-clicks-icon');
      element.appendChild(clicksIcon);

      const clicks = document.createElement('span');
      clicks.classList.add('project-clicks');
      clicks.textContent = '';
      element.appendChild(clicks);

      const date = document.createElement('span');
      date.classList.add('project-date');
      date.textContent = projectsO[project].date;
      element.appendChild(date);

      if (projectsO[project].github) {
        const githubBtn = document.createElement('a');
        githubBtn.classList.add('project-github');
        githubBtn.href = projectsO[project].github;
        githubBtn.target = '_blank';

        element.appendChild(githubBtn);
      }

      const textContainer = document.createElement('div');
      textContainer.classList.add('project-text');
      element.appendChild(textContainer);

      const description = document.createElement('span');
      description.classList.add('project-description');
      description.textContent = projectsO[project].description;
      textContainer.appendChild(description);

      const title = document.createElement('span');
      title.classList.add(
        projectsO[project].showTitle ? 'project-title' : 'project-title-hide',
      );
      title.textContent = projectsO[project].name;
      textContainer.appendChild(title);

      element.style.backgroundImage = `url(${projectsO[project].img})`;

      projectElements[project] = { div: link, text: clicks, icon: clicksIcon };
      projectList.push(project);

      link.appendChild(element);
      projectsContainer.appendChild(link);
    }
    socket.emit('get_clicks');
  });
});

socket.on('get_clicks', (clicks: Record<string, ClicksData>) => {
  clickData = clicks;
  for (const project in clicks) {
    if (project in projectElements) {
      projectElements[project].icon.src = clicks[project].views
        ? '/view-2.png'
        : '/click-2.png';
      projectElements[project].text.textContent = clicks[project].total + '';
    }
  }
  manageProjects();
});
