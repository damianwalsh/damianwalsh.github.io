document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-dialog-trigger]').forEach(btn => {
    btn.addEventListener('click', function() {
      const dialogId = btn.getAttribute('data-dialog-trigger');
      const dialog = document.getElementById(dialogId);
      if (dialog) {
        dialog.showModal();
      }
    });
  });
});
