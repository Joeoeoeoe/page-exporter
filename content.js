// document是整个
// 仍然有一个问题：当对话内容很长的时候，可能出现加载内容不完全
// 此时可能不会报错，但是也可能由于找到的第一段话不是用户问题导致报错

// 状态
let roundsCheck = Boolean()
let questionsCheck = Boolean()
let thinksCheck = Boolean()
let answersCheck = Boolean()
let formatSelect = ".md"
readStates()

// 监听 checkbox 状态变化，确保 `content.js` 能同步 popup 的变化
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.checkboxStates) {
        readStates()
    }
});
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.formatState) {
        readStates()
    }
});

// 读取存储的 checkbox 状态
function readStates(){
    // 这个读取函数的api似乎是异步的？
    chrome.storage.local.get("checkboxStates", (data) => {
        const states = data.checkboxStates || {};
        roundsCheck = states["checkbox-rounds"]
        questionsCheck = states["checkbox-questions"]
        thinksCheck = states["checkbox-thinks"]
        answersCheck = states["checkbox-answers"]
    });
    chrome.storage.local.get("formatState", (data) => {
        formatSelect = data.formatState || ".md" // state
    })
}

function logState(){
    console.log(roundsCheck,questionsCheck,thinksCheck,answersCheck)
    console.log(formatSelect)
}


// 存储当前内容的变量
let currentTitle = "";
let currentQuestions = "";
let currentThinks = "";
let currentAnswers = "";
// 初始加载所有文本内容
chrome.storage.local.get(["textTitle", "textQuestions", "textThinks", "textAnswers"], (data) => {
    if (data.textTitle) currentTitle = data.textTitle;
    if (data.textQuestions) currentQuestions = data.textQuestions;
    if (data.textThinks) currentThinks = data.textThinks;
    if (data.textAnswers) currentAnswers = data.textAnswers;
});
// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {

        if (changes.textTitle) {
            currentTitle = changes.textTitle.newValue;
            console.log("Title updated:", currentTitle);
        }
        if (changes.textQuestions) {
            currentQuestions = changes.textQuestions.newValue;
            console.log("Questions updated:", currentQuestions);
        }
        if (changes.textThinks) {
            currentThinks = changes.textThinks.newValue;
            console.log("Thinks updated:", currentThinks);
        }
        if (changes.textAnswers) {
            currentAnswers = changes.textAnswers.newValue;
            console.log("Answers updated:", currentAnswers);
        }

    }
});




// 全局按钮
createButtons()
setInterval(() => {
    if (!document.getElementById('export-chat')) {
        createButtons();
    }
}, 5000); // 每5秒检查一次


function createButtons() {
    const singleButton = (content, id, topScale, listener) => {
        // 创建按钮元素
        const exportButton = document.createElement('button');
        exportButton.textContent = content;
        exportButton.id = id;

        const styles = {
            position: 'fixed',
            width: '72px',
            height: '36px',
            top: topScale,
            right: '5%',
            zIndex: '10000',  // 确保 z-index 足够高
            padding: '10px',
            backgroundColor: '#dbeafe',
            fontSize: '16px',
            color: '#4d6bfe',
            border: '1px solid black',
            borderRadius: '5px',
            cursor: 'pointer',
            textAlign: 'center',
            lineHeight: '16px'
        };


        document.body.appendChild(exportButton);
        Object.assign(exportButton.style, styles);

        // 添加点击事件监听器
        exportButton.addEventListener('click', listener);
    }

    const getCalculatedTop = (percentage, additionalPx) => {
        const percentageHeight = window.innerHeight * (parseFloat(percentage) / 100);
        return `calc(${percentageHeight}px + ${additionalPx})`;
    };

    // 传入按钮的 `top` 为动态计算的值
    singleButton('导出', 'export-chat', getCalculatedTop(6, '0px'), download);
    singleButton('拷贝', 'copy-chat', getCalculatedTop(6, '36px'), copy);
}




// 获取原始内容
function removeScriptTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('script').forEach(script => script.remove());
    return div.innerHTML;
}
function _deprecated_getDialogs(){
    // 标题
    const title = document.querySelector('.d8ed659a').textContent // 标题
    // 尝试多个可能的选择器来匹配消息元素
    const dialogElements = document.querySelectorAll('.fbb737a4, ._4f9bf79'); // User DeepSeek
    const dialogs = [];
    let rounds = -1 // 有几轮对话
    let tempRound = {"user":"", "think":"", "answer":""} // 用来快速建立新的一轮对话
    for (let i=0; i<dialogElements.length;++i){
        const element = dialogElements[i]
        let stage = element.classList.contains('fbb737a4') ? 'user' : 'answer' // 一轮问答的第几个阶段
        let content = '' // 保留html的格式
        if (stage === 'user') {
            const userElement = element.querySelector('.fbb737a4');
            content = userElement ? userElement.innerHTML : element.innerHTML;
            // 说明这是新的一轮对话
            ++rounds
            dialogs.push({...tempRound})
            // 存储内容
            dialogs[rounds]['user'] = content
        } else {
            // think
            const thinkElement = element.querySelector('._48edb25');
            if(thinkElement){
                content = thinkElement.innerHTML
                stage = 'think'
                // 存储内容
                dialogs[rounds]['think'] = content
            }
            
            // answer
            const answerElement = element.querySelector('.ds-markdown');
            if (answerElement) {
                content = answerElement.innerHTML;
                // 存储内容
                dialogs[rounds]['answer'] = content
            }
        }
    }
    ++rounds
    return [title,dialogs];
}
function getDialogs(){
    // console.log("in getDialogs!")
    let backup_titleClass = '.d8ed659a'
    let backup_userClass = '.fbb737a4'
    let backup_thinkClass = '._4f9bf79 ._48edb25'
    let backup_answerClass = '._4f9bf79 .ds-markdown'

    let titleClass = currentTitle.length !== 0 ? currentTitle : backup_titleClass
    let userClass = currentQuestions.length !== 0 ? currentQuestions : backup_userClass
    let thinkClass = currentThinks.length !== 0 ? currentThinks : backup_thinkClass
    let answerClass = currentAnswers.length !== 0 ? currentAnswers : backup_answerClass
    // console.log(titleClass, userClass, thinkClass, answerClass)

    // 标题
    const titleElement = document.querySelector(titleClass)
    const title = titleElement ? titleElement.textContent : "title" // 标题
    // 尝试多个可能的选择器来匹配消息元素
    const dialogElements = document.querySelectorAll(`${userClass}, ${thinkClass}, ${answerClass}`); // User DeepSeek
    const dialogs = [];
    let rounds = -1 // 有几轮对话
    let tempRound = {"user":"", "think":"", "answer":""} // 用来快速建立新的一轮对话
    for (let i=0; i<dialogElements.length;++i){
        const element = dialogElements[i]
        let stage = element.matches(userClass) ? 'user'
            : element.matches(thinkClass)? 'think' : 'answer' // 一轮问答的第几个阶段
        let content = '' // 保留html的格式
        if (stage === 'user') {
            const userElement = element.querySelector(userClass);
            content = removeScriptTags(
                userElement ? userElement.innerHTML : element.innerHTML
            );
            // 说明这是新的一轮对话
            ++rounds
            dialogs.push({...tempRound})
            // 存储内容
            dialogs[rounds]['user'] = content
        } else if(stage === 'think') {
            // think
            const thinkElement = element.querySelector(thinkClass);
            content = removeScriptTags(thinkElement ? thinkElement.innerHTML : element.innerHTML);
            if(rounds===-1 || dialogs[rounds]['think'].length !== 0) {
                // 说明user的获取出错了，但是仍然应该看作新的一轮对话
                ++rounds
                dialogs.push({...tempRound})
            }
            dialogs[rounds]['think'] = content
        } else {
            // answer
            const answerElement = element.querySelector(answerClass);
            content = removeScriptTags(answerElement ? answerElement.innerHTML : element.innerHTML);
            if(rounds===-1 || dialogs[rounds]['answer'].length !== 0) {
                // 说明user的获取出错了，但是仍然应该看作新的一轮对话
                ++rounds
                dialogs.push({...tempRound})
            }
            dialogs[rounds]['answer'] = content
        }
    }
    ++rounds
    return [title,dialogs];
}



function toMarkdown(rawHtml){
    let turndownService = new TurndownService({
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',  // 让无序列表使用 `-`
        headingStyle: 'atx',  // 使用 Atx-style 语法，避免 Setext-style
        hr: '---',
    });

    // 添加自定义代码块规则
    turndownService.addRule('headingStyle', {
        filter: ['h1', 'h2'],
        replacement: function (content, node) {
            const level = node.tagName === 'H1' ? '#' : '##';
            return `${level} ${content}\n`;
        }
    });
    turndownService.addRule('customCodeBlock', {
        filter: (node) => {
            // 匹配包含代码块的 div
            return (
                node.nodeName === 'DIV' &&
                node.classList.contains('md-code-block')
            );
        },
        replacement: (content, node) => {
            // 提取代码语言（如 html）
            const languageNode = node.querySelector('.md-code-block-infostring');
            const language = languageNode ? languageNode.textContent.trim() : '';

            // 提取 pre 标签中的原始代码内容（忽略语法高亮 span）
            const preNode = node.querySelector('pre')
            const preContent = preNode? preNode.textContent : '';

            // 拼接为 Markdown 代码块
            return `\n\n\`\`\`${language}\n${preContent}\n\`\`\`\n\n`;
        }
    });

    turndownService.addRule('table', {
        filter: 'table',
        replacement: function (content, node) {
            let markdownTable = '';
            const rows = Array.from(node.querySelectorAll('tr'));

            rows.forEach((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll('th, td'))
                    .map(cell => cell.textContent.trim())
                    .join(' | ');

                markdownTable += `| ${cells} |\n`;

                // 添加表头的分隔行
                if (rowIndex === 0) {
                    markdownTable += `|${'- | '.repeat(row.childElementCount)}\n`;
                }
            });

            return markdownTable;
        }
    });


    return turndownService.turndown(rawHtml)
}


function toHtml(rawHtml){
    return `
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Document</title>
    </head>
    <body>
        ${rawHtml}
    </body>
    </html>
    `
}

function toDocx(rawHtml){
    const docx = htmlDocx.asBlob(rawHtml);
    return docx
}

function toTxt(rawHtml){
    // const parser = new DOMParser();
    // const doc = parser.parseFromString(rawHtml, 'text/html');
    // const strippedContent = doc.body.textContent || doc.body.innerText; // 提取纯文本内容
    // return strippedContent
    return window.htmlToText(rawHtml, {
        wordwrap: 130, // 设置换行宽度
        ignoreImage: true, // 忽略图片
        ignoreHref: true, // 忽略链接
    });
}




// 下载
function prepareInfo(){
    // 获取数据
    let [title, dialogs] = getDialogs()
    // 生成html的字符串结构
    let dialogsString = ""
    const assertQuestions = questionsCheck && !thinksCheck && !answersCheck // 仅导出所有问题
    const assertThinks = !questionsCheck && thinksCheck && !answersCheck // 仅导出所有深度思考
    const assertAnswers = !questionsCheck && !thinksCheck && answersCheck // 仅导出所有回答
    const assertAll = !assertQuestions && !assertThinks && !assertAnswers // 当配置错误时也会全部导出
    if(roundsCheck){
        dialogsString = dialogs.map((dialog, index) => {
            // 保持html结构
            let htmlString = ""
            htmlString += `<h1>${index+1}</h1>`
            if(assertAll || assertQuestions)
                htmlString += dialog['user']!=="" ? `<h2>用户问题</h2><div class="myuser">${dialog['user']}</div>`: "";
            if(assertAll || assertThinks)
                htmlString += dialog['think']!=="" ? `<h2>DeepSeek--深度思考</h2><div class="mythink">${dialog['think']}</div>` : "";
            if(assertAll || assertAnswers)
                htmlString += dialog['answer']!=="" ? `<h2>DeepSeek--回答</h2><div class="myanswer">${dialog['answer']}</div>` : "";
            return htmlString
        }).join("<br>");
    } else {
        dialogsString = dialogs.map((dialog, index) => {
            // 保持html结构
            let htmlString = ""
            if(assertAll || assertQuestions)
                htmlString += dialog['user']!=="" ? `<h1>用户问题</h1><div class="myuser">${dialog['user']}</div>`: "";
            if(assertAll || assertThinks || assertAnswers)
                htmlString += (dialog['think']!=="" || dialog['answer']!=="") ? `<h1>DeepSeek</h1>`: "";
            if(assertAll || assertThinks)
                htmlString += dialog['think']!=="" ? `<h2>深度思考</h2><div>${dialog['think']}</div>` : "";
            if(assertAll || assertAnswers)
                htmlString += dialog['answer']!=="" ? `<h2>回答</h2><div>${dialog['answer']}</div>` : "";
            return htmlString
        }).join("<br>");
    }

    let data = ""
    let type = ""
    let filename = ""
    // 数据格式转换
    if (formatSelect === '.md') {
        data = toMarkdown(dialogsString);
        type = "text/markdown";  // 设置文件类型为markdown
        filename = title + ".md";  // 使用title作为文件名并添加.md后缀
    } else if (formatSelect === '.docx') {
        data = toDocx(dialogsString);
        type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // docx文件类型
        filename = title + ".docx"; // 使用title作为文件名并添加.docx后缀
    } else if (formatSelect === '.html') {
        data = toHtml(dialogsString)
        type = "text/html";
        filename = title + ".html"
    } else if (formatSelect === '.txt') {
        data = toTxt(dialogsString)
        type = "text/textfile"
        filename = title + ".txt"
    }
    return [data, type, filename]
}
function download() {
    let [data, type, filename] = prepareInfo()

    // 创建Blob对象
    let file = new Blob([data], {type: type});

    // 处理浏览器兼容性
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
        let a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}



function copy() {
    let data
    [data, _, _] = prepareInfo()
    // 检查是否已经存在模态框，防止多次创建
    if (document.getElementById('markdown-modal')) {
        return; // 如果模态框已经存在，则不再创建
    }

    // 创建模态背景
    const modal = document.createElement('div');
    modal.id = 'markdown-modal';
    Object.assign(modal.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '1000'
    });

    // 创建模态内容容器
    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
        backgroundColor: '#fff',
        color: '#000', // 设置文本颜色为黑色
        padding: '20px',
        borderRadius: '8px',
        width: '50%', // 设置宽度为屏幕的50%
        height: '80%', // 设置高度为屏幕的80%
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden' // 防止内容溢出
    });

    // 创建文本区域
    const textarea = document.createElement('textarea');
    textarea.value = data;
    Object.assign(textarea.style, {
        flex: '1',
        resize: 'none',
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        fontFamily: 'monospace',
        marginBottom: '10px',
        boxSizing: 'border-box',
        color: '#000', // 设置文本颜色为黑色
        backgroundColor: '#f9f9f9', // 设置文本区域背景颜色为浅灰色，增强可读性
        border: '1px solid #ccc', // 添加边框以提高可见性
        borderRadius: '4px'
    });
    textarea.setAttribute('readonly', true); // 只读，防止用户修改内容

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
        display: 'flex',
        justifyContent: 'flex-end'
    });

    // 创建复制按钮
    const copyButton = document.createElement('button');
    copyButton.textContent = '复制';
    Object.assign(copyButton.style, {
        padding: '8px 16px',
        fontSize: '14px',
        cursor: 'pointer',
        backgroundColor: '#28A745',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        marginRight: '10px'
    });

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    Object.assign(closeButton.style, {
        padding: '8px 16px',
        fontSize: '14px',
        cursor: 'pointer',
        backgroundColor: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '4px'
    });

    // 将按钮添加到按钮容器
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(closeButton);

    // 将文本区域和按钮容器添加到模态内容容器
    modalContent.appendChild(textarea);
    modalContent.appendChild(buttonContainer);

    // 将模态内容容器添加到模态背景
    modal.appendChild(modalContent);

    // 将模态背景添加到文档主体
    document.body.appendChild(modal);

    // 自动聚焦文本区域
    textarea.focus();

    // 监听复制按钮点击事件
    copyButton.addEventListener('click', () => {
        textarea.select();
        navigator.clipboard.writeText(textarea.value)
            .then(() => {
                copyButton.textContent = '已复制';
                copyButton.style.backgroundColor = '#28A745';
                setTimeout(() => {
                    copyButton.textContent = '复制';
                    copyButton.style.backgroundColor = '#28A745';
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败', err);
            });
    });

    // 监听关闭按钮点击事件
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // 监听键盘事件（Esc 键关闭模态）
    const escListener = (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('markdown-modal')) {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', escListener);
            }
        }
    };
    document.addEventListener('keydown', escListener);

    // 点击模态背景关闭模态
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', escListener);
        }
    });
}

