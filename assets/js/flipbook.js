document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".flipbook").forEach(flipbook => {
    const pages = Array.from(flipbook.querySelectorAll(".page"));

    // assign z-index dynamically
    pages.forEach((page, i) => {
      page.style.zIndex = pages.length - i;
    });

    // clicking flips the topmost page
    flipbook.addEventListener("click", () => {
      const topPage = pages.find(p => !p.classList.contains("flipped"));
      if (topPage) {
        topPage.classList.add("flipped");
      } else {
        // reset when all flipped
        pages.forEach(p => p.classList.remove("flipped"));
      }
    });
  });
});
