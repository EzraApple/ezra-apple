const backLink = document.querySelector("[data-project-back]");

backLink?.addEventListener("click", (event) => {
  // Keep new-tab gestures and direct visits working as ordinary links.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!document.referrer || history.length < 2) return;

  const previousPage = new URL(document.referrer);
  if (previousPage.origin !== location.origin || previousPage.pathname !== "/") return;

  // Returning to the existing history entry restores its scroll and focus.
  event.preventDefault();
  history.back();
});
