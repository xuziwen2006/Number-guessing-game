// 游戏状态
const gameState = {
    answer: '',
    attempts: 0,
    history: [],
    gameOver: false,
    bestScore: localStorage.getItem('bestScore') || null,
    startTime: null
};

// DOM元素
const elements = {
    // 游戏状态
    attemptCount: document.getElementById('attemptCount'),
    bestScore: document.getElementById('bestScore'),
    totalAttempts: document.getElementById('totalAttempts'),
    
    // 输入和按钮
    guessInput: document.getElementById('guessInput'),
    guessBtn: document.getElementById('guessBtn'),
    newGameBtn: document.getElementById('newGameBtn'),
    charCount: document.getElementById('charCount'),
    
    // 反馈区域
    feedbackText: document.getElementById('feedbackText'),
    feedbackHint: document.getElementById('feedbackHint'),
    suggestion: document.getElementById('suggestion'),
    
    // 历史记录
    historyList: document.getElementById('historyList'),
    
    // 模态框
    successModal: document.getElementById('successModal'),
    answerDisplay: document.getElementById('answerDisplay'),
    finalAttempts: document.getElementById('finalAttempts'),
    performanceRating: document.getElementById('performanceRating'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    newGameModalBtn: document.getElementById('newGameModalBtn'),
    
    // 其他按钮
    showAnswerBtn: document.getElementById('showAnswerBtn'),
    hintBtn: document.getElementById('hintBtn'),
    resetBtn: document.getElementById('resetBtn'),
    shareBtn: document.getElementById('shareBtn')
};

// 生成四位无重复数字
function generateAnswer() {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const shuffled = [...digits].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4).join('');
}

// 初始化游戏
function initGame() {
    gameState.answer = generateAnswer();
    gameState.attempts = 0;
    gameState.history = [];
    gameState.gameOver = false;
    gameState.startTime = Date.now();
    
    // 更新UI
    updateStats();
    clearHistory();
    updateFeedback('等待你的第一次猜测...', '提示：数字完全匹配指的是位置和数字都正确');
    updateSuggestion('建议从1234开始，逐步缩小数字范围');
    
    // 重置输入
    elements.guessInput.value = '';
    updateCharCount();
    elements.guessInput.focus();
    
    console.log('新游戏谜底:', gameState.answer);
}

// 更新统计信息
function updateStats() {
    elements.attemptCount.textContent = gameState.attempts;
    elements.totalAttempts.textContent = gameState.attempts;
    elements.bestScore.textContent = gameState.bestScore || '-';
}

// 更新字符计数
function updateCharCount() {
    const count = elements.guessInput.value.length;
    elements.charCount.textContent = count;
    elements.charCount.style.color = count === 4 ? 'var(--color-success)' : 'var(--color-text-secondary)';
}

// 检查猜测
function checkGuess(guess) {
    let matches = 0;
    for (let i = 0; i < 4; i++) {
        if (guess[i] === gameState.answer[i]) {
            matches++;
        }
    }
    return matches;
}

// 处理猜测
function makeGuess() {
    if (gameState.gameOver) return;
    
    const guess = elements.guessInput.value.trim();
    
    // 验证输入
    if (!/^\d{4}$/.test(guess)) {
        updateFeedback('请输入4位数字（0-9）', '例如：1234 或 5678', 'error');
        return;
    }
    
    const matches = checkGuess(guess);
    const timeString = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // 添加到历史
    gameState.history.unshift({
        guess: guess,
        matches: matches,
        time: timeString
    });
    
    gameState.attempts++;
    
    // 添加到历史记录显示
    addHistoryItem(guess, matches, timeString);
    
    // 更新反馈
    const feedbackMessages = [
        { 
            main: '💣 完全偏离目标', 
            hint: '没有一个数字在正确的位置上' 
        },
        { 
            main: '🔍 发现1个正确位置', 
            hint: '继续探索其他位置' 
        },
        { 
            main: '🎯 不错！2个位置正确', 
            hint: '保持这个势头' 
        },
        { 
            main: '🔥 接近成功！3个位置正确', 
            hint: '离胜利只有一步之遥' 
        }
    ];
    
    if (matches === 4) {
        // 猜中了！
        gameState.gameOver = true;
        updateFeedback('🎉 恭喜！排雷成功！', '你找到了隐藏的数字', 'success');
        updateSuggestion('太棒了！你完美地完成了推理');
        
        // 显示成功模态框
        showSuccessModal();
        
        // 更新最佳记录
        if (!gameState.bestScore || gameState.attempts < parseInt(gameState.bestScore)) {
            gameState.bestScore = gameState.attempts.toString();
            localStorage.setItem('bestScore', gameState.attempts);
            elements.bestScore.textContent = gameState.bestScore;
        }
    } else {
        // 未猜中，显示相应反馈
        const feedback = feedbackMessages[matches];
        updateFeedback(feedback.main, feedback.hint, getFeedbackColor(matches));
        
        // 更新建议
        updateGameSuggestion();
    }
    
    // 更新统计信息
    updateStats();
    
    // 清空输入框
    elements.guessInput.value = '';
    updateCharCount();
    elements.guessInput.focus();
}

// 获取反馈颜色
function getFeedbackColor(matches) {
    switch(matches) {
        case 0: return 'error';
        case 1: return 'warning';
        case 2: return 'info';
        case 3: return 'success';
        default: return 'primary';
    }
}

// 更新反馈
function updateFeedback(mainText, hintText = '', type = 'info') {
    elements.feedbackText.textContent = mainText;
    elements.feedbackHint.textContent = hintText;
    
    // 设置颜色
    const colors = {
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
        info: 'var(--color-primary)'
    };
    
    elements.feedbackText.style.color = colors[type] || colors.info;
}

// 更新建议
function updateSuggestion(text) {
    elements.suggestion.textContent = text;
}

// 更新游戏建议
function updateGameSuggestion() {
    if (gameState.attempts === 0) {
        updateSuggestion('建议从1234开始，逐步缩小数字范围');
    } else if (gameState.attempts === 1) {
        updateSuggestion('尝试使用5678来测试另一组数字');
    } else if (gameState.attempts <= 3) {
        updateSuggestion('根据匹配数调整你的策略');
    } else if (gameState.history.some(h => h.matches >= 2)) {
        updateSuggestion('你已经掌握了部分数字，继续推理位置');
    } else {
        updateSuggestion('保持耐心，系统性地测试各种可能性');
    }
}

// 添加历史记录项
function addHistoryItem(guess, matches, time) {
    // 移除空状态提示
    const emptyState = elements.historyList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // 创建历史记录项
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    historyItem.innerHTML = `
        <div class="history-item-header">
            <span class="history-index">#${gameState.history.length}</span>
            <span class="history-time">${time}</span>
        </div>
        <div class="history-content">
            <span class="history-guess">${guess}</span>
            <span class="history-match match-${matches}">
                <i class="fas fa-bullseye"></i>
                ${matches} 匹配
            </span>
        </div>
    `;
    
    // 添加到列表顶部
    elements.historyList.insertBefore(historyItem, elements.historyList.firstChild);
}

// 清空历史记录
function clearHistory() {
    elements.historyList.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-search"></i>
            </div>
            <h3>开始你的推理之旅</h3>
            <p>每次猜测都会记录在这里，帮助你分析规律</p>
        </div>
    `;
}

// 显示成功模态框
function showSuccessModal() {
    const timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    elements.answerDisplay.textContent = gameState.answer;
    elements.finalAttempts.textContent = gameState.attempts;
    
    // 根据尝试次数评级
    let rating = '新手';
    if (gameState.attempts <= 4) rating = '推理大师';
    else if (gameState.attempts <= 6) rating = '专家级';
    else if (gameState.attempts <= 8) rating = '熟练者';
    else if (gameState.attempts <= 10) rating = '入门级';
    
    elements.performanceRating.textContent = rating;
    elements.successModal.style.display = 'block';
}

// 显示答案
function showAnswer() {
    if (!gameState.gameOver) {
        gameState.gameOver = true;
        gameState.attempts++;
        showSuccessModal();
    }
}

// 获取提示
function getHint() {
    if (gameState.attempts === 0) {
        updateFeedback('💡 提示：从1234或5678开始测试', '这样可以快速确定数字范围', 'info');
    } else if (gameState.history.length > 0) {
        const lastGuess = gameState.history[0].guess;
        const matches = gameState.history[0].matches;
        
        let hint = '';
        if (matches === 0) {
            hint = '💡 提示：尝试完全不同的数字组合';
        } else if (matches === 1) {
            hint = '💡 提示：保留匹配的数字，调整其他位置';
        } else if (matches >= 2) {
            hint = '💡 提示：你已接近成功，继续测试其他可能性';
        }
        
        updateFeedback(hint, '基于上一次猜测的分析', 'info');
    }
}

// 重置游戏
function resetGame() {
    if (confirm('确定要重置游戏吗？当前进度将丢失。')) {
        initGame();
    }
}

// 分享战绩
function shareResult() {
    const shareText = `我在"数字排雷"游戏中用${gameState.attempts}次成功找出数字${gameState.answer}！\n挑战链接：${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: '数字排雷 - 我的战绩',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('战绩已复制到剪贴板！');
        });
    }
}

// 事件监听
function setupEventListeners() {
    // 猜测按钮
    elements.guessBtn.addEventListener('click', makeGuess);
    
    // 输入框事件
    elements.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            makeGuess();
        }
    });
    
    elements.guessInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
        updateCharCount();
    });
    
    // 新游戏按钮
    elements.newGameBtn.addEventListener('click', () => {
        if (confirm('开始新游戏？当前进度将丢失。')) {
            initGame();
        }
    });
    
    // 查看答案按钮
    elements.showAnswerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAnswer();
    });
    
    // 提示按钮
    elements.hintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        getHint();
    });
    
    // 重置按钮
    elements.resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetGame();
    });
    
    // 模态框按钮
    elements.modalCloseBtn.addEventListener('click', () => {
        elements.successModal.style.display = 'none';
    });
    
    elements.newGameModalBtn.addEventListener('click', () => {
        elements.successModal.style.display = 'none';
        initGame();
    });
    
    elements.shareBtn.addEventListener('click', shareResult);
    
    // 点击模态框外部关闭
    elements.successModal.addEventListener('click', (e) => {
        if (e.target === elements.successModal || e.target.classList.contains('modal-overlay')) {
            elements.successModal.style.display = 'none';
        }
    });
}

// 页面加载
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initGame();
    
    // 加载最佳记录
    if (gameState.bestScore) {
        elements.bestScore.textContent = gameState.bestScore;
    }
    
    // 初始字符计数
    updateCharCount();
    
    // 初始焦点
    elements.guessInput.focus();
});