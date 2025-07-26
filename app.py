from flask import Flask, render_template, jsonify, session, send_from_directory
import os
import random
import threading
import sys
import select

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # 在生产环境中应该使用更安全的密钥

# 全局变量用于存储歌曲使用情况
used_songs_global = set()

# 获取所有歌曲文件列表
def get_songs_list():
    songs_dir = 'songs'
    songs = []
    for file in os.listdir(songs_dir):
        if file.endswith(('.mp3', '.flac', '.wav')):
            # 从文件名中提取歌曲名和艺术家
            song_name = os.path.splitext(file)[0]  # 移除扩展名
            songs.append({
                'filename': file,
                'name': song_name
            })
    return songs

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_random_song')
def get_random_song():
    global used_songs_global
    
    # 获取所有歌曲
    songs = get_songs_list()
    
    # 过滤掉已使用的歌曲
    available_songs = [song for song in songs if song['filename'] not in used_songs_global]
    
    # 如果所有歌曲都已使用过，则重置列表
    if not available_songs:
        available_songs = songs
        used_songs_global.clear()
    
    # 随机选择一首歌曲
    selected_song = random.choice(available_songs)
    
    # 将选中的歌曲添加到已使用列表中
    used_songs_global.add(selected_song['filename'])
    
    # 返回歌曲信息
    return jsonify({
        'filename': selected_song['filename'],
        'name': selected_song['name'],
        'remaining': len(available_songs) - 1  # 剩余未使用的歌曲数量
    })

@app.route('/reset_session')
def reset_session():
    global used_songs_global
    # 清空全局歌曲记录
    used_songs_global.clear()
    
    # 获取所有歌曲数量
    songs = get_songs_list()
    
    # 返回重置确认和歌曲总数
    return jsonify({
        'message': '会话已重置',
        'total_songs': len(songs)
    })

@app.route('/songs/<path:filename>')
def song_file(filename):
    return send_from_directory('songs', filename)

def reset_used_songs():
    """
    重置已使用的歌曲列表
    """
    global used_songs_global
    used_songs_global.clear()
    print("歌曲历史记录已重置，所有歌曲重新变为可选。")
    return len(get_songs_list())

def check_for_reset_command():
    """
    检查终端输入，如果输入'reset'则重置歌曲历史记录
    """
    while True:
        try:
            # Windows系统使用msvcrt
            if os.name == 'nt':
                import msvcrt
                if msvcrt.kbhit():
                    char = msvcrt.getch().decode('utf-8')
                    if char.lower() == 'r':
                        # 检查是否是'reset'命令
                        cmd = input()  # 获取剩余的字符
                        if cmd.lower() == 'eset':
                            total_songs = reset_used_songs()
                            print(f"重置完成！总歌曲数: {total_songs}")
            # Unix/Linux系统使用select
            else:
                import select
                if select.select([sys.stdin], [], [], 0) == ([sys.stdin], [], []):
                    line = sys.stdin.readline()
                    if line.strip().lower() == 'reset':
                        total_songs = reset_used_songs()
                        print(f"重置完成！总歌曲数: {total_songs}")
        except:
            pass

def input_thread():
    """
    处理用户输入的线程
    """
    while True:
        user_input = input()
        if user_input.strip().lower() == 'reset':
            total_songs = reset_used_songs()
            print(f"重置完成！总歌曲数: {total_songs}")

if __name__ == '__main__':
    # 启动输入处理线程
    thread = threading.Thread(target=input_thread, daemon=True)
    thread.start()
    
    print("服务器启动成功！")
    print("在终端中输入 'reset' 可以重置歌曲历史记录")
    print("按 Ctrl+C 可以停止服务器")
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)