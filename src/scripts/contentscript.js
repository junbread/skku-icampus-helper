window.onload = function () {
    chrome.extension.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg === 'get-video') {
            let id = document.querySelector('html').getAttribute('id')
            let title = document.title
            let isVideo = document.querySelector('#video-player')
            if (id && isVideo && id.match(/\w+-page/)) {
                id = id.replace('-page', '')
                console.log({ id, title })
                chrome.runtime.sendMessage({ id, title })
            }
        }
    })
}
