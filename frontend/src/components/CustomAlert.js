import React from 'react'
import PropTypes from 'prop-types'

const CustomAlert = ({ color, children, className = '' }) => {
  const getBackgroundColor = () => {
    switch (color) {
      case 'danger':
        return 'rgba(234, 84, 85, 0.12)'
      case 'success':
        return 'rgba(40, 199, 111, 0.12)'
      case 'warning':
        return 'rgba(255, 159, 67, 0.12)'
      case 'info':
        return 'rgba(0, 207, 232, 0.12)'
      default:
        return 'rgba(115, 103, 240, 0.12)'
    }
  }

  const getTextColor = () => {
    switch (color) {
      case 'danger':
        return '#ea5455'
      case 'success':
        return '#28c76f'
      case 'warning':
        return '#ff9f43'
      case 'info':
        return '#00cfe8'
      default:
        return '#7367f0'
    }
  }

  const getBorderColor = () => {
    switch (color) {
      case 'danger':
        return 'rgba(234, 84, 85, 0.2)'
      case 'success':
        return 'rgba(40, 199, 111, 0.2)'
      case 'warning':
        return 'rgba(255, 159, 67, 0.2)'
      case 'info':
        return 'rgba(0, 207, 232, 0.2)'
      default:
        return 'rgba(115, 103, 240, 0.2)'
    }
  }

  const styles = {
    alert: {
      padding: '0.857rem 1rem',
      borderRadius: '0.428rem',
      marginBottom: '1.5rem',
      backgroundColor: getBackgroundColor(),
      color: getTextColor(),
      border: `1px solid ${getBorderColor()}`,
      display: 'flex',
      alignItems: 'center'
    }
  }

  return (
    <div style={styles.alert} className={className}>
      {children}
    </div>
  )
}

CustomAlert.propTypes = {
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info']).isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

export default CustomAlert 