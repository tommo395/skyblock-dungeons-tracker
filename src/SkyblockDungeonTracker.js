import React, { useState, useEffect } from 'react';
import { Shield, Sword, Wand, Heart, Target, Clock, Trophy, Award, Star, Activity, Search, 
  FlaskConical, Loader, AlertTriangle, BookOpen, ChevronDown, ChevronUp, Info, RefreshCw } from 'lucide-react';

const SkyblockDungeonTracker = () => {
  // State management
  const [playerName, setPlayerName] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeProfile, setActiveProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('normal');
  const [selectedFloor, setSelectedFloor] = useState('7');
  const [selectedMasterFloor, setSelectedMasterFloor] = useState('1');
  const [expandedSections, setExpandedSections] = useState({
    floorDetails: true,
    essenceCollection: false
  });

  // Demo players for quick access
  const demoPlayers = [
    { name: 'tommo395', description: 'creator' },
    { name: 'midori642', description: 'cold guy' },
    { name: 'LeDucTaep', description: 'geko man' },
    { name: 'boolfalse', description: 'im scared' }
  ];

  // Fetch player data
  const fetchPlayerData = async (name = playerName) => {
    if (!name) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://sky.shiiyu.moe/api/v2/dungeons/${name}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch player data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.profiles || Object.keys(data.profiles).length === 0) {
        throw new Error('No profiles found for this player');
      }
      
      setPlayerData(data);
      setPlayerName(name);
      
      // Find the active profile
      const activeProfileKey = Object.keys(data.profiles).find(key => 
        data.profiles[key].selected === true
      ) || Object.keys(data.profiles)[0];
      
      setActiveProfile(data.profiles[activeProfileKey]);

      // Set default selected floor based on data
      if (data.profiles[activeProfileKey].dungeons?.catacombs?.highest_floor) {
        const highestFloor = data.profiles[activeProfileKey].dungeons.catacombs.highest_floor;
        setSelectedFloor(highestFloor.replace('floor_', ''));
      }
      
      if (data.profiles[activeProfileKey].dungeons?.master_catacombs?.highest_floor) {
        const highestMasterFloor = data.profiles[activeProfileKey].dungeons.master_catacombs.highest_floor;
        setSelectedMasterFloor(highestMasterFloor.replace('floor_', ''));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch player data');
    } finally {
      setLoading(false);
    }
  };

  // Format large numbers with K, M, B suffix
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  // Format time in mm:ss format from milliseconds
  const formatTime = (milliseconds) => {
    if (!milliseconds) return 'N/A';
    
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date from timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPlayerData();
  };

  // Function to get class icon with appropriate coloring
  const getClassIcon = (className) => {
    switch (className) {
      case 'tank':
        return <Shield size={20} className="text-class-tank" />;
      case 'berserk':
      case 'beserk': // Handle potential typo in API
        return <Sword size={20} className="text-class-berserk" />;
      case 'mage':
        return <Wand size={20} className="text-class-mage" />;
      case 'healer':
        return <Heart size={20} className="text-class-healer" />;
      case 'archer':
        return <Target size={20} className="text-class-archer" />;
      default:
        return <Target size={20} className="text-text-secondary" />;
    }
  };

  // Get color class name for class
  const getClassColorClass = (className) => {
    switch (className) {
      case 'tank': return 'text-class-tank';
      case 'berserk': 
      case 'beserk': return 'text-class-berserk';
      case 'mage': return 'text-class-mage';
      case 'healer': return 'text-class-healer';
      case 'archer': return 'text-class-archer';
      default: return 'text-text-secondary';
    }
  };
  
  // Function to get color based on score
  const getScoreColorClass = (score) => {
    if (score >= 300) return 'text-score-splus';
    if (score >= 270) return 'text-score-s';
    if (score >= 200) return 'text-score-a';
    if (score >= 100) return 'text-score-b';
    return 'text-score-c';
  };

  // Function to get color based on catacombs level
  const getRarityColorClass = (level) => {
    if (level >= 40) return 'text-rarity-mythic';
    if (level >= 30) return 'text-rarity-legendary';
    if (level >= 20) return 'text-rarity-epic';
    if (level >= 10) return 'text-rarity-rare';
    return 'text-rarity-uncommon';
  };

  // Get dungeons data from active profile
  const getDungeonsData = () => {
    if (!activeProfile || !activeProfile.dungeons) {
      return null;
    }
    return activeProfile.dungeons;
  };

  // Get catacombs data
  const getCatacombsData = () => {
    const dungeons = getDungeonsData();
    if (!dungeons) return null;
    
    return activeTab === 'normal' 
      ? dungeons.catacombs 
      : dungeons.master_catacombs;
  };

  // Get catacombs level
  const getCatacombsLevel = () => {
    const dungeons = getDungeonsData();
    if (!dungeons) return { level: 0, progress: 0 };
    
    const catacombs = dungeons.catacombs;
    if (!catacombs || !catacombs.level) return { level: 0, progress: 0 };
    
    return {
      level: catacombs.level.level || 0,
      progress: catacombs.level.progress || 0,
      xpCurrent: catacombs.level.xpCurrent || 0,
      xpForNext: catacombs.level.xpForNext || 0,
      totalXp: catacombs.level.xp || 0
    };
  };

  // Get floor data
  const getFloorData = () => {
    const catacombs = getCatacombsData();
    if (!catacombs || !catacombs.floors) return null;
    
    const floorId = activeTab === 'normal' ? selectedFloor : selectedMasterFloor;
    return catacombs.floors?.[floorId];
  };

  // Get floor keys
  const getFloorKeys = () => {
    const catacombs = getCatacombsData();
    if (!catacombs || !catacombs.floors) return [];
    
    return Object.keys(catacombs.floors).sort((a, b) => parseInt(a) - parseInt(b));
  };

  // Get class data
  const getClassData = () => {
    const dungeons = getDungeonsData();
    if (!dungeons || !dungeons.classes) return [];
    
    // Extract class data from the API response - handle nested structure
    // In the dungeons API, classes are nested as: classes.classes.{className}
    const classContainer = dungeons.classes.classes || {};
    const classNames = ['healer', 'mage', 'berserk', 'beserk', 'archer', 'tank'];
    const classData = [];
    
    for (const className of classNames) {
      if (classContainer[className]) {
        // Normalize the "beserk" to "berserk" if needed
        const normalizedName = className === 'beserk' ? 'berserk' : className;
        
        const classInfo = classContainer[className];
        // In the dungeons API, level info is directly in the level field
        const levelData = classInfo.level || {};
        
        classData.push({
          name: normalizedName,
          displayName: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1),
          level: levelData.level || 0,
          progress: levelData.progress || 0,
          experience: levelData.xp || 0,
          selected: normalizedName === dungeons.classes.selected_class
        });
      }
    }
    
    return classData;
  };

  // Get total completions
  const getTotalCompletions = () => {
    const dungeons = getDungeonsData();
    if (!dungeons) return 0;
    
    return dungeons.floor_completions || 0;
  };

  // Get secrets found
  const getSecretsFound = () => {
    const dungeons = getDungeonsData();
    if (!dungeons) return 0;
    
    return dungeons.secrets_found || 0;
  };

  // Get highest floor
  const getHighestFloor = (mode = 'normal') => {
    const dungeons = getDungeonsData();
    if (!dungeons) return 'None';
    
    const dungeonType = mode === 'normal' 
      ? dungeons.catacombs 
      : dungeons.master_catacombs;
    
    if (!dungeonType?.highest_floor) return 'None';
    
    return dungeonType.highest_floor.replace('floor_', 'F');
  };

  // Get fastest F7 time
  const getFastestF7Time = () => {
    const dungeons = getDungeonsData();
    if (!dungeons) return 'N/A';
    
    const f7Data = dungeons.catacombs?.floors?.[7];
    if (!f7Data || !f7Data.stats?.fastest_time) return 'N/A';
    
    return formatTime(f7Data.stats.fastest_time);
  };

  // Get fastest M7 time
  const getFastestM7Time = () => {
    const dungeons = getDungeonsData();
    if (!dungeons) return 'N/A';
    
    const m7Data = dungeons.master_catacombs?.floors?.[7];
    if (!m7Data || !m7Data.stats?.fastest_time) return 'N/A';
    
    return formatTime(m7Data.stats.fastest_time);
  };

  // Get most played floor
  const getMostPlayedFloor = (mode = 'normal') => {
    const dungeons = getDungeonsData();
    if (!dungeons) return 'None';
    
    const dungeonType = mode === 'normal'
      ? dungeons.catacombs
      : dungeons.master_catacombs;
    
    if (!dungeonType || !dungeonType.floors) return 'None';
    
    let maxPlays = 0;
    let mostPlayedFloor = 'None';
    
    Object.entries(dungeonType.floors).forEach(([floor, data]) => {
      const plays = data.stats?.times_played || 0;
      if (plays > maxPlays) {
        maxPlays = plays;
        mostPlayedFloor = floor === '0' ? 'Entrance' : `F${floor}`;
      }
    });
    
    return mostPlayedFloor;
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Section header with expansion toggle
  const SectionHeader = ({ title, icon, section, expanded }) => (
    <div 
      className="flex items-center justify-between cursor-pointer py-2" 
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center">
        {icon}
        <h2 className="text-2xl font-bold ml-2">{title}</h2>
      </div>
      {expanded ? 
        <ChevronUp className="text-text-secondary" /> : 
        <ChevronDown className="text-text-secondary" />
      }
    </div>
  );

  return (
    <div className="min-h-screen bg-primary text-text-primary p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Search */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-center text-ui-warning">Skyblock Dungeons Stats Tracker</h1>
          <p className="text-center text-text-secondary mb-6">Enter a Hypixel Skyblock player name to view their dungeon statistics</p>
          
          {/* Search Form */}
          <div className="bg-secondary p-6 rounded-lg shadow-card">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player IGN (e.g. tommo395)"
                className="flex-grow bg-tertiary text-text-primary px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-ui-primary"
              />
              <button
                type="submit"
                className="bg-ui-primary text-text-primary px-6 py-2 rounded hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-ui-primary disabled:opacity-50 transition"
                disabled={loading || !playerName}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader size={18} className="animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Search size={18} className="mr-2" />
                    Search
                  </span>
                )}
              </button>
            </form>
            
            {/* Quick Access Players */}
            <div className="mt-4">
              <p className="text-text-secondary text-sm mb-2">Quick access:</p>
              <div className="flex flex-wrap gap-2">
                {demoPlayers.map(player => (
                  <button
                    key={player.name}
                    onClick={() => fetchPlayerData(player.name)}
                    className="px-3 py-1 bg-tertiary hover:bg-accent rounded text-sm flex items-center transition"
                  >
                    <span>{player.name}</span>
                    <span className="text-text-tertiary ml-2 text-xs">({player.description})</span>
                  </button>
                ))}
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-ui-danger bg-opacity-30 border border-ui-danger text-text-primary rounded flex items-start">
                <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* No data state */}
        {!playerData && !loading && !error && (
          <div className="bg-secondary p-6 rounded-lg text-center shadow-card">
            <p className="text-text-secondary">Enter a player's IGN to view their dungeon stats.</p>
            <p className="text-xs text-text-tertiary mt-2">Try searching for popular players like "tommo395" or "Refraction"</p>
            
            <div className="mt-6 p-4 bg-tertiary rounded-lg">
              <h3 className="font-medium mb-2 text-ui-warning flex items-center">
                <Info size={16} className="mr-2" />
                How It Works
              </h3>
              <p className="text-text-secondary text-sm">
                This tracker shows detailed statistics about a player's performance in Hypixel Skyblock Dungeons,
                including Catacombs level, class levels, floor completions, and best runs.
              </p>
            </div>
          </div>
        )}
        
        {/* Player Data Display */}
        {activeProfile && getDungeonsData() && (
          <div>
            {/* Player Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-2 text-ui-warning flex items-center justify-center">
                <Trophy className="mr-2" />
                {playerName}'s Dungeons {activeProfile.cute_name && <span className="text-lg ml-2 text-text-secondary">({activeProfile.cute_name})</span>}
              </h1>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center">
                  <Search className="w-4 h-4 mr-1" />
                  <span>{getSecretsFound()} Secrets</span>
                </div>
                <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center">
                  <Award className="w-4 h-4 mr-1" />
                  <span>{getTotalCompletions()} Completions</span>
                </div>
                <button 
                  onClick={() => fetchPlayerData(playerName)}
                  className="bg-secondary hover:bg-tertiary px-3 py-1 rounded-full text-sm flex items-center transition"
                >
                  <RefreshCw size={14} className="mr-1" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            
            {/* Profile Selector (if multiple profiles) */}
            {Object.keys(playerData.profiles || {}).length > 1 && (
              <div className="bg-secondary p-4 rounded-lg mb-6 shadow-card">
                <h3 className="text-lg font-medium text-text-primary mb-2">Profiles</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(playerData.profiles).map(profile => (
                    <button
                      key={profile.profile_id}
                      className={`px-3 py-1 rounded transition ${activeProfile?.profile_id === profile.profile_id ? 'bg-ui-primary text-text-primary' : 'bg-tertiary text-text-secondary hover:bg-opacity-80'}`}
                      onClick={() => setActiveProfile(profile)}
                    >
                      {profile.cute_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Catacombs Levels */}
              <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center">
                    <Activity className="mr-2 text-ui-info" />
                    <span>Catacombs Stats</span>
                  </h2>
                </div>
                
                <div className="bg-tertiary rounded-lg p-4 border border-accent mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Catacombs Level</span>
                    <div 
                      className={`text-2xl font-bold px-3 py-0.5 border-2 rounded ${getRarityColorClass(getCatacombsLevel().level)}`}
                      style={{ borderColor: 'currentColor' }}
                    >
                      {getCatacombsLevel().level}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress to level {getCatacombsLevel().level + 1}</span>
                      <span>{Math.round(getCatacombsLevel().progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-primary rounded-full h-2">
                      <div 
                        className="bg-ui-primary h-2 rounded-full" 
                        style={{ width: `${getCatacombsLevel().progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-text-secondary grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between">
                        <span>Current XP</span>
                        <span>{formatNumber(getCatacombsLevel().xpCurrent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Needed XP</span>
                        <span>{formatNumber(getCatacombsLevel().xpForNext)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Total XP</span>
                        <span>{formatNumber(getCatacombsLevel().totalXp)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Selected Class</span>
                        <span className="flex items-center">
                          {getClassIcon(getDungeonsData()?.classes?.selected_class || 'none')}
                          <span className="ml-1 capitalize">{getDungeonsData()?.classes?.selected_class || 'None'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Class Levels */}
                <h3 className="text-lg font-medium mb-3">Class Levels</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getClassData().map((classData) => (
                    <div 
                      key={classData.name}
                      className={`bg-tertiary p-4 rounded-lg border ${classData.selected ? 'border-ui-warning' : 'border-accent'} transition hover:shadow-card-hover`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {getClassIcon(classData.name)}
                          <span className="ml-2 capitalize font-medium">{classData.displayName}</span>
                        </div>
                        <div 
                          className={`text-2xl font-bold ${getRarityColorClass(classData.level)}`}
                        >
                          {classData.level}
                        </div>
                      </div>
                      <div className="w-full bg-primary rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full ${getClassColorClass(classData.name)}`}
                          style={{ 
                            width: `${classData.progress * 100}%`,
                            backgroundColor: 'currentColor'
                          }}
                        ></div>
                      </div>
                      <div className="text-sm text-text-secondary flex justify-between">
                        <span>{Math.round(classData.progress * 100)}%</span>
                        <span>{formatNumber(classData.experience)} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dungeon Stats */}
              <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent">
                <h2 className="text-2xl font-bold flex items-center mb-4">
                  <FlaskConical className="mr-2 text-class-mage" />
                  <span>Dungeon Statistics</span>
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-tertiary rounded-lg p-4 border border-accent">
                    <h3 className="text-lg font-medium mb-3 text-mode-normal">Normal Mode</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Highest Floor</span>
                        <span>{getHighestFloor('normal')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Most Played</span>
                        <span>{getMostPlayedFloor('normal')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Fastest F7</span>
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1 text-ui-warning" />
                          {getFastestF7Time()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Completions</span>
                        <span>{formatNumber(getTotalCompletions())}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-tertiary rounded-lg p-4 border border-accent">
                    <h3 className="text-lg font-medium mb-3 text-mode-master">Master Mode</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Highest Floor</span>
                        <span>{getHighestFloor('master')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Most Played</span>
                        <span>{getMostPlayedFloor('master')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Fastest M7</span>
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1 text-ui-danger" />
                          {getFastestM7Time()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">M7 Completions</span>
                        <span>{formatNumber(getDungeonsData()?.master_catacombs?.floors?.[7]?.stats?.tier_completions || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-tertiary rounded-lg p-4 border border-accent">
                  <h3 className="text-lg font-medium mb-2">Performance Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">Total Runs</div>
                      <div className="font-bold text-lg">
                        {formatNumber(getDungeonsData()?.floor_completions || 0)}
                      </div>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">Secrets Found</div>
                      <div className="font-bold text-lg">
                        {formatNumber(getDungeonsData()?.secrets_found || 0)}
                      </div>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">Best F7 S+ Time</div>
                      <div className="font-bold text-lg">
                        {formatTime(getDungeonsData()?.catacombs?.floors?.[7]?.stats?.fastest_time_s_plus || 0)}
                      </div>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">Best M7 S+ Time</div>
                      <div className="font-bold text-lg">
                        {formatTime(getDungeonsData()?.master_catacombs?.floors?.[7]?.stats?.fastest_time_s_plus || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floor Statistics */}
            <div className="mb-8">
              <SectionHeader 
                title="Floor Statistics" 
                icon={<BookOpen className="text-ui-warning" />} 
                section="floorDetails"
                expanded={expandedSections.floorDetails}
              />
              
              {expandedSections.floorDetails && (
                <>
                  {/* Mode Toggle */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-text-secondary">Mode:</span>
                    <button
                      onClick={() => setActiveTab('normal')} 
                      className={`px-3 py-1 rounded transition ${activeTab === 'normal' ? 'bg-mode-normal' : 'bg-tertiary hover:bg-opacity-80'}`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setActiveTab('master')} 
                      className={`px-3 py-1 rounded transition ${activeTab === 'master' ? 'bg-mode-master' : 'bg-tertiary hover:bg-opacity-80'}`}
                    >
                      Master Mode
                    </button>
                  </div>
                  
                  {/* Floor Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getFloorKeys().map((floor) => (
                      <button
                        key={floor}
                        onClick={() => activeTab === 'normal' ? setSelectedFloor(floor) : setSelectedMasterFloor(floor)}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          (activeTab === 'normal' && selectedFloor === floor) 
                            ? 'bg-mode-normal' 
                            : (activeTab === 'master' && selectedMasterFloor === floor)
                              ? 'bg-mode-master'
                              : 'bg-tertiary hover:bg-opacity-80'
                        }`}
                      >
                        {floor === '0' ? 'Entrance' : `F${floor}`}
                      </button>
                    ))}
                  </div>
                  
                  {/* Floor Details */}
                  {getFloorData() ? (
                    <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold">
                            {activeTab === 'normal' && selectedFloor === '0' ? 'The Entrance' : 
                            `${activeTab === 'normal' ? 'Floor' : 'Master'} ${activeTab === 'normal' ? selectedFloor : selectedMasterFloor}`}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {getFloorData().stats?.tier_completions || 0} completions, {getFloorData().stats?.times_played || 0} total runs
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0 flex items-center">
                          <div 
                            className={`px-4 py-2 rounded font-bold ${getScoreColorClass(getFloorData().stats?.best_score || 0)}`}
                          >
                            Best Score: {getFloorData().stats?.best_score || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Floor Stats */}
                        <div>
                          <h4 className="font-semibold mb-3 border-b pb-2 border-accent">Performance</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-tertiary p-3 rounded-lg">
                              <div className="text-xs text-text-secondary">Fastest Time</div>
                              <div className="flex items-center text-lg font-semibold">
                                <Clock className="w-4 h-4 mr-1 text-ui-success" />
                                {formatTime(getFloorData().stats?.fastest_time)}
                              </div>
                            </div>

                            {getFloorData().stats?.fastest_time_s && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">Fastest S Time</div>
                                <div className="flex items-center text-lg font-semibold">
                                  <Clock className="w-4 h-4 mr-1 text-ui-primary" />
                                  {formatTime(getFloorData().stats?.fastest_time_s)}
                                </div>
                              </div>
                            )}

                            {getFloorData().stats?.fastest_time_s_plus && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">Fastest S+ Time</div>
                                <div className="flex items-center text-lg font-semibold">
                                  <Clock className="w-4 h-4 mr-1 text-score-splus" />
                                  {formatTime(getFloorData().stats?.fastest_time_s_plus)}
                                </div>
                              </div>
                            )}

                            <div className="bg-tertiary p-3 rounded-lg">
                              <div className="text-xs text-text-secondary">Mobs Killed</div>
                              <div className="text-lg font-semibold">
                                {formatNumber(getFloorData().stats?.mobs_killed || 0)}
                              </div>
                            </div>

                            <div className="bg-tertiary p-3 rounded-lg">
                              <div className="text-xs text-text-secondary">Most Mobs in Run</div>
                              <div className="text-lg font-semibold">
                                {getFloorData().stats?.most_mobs_killed || 0}
                              </div>
                            </div>

                            {getFloorData().stats?.watcher_kills && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">Watcher Kills</div>
                                <div className="text-lg font-semibold">
                                  {getFloorData().stats?.watcher_kills}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Damage Stats */}
                        <div>
                          <h4 className="font-semibold mb-3 border-b pb-2 border-accent">Highest Damage</h4>
                          {getFloorData().most_damage ? (
                            <div className="bg-tertiary p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {getClassIcon(getFloorData().most_damage.class)}
                                  <span className="ml-2 capitalize font-medium">
                                    {getFloorData().most_damage.class}
                                  </span>
                                </div>
                                <div className="text-xl font-bold">
                                  {formatNumber(getFloorData().most_damage.value)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-tertiary p-4 rounded-lg text-text-secondary">
                              No damage data available
                            </div>
                          )}
                          
                          {getFloorData().stats?.most_healing && (
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">Most Healing Done</h4>
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-lg font-semibold">
                                  {formatNumber(getFloorData().stats.most_healing)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Best Runs */}
                      {getFloorData().best_runs && getFloorData().best_runs.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-semibold mb-3 border-b pb-2 border-accent">Best Runs</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-tertiary">
                                  <th className="p-2 text-xs">Date</th>
                                  <th className="p-2 text-xs">Class</th>
                                  <th className="p-2 text-xs">Score</th>
                                  <th className="p-2 text-xs">Time</th>
                                  <th className="p-2 text-xs">Damage</th>
                                  <th className="p-2 text-xs">Secrets</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getFloorData().best_runs.slice(0, 3).map((run, index) => (
                                  <tr key={index} className="border-t border-accent">
                                    <td className="p-2 text-xs">
                                      {formatDate(run.timestamp)}
                                    </td>
                                    <td className="p-2 text-xs flex items-center">
                                      {getClassIcon(run.dungeon_class)}
                                      <span className="ml-1 capitalize">{run.dungeon_class}</span>
                                    </td>
                                    <td className="p-2 text-xs">
                                      <span className={getScoreColorClass(run.score_exploration + run.score_speed + run.score_skill + run.score_bonus)}>
                                        {run.score_exploration + run.score_speed + run.score_skill + run.score_bonus}
                                      </span>
                                    </td>
                                    <td className="p-2 text-xs">{formatTime(run.elapsed_time)}</td>
                                    <td className="p-2 text-xs">{formatNumber(run.damage_dealt)}</td>
                                    <td className="p-2 text-xs">{run.secrets_found}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-secondary p-5 rounded-lg text-center text-text-secondary shadow-card">
                      No data available for this floor
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Essence Collection */}
            {getDungeonsData().essence && Object.keys(getDungeonsData().essence).length > 0 && (
              <div className="mb-8">
                <SectionHeader 
                  title="Essence Collection" 
                  icon={<FlaskConical className="text-ui-info" />}
                  section="essenceCollection"
                  expanded={expandedSections.essenceCollection}
                />
                
                {expandedSections.essenceCollection && (
                  <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                      {Object.entries(getDungeonsData().essence).map(([type, amount]) => (
                        <div key={type} className="bg-tertiary px-3 py-3 rounded-lg text-center transition hover:shadow-card-hover">
                          <div className="text-sm text-text-secondary capitalize">{type}</div>
                          <div className="font-bold text-lg">{formatNumber(amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Score Explanation */}
            <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent mb-8">
              <h2 className="text-2xl font-bold flex items-center mb-4">
                <Star className="mr-2 text-ui-warning" />
                <span>Scoring System</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-tertiary p-4 rounded-lg border-l-4 border-ui-info">
                  <h3 className="text-lg font-semibold mb-2 text-ui-info">Exploration</h3>
                  <p className="text-sm">Based on the percentage of rooms cleared and secrets found. Max: 100 points</p>
                </div>

                <div className="bg-tertiary p-4 rounded-lg border-l-4 border-ui-success">
                  <h3 className="text-lg font-semibold mb-2 text-ui-success">Speed</h3>
                  <p className="text-sm">Based on completion time. Faster completion means higher score. Max: 100 points</p>
                </div>

                <div className="bg-tertiary p-4 rounded-lg border-l-4 border-ui-danger">
                  <h3 className="text-lg font-semibold mb-2 text-ui-danger">Skill</h3>
                  <p className="text-sm">Based on deaths, puzzles completion, and mob kills. Max: 100 points</p>
                </div>

                <div className="bg-tertiary p-4 rounded-lg border-l-4 border-ui-warning">
                  <h3 className="text-lg font-semibold mb-2 text-ui-warning">Bonus</h3>
                  <p className="text-sm">Additional points for special achievements like solving all puzzles. Max: 20 points</p>
                </div>
              </div>

              <div className="mt-6 bg-tertiary p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Score Tiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-white mr-2"></div>
                    <span>Less than 100: No reward bonus</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-score-s"></div>
                    <span>S: 270+ score (50% reward bonus)</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-score-splus"></div>
                    <span>S+: 300+ score (100% reward bonus)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-text-tertiary text-sm pt-4">
          <p>
            Data provided by the sky.shiiyu.moe API. This site is not affiliated with Hypixel or Mojang.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SkyblockDungeonTracker;