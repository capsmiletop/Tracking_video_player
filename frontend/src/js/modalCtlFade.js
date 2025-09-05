document.addEventListener("DOMContentLoaded", () => {
    const controls = document.querySelector('.controls');
    let hideTimeout;

    function showControls() {
        controls.classList.add('show');
        clearTimeout(hideTimeout);

        // Hide after 2 seconds of no movement
        hideTimeout = setTimeout(() => {
        controls.classList.remove('show');
        }, 2000);
    }

    // Show controls on mouse move inside the video container
    document.addEventListener('mousemove', showControls);

    // Optional: Hide immediately when mouse leaves
    document.addEventListener('mouseleave', () => {
        controls.classList.remove('show');
    });

    // Initially show controls for a moment
    showControls();

    function modalControl() {
        // Get the image and insert it inside the modal - use its "alt" text as a caption

        var imgModal = document.getElementsByClassName("modal")[0]
        var span = document.getElementsByClassName("close")[0]

        imgModal.onclick = function() {
            imgModal.style.display = "none"
        }
        span.onclick = function() {
            span.style.display = "none"
        }
    }
    modalControl()
})