// ** Vertical Menu Components
import VerticalNavMenuLink from './VerticalNavMenuLink'
import VerticalNavMenuGroup from './VerticalNavMenuGroup'
import VerticalNavMenuSectionHeader from './VerticalNavMenuSectionHeader'

// ** Utils
import { resolveVerticalNavMenuItemComponent as resolveNavItemComponent } from '@layouts/utils'
import { canViewMenuGroup } from '@core/utils/menuPermissions'

const VerticalMenuNavItems = props => {
  // ** Components Object
  const Components = {
    VerticalNavMenuLink,
    VerticalNavMenuGroup,
    VerticalNavMenuSectionHeader
  }

  // ** Render Nav Menu Items
  const RenderNavItems = props.items.map((item, index) => {
    const TagName = Components[resolveNavItemComponent(item)]
    const key = item.id || item.header || `menu-item-${index}`
    
    if (item.children) {
      return canViewMenuGroup(item) && <TagName item={item} index={index} key={key} {...props} />
    }
    return <TagName key={key} item={item} {...props} />
  })

  return RenderNavItems
}

export default VerticalMenuNavItems
