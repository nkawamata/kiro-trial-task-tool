import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useTaskComments } from '../../hooks/useTaskComments';
import { TaskCommentWithUser } from '../../services/taskCommentService';
import { RootState } from '../../store';

// Helper function to safely format dates
const safeFormatDistanceToNow = (date: Date): string => {
  try {
    if (!date || isNaN(date.getTime())) {
      return 'Unknown time';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'Unknown time';
  }
};

interface TaskCommentsProps {
  taskId: string;
}

interface CommentItemProps {
  comment: TaskCommentWithUser;
  currentUserId: string;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  currentUserId, 
  onUpdate, 
  onDelete 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = comment.userId === currentUserId;
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() === comment.content.trim()) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the parent component
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    handleMenuClose();
    try {
      await onDelete(comment.id);
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
          {comment.user?.name?.charAt(0).toUpperCase() || comment.userId.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="body2" fontWeight="medium">
              {comment.user?.name || comment.user?.email || `User ${comment.userId.slice(-4)}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {safeFormatDistanceToNow(comment.createdAt)}
            </Typography>
            {comment.createdAt && comment.updatedAt && 
             !isNaN(comment.createdAt.getTime()) && !isNaN(comment.updatedAt.getTime()) &&
             comment.createdAt.getTime() !== comment.updatedAt.getTime() && (
              <Chip 
                label="edited" 
                size="small" 
                variant="outlined" 
                sx={{ height: 16, fontSize: '0.625rem' }}
              />
            )}
          </Box>
          
          {isEditing ? (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                variant="outlined"
                size="small"
                disabled={isUpdating}
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editContent.trim()}
                  startIcon={isUpdating ? <CircularProgress size={16} /> : undefined}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {comment.content}
            </Typography>
          )}
        </Box>
        
        {isOwner && !isEditing && (
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    comments,
    hasMore,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment
  } = useTaskComments(taskId);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleSubmitComment();
    }
  };

  if (!user) return null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* New comment form */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add a comment... (Ctrl+Enter to submit)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyPress}
          variant="outlined"
          disabled={isSubmitting}
          inputProps={{ maxLength: 1000 }}
        />
        <Box sx={{ 
          mt: 1, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="caption" color="text.secondary">
            {newComment.length}/1000 characters
          </Typography>
          <Button
            variant="contained"
            onClick={handleSubmitComment}
            disabled={isSubmitting || !newComment.trim()}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
          >
            Comment
          </Button>
        </Box>
      </Paper>
      
      {/* Comments list */}
      {loading && comments.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            <>
              {comments.map((comment, index) => (
                <React.Fragment key={comment.id}>
                  <CommentItem
                    comment={comment}
                    currentUserId={user.id}
                    onUpdate={updateComment}
                    onDelete={deleteComment}
                  />
                  {index < comments.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
              
              {hasMore && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Chip 
                    label="More comments available" 
                    variant="outlined" 
                    size="small"
                    sx={{ opacity: 0.7 }}
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
};