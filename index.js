let lastUrl = location.href
let firstRender = true
let sections = {}

const observer = new MutationObserver(() => {
  const currentUrl = location.href
  const skins = document.querySelector('.pay-button-wrapper')
  if ((currentUrl !== lastUrl || firstRender) && skins) {
    console.clear()

    lastUrl = currentUrl
    firstRender = false
    
    const title = document.querySelector('.case-title')
    title.setAttribute('style', 'max-width: max-content;display: flex;align-items: center;gap: 1rem;')
    title.setAttribute('data-id', currentUrl.split('/').pop())

    setPercentages([title], true)
  }
  if (document.querySelector('.main-page-section')) {
    ;[...document.querySelectorAll('.main-page-section')].forEach(section => {
      const id = section.classList.value.split(' ').find(class_ => class_.startsWith('section-'))
      const isHidden = section.classList.contains('hidden-section')
      if (isHidden !== sections[id]) {
        sections[id] = isHidden

        if (isHidden) {
          return
        }
        
        const casesElements = [...section.querySelectorAll('.case-entity')].map(case_ => {
          const id = case_.href.split('/').pop()
          if (id.startsWith('lvl-'))
            return null

          case_.setAttribute('data-id', id)
          return case_
        }).filter(case_ => case_)

        setPercentages(casesElements)
      }
    })
  }
  
  if (!location.href.includes('cases/open')) {
    lastUrl = currentUrl
    firstRender = true
  }
  if (location.href.split('skin.club/')[1].split('/').length > 1) {
    sections = {}
  }
})
observer.observe(document, { subtree: true, childList: true })

async function setPercentages (elements, removeMargin = false) {
  const token = getCookieValue('rft')

  for (const caseId of elements.map(case_ => case_.getAttribute('data-id'))) {
    const res = await fetch(`https://gate.skin.club/apiv2/cases/${caseId}`, {
      headers: new Headers({
        'Authorization': `Bearer ${token}`
      })
    })
    const case_ = (await res.json()).data

    const percentages = getPercentage(
      parsePrice(case_.price),
      case_.last_successful_generation.contents.map(skin => ({
        price: parsePrice(skin.fixed_price),
        percentage: +skin.chance_percent
      }))
    )

    elements
      .filter(caseElement => caseElement.getAttribute('data-id') === case_.name)
      .forEach(caseElement => {
        const span = document.createElement('span')
        span.classList.add('case-entity__button')
        span.setAttribute('data-v-5736daae', '')
        span.setAttribute('style', caseEntityButtonStyles + `margin-top: ${removeMargin? '0;': '18px'}`)
        span.innerHTML = `
          <span data-v-5736daae="" class="active" style="color: white;">
              <span class="win" style="color: #4af1b8;">
                ${percentages.profit}%
              </span>
              /
              <span class="loss" style="color: crimson;">
                ${percentages.lose}%
              </span>
          </span>
        `
        caseElement.appendChild(span)
      })
  }
}

async function tryCatch (fn) {
  try {
    return [await fn(), null]
  } catch (error) {
    console.error(error)
    return [null, error]
  }
}

function getCookieValue(name) {
  const regex = new RegExp(`(^| )${name}=([^;]+)`)
  const match = document.cookie.match(regex)
  if (match)
    return match[2]
}

function getPercentage(casePrice, skins) {
  const total = skins.reduce((prev, curr) => {
    if (casePrice > curr.price)
      return { ...prev, lose: prev.lose + curr.percentage }
    else
      return { ...prev, profit: prev.profit + curr.percentage }
  }, { profit: 0, lose: 0 })

  return {
    profit: +total.profit.toFixed(2),
    lose: +total.lose.toFixed(2)
  }
}

function parsePrice(price) {
  const str = price.toString().padStart(3, '0')
  const result = str.slice(0, -2) + '.' + str.slice(-2)
  return Number(result)
}

const caseEntityButtonStyles = `
  align-items: center;
  background-color: #1c1a31;
  -webkit-clip-path: polygon(11px 0,calc(100% - 11px) 0,100% 50%,calc(100% - 11px) 100%,11px 100%,0 50%);
  clip-path: polygon(11px 0,calc(100% - 11px) 0,100% 50%,calc(100% - 11px) 100%,11px 100%,0 50%);
  color: #fff;
  cursor: default;
  display: inline-flex;
  font-family: Montserrat;
  font-size: 16px;
  font-weight: 600;
  height: 38px;
  justify-content: center;
  min-width: 108px;
  padding: 0 15px;
  text-transform: uppercase;
  transition: all .3s;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  white-space: nowrap;
  width: unset;
`
