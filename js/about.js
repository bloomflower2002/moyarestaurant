window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {          // trigger after 50px scroll
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
})