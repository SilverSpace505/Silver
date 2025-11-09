const devlogsPath = document.getElementById('devlogs-path') as HTMLDivElement;
const devlogs = document.getElementById('devlogs') as HTMLDivElement;

let scroll = 0;

devlogs.addEventListener('wheel', (event) => {
  scroll -= event.deltaY;

  devlogsPath.style.backgroundPositionY = scroll + 'rem';
});
