// 当页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取页面元素
    const showAnswerBtn = document.getElementById('show-answer');
    const nextSongBtn = document.getElementById('next-song');
    const songTitle = document.getElementById('song-title');
    const answerDiv = document.getElementById('answer');
    const songNameSpan = document.getElementById('song-name');
    const remainingCountSpan = document.getElementById('remaining-count');
    const songPlayer = document.getElementById('song-player');
    const scoreValue = document.getElementById('score-value');
    const answerControls = document.getElementById('answer-controls');
    const correctBtn = document.getElementById('correct-btn');
    const wrongBtn = document.getElementById('wrong-btn');
    const skipBtn = document.getElementById('skip-btn');
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const resetBtn = document.getElementById('reset-btn');
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    
    // 当前歌曲信息
    let currentSong = null;
    let score = 0;
    let history = [];
    let historyVisible = false;
    
    // 页面初始化
    songTitle.textContent = '点击"下一首"开始游戏';
    showAnswerBtn.disabled = true;
    songPlayer.style.display = 'none'; // 初始隐藏播放器
    
    // 从本地存储加载分数和历史记录
    loadGameState();
    
    // 显示答案按钮点击事件
    showAnswerBtn.addEventListener('click', function() {
        answerDiv.classList.remove('hidden');
        showAnswerBtn.disabled = true;
        answerControls.classList.remove('hidden');
    });
    
    // 对按钮点击事件
    correctBtn.addEventListener('click', function() {
        score += 2;
        updateScore();
        addToHistory(currentSong.name, 'correct');
        answerControls.classList.add('hidden');
        songPlayer.pause();
    });
    
    // 错按钮点击事件
    wrongBtn.addEventListener('click', function() {
        score -= 1;
        updateScore();
        addToHistory(currentSong.name, 'wrong');
        answerControls.classList.add('hidden');
        songPlayer.pause();
    });
    
    // 过按钮点击事件
    skipBtn.addEventListener('click', function() {
        addToHistory(currentSong.name, 'skip');
        answerControls.classList.add('hidden');
        songPlayer.pause();
    });
    
    // 下一首按钮点击事件
    nextSongBtn.addEventListener('click', function() {
        // 发送请求获取随机歌曲
        fetch('/get_random_song')
            .then(response => response.json())
            .then(data => {
                // 保存当前歌曲信息
                currentSong = data;
                
                // 更新页面内容
                songTitle.textContent = '这是哪首歌？';
                songNameSpan.textContent = data.name;
                remainingCountSpan.textContent = data.remaining;
                
                // 设置音频源并显示播放器
                songPlayer.src = '/songs/' + encodeURIComponent(data.filename);
                songPlayer.style.display = 'block';
                showAnswerBtn.disabled = false;
                
                // 隐藏答案
                answerDiv.classList.add('hidden');
                answerControls.classList.add('hidden');
                
                // 自动播放歌曲
                songPlayer.play();
            })
            .catch(error => {
                console.error('Error:', error);
                songTitle.textContent = '获取歌曲时出错，请刷新页面重试';
            });
    });
    
    // 切换历史记录显示
    toggleHistoryBtn.addEventListener('click', function() {
        historyVisible = !historyVisible;
        if (historyVisible) {
            historySection.classList.remove('hidden');
            toggleHistoryBtn.textContent = '隐藏历史记录';
            showHistory();
        } else {
            historySection.classList.add('hidden');
            toggleHistoryBtn.textContent = '显示历史记录';
        }
    });
    
    // 清空分数按钮点击事件
    resetBtn.addEventListener('click', function() {
        if (confirm('确定要清空分数和历史记录吗？')) {
            score = 0;
            history = [];
            updateScore();
            saveGameState();
            showHistory(); // 更新历史记录显示
        }
    });
    
    // 更新分数显示
    function updateScore() {
        scoreValue.textContent = score;
        saveGameState();
    }
    
    // 添加到历史记录
    function addToHistory(songName, result) {
        history.push({
            song: songName,
            result: result,
            time: new Date().toLocaleString()
        });
        saveGameState();
        // 如果历史记录区域是打开的，更新显示
        if (historyVisible) {
            showHistory();
        }
    }
    
    // 显示历史记录
    function showHistory() {
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<p>暂无历史记录</p>';
        } else {
            // 倒序显示，最新的在最上面
            for (let i = history.length - 1; i >= 0; i--) {
                const item = history[i];
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                
                let resultText = '';
                let resultClass = '';
                
                switch (item.result) {
                    case 'correct':
                        resultText = '对';
                        resultClass = 'result-correct';
                        break;
                    case 'wrong':
                        resultText = '错';
                        resultClass = 'result-wrong';
                        break;
                    case 'skip':
                        resultText = '过';
                        resultClass = 'result-skip';
                        break;
                }
                
                historyItem.innerHTML = `
                    <span class="history-song">${item.song}</span>
                    <span class="history-result ${resultClass}">${resultText}</span>
                `;
                
                historyList.appendChild(historyItem);
            }
        }
    }
    
    // 保存游戏状态到本地存储
    function saveGameState() {
        const gameState = {
            score: score,
            history: history
        };
        localStorage.setItem('songGame_state', JSON.stringify(gameState));
    }
    
    // 从本地存储加载游戏状态
    function loadGameState() {
        const savedState = localStorage.getItem('songGame_state');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            score = gameState.score || 0;
            history = gameState.history || [];
            updateScore();
        }
    }
});