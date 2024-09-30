let weightedPrizes = [];
let rotationAngle = 0; // 用于保存当前的转盘旋转角度
let prizeDistribution = {}; // 全局变量，存储奖品库存

// 从后端获取奖品库存
async function fetchPrizeDistribution() {
  try {
    const response = await fetch("http://localhost:3000/api/prizes");
    const data = await response.json();

    data.forEach((item) => {
      prizeDistribution[item.prize_name] = item.stock;
    });

    console.log("获取的奖品分布:", prizeDistribution); // 确认 prizeDistribution 被正确填充
    return prizeDistribution;
  } catch (error) {
    console.error("获取奖品数据失败", error);
  }
}

// 动态生成加权奖品池
function generateWeightedPrizes() {
  weightedPrizes = [];
  Object.entries(prizeDistribution).forEach(([prize, count]) => {
    for (let i = 0; i < count; i++) {
      weightedPrizes.push(prize); // 根据库存数量，重复加入奖品
    }
  });
}

// 验证是否可以进行多次抽奖
function validateDraws(drawTimes) {
  if (weightedPrizes.length < drawTimes) {
    alert(`奖品不足，只能抽 ${weightedPrizes.length} 次`);
    return false;
  }
  return true;
}

// 执行多次抽奖并旋转转盘
async function performDraws(drawTimes) {
  const results = [];

  for (let i = 0; i < drawTimes; i++) {
    if (weightedPrizes.length === 0) {
      alert(`奖品不足，只能抽 ${i} 次`);
      break;
    }

    const winningPrize =
      weightedPrizes[Math.floor(Math.random() * weightedPrizes.length)];

    // 更新前端库存
    prizeDistribution[winningPrize]--;
    generateWeightedPrizes(); // 重新生成奖池
    results.push(winningPrize);

    // 发送更新库存请求到后端
    try {
      const response = await fetch("http://localhost:3000/api/update-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prizeName: winningPrize }), // 将中奖奖品发送到后端
      });

      const result = await response.json();
      if (!result.success) {
        console.error("库存更新失败");
      }
    } catch (error) {
      console.error("更新库存请求失败", error);
    }
  }

  // 开始旋转转盘
  spinWheel(results);
}

// 显示抽奖结果
function showResults(results) {
  const resultMessage = results.join(", ");
  alert(`恭喜你获得: ${resultMessage}`);
}

// 旋转转盘的函数
function spinWheel(results) {
  const wheel = document.getElementById("wheel");

  if (!wheel) {
    console.error("转盘元素未找到");
    return;
  }

  const spinAngle = Math.floor(Math.random() * 360) + 360 * 5; // 随机旋转的角度，至少转5圈
  rotationAngle += spinAngle; // 累加旋转角度，保持转盘的持续旋转状态

  // 调试输出旋转角度
  console.log(`转盘开始旋转，旋转角度: ${rotationAngle}`);

  wheel.style.transition = "transform 5s ease-out"; // 设置旋转动画的时间和效果
  wheel.style.transform = `rotate(${rotationAngle}deg)`; // 应用新的旋转角度

  // 等待5秒钟旋转动画完成后，再弹出中奖结果
  setTimeout(function () {
    showResults(results);
  }, 5000);
}

// 设置多个抽奖按钮的点击事件
function setupDrawButtons() {
  document
    .getElementById("spin1Button")
    .addEventListener("click", async function () {
      console.log("点击了抽 1 次按钮"); // 调试输出，确认事件被触发
      if (validateDraws(1)) {
        await performDraws(1); // 抽 1 次
      }
    });

  document
    .getElementById("spin5Button")
    .addEventListener("click", async function () {
      console.log("点击了抽 5 次按钮"); // 调试输出
      if (validateDraws(5)) {
        await performDraws(5); // 抽 5 次
      }
    });

  document
    .getElementById("spin10Button")
    .addEventListener("click", async function () {
      console.log("点击了抽 10 次按钮"); // 调试输出
      if (validateDraws(10)) {
        await performDraws(10); // 抽 10 次
      }
    });
}

// SVG 圆形扇形绘制函数
function createSegment(angle, startAngle, color, label, radius) {
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

// 生成转盘的 SVG 扇形部分
function setupWheelGraphics() {
  const prizeList = Object.keys(prizeDistribution);
  const segmentCount = prizeList.length;
  const anglePerSegment = (2 * Math.PI) / segmentCount;
  const colors = generateGradientColors(segmentCount);

  const wheel = document.getElementById("wheel");
  wheel.innerHTML = ""; // 清空现有的内容
  let currentAngle = 0;

  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.25; // 根据屏幕大小动态调整半径

  prizeList.forEach((prize, index) => {
    const { path, text } = createSegment(
      anglePerSegment,
      currentAngle,
      colors[index % colors.length],
      prize,
      radius
    );
    wheel.appendChild(path);
    wheel.appendChild(text);
    currentAngle += anglePerSegment;
  });
}

// 动态生成渐变颜色
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

// 监听窗口尺寸变化，动态调整转盘大小
window.onresize = function () {
  setupWheelGraphics(); // 当窗口大小发生变化时重新绘制转盘
};

window.onload = async function () {
  const prizeDistribution = await fetchPrizeDistribution();
  if (prizeDistribution) {
    setupWheelGraphics(); // 初始化转盘图形
    generateWeightedPrizes(); // 初始化奖品池
    setupDrawButtons(); // 设置多个抽奖按钮的事件
  }

  // 设置初始旋转样式
  const wheel = document.getElementById("wheel");
  if (wheel) {
    wheel.style.transform = `rotate(0deg)`; // 初始设置旋转为0度
  }
};
