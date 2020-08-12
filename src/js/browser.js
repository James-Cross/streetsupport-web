/*
  global ga, document, history, window, getComputedStyle
*/

var Spinner = require('spin.js')

var redirect = function (url) {
  window.location = url
}

const reload = () => {
  window.location.reload()
}

var loaderAnim

var getLoader = function () {
  if (loaderAnim === undefined) {
    loaderAnim = new Spinner({
      zIndex: 180
    })
  }
  return loaderAnim
}

const location = () => {
  return window.location
}

let getBody = () => {
  return document.getElementsByTagName('body')[0]
}

var loading = function () {
  getBody().className += ' page-loading'
  getLoader().spin(document.getElementById('spin'))

  // Add notification mesage on loading Map. It is a temporary solution. I've not created test for it.
  if (document.getElementById('notification-map') !== null) {
    var notificationMap = document.getElementById('notification-map').cloneNode(true)
    notificationMap.style.display = 'block'
    document.getElementById('spin').getElementsByClassName('spinner')[0].appendChild(notificationMap)
  }
}

var loaded = function () {
  getBody().className = getBody().className.replace('page-loading', '')
  getLoader().stop()
}

var jumpTo = function (id) {
  var self = this
  self.id = id
  let gotoElement = () => {
    window.location.href = self.id
  }
  setTimeout(gotoElement, 250)
}

let pushHistory = (stateObject, title, url) => {
  history.pushState(stateObject, title, url)
}

let popHistory = () => {
  history.back()
}

let setOnHistoryPop = (onPopCallback) => {
  window.onpopstate = (e) => {
    onPopCallback(e)
  }
}

var scrollTo = function (selector) {
  const mobileHeader = document.querySelector('.header')

  const getDesktopHeaderHeight = () => {
    const desktopHeader = document.querySelector('.sticky')
    return desktopHeader.offsetHeight + 44 // navSubList.offsetHeight - doesn't return greater than 0!
  }

  const getMobileHeaderHeight = () => {
    return mobileHeader.offsetHeight
  }

  const getIsMobile = () => {
    const mobileHeaderDisplay = mobileHeader.currentStyle
      ? mobileHeader.currentStyle.display
      : getComputedStyle(mobileHeader, null).display
    return mobileHeaderDisplay === 'block'
  }

  const currentHeaderHeight = getIsMobile()
    ? getMobileHeaderHeight()
    : getDesktopHeaderHeight()

  let findPos = (obj) => {
    var curtop = 0
    if (obj.offsetParent) {
      do {
        curtop += obj.offsetTop
      } while (obj === obj.offsetParent)
      return [curtop - currentHeaderHeight]
    }
  }
  let element = document.querySelector(selector)
  window.scroll(0, findPos(element))
}

var trackEvent = function (src, action, description) {
  ga('send', 'event', src, action, description)
}

var print = function () {
  window.print()
}

const initPrint = () => {
  document.querySelector('.js-print-btn')
    .addEventListener('click', (e) => {
      e.preventDefault()
      window.print()
    })
}

module.exports = {
  redirect: redirect,
  reload: reload,
  location: location,
  loading: loading,
  loaded: loaded,
  trackEvent: trackEvent,
  scrollTo: scrollTo,
  jumpTo: jumpTo,
  print: print,
  initPrint: initPrint,
  pushHistory: pushHistory,
  popHistory: popHistory,
  setOnHistoryPop: setOnHistoryPop
}
