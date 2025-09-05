document.addEventListener("DOMContentLoaded", () => {
  function createFlower() {
        const flower = document.createElement('div');
        flower.classList.add('flower');

        // Random horizontal position
        flower.style.left = Math.random() * window.innerWidth + 'px';

        // Random animation duration
        const duration = 3 + Math.random() * 2;
        flower.style.animationDuration = duration + 's';

        // Add flower to body
        document.body.appendChild(flower);

        // Remove flower after animation ends
        flower.addEventListener('animationend', () => {
          flower.remove();
        });
      }

      // Spray flowers for 2 seconds
      let count = 0;
      const flowerInterval = setInterval(() => {
        createFlower();
        count++;
        if (count > 30) clearInterval(flowerInterval); // stop after 30 flowers
  }, 100);  
})
