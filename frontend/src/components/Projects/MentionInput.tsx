import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Popper,
  ClickAwayListener,
  CircularProgress,
  Typography,
} from '@mui/material';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  onSearchUsers: (query: string) => Promise<User[]>;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = 'Write a comment...',
  disabled = false,
  rows = 3,
  onSearchUsers,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      setAnchorEl(inputRef.current);
    }
  }, []);

  useEffect(() => {
    const searchMentions = async () => {
      if (mentionQuery.length >= 2) {
        setIsSearching(true);
        try {
          const users = await onSearchUsers(mentionQuery);
          setSuggestions(users);
          setSelectedIndex(0);
        } catch (error) {
          console.error('Error searching users:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setIsSearching(false);
      }
    };

    if (mentionStart >= 0) {
      // Show searching state immediately
      if (mentionQuery.length >= 2) {
        setIsSearching(true);
      }

      // Debounce search to reduce API calls (wait 300ms after user stops typing)
      const debounceTimer = setTimeout(() => {
        searchMentions();
      }, 300);

      return () => {
        clearTimeout(debounceTimer);
        setIsSearching(false);
      };
    }
  }, [mentionQuery, mentionStart, onSearchUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);

    // Check if @ was just typed
    if (newValue[cursorPos - 1] === '@') {
      setMentionStart(cursorPos - 1);
      setMentionQuery('');
      setShowSuggestions(true);
      return;
    }

    // If we're in mention mode, update the query
    if (mentionStart >= 0) {
      const textAfterMention = newValue.substring(mentionStart + 1, cursorPos);

      // Check if there's a space or newline (end mention mode)
      if (textAfterMention.includes(' ') || textAfterMention.includes('\n')) {
        setMentionStart(-1);
        setShowSuggestions(false);
        setMentionQuery('');
        return;
      }

      setMentionQuery(textAfterMention);
    }
  };

  const insertMention = (user: User) => {
    if (mentionStart < 0) return;

    const cursorPos = inputRef.current?.selectionStart || 0;
    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(cursorPos);

    const mentionText = `@[${user.displayName}](${user.id})`;
    const newValue = beforeMention + mentionText + ' ' + afterCursor;

    onChange(newValue);
    setMentionStart(-1);
    setShowSuggestions(false);
    setMentionQuery('');
    setSuggestions([]);

    // Set cursor position after mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionStart + mentionText.length + 1;
        inputRef.current.selectionStart = newCursorPos;
        inputRef.current.selectionEnd = newCursorPos;
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showSuggestions) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setMentionStart(-1);
        setMentionQuery('');
        break;
    }
  };

  const handleClickAway = () => {
    setShowSuggestions(false);
    setMentionStart(-1);
    setMentionQuery('');
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          multiline
          rows={rows}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          variant="outlined"
          disabled={disabled}
          inputRef={inputRef}
        />
        <Popper
          open={showSuggestions && (isSearching || suggestions.length > 0)}
          anchorEl={anchorEl}
          placement="bottom-start"
          style={{ zIndex: 1300, width: anchorEl?.clientWidth }}
        >
          <Paper elevation={3} sx={{ maxHeight: 300, overflow: 'auto', mt: 1 }}>
            {isSearching ? (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Searching...
                </Typography>
              </Box>
            ) : suggestions.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            ) : (
              <List>
                {suggestions.map((user, index) => (
                  <ListItem
                    key={user.id}
                    button
                    selected={index === selectedIndex}
                    onClick={() => insertMention(user)}
                    sx={{
                      bgcolor: index === selectedIndex ? 'action.selected' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {user.firstName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.displayName}
                      secondary={user.email}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default MentionInput;
