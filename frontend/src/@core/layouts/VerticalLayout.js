// ** React Imports
import { useState, useEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'

// ** Store & Actions
import { useSelector, useDispatch } from 'react-redux'
import { handleMenuCollapsed, handleContentWidth, handleMenuHidden } from '@store/layout'

// ** Third Party Components
import classnames from 'classnames'
import { ArrowUp } from 'react-feather'

// ** Reactstrap Imports
import { Navbar, Button } from 'reactstrap'

// ** Configs
import themeConfig from '@configs/themeConfig'

// ** Custom Components
import Customizer from '@components/customizer'
import ScrollToTop from '@components/scrolltop'
import FooterComponent from './components/footer'
import NavbarComponent from './components/navbar'
import SidebarComponent from './components/menu/vertical-menu'

// ** Custom Hooks
import { useRTL } from '@hooks/useRTL'
import { useSkin } from '@hooks/useSkin'
import { useLayout } from '@hooks/useLayout'
import { useNavbarType } from '@hooks/useNavbarType'
import { useFooterType } from '@hooks/useFooterType'
import { useNavbarColor } from '@hooks/useNavbarColor'

// ** Styles
import '@styles/base/core/menu/menu-types/vertical-menu.scss'
import '@styles/base/core/menu/menu-types/vertical-overlay-menu.scss'

const VerticalLayout = props => {
  // ** Props
  const { menu, navbar, footer, children, menuData } = props

  // ** Hooks
  const [isRtl, setIsRtl] = useRTL()
  const { skin, setSkin } = useSkin()
  const { navbarType, setNavbarType } = useNavbarType()
  const { footerType, setFooterType } = useFooterType()
  const { navbarColor, setNavbarColor } = useNavbarColor()
  const { layout, setLayout } = useLayout()

  // ** States
  const [isMounted, setIsMounted] = useState(false)
  const [menuVisibility, setMenuVisibility] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'))

  // ** Store Vars
  const dispatch = useDispatch()
  const layoutStore = useSelector(state => state.layout)

  // ** Update Window Width
  const handleWindowWidth = () => {
    setWindowWidth(window.innerWidth)
  }

  // ** Vars
  const location = useLocation()
  const contentWidth = layoutStore.contentWidth
  const menuCollapsed = layoutStore.menuCollapsed
  const isHidden = layoutStore.menuHidden

  // ** Toggles Menu Collapsed
  const setMenuCollapsed = val => dispatch(handleMenuCollapsed(val))

  // ** Handles Content Width
  const setContentWidth = val => dispatch(handleContentWidth(val))

  // ** Handles Content Width
  const setIsHidden = val => dispatch(handleMenuHidden(val))

  //** This function will detect the Route Change and will hide the menu on menu item click
  useEffect(() => {
    if (menuVisibility && windowWidth < 1200) {
      setMenuVisibility(false)
    }
  }, [location])

  //** Sets Window Size & Layout Props
  useEffect(() => {
    if (window !== undefined) {
      window.addEventListener('resize', handleWindowWidth)
    }
  }, [windowWidth])

  //** ComponentDidMount
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // ** Récupérer le rôle de l'utilisateur au chargement
  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setUserRole(role)
  }, [])

  // ** Générer le menu en fonction du rôle
  const getMenuData = () => {
    if (typeof menuData === 'function') {
      return menuData(userRole)
    }
    return menuData
  }

  // ** Return if user is not logged in
  if (!localStorage.getItem('token')) {
    return null
  }

  return (
    <div
      className={classnames(
        `wrapper vertical-layout ${skin === 'bordered' ? 'bordered-layout' : ''} ${
          windowWidth < 1200 ? 'breakpoint-lt-xl' : ''
        } ${skin === 'dark' ? 'dark-layout' : ''} ${menuCollapsed ? 'menu-collapsed' : ''} ${
          skin === 'semi-dark' ? 'semi-dark-layout' : ''
        }`
      )}
      {...(isHidden ? { 'data-col': '1-column' } : {})}
    >
      {!isHidden ? (
        <SidebarComponent
          skin={skin}
          menu={menu}
          menuData={getMenuData()}
          menuCollapsed={menuCollapsed}
          menuVisibility={menuVisibility}
          setMenuCollapsed={setMenuCollapsed}
          setMenuVisibility={setMenuVisibility}
        />
      ) : null}

      <Navbar
        expand='lg'
        container={false}
        light={skin !== 'dark'}
        dark={skin === 'dark' || skin === 'semi-dark'}
        color={navbarColor}
        className={classnames(
          `header-navbar navbar align-items-center floating-nav navbar-shadow ${
            navbarType === 'sticky' ? 'sticky' : ''
          }`
        )}
      >
        <div className='navbar-container d-flex content'>
          {navbar ? (
            navbar({ skin, setSkin, setMenuVisibility })
          ) : (
            <NavbarComponent setMenuVisibility={setMenuVisibility} skin={skin} setSkin={setSkin} />
          )}
        </div>
      </Navbar>

      {/* Main Content */}
      <div className='app-content content'>
        <div className='content-wrapper'>
          <div className='content-body'>
            {children || <Outlet />}
          </div>
        </div>
      </div>

      {/* Vertical Nav Menu Overlay */}
      <div
        className={classnames('sidenav-overlay', {
          show: menuVisibility
        })}
        onClick={() => setMenuVisibility(false)}
      ></div>
      {/* Vertical Nav Menu Overlay */}

      {themeConfig.layout.customizer === true ? (
        <Customizer
          skin={skin}
          setSkin={setSkin}
          footerType={footerType}
          setFooterType={setFooterType}
          navbarType={navbarType}
          setNavbarType={setNavbarType}
          navbarColor={navbarColor}
          setNavbarColor={setNavbarColor}
          isRtl={isRtl}
          setIsRtl={setIsRtl}
          layout={layout}
          setLayout={setLayout}
          setIsHidden={setIsHidden}
          contentWidth={contentWidth}
          setContentWidth={setContentWidth}
          menuCollapsed={menuCollapsed}
          setMenuCollapsed={setMenuCollapsed}
          transition={props.transition}
        />
      ) : null}
      <footer
        className={classnames(`footer footer-light ${footerType === 'sticky' ? 'fixed-bottom' : ''}`)}
      >
        {footer ? footer : <FooterComponent footerType={footerType} footerClasses={classnames('footer-light')} />}
      </footer>
      <ScrollToTop>
            <Button className='btn-icon' color='primary'>
              <ArrowUp size={14} />
            </Button>
          </ScrollToTop>
    </div>
  )
}

export default VerticalLayout
