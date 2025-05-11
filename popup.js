// document是popup.html

document.getElementById("toggle_configs").addEventListener("click",(event)=>{
    console.log("svg点击",event)
    const div = document.getElementById("other_configs")
    if(div.classList.contains("hidden")) {
        div.classList.remove("hidden");
        div.classList.add("visible");

        const svg_add = document.getElementById("svg_add")
        svg_add.classList.remove("visible")
        svg_add.classList.add("hidden")
        const svg_minus = document.getElementById("svg_minus")
        svg_minus.classList.remove("hidden")
        svg_minus.classList.add("visible")
    } else if(div.classList.contains("visible")) {
        div.classList.remove("visible");
        div.classList.add("hidden");

        const svg_add = document.getElementById("svg_add")
        svg_add.classList.remove("hidden")
        svg_add.classList.add("visible")
        const svg_minus = document.getElementById("svg_minus")
        svg_minus.classList.remove("visible")
        svg_minus.classList.add("hidden")
    }

})

document.getElementById("toggle_visibility").addEventListener("click",(event)=>{
    const svg_invisible = document.getElementById("svg_invisible")
    if(svg_invisible.classList.contains("visible")) {
        svg_invisible.classList.remove("visible")
        svg_invisible.classList.add("hidden")
        const svg_visible = document.getElementById("svg_visible")
        svg_visible.classList.remove("hidden")
        svg_visible.classList.add("visible")

        chrome.storage.local.set({ visibility: false });
    } else if(svg_invisible.classList.contains("hidden")) {
        svg_invisible.classList.remove("hidden")
        svg_invisible.classList.add("visible")
        const svg_visible = document.getElementById("svg_visible")
        svg_visible.classList.remove("visible")
        svg_visible.classList.add("hidden")

        chrome.storage.local.set({ visibility: true });
    }
})

document.getElementById("svg_reset").addEventListener("click", (event)=>{
    // 默认值
    const defaultValues = {
        title: '.d8ed659a',
        questions: '.fbb737a4',
        thinks: '._4f9bf79 ._48edb25',
        answers: '._4f9bf79 .ds-markdown'
    };
    chrome.storage.local.set({
        textTitle: defaultValues.title,
        textQuestions: defaultValues.questions,
        textThinks: defaultValues.thinks,
        textAnswers: defaultValues.answers
    });

    // 重新加载
    reloadTexts()
})

function reloadTexts() {

    // 文本选择
    const titleText = document.getElementById("text-title");
    const questionsText = document.getElementById("text-questions");
    const thinksText = document.getElementById("text-thinks");
    const answersText = document.getElementById("text-answers");
    const texts = {
        title: titleText,
        questions: questionsText,
        thinks: thinksText,
        answers: answersText
    };

// 从存储中加载文本内容
    // 默认值
    const defaultValues = {
        title: '.d8ed659a',
        questions: '.fbb737a4',
        thinks: '._4f9bf79 ._48edb25',
        answers: '._4f9bf79 .ds-markdown'
    };

// 从存储中加载文本内容
    chrome.storage.local.get(["textTitle", "textQuestions", "textThinks", "textAnswers"], (data) => {
        // 如果存储中没有值或值为空，则使用默认值
        const titleValue = data.textTitle || defaultValues.title;
        const questionsValue = data.textQuestions || defaultValues.questions;
        const thinksValue = data.textThinks || defaultValues.thinks;
        const answersValue = data.textAnswers || defaultValues.answers;

        // 设置文本框值
        if (titleText) titleText.value = titleValue;
        if (questionsText) questionsText.value = questionsValue;
        if (thinksText) thinksText.value = thinksValue;
        if (answersText) answersText.value = answersValue;

        // 如果存储中没有值，则保存默认值
        if (!data.textTitle || !data.textQuestions || !data.textThinks || !data.textAnswers) {
            chrome.storage.local.set({
                textTitle: titleValue,
                textQuestions: questionsValue,
                textThinks: thinksValue,
                textAnswers: answersValue
            });
        }
    });

// 防抖函数
    function debounce(func, delay) {
        let timeoutId;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }

// 保存文本到存储（带防抖）
    const saveTextToStorage = debounce(function() {
        const textData = {
            textTitle: titleText ? titleText.value : "",
            textQuestions: questionsText ? questionsText.value : "",
            textThinks: thinksText ? thinksText.value : "",
            textAnswers: answersText ? answersText.value : ""
        };
        chrome.storage.local.set(textData);
    }, 500);

// 为所有文本区域添加输入监听
    Object.values(texts).forEach(textArea => {
        if (textArea) {
            textArea.addEventListener("input", saveTextToStorage);
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    try {
        const roundsCheck = document.getElementById("checkbox-rounds");
        const questionsCheck = document.getElementById("checkbox-questions");
        const thinksCheck = document.getElementById("checkbox-thinks");
        const answersCheck = document.getElementById("checkbox-answers");

        const checkboxes = [roundsCheck, questionsCheck, thinksCheck, answersCheck];

        // 从 chrome.storage.local 读取状态
        chrome.storage.local.get("checkboxStates", (data) => {
            const states = data.checkboxStates || {};
            checkboxes.forEach((checkbox) => {
                if (checkbox) {
                    checkbox.checked = states[checkbox.id] || false;
                }
            });
        });

        // 监听复选框变化并存储新状态
        checkboxes.forEach((checkbox) => {
            if (checkbox) {
                checkbox.addEventListener("change", function () {
                    chrome.storage.local.get("checkboxStates", (data) => {
                        const states = data.checkboxStates || {};
                        states[checkbox.id] = checkbox.checked;
                        chrome.storage.local.set({ checkboxStates: states });
                    });
                });
            }
        });

        // 格式选择
        const formatSelect = document.getElementById("format-selection")
        // 读取并设置初始状态
        chrome.storage.local.get("formatState", (data) => {
            const state = data.formatState || ".md"; // 如果没有保存的状态，则默认为空字符串
            if (formatSelect) {
                formatSelect.value = state;
            }
        });
        // 监听并存储新的状态
        if (formatSelect) {
            formatSelect.addEventListener("change", function () {
                const newState = formatSelect.value;
                chrome.storage.local.set({ formatState: newState });
            });
        }

        reloadTexts()

    } catch (error) {
        console.log("popup.js 出错:", error);
    }
});
