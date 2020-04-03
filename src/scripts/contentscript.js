window.onload = function () {
    function getFromCookie(cookieName) {
        const query = document.cookie.match(`(^|;) ?${cookieName}=([^;]*)(;|$)`)
        return query ? query[2] : null
    }

    function getFromFormField(fieldName) {
        const form = document.querySelector('#tool_form')
        return form ? form.querySelector(`[name="${fieldName}"]`).value : null
    }

    function makeApiRequest(url, apiToken, callback) {
        const request = new XMLHttpRequest()

        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    callback(request.responseText)
                }
            }
        }

        request.open('GET', url)
        request.setRequestHeader('Authorization', `Bearer ${apiToken}`)
        request.send()
    }

    function isTopFrame() {
        let topFrame = false
        try {
            topFrame = top.document === window.document
        } catch (e) { }

        return topFrame
    }

    function checkMode() {
        if (document.querySelector('[id^=xn-unit')) return 'unit'
        if (document.querySelector('[id^=xn-course')) return 'course'

        return 'etc'
    }

    chrome.extension.onMessage.addListener((msg, sender, sendResponse) => {
        if (isTopFrame()) {
            const apiToken = getFromCookie('xn_api_token')
            const userId = getFromFormField('custom_user_id')
            const userLogin = getFromFormField('custom_user_login')
            const courseCode = getFromFormField('custom_course_id')

            if (msg === 'get-contents') {
                if (apiToken && courseCode) {
                    makeApiRequest(`https://canvas.skku.edu/learningx/api/v1/courses/${courseCode}/allcomponents_db?user_id=${userId}&user_login=${userLogin}&role=1`, apiToken, text => {
                        let files = JSON.parse(text)
                        files = files
                            .filter(file => {
                                return file.hasOwnProperty('commons_content')
                            })
                            .map(file => {
                                return {
                                    id: file.commons_content.content_id,
                                    title: file.title,
                                    type: file.commons_content.content_type,
                                    url: file.commons_content.view_url
                                }
                            })
                        chrome.runtime.sendMessage({ type: 'get-contents', data: files })
                    })
                }
            }

            if (msg === 'get-resources') {
                if (apiToken && courseCode) {
                    makeApiRequest(`https://canvas.skku.edu/learningx/api/v1/courses/${courseCode}/resources_db`, apiToken, text => {
                        let files = JSON.parse(text)
                        files = files
                            .filter(file => {
                                return file.hasOwnProperty('commons_content')
                            })
                            .map(file => {
                                return {
                                    id: file.commons_content.content_id,
                                    title: file.title,
                                    type: file.commons_content.content_type,
                                    url: file.commons_content.view_url
                                }
                            })
                        chrome.runtime.sendMessage({ type: 'get-resources', data: files })
                    })
                }
            }
        }

        if (msg === 'get-content') {
            let id = document.querySelector('html').getAttribute('id')
            let title = document.title

            if (id && id.match(/\w+-page/)) {
                id = id.replace('-page', '')
                let type = document.querySelector('meta[name="commons.content_type"]')
                if (type) {
                    switch (type.getAttribute("content")) {
                        case "2":
                            type = 'movie'
                            break
                        case "10":
                            type = 'pdf'
                            break
                        default:
                            type = 'etc'
                            break
                    }

                    chrome.runtime.sendMessage({ type: 'get-content', data: { id, title, type } })
                }

            }
        }

        if (msg === 'check-mode') {
            const pageMode = checkMode()
            if (pageMode !== 'etc')
                chrome.runtime.sendMessage({ type: 'check-mode', data: pageMode })
        }

    })
}