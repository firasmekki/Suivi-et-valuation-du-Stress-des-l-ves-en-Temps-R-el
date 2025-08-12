import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isRTL: false,
  layout: 'vertical',
  skin: 'light',
  lastSkin: 'light',
  menuCollapsed: false,
  footerType: 'static',
  navbarType: 'floating',
  menuHidden: false,
  contentWidth: 'full'
}

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    handleRTL: (state, action) => {
      state.isRTL = action.payload
    },
    handleLayout: (state, action) => {
      state.layout = action.payload
    },
    handleSkin: (state, action) => {
      state.skin = action.payload
      state.lastSkin = action.payload
    },
    handleMenuCollapsed: (state, action) => {
      state.menuCollapsed = action.payload
    },
    handleFooterType: (state, action) => {
      state.footerType = action.payload
    },
    handleNavbarType: (state, action) => {
      state.navbarType = action.payload
    },
    handleMenuHidden: (state, action) => {
      state.menuHidden = action.payload
    },
    handleContentWidth: (state, action) => {
      state.contentWidth = action.payload
    }
  }
})

export const {
  handleRTL,
  handleLayout,
  handleSkin,
  handleMenuCollapsed,
  handleFooterType,
  handleNavbarType,
  handleMenuHidden,
  handleContentWidth
} = layoutSlice.actions

export default layoutSlice.reducer 