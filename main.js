const ajax = {
    request(method, url, body, success) {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.addEventListener('load', success);
        xhr.send(body);
    },
    get(url, success) {
        this.request('GET', url, null, success);
    },
    post(url, body, success) {
        this.request('POST', url, body, success);
    }
};

const div = function (className=undefined, id=undefined) {
    const d = document.createElement('div');
    if (className !== undefined) d.className = className;
    if (id !== undefined) d.id = id;
    return d;
};

const main = document.getElementById('main');
const black = document.getElementById('black');

const displaySlides = function (markdown) {
    const data = {
        text: markdown,
        mode: 'gfm'
    };
    ajax.post('https://api.github.com/markdown', JSON.stringify(data), function () {
        const orig = div();
        orig.innerHTML = this.responseText;
        const slides = div();
        let numSlides = 0;
        let slide = div('slide', 'slide-' + ++numSlides);
        let title = null;
        [...orig.childNodes].forEach(node => {
            switch (node.tagName) {
                case 'HR': {
                    slides.appendChild(slide);
                    slide = div('slide', 'slide-' + ++numSlides);
                    break;
                }
                case 'UL': {
                    const columns = Math.ceil(node.childNodes.length / 15);
                    node.setAttribute("style", 'columns: ' + columns);
                    slide.appendChild(node);
                    break;
                }
                case 'DIV': {
                    if (node.firstChild.tagName === 'PRE') {
                        node.firstChild.contentEditable = true;
                        node.firstChild.spellcheck = false;
                    }
                    slide.appendChild(node);
                    break;
                }
                case 'H1': {
                    if (!title) title = node.innerText;
                    slide.appendChild(node);
                    break;
                }
                default: {
                    slide.appendChild(node);
                    break;
                }
            }
        });
        slides.appendChild(slide);

        document.title = title;
        main.innerHTML = slides.innerHTML;
        document
            .querySelectorAll('input[type=checkbox]')
            .forEach(node => node.disabled = false);
        document
            .querySelectorAll('a[href]')
            .forEach(node => node.target = '_blank');

        let slideIndex = 1;
        window.addEventListener('keypress', function (event) {
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown': {
                    if (slideIndex < numSlides) slideIndex++;
                    event.preventDefault();
                    break;
                }
                case 'ArrowLeft':
                case 'ArrowUp': {
                    if (slideIndex > 1) slideIndex--;
                    event.preventDefault();
                    break;
                }
                case 'b': {
                    black.style.display = black.style.display === 'none'
                        ? 'block'
                        : 'none';
                    event.preventDefault();
                    break;
                }
                default:
                    return;
            }
            window.location.hash = '#slide-' + slideIndex;
        });
        let scrolling = false;
        window.addEventListener('wheel', function (event) {
            event.preventDefault();
            if (!scrolling && event.deltaY > 0) {
                if (slideIndex < numSlides) {
                    slideIndex++;
                    scrolling = true;
                    setTimeout(() => scrolling = false, 200);
                }
            }
            if (!scrolling && event.deltaY < 0) {
                if (slideIndex > 1) {
                    slideIndex--;
                    scrolling = true;
                    setTimeout(() => scrolling = false, 200);
                }
            }
            window.location.hash = '#slide-' + slideIndex;
        });
    });
};

const processHash = function (hash) {
    ajax.get(`https://api.github.com/gists/${hash}`, function () {
        const response = JSON.parse(this.responseText);
        const files = response.files;
        const file = Object.values(files)[0];
        const content = file.content;
        displaySlides(content);
    });
};

const params = new URLSearchParams(window.location.search);
const hash = params.get('hash') || 'b1720b66a1e9afe1c942d1f03b3f5772';
processHash(hash);