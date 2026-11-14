(() => {
  const dialog = document.getElementById("study-dialog");
  const openButton = document.querySelector('.nav-item[data-view="study"]');
  const closeButton = document.getElementById("study-dialog-close");

  if (!dialog || !openButton || !closeButton) return;

  function openStudySpace() {
    if (!dialog.open) dialog.showModal();
    openButton.setAttribute("aria-expanded", "true");
  }

  function closeStudySpace() {
    if (dialog.open) dialog.close();
    openButton.setAttribute("aria-expanded", "false");
  }

  openButton.addEventListener("click", (event) => {
    event.preventDefault();
    openStudySpace();
  });

  closeButton.addEventListener("click", closeStudySpace);

  dialog.addEventListener("close", () => {
    openButton.setAttribute("aria-expanded", "false");
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeStudySpace();
  });
})();