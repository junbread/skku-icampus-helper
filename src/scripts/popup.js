window.onload = () => {
    function findValidContentsRepository(url, callback) {
        const contentRepositories = ["contents", "contents2", "contents3"]
        contentRepositories.forEach(repository => {
            const repositoryUrl = `https://cdn-lcms.skku.edu/${repository}/skku100001/${url}`

            const request = new XMLHttpRequest()
            request.onreadystatechange = () => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        callback(repositoryUrl)
                    }
                }
            }

            request.open('HEAD', repositoryUrl)
            request.send()
        })
    }

    const contents = document.querySelector('#contents')
    const resources = document.querySelector('#resources')
    const contentList = document.querySelector('#content-list')
    const resourceList = document.querySelector('#resource-list')

    let pageMode = 'etc'

    document.querySelector('#resource-download-all').addEventListener('click', () => {
        document.querySelectorAll('#resource-list li').forEach(el => {
            const id = el.getAttribute('id')
            const type = el.getAttribute('data-type')
            const filename = encodeURIComponent(el.innerText) + '.pdf'

            findValidContentsRepository(`${id}/contents/web_files/original.pdf`, url => {
                chrome.downloads.download({ url, filename })
            })
        })
    })

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type === 'check-mode') {
            pageMode = msg.data

            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                const currentUrl = tabs[0].url
                if (currentUrl.match(/.+\/external_tools\/1.*/)) { // contents
                    contents.setAttribute('style', 'display: block')
                    resources.setAttribute('style', 'display: none')
                    if (pageMode === 'course')
                        chrome.tabs.sendMessage(tabs[0].id, 'get-contents')
                    if (pageMode === 'unit')
                        chrome.tabs.sendMessage(tabs[0].id, 'get-content')
                }
                if (currentUrl.match(/.+\/external_tools\/2.*/)) { // resouces
                    contents.setAttribute('style', 'display: none')
                    resources.setAttribute('style', 'display: block')
                    chrome.tabs.sendMessage(tabs[0].id, 'get-resources')
                }
            })
        }

        if (msg.type.match('get-contents?$')) {
            function addContentRow(file) {
                let contentElem = document.createElement('li')
                contentElem.setAttribute("id", file.id)
                contentElem.innerText = file.title
                contentList.appendChild(contentElem)

                document.getElementById(file.id).addEventListener('click', () => {
                    if (file.type.match('movie'))
                        findValidContentsRepository(`${file.id}/contents/media_files/mobile/ssmovie.mp4`, url => {
                            chrome.tabs.create({ url })
                        })
                    else if (file.type.match('screenlecture'))
                        findValidContentsRepository(`${file.id}/contents/media_files/mixed.mp4`, url => {
                            chrome.tabs.create({ url })
                        })
                    else if (file.type.match('pdf'))
                        findValidContentsRepository(`${file.id}/contents/web_files/original.pdf`, url => {
                            chrome.tabs.create({ url })
                        })
                    else
                        chrome.tabs.create({ url: file.url })
                })
            }

            if (msg.type === 'get-content') {
                document.querySelector('#err-no-contents').setAttribute('style', 'display:none')
                addContentRow(msg.data)
            }

            if (msg.type === 'get-contents') {
                if (msg.data.length)
                    document.querySelector('#err-no-contents').setAttribute('style', 'display:none')
                msg.data.forEach(file => { addContentRow(file) })

            }
        }

        if (msg.type === 'get-resources') {
            if (msg.data.length)
                document.querySelector('#err-no-resources').setAttribute('style', 'display:none')

            msg.data.forEach(file => {
                let resourceElem = document.createElement('li')
                resourceElem.setAttribute("id", file.id)
                resourceElem.setAttribute("data-type", file.type)
                resourceElem.innerText = file.title
                resourceList.appendChild(resourceElem)

                document.getElementById(file.id).addEventListener('click', () => {
                    if (file.type.match('movie'))
                        findValidContentsRepository(`${file.id}/contents/media_files/mobile/ssmovie.mp4`, url => {
                            chrome.tabs.create({ url })
                        })
                    else if (file.type.match('screenlecture'))
                        findValidContentsRepository(`${file.id}/contents/media_files/mixed.mp4`, url => {
                            chrome.tabs.create({ url })
                        })
                    else if (file.type.match('pdf'))
                        findValidContentsRepository(`${file.id}/contents/web_files/original.pdf`, url => {
                            chrome.tabs.create({ url })
                        })
                    else
                        chrome.tabs.create({ url: file.url })
                })
            })
        }
    })

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, 'check-mode')
    })
}