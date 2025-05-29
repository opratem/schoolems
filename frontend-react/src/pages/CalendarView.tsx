import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  styled,
  useTheme,
  Button,
  ButtonGroup,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  CalendarMonth,
  ViewWeek,
  Event,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import api from '../api/axios';
import { AuthContext } from '../contexts/AuthContext';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface Employee {
  id: number;
  name: string;
}

interface LeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employee: Employee;
}

type ViewMode = 'month' | 'week';

const CalendarContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 0),
}));

const DayCell = styled(Box)(({ theme }) => ({
  minHeight: '120px',
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(0.5),
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  '&.other-month': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.disabled,
  },
  '&.today': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
}));

const LeaveChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.25),
  fontSize: '0.75rem',
  height: '20px',
  cursor: 'pointer',
  '&.approved': {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  '&.pending': {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  '&.rejected': {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
}));

const WeekDayHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.divider}`,
  fontWeight: 600,
  textAlign: 'center',
}));

export default function CalendarView() {
  const { user, isAdmin, isManager } = useContext(AuthContext) || {};
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin || isManager) {
        res = await api.get('/leaverequests');
      } else if (user?.employeeId) {
        res = await api.get(`/leaverequests/employee/${user.employeeId}`);
      } else {
        res = { data: [] };
      }
      setLeaveRequests(res.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [user, isAdmin, isManager]);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentDate(prev =>
      viewMode === 'month'
        ? prev.subtract(1, 'month')
        : prev.subtract(1, 'week')
    );
  };

  const goToNext = () => {
    setCurrentDate(prev =>
      viewMode === 'month'
        ? prev.add(1, 'month')
        : prev.add(1, 'week')
    );
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
  };

  // Get leave requests for a specific date
  const getLeaveRequestsForDate = (date: Dayjs) => {
    return leaveRequests.filter(request => {
      const startDate = dayjs(request.startDate);
      const endDate = dayjs(request.endDate);
      return date.isSameOrAfter(startDate, 'day') && date.isSameOrBefore(endDate, 'day');
    });
  };

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');

    const days = [];
    let current = startOfCalendar;

    while (current.isSameOrBefore(endOfCalendar)) {
      days.push(current);
      current = current.add(1, 'day');
    }

    return days;
  };

  // Generate week days for week view
  const generateWeekDays = () => {
    const startOfWeek = currentDate.startOf('week');
    const days = [];

    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }

    return days;
  };

  const calendarDays = viewMode === 'month' ? generateMonthDays() : generateWeekDays();

  // Format the header title
  const headerTitle = viewMode === 'month'
    ? currentDate.format('MMMM YYYY')
    : `Week of ${currentDate.startOf('week').format('MMM D, YYYY')}`;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Leave Calendar
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {isAdmin || isManager
            ? 'View all employee leave requests in calendar format'
            : 'View your leave requests in calendar format'
          }
        </Typography>
      </Box>

      <CalendarContainer>
        <CalendarHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={goToPrevious} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5" sx={{ minWidth: '200px', textAlign: 'center' }}>
              {headerTitle}
            </Typography>
            <IconButton onClick={goToNext} size="small">
              <ChevronRight />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Today />}
              onClick={goToToday}
              sx={{ ml: 2 }}
            >
              Today
            </Button>
          </Box>

          <ButtonGroup size="small" variant="outlined">
            <Button
              variant={viewMode === 'month' ? 'contained' : 'outlined'}
              startIcon={<CalendarMonth />}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
              startIcon={<ViewWeek />}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
          </ButtonGroup>
        </CalendarHeader>

        <Divider sx={{ mb: 2 }} />

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LeaveChip
              label="Approved"
              size="small"
              className="approved"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LeaveChip
              label="Pending"
              size="small"
              className="pending"
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LeaveChip
              label="Rejected"
              size="small"
              className="rejected"
            />
          </Box>
        </Box>

        {/* Calendar Grid */}
        <Grid container spacing={0}>
          {/* Day headers */}
          {weekDays.map(day => (
            <Grid item xs={12/7} key={day}>
              <WeekDayHeader>
                {day}
              </WeekDayHeader>
            </Grid>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const dayLeaveRequests = getLeaveRequestsForDate(day);
            const isToday = day.isSame(dayjs(), 'day');
            const isCurrentMonth = day.month() === currentDate.month();

            return (
              <Grid item xs={12/7} key={index}>
                <DayCell
                  className={`
                    ${!isCurrentMonth ? 'other-month' : ''}
                    ${isToday ? 'today' : ''}
                  `}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 'bold' : 'normal',
                      mb: 0.5
                    }}
                  >
                    {day.format('D')}
                  </Typography>

                  <Box sx={{ maxHeight: '80px', overflow: 'hidden' }}>
                    {dayLeaveRequests.map(request => (
                      <Tooltip
                        key={request.id}
                        title={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {request.employee.name}
                            </Typography>
                            <Typography variant="caption">
                              {request.leaveType} - {request.status}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {dayjs(request.startDate).format('MMM D')} - {dayjs(request.endDate).format('MMM D')}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {request.reason}
                            </Typography>
                          </Box>
                        }
                        arrow
                      >
                        <LeaveChip
                          label={
                            viewMode === 'week'
                              ? `${request.employee.name} - ${request.leaveType}`
                              : request.employee.name.split(' ')[0]
                          }
                          size="small"
                          className={request.status.toLowerCase()}
                        />
                      </Tooltip>
                    ))}

                    {dayLeaveRequests.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayLeaveRequests.length - 3} more
                      </Typography>
                    )}
                  </Box>
                </DayCell>
              </Grid>
            );
          })}
        </Grid>
      </CalendarContainer>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading calendar...</Typography>
        </Box>
      )}
    </Container>
  );
}
