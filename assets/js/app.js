// Fintech Modernist - Main App Script
document.addEventListener('DOMContentLoaded', () => {
    // Quick Add FAB Interaction
    const fabButtons = document.querySelectorAll('button.fixed.bottom-28.right-6');
    fabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Transaction modal opened!');
        });
    });
});
