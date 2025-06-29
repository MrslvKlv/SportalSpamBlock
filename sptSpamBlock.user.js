// ==UserScript==
// @name         Spam Blocker
// @namespace    https://github.com/MrslvKlv
// @version      1.5
// @description  Block Spam Comments at Sportal.bg
// @author       Mrslv
// @match        sportal.bg/*
// @updateURL    https://raw.githubusercontent.com/MrslvKlv/SportalSpamBlock/main/sptSpamBlock.user.js
// @downloadURL  https://raw.githubusercontent.com/MrslvKlv/SportalSpamBlock/main/sptSpamBlock.user.js
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    const STORAGE_KEY = 'blockedSpamPhrases_v1';
    let blockedPhrases = loadBlockedPhrases();
    let blockedCount = 0;

    function loadBlockedPhrases() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        } else {
            const defaults = [
                "намериш жена за една нощ",
                "гаpантиpано",
                "искаш ли да си намериш жена",
                "17x.fun",
                "една нощ"
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }
    }

    function saveBlockedPhrases() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(blockedPhrases));
    }

    function getCommentContainer(element) {
        while (element && !element.classList.contains('sc-kHpflN')) {
            element = element.parentElement;
        }
        return element;
    }

    function hideSpamComments() {
        const potentialSpams = document.querySelectorAll('.sc-jcvEFQ');

        potentialSpams.forEach(el => {
            const text = el.textContent.toLowerCase();
            if (blockedPhrases.some(phrase => text.includes(phrase))) {
                const fullComment = getCommentContainer(el);
                if (fullComment && fullComment.style.display !== 'none') {
                    fullComment.style.display = 'none';
                    blockedCount++;
                    updateStatsDisplay();
                }
            } else {
                addBlockButton(el);
            }
        });
    }

    function addBlockButton(el) {
        if (el.querySelector('.tampermonkey-block-btn')) return;

        const btn = document.createElement('button');
        btn.textContent = '❌ Block this';
        btn.className = 'tampermonkey-block-btn';
        btn.style.cssText = `
            background: red;
            color: white;
            border: none;
            font-size: 12px;
            padding: 2px 6px;
            cursor: pointer;
            margin-left: 10px;
            border-radius: 4px;
        `;

        btn.onclick = (e) => {
            e.stopPropagation();
            const text = el.textContent.trim().toLowerCase();
            if (!blockedPhrases.includes(text)) {
                blockedPhrases.push(text);
                saveBlockedPhrases();
                hideSpamComments();
                alert('Comment blocked and phrase saved!');
            }
        };

        el.appendChild(btn);
    }

    function createControlPanel() {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.bottom = '20px';
        wrapper.style.right = '20px';
        wrapper.style.zIndex = '9999';
        wrapper.style.display = 'flex';
        wrapper.style.gap = '10px';
        wrapper.style.alignItems = 'center';

        const btn = document.createElement('button');
        btn.textContent = "⚙️ Manage";
        Object.assign(btn.style, {
            padding: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            boxShadow: '0 0 6px rgba(0,0,0,0.3)',
            opacity: '0.85'
        });
        btn.onclick = showPopup;

        const stat = document.createElement('span');
        stat.id = 'spam-block-counter';
        stat.style.color = 'white';
        stat.style.background = 'green';
        stat.style.padding = '5px 8px';
        stat.style.borderRadius = '5px';
        stat.style.fontSize = '12px';
        stat.textContent = '🧹 0 removed';

        wrapper.appendChild(btn);
        wrapper.appendChild(stat);
        document.body.appendChild(wrapper);
    }

    function updateStatsDisplay() {
        const stat = document.querySelector('#spam-block-counter');
        if (stat) stat.textContent = `🧹 ${blockedCount} removed`;
    }

    function showPopup() {
        const popup = document.createElement('div');
        popup.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: #f0f0f0; color: black; border: 2px solid #333; padding: 20px; z-index: 10000;
                        max-width: 400px; width: 100%; box-shadow: 0 0 10px rgba(0,0,0,0.5); font-family: sans-serif;">
                <h3 style="margin-top:0;">🛑 Blocked Words</h3>
                <ul id="block-list" style="list-style: none; padding: 0; max-height: 200px; overflow-y: auto;"></ul>
                <input type="text" id="new-word" placeholder="Enter new word..." style="width: 70%; padding: 5px;">
                <button id="add-word" style="width: 25%; margin-left: 5px;">Add</button>
                <br><br>
                <button id="close-popup" style="width: 100%; padding: 8px;">Close</button>
            </div>
        `;
        document.body.appendChild(popup);

        function updateList() {
            const ul = popup.querySelector('#block-list');
            ul.innerHTML = '';
            blockedPhrases.forEach((word, index) => {
                const li = document.createElement('li');
                li.style.margin = '5px 0';
                li.innerHTML = `
                    <span style="color:black;">${word}</span>
                    <button style="float:right;" data-index="${index}">Remove</button>
                `;
                ul.appendChild(li);
            });

            ul.querySelectorAll('button').forEach(btn => {
                btn.onclick = function () {
                    const idx = parseInt(this.getAttribute('data-index'));
                    blockedPhrases.splice(idx, 1);
                    saveBlockedPhrases();
                    updateList();
                    hideSpamComments();
                };
            });
        }

        popup.querySelector('#add-word').onclick = () => {
            const input = popup.querySelector('#new-word');
            const value = input.value.trim().toLowerCase();
            if (value && !blockedPhrases.includes(value)) {
                blockedPhrases.push(value);
                saveBlockedPhrases();
                updateList();
                hideSpamComments();
                input.value = '';
            }
        };

        popup.querySelector('#close-popup').onclick = () => popup.remove();
        updateList();
    }

    // Init
    hideSpamComments();
    createControlPanel();

    const observer = new MutationObserver(hideSpamComments);
    observer.observe(document.body, { childList: true, subtree: true });
})();
