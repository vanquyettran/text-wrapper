!function (window) {
    /**
     *
     * @param {string} text
     * @param {string|object} font
     * @param {number} maxWidth
     * @param {string?} longWordContinue
     * @param {number?} maxLineCount
     * @param {string?} ellipsis
     * @return {Array} an array of lines after wrapped
     */
    const wrapText = function (text, font, maxWidth, longWordContinue, maxLineCount, ellipsis) {
        if ('string' !== typeof text) {
            throw new Error('text must be a string. Got: ' + (typeof text));
        }

        const lines = text.split('\n');

        const canvas = window.document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if ('string' === typeof font) {
            ctx.font = font;
        } else if ('object' === typeof font) {
            ctx.font = [font['style'], font['weight'], font['size'], font['family']].filter(item => 'undefined' !== typeof item).join(' ');
        } else {
            throw new Error('font must be a string or an object. Got: ' + (typeof font));
        }

        if ('number' !== typeof maxWidth) {
            throw new Error('maxWidth must be a number. Got: ' + (typeof maxWidth));
        }

        if ('number' !== typeof maxLineCount) {
            maxLineCount = 0;
        }

        if ('string' !== typeof ellipsis) {
            ellipsis = '...';
        }

        if ('string' !== typeof longWordContinue) {
            longWordContinue = '-';
        }

        const newLines = [];
        lines.forEach(line => {
            if (line.trim().length > 0) {
                const words = line.split(/(\s+)/);
                // console.log('words', words);

                const newWords = [];
                words.forEach(word => {
                    let newWord = '';
                    word.split('').forEach(char => {
                        const tryNewWord = newWord + char;
                        const tryNewWordWidth = ctx.measureText(tryNewWord).width;
                        if (tryNewWordWidth > maxWidth && newWord.length > 0) {
                            newWords.push(newWord);
                            newWord = longWordContinue + char;
                        } else {
                            newWord = tryNewWord;
                        }
                    });
                    if (newWord.length > 0) {
                        newWords.push(newWord);
                    }
                });

                // console.log('new words', newWords);
                let newLine = '';
                newWords.forEach(word => {
                    const tryNewLine = newLine.trim().length > 0 ? (newLine + word) : word;
                    const tryNewLineWidth = ctx.measureText(tryNewLine.trim()).width;
                    if (tryNewLineWidth > maxWidth && newLine.trim().length > 0) {
                        newLines.push(newLine.trim());
                        newLine = word;
                    } else {
                        newLine = tryNewLine;
                    }
                });
                if (newLine.trim().length > 0) {
                    newLines.push(newLine.trim());
                }
            } else {
                newLines.push('');
            }
        });

        // console.log('new lines', newLines);
        let maxLineWidth = 0;
        newLines.forEach(line => {
            const lineWidth = ctx.measureText(line).width;
            if (lineWidth > maxLineWidth) {
                maxLineWidth = lineWidth;
            }
        });

        let newLineTrackers = [];
        if (maxLineCount > 0) {
            newLines.forEach((line, index) => {
                if (index + 1 <= maxLineCount) {
                    if (newLines[index + 1] && index + 2 > maxLineCount) {
                        while (line !== '' && ctx.measureText(line + ellipsis).width > maxWidth) {
                            line = line.slice(0, -1);
                            // console.log(line);
                        }
                        line += ellipsis;
                    }
                    newLineTrackers.push({
                        content: line,
                        width: ctx.measureText(line).width
                    });
                }
            });
        } else {
            newLineTrackers = newLines.map(line => ({
                content: line,
                width: ctx.measureText(line).width
            }));
        }

        return newLineTrackers;
    };

    /**
     *
     * @param {HTMLElement|HTMLElement[]|NodeList|string} wrappedEls
     * @param {string?} lineBreaker
     */
    const elementTextLinesLimit = function (wrappedEls, lineBreaker) {
        if (wrappedEls instanceof HTMLElement) {
            wrappedEls = [wrappedEls];
        } else if (wrappedEls instanceof Array || wrappedEls instanceof NodeList) {
            [].forEach.call(wrappedEls, function (wrappedEl) {
                if (!(wrappedEl instanceof HTMLElement)) {
                    throw new Error('Element is not a HTMLElement: ' + wrappedEl.toString());
                }
            });
        } else if ('string' === typeof wrappedEls) {
            wrappedEls = document.querySelectorAll(wrappedEls);
        } else {
            throw new Error('wrappedEls is not a query string, a HTMLElement or a List of HTMLElement');
        }

        if ('string' !== typeof lineBreaker) {
            lineBreaker = '\n';
        }

        const updateText = function (wrappedEls) {
            [].forEach.call(wrappedEls, function (wrappedEl) {
                let textToWrap = wrappedEl.getAttribute('data-text-to-wrap');
                if (null === textToWrap) {
                    textToWrap = wrappedEl.textContent;
                    textToWrap = textToWrap.split('\n').join(' ');
                    while (textToWrap.indexOf('  ') > -1) {
                        textToWrap = textToWrap.split('  ').join(' ');
                    }
                    textToWrap = textToWrap.trim();
                    wrappedEl.setAttribute('data-text-to-wrap', textToWrap);
                }

                const max_line_count = Number.parseInt(wrappedEl.getAttribute('data-max-line-count'));
                const max_width = wrappedEl.clientWidth;
                const styles = window.getComputedStyle(wrappedEl);

                const args = [
                    textToWrap,
                    {
                        family: styles['font-family'],
                        style: styles['font-style'],
                        weight: styles['font-weight'],
                        size: styles['font-size'],
                    },
                    max_width,
                    '-',
                    max_line_count,
                    '...'
                ];

                const wrappedLines = wrapText(...args);

                // console.log(args);
                // console.log(wrappedLines);

                wrappedEl.innerHTML = wrappedLines.map(line => line.content).join(lineBreaker);
            });
        };

        updateText(wrappedEls);

        window.addEventListener('resize', function () {
            updateText(wrappedEls);
        });
    };

    window.TextWrapper = {
        wrapText,
        elementTextLinesLimit
    };
}(window);
