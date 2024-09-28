let weightedPrizes = [];

// 从后端获取奖品库存
async function fetchPrizeDistribution() {
  try {
    const response = await fetch("http://localhost:3000/api/prizes");
    const data = await response.json();

    const prizeDistribution = {};
    data.forEach((item) => {
      prizeDistribution[item.prize_name] = item.stock;
    });

    return prizeDistribution;
  } catch (error) {
    console.error("获取奖品数据失败", error);
  }
}

function generateWeightedPrizes(prizeDistribution) {
  weightedPrizes = [];
  Object.entries(prizeDistribution).forEach(([prize, count]) => {
    for (let i = 0; i < count; i++) {
      weightedPrizes.push(prize);
    }
  });
}

function setupWheel(prizeDistribution) {
  generateWeightedPrizes(prizeDistribution);

  document
    .getElementById("spinButton")
    .addEventListener("click", async function () {
      if (weightedPrizes.length === 0) {
        alert("所有奖品已抽完！");
        return;
      }

      const winningPrize =
        weightedPrizes[Math.floor(Math.random() * weightedPrizes.length)];

      spinWheel(winningPrize, prizeDistribution);
    });
}

function createSegment(angle, startAngle, color, label) {
  const radius = 250;
  const x1 = radius * Math.cos(startAngle);
  const y1 = radius * Math.sin(startAngle);
  const x2 = radius * Math.cos(startAngle + angle);
  const y2 = radius * Math.sin(startAngle + angle);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const largeArcFlag = angle > Math.PI ? 1 : 0;
  const d = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  path.setAttribute("d", d);
  path.setAttribute("fill", color);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  const textAngle = startAngle + angle / 2;
  const textX = (radius / 1.5) * Math.cos(textAngle);
  const textY = (radius / 1.5) * Math.sin(textAngle);
  text.setAttribute("x", textX);
  text.setAttribute("y", textY);
  text.setAttribute(
    "transform",
    `rotate(${(textAngle * 180) / Math.PI} ${textX} ${textY})`
  );
  text.textContent = label;

  return { path, text };
}

function setupWheelGraphics(prizeDistribution) {
  const prizeList = Object.keys(prizeDistribution);
  const segmentCount = prizeList.length;
  const anglePerSegment = (2 * Math.PI) / segmentCount;

  const colors = generateGradientColors(segmentCount);

  const wheel = document.getElementById("wheel");
  let currentAngle = 0;

  prizeList.forEach((prize, index) => {
    const { path, text } = createSegment(
      anglePerSegment,
      currentAngle,
      colors[index % colors.length],
      prize
    );
    wheel.appendChild(path);
    wheel.appendChild(text);
    currentAngle += anglePerSegment;
  });
}

function generateGradientColors(count) {
  const colors = [];
  const hue = 0;
  const saturation = 70;
  const lightnessStart = 30;
  const lightnessEnd = 90;

  for (let i = 0; i < count; i++) {
    const lightness =
      lightnessStart + ((lightnessEnd - lightnessStart) / count) * i;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}

window.onload = async function () {
  const prizeDistribution = await fetchPrizeDistribution();
  if (prizeDistribution) {
    setupWheelGraphics(prizeDistribution);
    setupWheel(prizeDistribution);
  }
};

let rotationAngle = 0;

function spinWheel(winningPrize, prizeDistribution) {
  const wheel = document.getElementById("wheel");

  const spinAngle = Math.floor(Math.random() * 360) + 360 * 5;
  rotationAngle += spinAngle;

  wheel.style.transition = "transform 5s ease-out";
  wheel.style.transform = `rotate(${rotationAngle}deg)`;

  setTimeout(async function () {
    try {
      const response = await fetch("http://localhost:3000/api/update-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prizeName: winningPrize }),
      });

      const result = await response.json();
      if (result.success) {
        prizeDistribution[winningPrize]--;
        generateWeightedPrizes(prizeDistribution);
        alert(`恭喜你获得: ${winningPrize}`);
      } else {
        alert("库存更新失败");
      }
    } catch (error) {
      console.error("更新库存失败", error);
    }
  }, 5000); // 5秒后弹出结果，确保转盘已经完成旋转
}
