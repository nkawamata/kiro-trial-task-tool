import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationGuardProps {
  hasUnsavedChanges: boolean;
  message?: string;
  onConfirmNavigation?: () => void;
  onCancelNavigation?: () => void;
}

export const NavigationGuard: React.FC<NavigationGuardProps> = ({
  hasUnsavedChanges,
  message = 'You have unsaved changes. Are you sure you want to leave this page?',
  onConfirmNavigation,
  onCancelNavigation
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [nextLocation, setNextLocation] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        setShowDialog(true);
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', location.pathname + location.search);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, message, location]);

  const handleConfirmNavigation = () => {
    setShowDialog(false);
    onConfirmNavigation?.();
    
    if (nextLocation) {
      navigate(nextLocation, { replace: true });
      setNextLocation(null);
    } else {
      // Handle browser back button
      window.history.back();
    }
  };

  const handleCancelNavigation = () => {
    setShowDialog(false);
    setNextLocation(null);
    onCancelNavigation?.();
  };

  // Function to be called when programmatic navigation is attempted
  const checkNavigation = (targetLocation: string): boolean => {
    if (hasUnsavedChanges) {
      setNextLocation(targetLocation);
      setShowDialog(true);
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  };

  return (
    <>
      <Dialog
        open={showDialog}
        onClose={handleCancelNavigation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Unsaved Changes
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {message}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Your changes will be lost if you continue without saving.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNavigation} color="primary">
            Stay on Page
          </Button>
          <Button 
            onClick={handleConfirmNavigation} 
            color="warning" 
            variant="contained"
          >
            Leave Without Saving
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Hook to use navigation guard
export const useNavigationGuard = (hasUnsavedChanges: boolean) => {
  const navigate = useNavigate();
  const [guardedNavigate, setGuardedNavigate] = useState<((path: string) => void) | null>(null);

  useEffect(() => {
    const safeNavigate = (path: string) => {
      if (!hasUnsavedChanges) {
        navigate(path);
        return;
      }

      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
      
      if (confirmed) {
        navigate(path);
      }
    };

    setGuardedNavigate(() => safeNavigate);
  }, [navigate, hasUnsavedChanges]);

  return guardedNavigate;
};