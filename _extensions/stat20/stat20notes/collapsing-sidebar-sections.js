
document.addEventListener("DOMContentLoaded", function () {
  
  //// Set the default sidebar state ////
  
  // Get all sidebar sections
  const sidebarSections = document.querySelectorAll('.sidebar-item-section');

  // Collapse all sections initially
  sidebarSections.forEach(section => {
    const collapseElement = section.querySelector('.collapse');
    collapseElement.classList.remove('show');
  });

  // Find the active link
  const activeLink = document.querySelector('.sidebar-item-text.active');

  if (activeLink) {
    // Get the closest section that contains this link
    const activeSection = activeLink.closest('.sidebar-item-section');

    if (activeSection) {
      // Expand this section
      const collapseElement = activeSection.querySelector('.collapse');
      collapseElement.classList.add('show');
    }
  }
  
  //// Update the sidebar state on click ////
  const topLevelItems = document.querySelectorAll('.sidebar-item.sidebar-item-section');

  topLevelItems.forEach(item => {
    const toggleLink = item.querySelector('.sidebar-item-text');

    toggleLink.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = toggleLink.getAttribute('data-bs-target');
      const targetSection = document.querySelector(targetId);

      // Collapse all other sections
      topLevelItems.forEach(otherItem => {
        if (otherItem !== item) {
          const otherTargetId = otherItem.querySelector('.sidebar-item-text').getAttribute('data-bs-target');
          const otherTargetSection = document.querySelector(otherTargetId);
          if (otherTargetSection.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(otherTargetSection).hide();
          }
        }
      });

      // Expand or collapse the clicked section
      const targetCollapse = bootstrap.Collapse.getOrCreateInstance(targetSection);
      if (targetSection.classList.contains('show')) {
        targetCollapse.hide();
      } else {
        targetCollapse.show();
      }
    });
  });
});
