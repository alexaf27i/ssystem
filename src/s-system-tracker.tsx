import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudyTracker = () => {
  // Color themes
  const themes = {
    blue: {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-blue-100',
      accent: 'text-blue-600',
      header: 'bg-blue-50'
    },
    green: {
      primary: 'bg-green-500 hover:bg-green-600 text-white',
      secondary: 'bg-green-100',
      accent: 'text-green-600',
      header: 'bg-green-50'
    },
    purple: {
      primary: 'bg-purple-500 hover:bg-purple-600 text-white',
      secondary: 'bg-purple-100',
      accent: 'text-purple-600',
      header: 'bg-purple-50'
    },
    orange: {
      primary: 'bg-orange-500 hover:bg-orange-600 text-white',
      secondary: 'bg-orange-100',
      accent: 'text-orange-600',
      header: 'bg-orange-50'
    }
  };

  // Initialize state with sample data or from localStorage.
  // Added distractionFree flag to each entry.
  const [studyData, setStudyData] = useState(() => {
    const savedData = localStorage.getItem('studyData');
    return savedData ? JSON.parse(savedData) : [
      { id: 1, date: '2025-03-01', hours: 2.5, subject: 'Mathematics', distractionFree: true },
      { id: 2, date: '2025-03-02', hours: 1.0, subject: 'Physics', distractionFree: false },
      { id: 3, date: '2025-03-03', hours: 3.0, subject: 'Computer Science', distractionFree: true },
      { id: 4, date: '2025-02-25', hours: 2.0, subject: 'Mathematics', distractionFree: false },
      { id: 5, date: '2025-02-26', hours: 1.5, subject: 'Physics', distractionFree: true },
      { id: 6, date: '2025-02-27', hours: 4.0, subject: 'Computer Science', distractionFree: true },
      { id: 7, date: '2025-02-28', hours: 2.0, subject: 'Literature', distractionFree: false }
    ];
  });

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('studyTheme');
    return savedTheme || 'blue';
  });
  const [editingId, setEditingId] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    subject: '',
    distractionFree: false
  });
  const [timeRange, setTimeRange] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [chartType, setChartType] = useState('line');
  
  // Save to localStorage whenever studyData or theme changes
  useEffect(() => {
    localStorage.setItem('studyData', JSON.stringify(studyData));
  }, [studyData]);
  
  useEffect(() => {
    localStorage.setItem('studyTheme', theme);
  }, [theme]);

  // Get unique subjects
  const uniqueSubjects = [...new Set(studyData.map(entry => entry.subject))].sort();
  
  // Filter data based on selected time range and subject
  const getFilteredData = () => {
    let filtered = [...studyData];
    
    // Apply time filter
    const now = new Date();
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(entry => new Date(entry.date) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(entry => new Date(entry.date) >= monthAgo);
    }
    
    // Apply subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(entry => entry.subject === subjectFilter);
    }
    
    return filtered;
  };
  
  const filteredData = getFilteredData();
  
  // Calculate summary statistics
  const totalHours = filteredData.reduce((total, entry) => total + Number(entry.hours), 0);
  const averageHoursPerDay = filteredData.length ? (totalHours / filteredData.length).toFixed(1) : 0;
  
  // Prepare chart data
  const prepareChartData = () => {
    const dateMap = new Map();
    
    // Sort by date
    const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group by date
    sortedData.forEach(entry => {
      const date = entry.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          total: 0
        });
        
        // Initialize each subject with 0 hours
        uniqueSubjects.forEach(subject => {
          dateMap.get(date)[subject] = 0;
        });
      }
      
      // Add hours for the specific subject
      dateMap.get(date)[entry.subject] += Number(entry.hours);
      dateMap.get(date).total += Number(entry.hours);
    });
    
    return Array.from(dateMap.values());
  };
  
  const chartData = prepareChartData();
  
  // Calculate subject statistics
  const getSubjectStats = () => {
    const stats = {};
    uniqueSubjects.forEach(subject => {
      const subjectEntries = filteredData.filter(entry => entry.subject === subject);
      const subjectHours = subjectEntries.reduce((total, entry) => total + Number(entry.hours), 0);
      stats[subject] = {
        hours: subjectHours,
        percentage: totalHours ? Math.round((subjectHours / totalHours) * 100) : 0
      };
    });
    return stats;
  };
  
  const subjectStats = getSubjectStats();
  
  // Add new entry
  const handleAddEntry = () => {
    if (newEntry.hours <= 0 || !newEntry.subject.trim()) return;
    
    const entry = {
      id: Date.now(),
      date: newEntry.date,
      hours: Number(newEntry.hours),
      subject: newEntry.subject.trim(),
      distractionFree: newEntry.distractionFree
    };
    
    setStudyData([...studyData, entry]);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      subject: '',
      distractionFree: false
    });
  };
  
  // Delete entry
  const handleDelete = (id) => {
    setStudyData(studyData.filter(entry => entry.id !== id));
    if (editingId === id) setEditingId(null);
  };
  
  // Start editing
  const handleEdit = (id) => {
    setEditingId(id);
  };
  
  // Save edits
  const handleSave = (id, updatedEntry) => {
    setStudyData(studyData.map(entry => 
      entry.id === id ? { ...entry, ...updatedEntry } : entry
    ));
    setEditingId(null);
  };
  
  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
  };
  
  // Form change handlers
  const handleNewEntryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEntry({
      ...newEntry,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // NEW: Calculate timeframe statistics.
  // Points are calculated as 10 points per study hour.
  const getTimeFrameStats = (timeFrame) => {
    let entries = [];
    const now = new Date();
    
    if (timeFrame === 'day') {
      const today = now.toISOString().split('T')[0];
      entries = studyData.filter(entry => entry.date === today);
    } else if (timeFrame === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      entries = studyData.filter(entry => new Date(entry.date) >= weekAgo);
    } else if (timeFrame === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      entries = studyData.filter(entry => new Date(entry.date) >= monthAgo);
    }
    
    const totalStudyHours = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    const totalPoints = totalStudyHours * 10;
    
    return {
      totalStudyHours: totalStudyHours.toFixed(1),
      totalPoints: totalPoints.toFixed(0)
    };
  };

  // NEW: Calculate distraction‐free study streak in hours.
  // This function sums distraction‐free hours for consecutive days starting from today.
  const getDistractionFreeStreak = () => {
    let streakHours = 0;
    const today = new Date();
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      // Filter entries for this date that are distraction free.
      const dayEntries = studyData.filter(entry => entry.date === dateStr && entry.distractionFree);
      if (dayEntries.length > 0) {
        const dayTotal = dayEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
        streakHours += dayTotal;
      } else {
        break;
      }
      // Move to previous day.
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streakHours;
  };

  // Helper function to get colors for subjects
  const getSubjectColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ff0000', '#b042f5'];
    return colors[index % colors.length];
  };

  return (
    <div className={`max-w-6xl mx-auto p-4 ${themes[theme].header} min-h-screen`}>
      <h1 className={`text-3xl font-bold mb-6 text-center ${themes[theme].accent}`}>Daily Study Tracker</h1>
      
      {/* Theme selector */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Customize Theme</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(themes).map(themeName => (
            <button
              key={themeName}
              onClick={() => setTheme(themeName)}
              className={`px-4 py-2 rounded capitalize ${theme === themeName ? themes[themeName].primary : 'bg-gray-200'}`}
            >
              {themeName}
            </button>
          ))}
        </div>
      </div>
      
      {/* Add new entry form */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Study Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={newEntry.date}
              onChange={handleNewEntryChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hours</label>
            <input
              type="number"
              name="hours"
              min="0"
              step="0.5"
              value={newEntry.hours}
              onChange={handleNewEntryChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              name="subject"
              value={newEntry.subject}
              onChange={handleNewEntryChange}
              className="w-full p-2 border rounded"
              list="subject-list"
            />
            <datalist id="subject-list">
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="distractionFree"
                checked={newEntry.distractionFree}
                onChange={handleNewEntryChange}
                className="mr-2"
              />
              <span className="text-sm">Distraction Free</span>
            </label>
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAddEntry}
              className={`w-full p-2 rounded ${themes[theme].primary}`}
            >
              Add Entry
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Time Range</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select 
              value={subjectFilter} 
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Chart Type</label>
            <select 
              value={chartType} 
              onChange={(e) => setChartType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Study sessions summary */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Summary Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded ${themes[theme].secondary}`}>
            <h3 className="text-lg font-medium mb-1">Total Time</h3>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)} hours</p>
          </div>
          <div className={`p-4 rounded ${themes[theme].secondary}`}>
            <h3 className="text-lg font-medium mb-1">Study Sessions</h3>
            <p className="text-2xl font-bold">{filteredData.length}</p>
          </div>
          <div className={`p-4 rounded ${themes[theme].secondary}`}>
            <h3 className="text-lg font-medium mb-1">Average Per Session</h3>
            <p className="text-2xl font-bold">{averageHoursPerDay} hours</p>
          </div>
          <div className={`p-4 rounded ${themes[theme].secondary}`}>
            <h3 className="text-lg font-medium mb-1">Unique Subjects</h3>
            <p className="text-2xl font-bold">{uniqueSubjects.length}</p>
          </div>
        </div>
      </div>
      
      {/* NEW: Timeframe Statistics Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Timeframe Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['day', 'week', 'month'].map((frame) => {
            const stats = getTimeFrameStats(frame);
            return (
              <div key={frame} className="p-4 border rounded">
                <h3 className="font-semibold mb-2 capitalize">{frame}</h3>
                <p>Total Study Hours: {stats.totalStudyHours} hrs</p>
                <p>Total Points: {stats.totalPoints}</p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* NEW: Distraction-Free Streak (in hours) */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Distraction-Free Study Session Streak (in hours)</h2>
        <p className="text-2xl font-bold">Current Streak: {getDistractionFreeStreak()} hrs</p>
      </div>
      
      {/* Subject breakdown */}
      {uniqueSubjects.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Subject Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(subjectStats).map(([subject, stats]) => (
              <div key={subject} className="p-4 border rounded">
                <h3 className="text-lg font-medium">{subject}</h3>
                <div className="mt-2 mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${themes[theme].primary}`} 
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>{stats.hours.toFixed(1)} hours</span>
                  <span>{stats.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Charts */}
      {chartData.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Study Time Visualization</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {subjectFilter === 'all' ? (
                    <>
                      <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" strokeWidth={2} />
                      {uniqueSubjects.map((subject, index) => (
                        <Line 
                          key={subject}
                          type="monotone" 
                          dataKey={subject} 
                          stroke={getSubjectColor(index)} 
                          name={subject}
                          strokeDasharray={index % 2 ? "5 5" : ""}
                        />
                      ))}
                    </>
                  ) : (
                    <Line type="monotone" dataKey={subjectFilter} stroke="#8884d8" name={subjectFilter} strokeWidth={2} />
                  )}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  {subjectFilter === 'all' ? (
                    uniqueSubjects.map((subject, index) => (
                      <Bar 
                        key={subject}
                        dataKey={subject} 
                        fill={getSubjectColor(index)} 
                        name={subject} 
                        stackId={timeRange === 'all' ? "a" : undefined}
                      />
                    ))
                  ) : (
                    <Bar dataKey={subjectFilter} fill="#8884d8" name={subjectFilter} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Study sessions list */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Study Sessions</h2>
        {filteredData.length === 0 ? (
          <p className="text-gray-500 italic">No study sessions match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={themes[theme].secondary}>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Subject</th>
                  <th className="p-2 text-right">Hours</th>
                  <th className="p-2 text-center">Distraction-Free</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                  <tr key={entry.id} className="border-b">
                    {editingId === entry.id ? (
                      <>
                        <td className="p-2">
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => handleSave(entry.id, { date: e.target.value })}
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={entry.subject}
                            onChange={(e) => handleSave(entry.id, { subject: e.target.value })}
                            className="w-full p-1 border rounded"
                            list="subject-list-edit"
                          />
                          <datalist id="subject-list-edit">
                            {uniqueSubjects.map(subject => (
                              <option key={subject} value={subject} />
                            ))}
                          </datalist>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={entry.hours}
                            onChange={(e) => handleSave(entry.id, { hours: Number(e.target.value) })}
                            className="w-full p-1 border rounded text-right"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={entry.distractionFree}
                            onChange={(e) => handleSave(entry.id, { distractionFree: e.target.checked })}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-gray-700 mr-2"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="p-2">{entry.subject}</td>
                        <td className="p-2 text-right">{entry.hours.toFixed(1)}</td>
                        <td className="p-2 text-center">{entry.distractionFree ? '✅' : '❌'}</td>
                        <td className="p-2 text-center">
                          <button 
                            onClick={() => handleEdit(entry.id)}
                            className={themes[theme].accent + " mr-2"}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyTracker;