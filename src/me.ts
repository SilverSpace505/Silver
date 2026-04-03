
const aboutMe = document.getElementById('about-me') as HTMLDivElement;
aboutMe.addEventListener('wheel', (e) => {
  e.stopPropagation();
}, { passive: false })