// Scope the visual cleanup to Match, including Composition, tactics and Causerie.
document.addEventListener('DOMContentLoaded', () => {
  const otherViews = ['home-mode', 'training-mode', 'reports-mode', 'coach-agenda-mode', 'club-network-mode', 'resources-mode', 'squad-mode'];
  function sync() {
    document.body.classList.toggle('match-clean-mode', !otherViews.some(name => document.body.classList.contains(name)));
  }
  new MutationObserver(sync).observe(document.body, {attributes: true, attributeFilter: ['class']});
  sync();
});
