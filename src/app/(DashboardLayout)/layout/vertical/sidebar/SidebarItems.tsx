import Menuitems from "./MenuItems";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import useMediaQuery from "@mui/material/useMediaQuery";
import NavItem from "./NavItem";
import NavCollapse from "./NavCollapse";
import NavGroup from "./NavGroup/NavGroup";
import { useContext } from "react";

import { CustomizerContext } from "@/app/context/customizerContext";
import { useAuth } from "@/app/context/authContext";

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf("/"));
  const { isSidebarHover, isCollapse, isMobileSidebar, setIsMobileSidebar } =
    useContext(CustomizerContext);
  const { user } = useAuth();

  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));
  const hideMenu: any = lgUp
    ? isCollapse == "mini-sidebar" && !isSidebarHover
    : "";

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!user || !user.role) {
      return Menuitems; // If no user or role, show all (or you can return empty array)
    }

    const userRole = user.role.toLowerCase();

    // Helper function to check if a role is allowed
    const isRoleAllowed = (roles?: string[]) => {
      if (!roles || !Array.isArray(roles)) {
        return true; // If no roles specified, allow (for backward compatibility)
      }
      const normalizedRoles = roles.map((role) => role.toLowerCase());
      return normalizedRoles.includes(userRole);
    };

    // Recursive function to filter menu items and their children
    const filterMenuItem = (item: any): any | null => {
      // Always include subheaders
      if (item.subheader) {
        return item;
      }

      // Check if item has roles and user's role is allowed
      if (!isRoleAllowed(item.roles)) {
        return null;
      }

      // If item has children, filter them recursively
      if (item.children && Array.isArray(item.children)) {
        const filteredChildren = item.children
          .map(filterMenuItem)
          .filter((child: any) => child !== null);

        // Only include parent if it has at least one visible child
        if (filteredChildren.length === 0) {
          return null;
        }

        // Return item with filtered children
        return {
          ...item,
          children: filteredChildren,
        };
      }

      // Item is allowed and has no children (or children check passed)
      return item;
    };

    return Menuitems.map(filterMenuItem).filter((item) => item !== null);
  };

  const filteredMenuItems = getFilteredMenuItems();

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {filteredMenuItems.map((item) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return (
              <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />
            );

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else if (item.children) {
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}
              />
            );

            // {/********If Sub No Menu**********/}
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
