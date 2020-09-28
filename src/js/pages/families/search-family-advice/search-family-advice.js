// Common modules
import '../../../common'
import ko from 'knockout'

const api = require('../../../get-api-data')
const browser = require('../../../browser')
const endpoints = require('../../../api')
const location = require('../../../location/locationSelector')

function SearchFamilyAdvice () {
  const self = this
  const currentLocation = location.getCurrentHubFromCookies()

  self.isSelectedSearchInput = ko.observable(false)
  self.showFilteredAdvice = ko.observable(false)
  self.advice = ko.observableArray([])
  self.filteredAdvice = ko.observableArray([])
  self.searchQuery = ko.observable('')

  self.isSelectedSearchInput.subscribe((newValue) => {
    if (newValue && self.searchQuery().trim().length && self.filteredAdvice().length) {
      self.showFilteredAdvice(true)
    }
  })

  self.onInputLostFocus = function (data, event) {
    if (event.relatedTarget === null || event.relatedTarget != null && event.relatedTarget.className !== 'breadcrumbs-list') {
      self.showFilteredAdvice(false)
    }
  }

  self.searchQuery.subscribe(() => {
    if (currentLocation.id) {
      self.search()
    }
    else {
      self.onSearchAdviceFail()
    }
  })

  self.onSearchAdviceFail = function () {
    window.alert('Please choose your location in the Locations menu.')
  }

  self.getAdvice = function () {
    browser.loading()
    api
    .data(`${endpoints.faqs}?location=${currentLocation.id}&tags=families&pageSize=100000&index=0`)
    .then((result) => {
      self.advice(result.data.items.map((x) => {
        return {
          id: ko.observable(x.id),
          body: ko.observable(x.body),
          locationKey: ko.observable(x.locationKey),
          parentScenario: ko.observable(x.parentScenario),
          sortPosition: ko.observable(x.sortPosition),
          tags: ko.observableArray(x.tags),
          title: ko.observable(x.title),
          breadcrumbs: ko.observable(`Families > ${x.parentScenario ? x.parentScenario.name + ' > ' : ''}${x.title}`)
        }
      }))
      browser.loaded()
    }, (_) => {
      browser.redirect('/500')
    })
  }

  self.sortByTitle = function (a, b, searchTermRegex) {
    let resA = a.title().toLowerCase().trim().match(searchTermRegex)
    resA = resA !== null ? resA.length : 0

    let resB = b.title().toLowerCase().trim().match(searchTermRegex)
    resB = resB !== null ? resB.length : 0

    if ((resB - resA) === 0) {
      return self.sortByParentScenario(a, b, searchTermRegex)
    }
    return resB - resA
  }

  self.filterByTitle = function (searchTermRegex) {
    let filteredByTitle = ko.observableArray(self.advice().filter((x) => {
                                                                    let result = x.title().toLowerCase().trim().match(searchTermRegex);
                                                                    return result !== null && result.length
                                                                  })
                            .sort((a, b) => self.sortByTitle(a, b, searchTermRegex)))
    return filteredByTitle
  }

  self.sortByParentScenario = function (a, b, searchTermRegex) {
    let resA = a.parentScenario() !== null ? a.parentScenario().name.toLowerCase().trim().match(searchTermRegex) : null
    resA = resA !== null ? resA.length : 0

    let resB = b.parentScenario() !== null ? b.parentScenario().name.toLowerCase().trim().match(searchTermRegex) : null
    resB = resB !== null ? resB.length : 0

    if ((resB - resA) === 0) {
      return self.sortByTag(a, b, searchTermRegex)
    }
    return resB - resA
  }

  self.filterByParentScenario = function (searchTermRegex) {
    let filteredByTitle = ko.observableArray(self.filteredAdvice().filter((x) => {
                                                                            if (x.parentScenario() !== null) {
                                                                              let result = x.parentScenario().name.toLowerCase().trim().match(searchTermRegex);
                                                                              return result !== null && result.length
                                                                            }
                                                                            return false
                                                                          })
                            .sort((a, b) => self.sortByParentScenario(a, b, searchTermRegex)))
    return filteredByTitle
  }

  self.sortByTag = function (a, b, searchTermRegex) {
    let resA = a.tags() !== null ? a.tags().filter((y) => y !== 'families').join(' ').match(searchTermRegex) : null
    resA = resA !== null ? resA.length : 0

    let resB = b.tags() !== null ? b.tags().filter((y) => y !== 'families').join(' ').replaceAll('-', ' ').match(searchTermRegex) : null
    resB = resB !== null ? resB.length : 0

    if ((resB - resA) === 0) {
      return self.sortByContent(a, b, searchTermRegex)
    }
    return resB - resA
  }

  self.filterByTag = function (searchTermRegex) {
    let filteredByTag = ko.observableArray(self.filteredAdvice().filter((x) => {
                                                                          if (x.tags() !== null) {
                                                                            let result = x.tags().filter((y) => y !== 'families').join(' ').replaceAll('-', ' ').match(searchTermRegex)
                                                                            return result !== null && result.length
                                                                          }
                                                                          return false
                                                                        })
                          .sort((a, b) => self.sortByTag(a, b, searchTermRegex)))
    return filteredByTag
  }

  self.sortByContent = function (a, b, searchTermRegex) {
    let resContentA = a.body().toLowerCase().trim().match(searchTermRegex)
    resContentA = resContentA !== null ? resContentA.length : 0

    let resContentB = b.body().toLowerCase().trim().match(searchTermRegex)
    resContentB = resContentB !== null ? resContentB.length : 0

    return resContentB - resContentA
  }

  self.filterByContent = function (searchTermRegex) {
    let filteredByContent = ko.observableArray(self.filteredAdvice().filter((x) => {
                                                                              let result = x.body().toLowerCase().trim().match(searchTermRegex)
                                                                              return result !== null && result.length
                                                                            })
                              .sort((a, b) => self.sortByContent(a, b, searchTermRegex)))
    return filteredByContent
  }

  self.search = function () {
    let searchTerm = self.searchQuery().toLowerCase()

    if (searchTerm.trim()) {
      // Tokenize the search terms and remove empty spaces
      let tokens = searchTerm.toLowerCase().split(' ').filter((token) => token.trim() !== '');
      let searchTermRegex = new RegExp(tokens.join('|'), 'gim')

      let filteredByTitle = self.filterByTitle(searchTermRegex)
      self.filteredAdvice(self.advice().filter((x) => !filteredByTitle().some((y) => x.id() === y.id()) ))

      let filteredByParentScenario = self.filterByParentScenario(searchTermRegex)
      self.filteredAdvice(self.filteredAdvice().filter((x) => !filteredByParentScenario().some((y) => x.id() === y.id()) ))

      let filteredByTag = self.filterByTag(searchTermRegex)
      self.filteredAdvice(self.filteredAdvice().filter((x) => !filteredByTag().some((y) => x.id() === y.id()) ))

      let filteredByContent = self.filterByContent(searchTermRegex)
      self.filteredAdvice(filteredByTitle().concat(filteredByParentScenario()).concat(filteredByTag()).concat(filteredByContent()))
    }
    else {
      self.filteredAdvice([])
    }

    self.showFilteredAdvice(self.filteredAdvice().length)
  }

  self.searchAll = function (data, event) {
    if (event.which === 1 || event.which === 13) {
      document.location.href = `/families/advice/result?searchQuery=${self.searchQuery().trim()}`
    }
  }

  self.getAdvice()
}

module.exports = SearchFamilyAdvice
