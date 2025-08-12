// ** Third Party Components
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Chart from 'react-apexcharts'

// ** Reactstrap Imports
import { Card, CardBody } from 'reactstrap'

const StatisticsCards = props => {
  // ** Props
  const { className, hideChart, iconRight, iconBg, icon, stat, statTitle, options, series, type, height } = props

  return (
    <Card>
      <CardBody
        className={classnames('stats-card-body d-flex pt-2', {
          [className]: className,
          'flex-column align-items-start': !iconRight && !hideChart,
          'justify-content-between flex-row-reverse align-items-center': iconRight,
          'justify-content-center flex-column text-center': hideChart && !iconRight,
          'pb-0': !hideChart,
          'pb-2': hideChart
        })}
      >
        <div className='icon-section'>
          <div className={`avatar avatar-stats p-50 m-0 ${iconBg ? `bg-light-${iconBg}` : 'bg-light-primary'}`}>
            <div className='avatar-content'>{icon}</div>
          </div>
        </div>
        <div className='title-section'>
          <h2 className='fw-bold mt-1 mb-25'>{stat}</h2>
          <p className='mb-0'>{statTitle}</p>
        </div>
      </CardBody>
      {!hideChart && <Chart options={options} series={series} type={type} height={height ? height : 100} />}
    </Card>
  )
}
export default StatisticsCards

// ** PropTypes
StatisticsCards.propTypes = {
  type: PropTypes.string,
  series: PropTypes.array,
  height: PropTypes.string,
  iconBg: PropTypes.string,
  options: PropTypes.object,
  hideChart: PropTypes.bool,
  iconRight: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node.isRequired,
  stat: PropTypes.string.isRequired,
  statTitle: PropTypes.string.isRequired
}
