import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link } from 'react-router-dom';

interface MenuItem {
  text: string;
  path?: string;
  onClick?: () => void;
}

interface MobileMenuProps {
  menuItems: MenuItem[];
  onDrawerToggle: () => void;
  mobileOpen: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  menuItems,
  onDrawerToggle,
  mobileOpen
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawer = (
    <List>
      {menuItems.map((item) => (
        <ListItem 
          key={item.text} 
          component={item.onClick ? 'div' : Link} 
          to={item.path}
          onClick={item.onClick || onDrawerToggle}
          sx={{ 
            cursor: 'pointer',
            color: 'inherit',
            textDecoration: 'none',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            '&:visited': {
              color: 'inherit'
            }
          }}
        >
          <ListItemText 
            primary={item.text} 
            sx={{
              '& .MuiTypography-root': {
                color: 'inherit'
              }
            }}
          />
        </ListItem>
      ))}
    </List>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}; 