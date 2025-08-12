// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import PropTypes from 'prop-types'

const ScrollTop = props => {
  // ** Props
  const { showOffset, scrollBehaviour, children, ...rest } = props

  // ** State
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (window) {
      window.addEventListener('scroll', () => {
        if (window.pageYOffset >= showOffset) {
          setVisible(true)
        } else {
          setVisible(false)
        }
      })
    }
  }, [])

  const handleScrollToTop = () => {
    window.scroll({ top: 0, behavior: scrollBehaviour })
  }

  return (
    visible && (
      <div className='scroll-to-top' onClick={handleScrollToTop} {...rest}>
        {children}
      </div>
    )
  )
}

export default ScrollTop

// ** PropTypes
ScrollTop.propTypes = {
  showOffset: PropTypes.number,
  children: PropTypes.any.isRequired,
  scrollBehaviour: PropTypes.oneOf(['smooth', 'instant', 'auto'])
}

ScrollTop.defaultProps = {
  scrollBehaviour: 'smooth'
}
