window.onload = () => {

    const vidList = document.querySelector('#vid-list')

    chrome.runtime.onMessage.addListener((video, sender, sendResponse) => {
        document
            .querySelectorAll('.msg-error')
            .forEach(el => el.setAttribute("style", "display:none"))

        let vidElem = document.createElement('li')
        vidElem.setAttribute("id", video.id)
        vidElem.innerText = video.title
        vidList.appendChild(vidElem)

        document.getElementById(video.id).addEventListener('click', () => {
            chrome.tabs.create({ url: `https://cdn-lcms.skku.edu/contents3/skku100001/${video.id}/contents/media_files/mobile/ssmovie.mp4` })
        })
    })

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, 'get-video')
    })
}