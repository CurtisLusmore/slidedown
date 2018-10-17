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
                    if (node.firstChild.tagName === 'PRE')
                        node.firstChild.contentEditable = true;
                        node.firstChild.spellcheck = false;
                }
                default: {
                    slide.appendChild(node);
                    break;
                }
            }
        });
        slides.appendChild(slide);

        main.innerHTML = slides.innerHTML;

        let slideIndex = 1;
        window.addEventListener('keypress', function (event) {
            switch (event.key) {
                case 'ArrowDown': {
                    if (slideIndex < numSlides) slideIndex++;
                    event.preventDefault();
                    break;
                }
                case 'ArrowUp': {
                    if (slideIndex > 1) slideIndex--;
                    event.preventDefault();
                    break;
                }
                default:
                    return;
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
const hash = params.get('hash');

if (hash) processHash(hash);