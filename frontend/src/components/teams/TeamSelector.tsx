import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Chip,
  Autocomplete,
  TextField,
  Typography
} from '@mui/material';
import { Team } from '@task-manager/shared';
import { RootState, AppDispatch } from '../../store';
import { searchTeams } from '../../store/slices/teamsSlice';

interface TeamSelectorProps {
  selectedTeams: Team[];
  onTeamsChange: (teams: Team[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeams,
  onTeamsChange,
  label = "Teams",
  placeholder = "Search and select teams",
  disabled = false
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { searchResults, searchLoading } = useSelector((state: RootState) => state.teams);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery.length >= 2) {
      dispatch(searchTeams(searchQuery));
    }
  }, [dispatch, searchQuery]);

  const handleTeamChange = (event: any, newValue: Team[]) => {
    onTeamsChange(newValue);
  };

  return (
    <Box>
      <Autocomplete
        multiple
        options={searchResults}
        getOptionLabel={(team) => team.name}
        value={selectedTeams}
        onChange={handleTeamChange}
        inputValue={searchQuery}
        onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
        loading={searchLoading}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((team, index) => (
            <Chip
              variant="outlined"
              label={team.name}
              {...getTagProps({ index })}
              key={team.id}
            />
          ))
        }
        renderOption={(props, team) => (
          <li {...props}>
            <Box>
              <Typography variant="body1">{team.name}</Typography>
              {team.description && (
                <Typography variant="body2" color="text.secondary">
                  {team.description}
                </Typography>
              )}
            </Box>
          </li>
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
    </Box>
  );
};