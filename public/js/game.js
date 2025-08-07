document.addEventListener("DOMContentLoaded", () => {
  const styles = ["green", "purple", "blue"];
  let coins = 0;

  const requestedStyle = document.getElementById("requested-style");
  const result = document.getElementById("result");
  const coinsDisplay = document.getElementById("coins");

  function randomStyle() {
    const index = Math.floor(Math.random() * styles.length);
    return styles[index];
  }

  let currentStyle = randomStyle();
  requestedStyle.textContent = currentStyle;

  document.querySelectorAll(".tool").forEach(button => {
    button.addEventListener("click", () => {
      const picked = button.dataset.style;
      if (picked === currentStyle) {
        coins += 10;
        result.textContent = "✅ Correct!";
        result.style.color = "green";
      } else {
        result.textContent = "❌ Wrong! Try again.";
        result.style.color = "red";
      }
      coinsDisplay.textContent = `💰 Coins: ${coins}`;
      currentStyle = randomStyle();
      requestedStyle.textContent = currentStyle;
    });
  });
});
