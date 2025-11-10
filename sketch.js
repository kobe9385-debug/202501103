let questionTable;
let allQuestions = [];
let quizQuestions = [];
const QUIZ_LENGTH = 10;

let currentQuestionIndex = 0;
let correctCount = 0;
let score = 0;
let gameState = 'start'; // 'start', 'quiz', 'result'

let answerButtons = [];
let feedback = '';
let feedbackColor;

// 互動效果的粒子
let particles = [];
let resultParticles = []; // 用於結果畫面的特殊動畫粒子

// 在 setup() 之前預先載入 CSV 檔案
function preload() {
  questionTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 將載入的表格資料轉換成我們喜歡的物件陣列格式
  for (let row of questionTable.rows) {
    let questionObj = {
      question: row.get('question'),
      options: [
        row.get('optionA'),
        row.get('optionB'),
        row.get('optionC'),
        row.get('optionD')
      ],
      correctAnswer: row.get('correctAnswer')
    };
    allQuestions.push(questionObj);
  }
  
  // 初始化粒子效果
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  background(51);
  
  // 繪製背景粒子效果
  for (let p of particles) {
    p.update();
    p.show();
  }

  // 根據不同的遊戲狀態繪製不同畫面
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'quiz') {
    drawQuizScreen();
  } else if (gameState === 'result') {
    // 更新並繪製結果動畫粒子
    for (let i = resultParticles.length - 1; i >= 0; i--) {
      let p = resultParticles[i];
      p.update();
      p.show();
      if (p.isDead()) {
        resultParticles.splice(i, 1);
      }
    }
    drawResultScreen();
  }
}

// --- 畫面繪製函數 ---

function drawStartScreen() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(50);
  text('p5.js 互動測驗', width / 2, height / 2 - 80);
  textSize(24);
  text('準備好了嗎？', width / 2, height / 2);
  
  // 開始按鈕
  let startButton = { x: width / 2 - 100, y: height / 2 + 60, w: 200, h: 60 };
  drawButton(startButton, '開始測驗');
}

function drawQuizScreen() {
  let q = quizQuestions[currentQuestionIndex];
  
  // 繪製題目
  textAlign(LEFT, TOP);
  fill(255);
  textSize(28);
  text(`第 ${currentQuestionIndex + 1} 題：\n${q.question}`, 50, 50);

    // 繪製右上角分數
    textAlign(RIGHT, TOP);
    fill(255, 255, 255, 200);
    textSize(24);
    text(`得分: ${score}`, width - 30, 30);


  // 繪製進度條
  drawProgressBar();

  // 繪製選項按鈕
  for (let i = 0; i < answerButtons.length; i++) {
    drawButton(answerButtons[i], q.options[i]);
  }
  
  // 繪製上一題的作答回饋
  if (feedback) { // 如果已經作答
    let isLastQuestion = currentQuestionIndex === QUIZ_LENGTH - 1;
    let buttonText = isLastQuestion ? '查看結果' : '下一題';
    let nextButton = { x: width / 2 - 100, y: height - 120, w: 200, h: 60 };
    drawButton(nextButton, buttonText);
  }
}

function drawResultScreen() {
  let feedbackText = '';
  let feedbackEmoji = '';

  if (correctCount === QUIZ_LENGTH) {
    feedbackText = '太神啦！你全對了！';
    // 煙火動畫會取代表情符號
    feedbackEmoji = ''; 
  } else if (correctCount === 0) {
    feedbackText = '再接再厲，下次會更好！';
    feedbackEmoji = ''; // 爆炸動畫會取代表情符號
  } else if (correctCount >= QUIZ_LENGTH * 0.75) {
    feedbackText = '表現優異，繼續努力！';
    feedbackEmoji = '👍😊';
  } else if (correctCount >= QUIZ_LENGTH * 0.5) {
    feedbackText = '還不錯，再加把勁！';
    feedbackEmoji = '🙂';
  } else {
    feedbackText = '別灰心，下次會更好！';
    feedbackEmoji = '💪';
  }

  textAlign(CENTER, CENTER);
  fill(255);
  textSize(60);
  text('測驗結束', width / 2, height / 2 - 150);
  
  // 將分數相關資訊的字體大小統一
  textSize(36);
  text(`總題數: ${QUIZ_LENGTH}`, width / 2, height / 2 - 80);
  text(`答對題數: ${correctCount}`, width / 2, height / 2 - 40);
  text(`總得分: ${score}`, width / 2, height / 2);
  
  // 將回饋文字下移以避免重疊
  textSize(32);
  fill(240, 220, 100);
  text(feedbackText, width / 2, height / 2 + 60);
  
  textSize(80);
  text(feedbackEmoji, width / 2, height / 2 + 130);

  // 重玩按鈕
  let restartButton = { x: width / 2 - 100, y: height - 120, w: 200, h: 60 };
  drawButton(restartButton, '再玩一次');
}

// --- 邏輯與輔助函數 ---

function startQuiz() {
  gameState = 'quiz';
  score = 0;
  correctCount = 0;
  currentQuestionIndex = 0;
  
  // 從所有題目中隨機抽取 QUIZ_LENGTH 題
  // 使用 map 進行深拷貝，避免修改原始題庫 allQuestions
  quizQuestions = shuffle(allQuestions).slice(0, QUIZ_LENGTH).map(q => {
    // 對每個抽出的問題，複製一份並打亂其選項順序
    const newQ = structuredClone(q); // 使用 structuredClone 進行更可靠的深拷貝
    newQ.options = shuffle(newQ.options);
    return newQ;
  });
  
  setupAnswerButtons();
}

function setupAnswerButtons() {
  answerButtons = [];
  let buttonW = 350;
  let buttonH = 60;
  let spacing = 20;
  let startY = 250;
  for (let i = 0; i < 4; i++) {
    let x = (i % 2 === 0) ? width / 2 - buttonW - spacing / 2 : width / 2 + spacing / 2;
    let y = (i < 2) ? startY : startY + buttonH + spacing;
    answerButtons.push({ x: x, y: y, w: buttonW, h: buttonH, id: i, state: 'default' });
  }
}

function checkAnswer(selectedIndex) {
  let q = quizQuestions[currentQuestionIndex];
  let selectedOption = q.options[selectedIndex];

  if (selectedOption === q.correctAnswer) {
    correctCount++;
    score = correctCount * 10;
    feedback = 'answered'; // 標記為已回答
    answerButtons[selectedIndex].state = 'correct';
    // 答對時產生慶祝粒子
    celebrate();
  } else {
    feedback = 'answered'; // 標記為已回答
    answerButtons[selectedIndex].state = 'incorrect';
    // 找出正確答案並標示為綠色
    const correctIndex = q.options.findIndex(opt => opt === q.correctAnswer);
    if (correctIndex !== -1) {
      answerButtons[correctIndex].state = 'correct';
    }
  }
}

function goToNextQuestion() {
  currentQuestionIndex++;
  feedback = ''; // 清除已回答標記
  if (currentQuestionIndex >= QUIZ_LENGTH) {
    gameState = 'result';
    setupResultAnimation(); // 觸發結果動畫
  } else {
    setupAnswerButtons(); // 為下一題重置按鈕
  }
}

function setupResultAnimation() {
  resultParticles = []; // 清空舊的粒子
  if (correctCount === QUIZ_LENGTH) {
    // 產生 5 個煙火
    for (let i = 0; i < 5; i++) {
      // 延遲產生，效果更好
      setTimeout(() => {
        resultParticles.push(new Particle(random(width * 0.2, width * 0.8), height, 'firework'));
      }, i * 300);
    }
  } else if (correctCount === 0) {
    // 產生一連串像手榴彈的連鎖爆炸
    const explosionCount = 7; // 總共要爆炸幾次
    const particlesPerExplosion = 40; // 每次爆炸產生多少粒子
    for (let i = 0; i < explosionCount; i++) {
      setTimeout(() => {
        const explosionX = random(width * 0.1, width * 0.9);
        const explosionY = random(height * 0.2, height * 0.8);
        for (let j = 0; j < particlesPerExplosion; j++) {
          resultParticles.push(new Particle(explosionX, explosionY, 'explosion'));
        }
      }, i * 150); // 每次爆炸間隔 150 毫秒
    }
  }
}

function mousePressed() {
  if (gameState === 'start') {
    let startButton = { x: width / 2 - 100, y: height / 2 + 60, w: 200, h: 60 };
    if (isMouseInButton(startButton)) {
      startQuiz();
    }
  } else if (gameState === 'quiz') {
    if (feedback) { // 如果已作答，則檢查是否點擊 "下一題"
      const nextButton = { x: width / 2 - 100, y: height - 120, w: 200, h: 60 };
      if (isMouseInButton(nextButton)) {
        goToNextQuestion();
      }
    } else { // 如果還沒作答，則檢查答案選項
      for (let i = 0; i < answerButtons.length; i++) {
        if (isMouseInButton(answerButtons[i])) {
          checkAnswer(i);
          break;
        }
      }
    }
  } else if (gameState === 'result') {
    let restartButton = { x: width / 2 - 100, y: height - 120, w: 200, h: 60 };
    if (isMouseInButton(restartButton)) {
      resultParticles = []; // 清除結果動畫
      gameState = 'start';
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 當視窗大小改變時，重新計算按鈕位置以保持佈局
  if (gameState === 'quiz') {
    setupAnswerButtons();
  }
}
function isMouseInButton(btn) {
  return mouseX > btn.x && mouseX < btn.x + btn.w &&
         mouseY > btn.y && mouseY < btn.y + btn.h;
}

function drawButton(btn, txt) {
  push();
  // 根據按鈕狀態決定顏色
  if (btn.state === 'correct') {
    fill(20, 180, 120); // 答對的綠色
    stroke(255);
    strokeWeight(3);
  } else if (btn.state === 'incorrect') {
    fill(200, 50, 80); // 答錯的紅色
    stroke(255);
    strokeWeight(3);
  } else if (isMouseInButton(btn) && !feedback) { // 只有在還沒作答時才有懸停效果
    fill(150, 180, 255); // 滑鼠懸停時變色
    stroke(255);
    strokeWeight(3);
  } else {
    fill(80, 120, 200);
    stroke(200);
    strokeWeight(1);
  }
  rect(btn.x, btn.y, btn.w, btn.h, 10); // 圓角矩形
  
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(20);
  text(txt, btn.x + btn.w / 2, btn.y + btn.h / 2);
  pop();
}

function drawProgressBar() {
  let progress = (currentQuestionIndex + 1) / QUIZ_LENGTH;
  let barWidth = width - 100;
  let barY = 180;
  
  // 背景條
  noStroke();
  fill(100);
  rect(50, barY, barWidth, 20, 10);
  
  // 進度條
  fill(100, 200, 255);
  rect(50, barY, barWidth * progress, 20, 10);
}

function celebrate() {
    for (let i = 0; i < 50; i++) {
        let p = new Particle(width / 2, height / 2, 'celebration');
        particles.push(p);
    }
}

// --- 互動效果類別 ---

class Particle {
  constructor(x, y, type = 'background') {
    this.type = type;
    this.pos = createVector(x, y);
    this.lifespan = 255;

    if (this.type === 'celebration') {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(2, 6));
        this.acc = createVector(0, 0.1); // 模擬重力
        this.color = color(random(150, 255), random(150, 255), random(100, 200), 255);
    } else if (this.type === 'firework') {
        this.vel = createVector(0, random(-12, -17)); // 向上發射
        this.acc = createVector(0, 0.2); // 重力
        this.color = color(255, 255, 0);
    } else if (this.type === 'explosion') {
        this.vel = p5.Vector.random2D().mult(random(3, 10));
        this.acc = createVector(0, 0.2); // 重力
        this.color = color(random(200, 255), random(50, 150), 0);
        this.lifespan = random(150, 255);
    }
    else { // 'background'
        // 背景粒子
        this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
        this.color = color(255, 255, 255, random(30, 80));
    }
    this.size = random(2, 5);
  }

  update() {
    if (this.type === 'firework' && this.vel.y >= 0) {
      // 煙火到達頂點，爆炸成碎片
      this.lifespan = 0; // 標記為死亡
      for (let i = 0; i < 100; i++) {
        resultParticles.push(new Particle(this.pos.x, this.pos.y, 'celebration'));
      }
    }

    this.pos.add(this.vel);
    if (this.type !== 'background') {
        this.vel.add(this.acc);
        this.lifespan -= 3;
    } else {
        // 背景粒子邊界處理
        if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
            this.pos.x = random(width);
            this.pos.y = random(height);
        }
    }
  }

  show() {
    noStroke();
    if (this.type !== 'background') {
        fill(red(this.color), green(this.color), blue(this.color), this.lifespan);
    } else {
        fill(this.color);
    }
    ellipse(this.pos.x, this.pos.y, this.size);
  }
  
  isDead() {
      return this.lifespan < 0;
  }
}
