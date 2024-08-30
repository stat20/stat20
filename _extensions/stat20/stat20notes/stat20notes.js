document.addEventListener("DOMContentLoaded", function () {
  
  // Remove the toggle from the first section of the sidebar
  const firstContainer = document.querySelector('.sidebar-item-container');
  
  if (firstContainer) {
    
    firstContainer.classList.add('sidebar-title');
    const firstToggleLink = firstContainer.querySelector('a.sidebar-item-toggle)
    
    if (firstToggleLink) {
        firstToggleLink.remove();
    }
  }
    
});
