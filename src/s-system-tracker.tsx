import React, { useState, useEffect } from 'react';

// Format date for display (moved outside for global use and to avoid duplication)
const formatDate = (dateString) => {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const SSystemTracker = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });
  const [sessions, setSessions] = useState(() => {
    const savedSessions = localStorage.getItem('sessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  const [penalties, setPenalties] = useState(() => {
    const savedPenalties = localStorage.getItem('penalties');
    return savedPenalties ? JSON.parse(savedPenalties) : [];
  });
  const [newSession, setNewSession] = useState({
    subject: '',
    duration: 60,
    distractionFree: true,
    date: new Date().toISOString().split('T')[0]
  });
  const [newPenalty, setNewPenalty] = useState({
    reason: '',
    points: 5,
    date: new Date().toISOString().split('T')[0]
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'all'
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);

  // New state for customizable goals
  const [dailyStudyGoal, setDailyStudyGoal] = useState(() => {
    const savedGoal = localStorage.getItem('dailyStudyGoal');
    return savedGoal ? JSON.parse(savedGoal) : 8; // Default to 8 hours
  });
  const [weeklyStudyGoal, setWeeklyStudyGoal] = useState(() => {
    const savedGoal = localStorage.getItem('weeklyStudyGoal');
    return savedGoal ? JSON.parse(savedGoal) : 40; // Default to 40 hours
  });

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Save penalties to localStorage
  useEffect(() => {
    localStorage.setItem('penalties', JSON.stringify(penalties));
  }, [penalties]);

  // Save daily study goal to localStorage
  useEffect(() => {
    localStorage.setItem('dailyStudyGoal', JSON.stringify(dailyStudyGoal));
  }, [dailyStudyGoal]);

  // Save weekly study goal to localStorage
  useEffect(() => {
    localStorage.setItem('weeklyStudyGoal', JSON.stringify(weeklyStudyGoal));
  }, [weeklyStudyGoal]);

  // Calculate points for a session
  const calculatePoints = (session) => {
    const blocks = Math.floor(session.duration / 10);
    const basePoints = blocks * 5;
    let bonusPoints = 0;

    if (session.distractionFree) {
      bonusPoints = Math.floor(session.duration / 60) * 10;
      // For sessions less than an hour but more than 30 minutes
      if (session.duration < 60 && session.duration >= 30) {
        bonusPoints = 5;
      }
    }

    return {
      basePoints,
      bonusPoints,
      totalPoints: basePoints + bonusPoints
    };
  };

  // Calculate distraction-free streak in hours
  const calculateStreak = () => {
    const sortedSessions = [...sessions].sort((a, b) => {
      // Compare by date first
      if (a.date === b.date) {
        // If dates are the same, use creation timestamp (id) as a proxy for time
        return a.id - b.id;
      }
      return new Date(a.date) - new Date(b.date);
    });

    let streak = 0;
    // Start from the most recent session and go backwards
    for (let i = sortedSessions.length - 1; i >= 0; i--) {
      const session = sortedSessions[i];
      if (session.distractionFree) {
        streak += session.duration / 60; // Convert minutes to hours
      } else {
        break; // Streak broken by non-distraction-free session
      }
    }

    return Math.round(streak * 10) / 10; // Round to 1 decimal place
  };

  // Update streak whenever sessions change
  useEffect(() => {
    setCurrentStreak(calculateStreak());
  }, [sessions]);

  // Get date ranges
  const getDateRange = (type) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (type) {
      case 'day':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
        return {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0]
        };
      default:
        return { start: '', end: '' };
    }
  };

  // Calculate stats for a period
  const getPeriodStats = (type) => {
    const { start, end } = getDateRange(type);

    const periodSessions = sessions.filter(session =>
      session.date >= start && session.date <= end
    );

    const periodPenalties = penalties.filter(penalty =>
      penalty.date >= start && penalty.date <= end
    );

    const totalHours = periodSessions.reduce((sum, session) => sum + session.duration / 60, 0);
    const sessionPoints = periodSessions.reduce((sum, session) => sum + session.totalPoints, 0);
    const penaltyPoints = periodPenalties.reduce((sum, penalty) => sum + penalty.points, 0);
    const netPoints = Math.max(0, sessionPoints - penaltyPoints);

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      sessionPoints,
      penaltyPoints,
      netPoints,
      sessionCount: periodSessions.length,
      penaltyCount: periodPenalties.length
    };
  };

  const filteredSessions = viewMode === 'current'
    ? sessions.filter(session => session.date === selectedDate)
    : sessions;

  const filteredPenalties = viewMode === 'current'
    ? penalties.filter(penalty => penalty.date === selectedDate)
    : penalties;

  // Calculate total points for the view
  useEffect(() => {
    const sessionPoints = filteredSessions.reduce((sum, session) => sum + session.totalPoints, 0);
    const penaltyPoints = filteredPenalties.reduce((sum, penalty) => sum + penalty.points, 0);
    setTotalPoints(Math.max(0, sessionPoints - penaltyPoints));
  }, [filteredSessions, filteredPenalties]);

  // Determine level based on points
  useEffect(() => {
    const level = Math.max(1, Math.floor(totalPoints / 100) + 1);
    setCurrentLevel(level);
  }, [totalPoints]);

  // Get unique dates from sessions and penalties
  const getUniqueDates = () => {
    const sessionDates = sessions.map(session => session.date);
    const penaltyDates = penalties.map(penalty => penalty.date);
    const allDates = [...new Set([...sessionDates, ...penaltyDates])];
    return allDates.sort((a, b) => new Date(b) - new Date(a)); // Sort by most recent
  };

  // Add a new study session
  const addSession = () => {
    if (!newSession.subject) {
      alert('Please enter a subject name');
      return;
    }

    const pointsInfo = calculatePoints(newSession);
    const sessionWithPoints = {
      ...newSession,
      ...pointsInfo,
      id: Date.now() // Unique ID for each session
    };

    setSessions([...sessions, sessionWithPoints]);

    // Reset form
    setNewSession({
      subject: '',
      duration: 60,
      distractionFree: true,
      date: selectedDate
    });
  };

  // Add a new penalty
  const addPenalty = () => {
    if (!newPenalty.reason) {
      alert('Please enter a reason for the penalty');
      return;
    }

    const penaltyWithId = {
      ...newPenalty,
      id: Date.now() // Unique ID for each penalty
    };

    setPenalties([...penalties, penaltyWithId]);

    // Reset form
    setNewPenalty({
      reason: '',
      points: 5,
      date: selectedDate
    });
  };

  // Remove a session
  const removeSession = (id) => {
    setSessions(sessions.filter(session => session.id !== id));
  };

  // Remove a penalty
  const removePenalty = (id) => {
    setPenalties(penalties.filter(penalty => penalty.id !== id));
  };

  // Get reward text based on level
  const getRewardText = () => {
    switch(currentLevel) {
      case 1:
        return "Keep studying to reach level 2!";
      case 2:
        return "Reward: Watch one episode of your favorite anime!";
      case 3:
        return "Reward: Enjoy a special treat or snack!";
      default:
        return `Reward: Level ${currentLevel} - Choose a special activity!`;
    }
  };

  // Calculate total penalty points for the current view
  const totalPenaltyPoints = filteredPenalties.reduce((sum, penalty) => sum + penalty.points, 0);

  // Calculate daily stats including studyHours
  const getDailyStats = () => {
    const uniqueDates = getUniqueDates();

    return uniqueDates.map(date => {
      const daysSessions = sessions.filter(s => s.date === date);
      const daysPenalties = penalties.filter(p => p.date === date);

      const sessionPoints = daysSessions.reduce((sum, s) => sum + s.totalPoints, 0);
      const penaltyPoints = daysPenalties.reduce((sum, p) => sum + p.points, 0);
      const netPoints = Math.max(0, sessionPoints - penaltyPoints);
      const level = Math.max(1, Math.floor(netPoints / 100) + 1);
      const studyHours = daysSessions.reduce((sum, s) => sum + s.duration / 60, 0); // Calculate study hours for the day

      return {
        date,
        formattedDate: formatDate(date),
        sessionPoints,
        penaltyPoints,
        netPoints,
        level,
        sessionCount: daysSessions.length,
        penaltyCount: daysPenalties.length,
        studyHours: Math.round(studyHours * 10) / 10 // Round to 1 decimal place
      };
    });
  };

  // Function to reset all data
  const resetAllData = () => {
    if (window.confirm("Are you sure you want to reset all your study data, goals, and progress? This action cannot be undone.")) {
      setSessions([]);
      setPenalties([]);
      setDailyStudyGoal(8); // Reset to default
      setWeeklyStudyGoal(40); // Reset to default
      localStorage.clear(); // Clear all data from localStorage
      alert("All data has been reset!");
    }
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto rounded-lg shadow-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      {/* Dark Mode Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-md ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-800'}`}
        >
          {darkMode ? '💡 Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <h1 className="text-3xl font-bold text-center mb-6">S-System Study Tracker</h1>

      {/* Date Selection */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex flex-wrap justify-between items-center">
          <div className="mb-2 sm:mb-0">
            <label className={`text-sm font-medium mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setNewSession({...newSession, date: e.target.value});
                setNewPenalty({...newPenalty, date: e.target.value});
              }}
              className={`p-2 rounded-md ${darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
          <div>
            <label className={`text-sm font-medium mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              View Mode:
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className={`p-2 rounded-md ${darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="current">Current Date ({formatDate(selectedDate)})</option>
              <option value="all">All Dates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
        <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>

        {/* Streak Counter */}
        <div className="mb-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'} border-l-4 border-orange-500`}>
            <h3 className="font-semibold text-orange-600 mb-1">🔥 Distraction-Free Streak</h3>
            <p className="text-2xl font-bold">{currentStreak} hours</p>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Keep it up! Every distraction-free session counts.
            </p>
          </div>
        </div>

        {/* Period Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Today */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
            <h3 className="font-semibold text-blue-600 mb-2">📅 Today</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Study Hours:</span> {getPeriodStats('day').totalHours}h</p>
              <p><span className="font-medium">Sessions:</span> {getPeriodStats('day').sessionCount}</p>
              <p><span className="font-medium">Points:</span> <span className="text-green-600">+{getPeriodStats('day').sessionPoints}</span></p>
              <p><span className="font-medium">Penalties:</span> <span className="text-red-600">-{getPeriodStats('day').penaltyPoints}</span></p>
              <p className="font-bold"><span className="font-medium">Net:</span> {getPeriodStats('day').netPoints}</p>
            </div>
          </div>

          {/* This Week */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
            <h3 className="font-semibold text-purple-600 mb-2">🗓️ This Week</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Study Hours:</span> {getPeriodStats('week').totalHours}h</p>
              <p><span className="font-medium">Sessions:</span> {getPeriodStats('week').sessionCount}</p>
              <p><span className="font-medium">Points:</span> <span className="text-green-600">+{getPeriodStats('week').sessionPoints}</span></p>
              <p><span className="font-medium">Penalties:</span> <span className="text-red-600">-{getPeriodStats('week').penaltyPoints}</span></p>
              <p className="font-bold"><span className="font-medium">Net:</span> {getPeriodStats('week').netPoints}</p>
            </div>
          </div>

          {/* This Month */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
            <h3 className="font-semibold text-indigo-600 mb-2">🗓️ This Month</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Study Hours:</span> {getPeriodStats('month').totalHours}h</p>
              <p><span className="font-medium">Sessions:</span> {getPeriodStats('month').sessionCount}</p>
              <p><span className="font-medium">Points:</span> <span className="text-green-600">+{getPeriodStats('month').sessionPoints}</span></p>
              <p><span className="font-medium">Penalties:</span> <span className="text-red-600">-{getPeriodStats('month').penaltyPoints}</span></p>
              <p className="font-bold"><span className="font-medium">Net:</span> {getPeriodStats('month').netPoints}</p>
            </div>
          </div>
        </div>

        {/* Study Goals Progress */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
            <h4 className="font-medium mb-2">Daily Goal Progress</h4>
            <div className="flex justify-between text-sm mb-1">
              <span>Study Hours</span>
              <span>{getPeriodStats('day').totalHours}/{dailyStudyGoal}h</span>
            </div>
            <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (getPeriodStats('day').totalHours / dailyStudyGoal) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
            <h4 className="font-medium mb-2">Weekly Goal Progress</h4>
            <div className="flex justify-between text-sm mb-1">
              <span>Study Hours</span>
              <span>{getPeriodStats('week').totalHours}/{weeklyStudyGoal}h</span>
            </div>
            <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (getPeriodStats('week').totalHours / weeklyStudyGoal) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Customizable Goals */}
        <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-600">
          <h4 className="font-medium mb-2">Set Study Goals</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Daily Goal (hours)</label>
              <input
                type="number"
                value={dailyStudyGoal}
                onChange={(e) => setDailyStudyGoal(parseInt(e.target.value) || 0)}
                className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                min="0"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Weekly Goal (hours)</label>
              <input
                type="number"
                value={weeklyStudyGoal}
                onChange={(e) => setWeeklyStudyGoal(parseInt(e.target.value) || 0)}
                className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Points and Level Summary */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {viewMode === 'current' ? `Points for ${formatDate(selectedDate)}:` : 'Total Points:'} {totalPoints}
            </h2>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Current Level: {currentLevel}</p>
          </div>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
            <p className="font-medium">{getRewardText()}</p>
          </div>
        </div>
        <div className={`mt-3 h-4 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
          <div
            className="bg-blue-500 h-full"
            style={{ width: `${(totalPoints % 100) / 100 * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-right mt-1">Progress to Level {currentLevel + 1}: {totalPoints % 100}/100</p>
      </div>

      {/* Add New Session Form */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h2 className="text-xl font-semibold mb-3">Add Study Session</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Subject</label>
            <input
              type="text"
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              value={newSession.subject}
              onChange={(e) => setNewSession({...newSession, subject: e.target.value})}
              placeholder="e.g. Digital Electronics, JLPT"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Duration (minutes)</label>
            <input
              type="number"
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              value={newSession.duration}
              onChange={(e) => setNewSession({...newSession, duration: parseInt(e.target.value) || 0})}
              min="10"
              step="10"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={newSession.distractionFree}
              onChange={(e) => setNewSession({...newSession, distractionFree: e.target.checked})}
              className="mr-2"
            />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Distraction-free session</span>
          </label>
        </div>
        <div className="mt-4">
          <button
            onClick={addSession}
            className={`py-2 px-4 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            Add Session
          </button>
        </div>
      </div>

      {/* Add Penalty Section */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
        <h2 className="text-xl font-semibold mb-3">Add Penalty</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Reason</label>
            <input
              type="text"
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              value={newPenalty.reason}
              onChange={(e) => setNewPenalty({...newPenalty, reason: e.target.value})}
              placeholder="e.g. Social media distraction"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Points (-5 by default)</label>
            <input
              type="number"
              className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-600 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              value={newPenalty.points}
              onChange={(e) => setNewPenalty({...newPenalty, points: parseInt(e.target.value) || 0})}
              min="1"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={addPenalty}
            className={`py-2 px-4 rounded-md ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
          >
            Add Penalty
          </button>
        </div>
      </div>

      {/* Points Preview */}
      {newSession.subject && (
        <div className={`p-4 rounded-lg mb-6 border ${darkMode ? 'bg-gray-700 border-blue-800' : 'bg-gray-50 border-blue-100'}`}>
          <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Points Preview</h3>
          <div className="flex justify-between text-sm">
            <div>
              <p>Base Points: {calculatePoints(newSession).basePoints}</p>
              <p>Bonus Points: {calculatePoints(newSession).bonusPoints}</p>
            </div>
            <div className="font-bold">
              Total: {calculatePoints(newSession).totalPoints} points
            </div>
          </div>
        </div>
      )}

      {/* Daily Stats */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Daily Progress</h2>
        {getUniqueDates().length === 0 ? (
          <p className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date</th>
                  <th className={`p-3 text-right text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Hours</th>
                  <th className={`p-3 text-right text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sessions</th>
                  <th className={`p-3 text-right text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Penalties</th>
                  <th className={`p-3 text-right text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Points</th>
                  <th className={`p-3 text-center text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Level</th>
                  <th className={`p-3 text-center text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getDailyStats().map((day) => (
                  <tr
                    key={day.date}
                    className={`${darkMode ? 'border-t border-gray-700' : 'border-t'} ${
                      day.date === selectedDate ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''
                    }`}
                  >
                    <td className="p-3 font-medium">{day.formattedDate}</td>
                    <td className="p-3 text-right font-medium">{day.studyHours}h</td>
                    <td className="p-3 text-right">
                      <span className="text-green-500 font-medium">+{day.sessionPoints}</span>
                      <span className="text-xs ml-1">({day.sessionCount})</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-red-500 font-medium">-{day.penaltyPoints}</span>
                      <span className="text-xs ml-1">({day.penaltyCount})</span>
                    </td>
                    <td className="p-3 text-right font-bold">{day.netPoints}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-md ${
                        darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {day.level}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedDate(day.date);
                          setNewSession({...newSession, date: day.date});
                          setNewPenalty({...newPenalty, date: day.date});
                          setViewMode('current');
                        }}
                        className={`px-2 py-1 rounded-md ${
                          darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                        } text-sm`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">
          {viewMode === 'current' ? `Study Sessions for ${formatDate(selectedDate)}` : 'All Study Sessions'}
        </h2>
        {filteredSessions.length === 0 ? (
          <p className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No study sessions found for this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  {viewMode === 'all' && <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date</th>}
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subject</th>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Duration</th>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Base</th>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Bonus</th>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total</th>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id} className={darkMode ? 'border-t border-gray-700' : 'border-t'}>
                    {viewMode === 'all' && <td className="p-3">{formatDate(session.date)}</td>}
                    <td className="p-3">{session.subject}</td>
                    <td className="p-3">{session.duration} min</td>
                    <td className="p-3">{session.basePoints}</td>
                    <td className="p-3">{session.bonusPoints}</td>
                    <td className="p-3 font-bold">{session.totalPoints}</td>
                    <td className="p-3">
                      <button
                        onClick={() => removeSession(session.id)}
                        className={darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  {viewMode === 'all' && <td></td>}
                  <td colSpan={viewMode === 'all' ? 5 : 4} className="p-3 text-right font-semibold">Total Session Points:</td>
                  <td className="p-3 font-bold">{filteredSessions.reduce((sum, session) => sum + session.totalPoints, 0)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Penalties List */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          {viewMode === 'current' ? `Penalties for ${formatDate(selectedDate)}` : 'All Penalties'}
        </h2>
        {filteredPenalties.length === 0 ? (
          <p className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No penalties found for this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  {viewMode === 'all' && <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date</th>}
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reason</th>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Points Deducted</th>
                  <th className={`p-3 text-left text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenalties.map((penalty) => (
                  <tr key={penalty.id} className={darkMode ? 'border-t border-gray-700' : 'border-t'}>
                    {viewMode === 'all' && <td className="p-3">{formatDate(penalty.date)}</td>}
                    <td className="p-3">{penalty.reason}</td>
                    <td className="p-3 font-bold text-red-500">-{penalty.points}</td>
                    <td className="p-3">
                      <button
                        onClick={() => removePenalty(penalty.id)}
                        className={darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  {viewMode === 'all' && <td></td>}
                  <td colSpan={viewMode === 'all' ? 1 : 1} className="p-3 text-right font-semibold">Total Penalty Points:</td>
                  <td className="p-3 font-bold text-red-500">-{totalPenaltyPoints}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Overall Summary */}
      <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h2 className="text-xl font-semibold mb-2">
          {viewMode === 'current' ? `Summary for ${formatDate(selectedDate)}` : 'Overall Summary'}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>Total Session Points: <span className="font-bold text-green-500">+{filteredSessions.reduce((sum, session) => sum + session.totalPoints, 0)}</span></p>
            <p>Total Penalty Points: <span className="font-bold text-red-500">-{totalPenaltyPoints}</span></p>
          </div>
          <div className="text-right">
            <p>Current Level: <span className="font-bold">{currentLevel}</span></p>
            <p className="font-bold text-lg">Net Points: {totalPoints}</p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-6 text-center">
        <button
          onClick={resetAllData}
          className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          Reset All Data
        </button>
      </div>
    </div>
  );
};

export default SSystemTracker;
