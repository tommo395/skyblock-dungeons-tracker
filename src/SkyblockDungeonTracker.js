import React, { useState, useEffect, useRef } from "react";
import {
  Shield, Sword, Wand, Heart, Target, Clock, Trophy, Award, Star, Activity,
  Search, FlaskConical, Loader, AlertTriangle, BookOpen, ChevronDown, ChevronUp,
  Info, RefreshCw, X, User, BrainCircuit, Calculator, Palette, Users, PlusCircle,
  Trash2, BarChart2, ArrowLeft
} from "lucide-react";
import "./theme.css";

const SkyblockDungeonTracker = () => {
  // State management
  const [playerNameInput, setPlayerNameInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeProfile, setActiveProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("catacombs");
  const [selectedFloor, setSelectedFloor] = useState("7");
  const [selectedMasterFloor, setSelectedMasterFloor] = useState("1");
  const [expandedSections, setExpandedSections] = useState({
    floorDetails: true,
    essenceCollection: true,
    weightDetails: true,
    advancedWeightInfo: false,
  });
  const [playerAvatar, setPlayerAvatar] = useState(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("classic");
  const searchInputRef = useRef(null);
  
  // Comparison mode state
  const [viewMode, setViewMode] = useState("single");
  const [comparedPlayers, setComparedPlayers] = useState([]);
  const [comparisonInput, setComparisonInput] = useState("");
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [activeComparisonTab, setActiveComparisonTab] = useState("overview");

  // Hypixel API configuration 
  const API_KEY = "5cbf578a-5156-4415-a36b-0204b6795d96";
  const HYPIXEL_BASE_URL = "https://api.hypixel.net/v2/skyblock/profiles";
  
  // Dungeoneering XP requirements per level
  const DUNGEONEERING_XP = {
    1: 50000,
    2: 75000,
    3: 110000,
    4: 160000,
    5: 230000,
    6: 330000,
    7: 470000,
    8: 670000,
    9: 950000,
    10: 1340000,
    11: 1890000,
    12: 2665000,
    13: 3760000,
    14: 5260000,
    15: 7380000,
    16: 10300000,
    17: 14400000,
    18: 20000000,
    19: 27600000,
    20: 38000000,
    21: 52500000,
    22: 71500000,
    23: 97000000,
    24: 132000000,
    25: 180000000,
    26: 243000000,
    27: 328000000,
    28: 445000000,
    29: 600000000,
    30: 800000000,
    31: 1065000000,
    32: 1410000000,
    33: 1900000000,
    34: 2500000000,
    35: 3300000000,
    36: 4300000000,
    37: 5600000000,
    38: 7200000000,
    39: 9200000000,
    40: 12000000000,
    41: 15000000000,
    42: 19000000000,
    43: 24000000000,
    44: 30000000000,
    45: 38000000000,
    46: 48000000000,
    47: 60000000000,
    48: 75000000000,
    49: 93000000000,
    50: 116250000000,
    51: 200000000000
  };

  // Demo players for quick access
  const demoPlayers = [
    { name: "tommo395", description: "creator" },
    { name: "midori642", description: "cold guy" },
    { name: "LeDucTaep", description: "geko man" },
    { name: "boolfalse", description: "im scared" },
  ];

  // Themes array
  const themes = [
    { id: "classic", name: "Classic Dark", color: "#0f172a", previewClass: "" },
    { id: "light", name: "Light Mode", color: "#f8fafc", previewClass: "" },
    { id: "hypixel", name: "Hypixel", color: "#0e1823", previewClass: "" },
    { id: "outline", name: "Wireframe", color: "#000000", previewClass: "" },
  ];

  // Parse URL parameters on component mount
  useEffect(() => {
    // Check for player parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const playerFromUrl = urlParams.get("player");
    const themeFromUrl = urlParams.get("theme");
    const compareParam = urlParams.get("compare");

    if (themeFromUrl && themes.some((theme) => theme.id === themeFromUrl)) {
      setCurrentTheme(themeFromUrl);
    }

    if (playerFromUrl) {
      setPlayerNameInput(playerFromUrl);
      fetchPlayerData(playerFromUrl);
    }
    
    // Handle comparison players from URL
    if (compareParam) {
      const comparePlayers = compareParam.split(",").filter(Boolean);
      if (comparePlayers.length > 0) {
        setViewMode("compare");
        Promise.all(comparePlayers.map(fetchPlayerDataForComparison))
          .then(results => {
            const validPlayers = results.filter(Boolean);
            if (validPlayers.length > 0) {
              setComparedPlayers(validPlayers);
            }
          });
      }
    }
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;

    // Update URL with theme
    const url = new URL(window.location);
    url.searchParams.set("theme", currentTheme);
    window.history.pushState({}, "", url);
  }, [currentTheme]);

  // Update URL when player changes
  const updateUrlWithPlayer = (name) => {
    if (!name) return;
    const url = new URL(window.location);
    url.searchParams.set("player", name);
    window.history.pushState({}, "", url);
  };
  
  // Update URL with comparison players
  const updateUrlWithComparison = (players) => {
    const url = new URL(window.location);
    if (players.length > 0) {
      const playerNames = players.map(p => p.name).join(",");
      url.searchParams.set("compare", playerNames);
    } else {
      url.searchParams.delete("compare");
    }
    window.history.pushState({}, "", url);
  };

  // FIXED: Completely rebuilt UUID function to handle network errors better
  const getUuid = async (username) => {
    if (!username) return null;
    
    // Direct UUID lookup from player name
    const directUuidLookup = async () => {
      try {
        console.log(`Fetching UUID for ${username} from Mojang API...`);
        
        // Create an AbortController with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(
          `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username.trim())}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (response.status === 404) {
          throw new Error(`Player not found: ${username}`);
        }
        
        if (response.status !== 200) {
          throw new Error(`Mojang API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.id) {
          throw new Error("Invalid response from Mojang API");
        }
        
        console.log(`UUID found for ${username}: ${data.id}`);
        return data.id;
      } catch (err) {
        // If it's an abort error, provide a more user-friendly message
        if (err.name === 'AbortError') {
          throw new Error("Mojang API request timed out. Please try again.");
        }
        
        console.error("Error in direct UUID lookup:", err);
        throw err;
      }
    };
    
    // Backup method: Try to get UUID from Hypixel API directly
    const backupUuidLookup = async () => {
      try {
        console.log(`Trying backup UUID lookup for ${username} from Hypixel API...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
          `https://api.hypixel.net/v2/player?key=${API_KEY}&name=${encodeURIComponent(username.trim())}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (response.status !== 200) {
          throw new Error(`Hypixel API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.cause || "Hypixel API error");
        }
        
        if (!data.player || !data.player.uuid) {
          throw new Error("Player not found in Hypixel API");
        }
        
        console.log(`UUID found from Hypixel API: ${data.player.uuid}`);
        return data.player.uuid;
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error("Hypixel API request timed out. Please try again.");
        }
        
        console.error("Error in backup UUID lookup:", err);
        throw err;
      }
    };
    
    // Final fallback: Use hard-coded UUIDs for demo players
    const fallbackUuidMap = {
      "tommo395": "b5fbda03-63f3-4ee0-bceb-62c422d1bd9d",
      "midori642": "cbd1c0b6-75c7-474b-a08c-5d711a02d31a",
      "leductaep": "ca1afa1f-48b3-4812-a183-a9374258a72e"
    };
    
    try {
      // First try direct UUID lookup
      return await directUuidLookup();
    } catch (err1) {
      console.log(`First UUID lookup failed: ${err1.message}. Trying backup method...`);
      
      try {
        // Then try backup method
        return await backupUuidLookup();
      } catch (err2) {
        console.log(`Backup UUID lookup failed: ${err2.message}. Checking fallbacks...`);
        
        // Then check if it's a demo player
        const lowercaseName = username.toLowerCase();
        if (fallbackUuidMap[lowercaseName]) {
          console.log(`Using fallback UUID for ${username}`);
          return fallbackUuidMap[lowercaseName].replace(/-/g, '');
        }
        
        // All methods failed
        throw new Error(`Could not retrieve UUID: ${err1.message}. Backup also failed: ${err2.message}`);
      }
    }
  };

  // Calculate dungeon level from XP
  const getLevelFromXp = (xp) => {
    if (!xp || xp === 0) {
      return {
        level: 0,
        levelWithProgress: 0,
        progress: 0,
        xpCurrent: 0,
        xpForNext: DUNGEONEERING_XP[1]
      };
    }
    
    // Scale XP by 1000 as in Python code
    xp = xp * 1000;
    
    // Sum required XP for each level
    let totalXp = 0;
    let level = 0;
    
    for (let lvl = 1; lvl <= 51; lvl++) {
      if (DUNGEONEERING_XP[lvl]) {
        const requiredXp = DUNGEONEERING_XP[lvl];
        
        // If adding this level's XP would exceed player's XP
        if (totalXp + requiredXp > xp) {
          // Calculate progress within level
          const xpIntoLevel = xp - totalXp;
          const progress = xpIntoLevel / requiredXp;
          
          return {
            level: level,
            levelWithProgress: parseFloat((level + progress).toFixed(2)),
            progress: parseFloat(progress.toFixed(4)),
            xpCurrent: Math.round(xpIntoLevel),
            xpForNext: requiredXp
          };
        }
        
        totalXp += requiredXp;
        level += 1;
      }
    }
    
    // Max level
    return {
      level: 50,
      levelWithProgress: 50,
      progress: 1,
      xpCurrent: 0,
      xpForNext: 0
    };
  };

  // Fetch player avatar
  const fetchPlayerAvatar = async (name) => {
    try {
      const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(name)}/64`;
      setPlayerAvatar(avatarUrl);
      return avatarUrl;
    } catch (err) {
      console.error("Failed to fetch player avatar:", err);
      setPlayerAvatar(null);
      return null;
    }
  };

  // Format large numbers with K, M, B suffix
  const formatNumber = (num) => {
    if (num === undefined || num === null) return "N/A";

    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  // Format time in mm:ss format from milliseconds
  const formatTime = (milliseconds) => {
    if (!milliseconds) return "N/A";

    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date from timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // COMPLETELY REBUILT: Fetch from Hypixel API with much better error handling
  const fetchPlayerData = async (name = playerNameInput) => {
    if (!name) return;

    setLoading(true);
    setStatsLoaded(false);
    setError("");

    try {
      // Start fetching avatar early
      fetchPlayerAvatar(name);

      // Step 1: Get UUID with robust error handling
      let uuid;
      try {
        uuid = await getUuid(name);
      } catch (uuidError) {
        console.error("UUID fetch error:", uuidError);
        throw new Error(`Failed to retrieve UUID: ${uuidError.message}`);
      }

      if (!uuid) {
        throw new Error("Could not find a UUID for this player");
      }

      console.log(`Successfully found UUID: ${uuid} for player: ${name}`);

      // Step 2: Fetch profiles from Hypixel API with timeout
      console.log(`Fetching SkyBlock profiles for UUID: ${uuid}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${HYPIXEL_BASE_URL}?uuid=${uuid}`, {
        headers: { "API-Key": API_KEY },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Detailed error handling for different HTTP status codes
      if (response.status === 403) {
        throw new Error("Invalid API Key or rate limited. Please try again later.");
      } else if (response.status === 404) {
        throw new Error("Player has no SkyBlock profiles");
      } else if (response.status === 429) {
        throw new Error("Too many requests to Hypixel API. Please try again in a minute.");
      } else if (response.status !== 200) {
        throw new Error(`Hypixel API error: ${response.status}`);
      }

      // Step 3: Parse the JSON response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        throw new Error("Failed to parse Hypixel API response");
      }
      
      if (!data.success) {
        throw new Error(data.cause || "Hypixel API returned an error");
      }
      
      if (!data.profiles || data.profiles.length === 0) {
        throw new Error("No SkyBlock profiles found for this player");
      }

      console.log(`Found ${data.profiles.length} profiles for ${name}`);

      // Step 4: Process the data
      const processedData = processProfileData(data, uuid, name);
      
      // Step 5: Update state with the processed data
      setPlayerData(processedData);
      setDisplayName(name);
      updateUrlWithPlayer(name);

      // Set active profile
      const activeProfileId = processedData.activeProfile;
      setActiveProfile(processedData.profiles[activeProfileId]);

      // Set default selected floor based on data
      const highestNormal = processedData.profiles[activeProfileId].dungeons.stats.highestFloorNormal;
      const highestMaster = processedData.profiles[activeProfileId].dungeons.stats.highestFloorMaster;
      
      if (highestNormal) {
        setSelectedFloor(highestNormal.toString());
      }
      
      if (highestMaster) {
        setSelectedMasterFloor(highestMaster.toString());
      }

      setStatsLoaded(true);
      return processedData;
    } catch (err) {
      console.error("Error fetching player data:", err);
      setError(err.message || "Failed to fetch player data");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Process the profile data from Hypixel API
  const processProfileData = (data, uuid, name) => {
    try {
      // Find active profile
      let activeProfile = null;
      let latestProfile = null;
      let latestSave = 0;
      
      for (const profile of data.profiles) {
        if (profile.selected) {
          activeProfile = profile.profile_id;
        }
        
        if (profile.last_save > latestSave) {
          latestSave = profile.last_save;
          latestProfile = profile.profile_id;
        }
      }
      
      // Default to latest if none is selected
      if (!activeProfile) {
        activeProfile = latestProfile;
      }
      
      // FIXED: Handle UUID checks more comprehensively
      const formattedProfiles = {};
      
      for (const profile of data.profiles) {
        // Try both formats of UUID and more variations
        const formattedUuid = `${uuid.slice(0,8)}-${uuid.slice(8,12)}-${uuid.slice(12,16)}-${uuid.slice(16,20)}-${uuid.slice(20)}`;
        
        // Try all possible UUID formats
        let memberData = null;
        const possibleUuids = [uuid, formattedUuid, uuid.toLowerCase(), formattedUuid.toLowerCase()];
        
        for (const possibleUuid of possibleUuids) {
          if (profile.members[possibleUuid]) {
            memberData = profile.members[possibleUuid];
            break;
          }
        }
        
        // If we still don't have member data, try scanning all keys (case insensitive)
        if (!memberData) {
          for (const memberId in profile.members) {
            if (memberId.toLowerCase() === uuid.toLowerCase() || 
                memberId.toLowerCase() === formattedUuid.toLowerCase()) {
              memberData = profile.members[memberId];
              break;
            }
          }
        }
        
        if (!memberData) {
          console.warn(`Could not find player data in profile ${profile.profile_id}`);
          continue;
        }
        
        // Process dungeons data
        try {
          const dungeons = memberData.dungeons || {};
          const dungeonsData = processDungeonsData(dungeons);
          
          formattedProfiles[profile.profile_id] = {
            profile_id: profile.profile_id,
            cute_name: profile.cute_name || profile.profile_id,
            selected: profile.profile_id === activeProfile,
            dungeons: dungeonsData
          };
        } catch (dungeonError) {
          console.error(`Error processing dungeons data for profile ${profile.profile_id}:`, dungeonError);
          // Continue to next profile rather than failing completely
          continue;
        }
      }
      
      // Check if we actually found any profiles with data
      if (Object.keys(formattedProfiles).length === 0) {
        throw new Error("No player data found in any profile");
      }
      
      return {
        player: { username: name },
        profiles: formattedProfiles,
        activeProfile: activeProfile
      };
    } catch (err) {
      console.error("Error processing profile data:", err);
      throw new Error(`Failed to process profile data: ${err.message}`);
    }
  };

  // Format best run data
  const getBestRunData = (floor) => {
    if (!floor || !floor.best_runs) return null;
    
    // Find highest scoring run
    let bestRun = null;
    let bestScore = 0;
    
    const runs = Array.isArray(floor.best_runs) ? floor.best_runs : Object.values(floor.best_runs);
    
    for (const run of runs) {
      const score = (run.score_exploration || 0) + 
                   (run.score_speed || 0) + 
                   (run.score_skill || 0) + 
                   (run.score_bonus || 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestRun = run;
      }
    }
    
    if (!bestRun) return null;
    
    // Determine grade
    let grade = "D";
    if (bestScore > 300) grade = "S+";
    else if (bestScore > 270) grade = "S";
    else if (bestScore > 230) grade = "A";
    else if (bestScore > 160) grade = "B";
    else if (bestScore > 100) grade = "C";
    
    return {
      grade,
      score: bestScore,
      score_exploration: bestRun.score_exploration || 0,
      score_speed: bestRun.score_speed || 0,
      score_skill: bestRun.score_skill || 0,
      score_bonus: bestRun.score_bonus || 0,
      elapsed_time: bestRun.elapsed_time || 0,
      elapsed_time_formatted: formatTime(bestRun.elapsed_time || 0),
      deaths: bestRun.deaths || 0,
      secrets_found: bestRun.secrets_found || 0,
      damage_dealt: bestRun.damage_dealt || 0,
      damage_mitigated: bestRun.damage_mitigated || 0,
      dungeon_class: bestRun.dungeon_class || "unknown"
    };
  };

  // Process floor data
  const processFloorData = (catacombs, floorId) => {
    if (!catacombs) return null;
    
    // Get times, scores, etc.
    const fastest_time = catacombs.fastest_time?.[floorId];
    const fastest_time_s = catacombs.fastest_time_s?.[floorId];
    const fastest_time_s_plus = catacombs.fastest_time_s_plus?.[floorId];
    const best_score = catacombs.best_score?.[floorId] || 0;
    const tier_completions = catacombs.tier_completions?.[floorId] || 0;
    const times_played = catacombs.times_played?.[floorId] || tier_completions;
    
    // Get best run
    const best_run = getBestRunData({
      best_runs: catacombs.best_runs?.[floorId]
    });
    
    // Get stats
    const mobs_killed = catacombs.mobs_killed?.[floorId] || 0;
    const most_mobs_killed = catacombs.most_mobs_killed?.[floorId] || 0;
    const watcher_kills = catacombs.watcher_kills?.[floorId] || 0;
    
    // Format most damage
    const most_damage = {};
    const damage_classes = ["tank", "healer", "mage", "archer", "berserk"];
    damage_classes.forEach(className => {
      const key = `most_damage_${className}`;
      if (catacombs[key] && catacombs[key][floorId]) {
        most_damage[className] = catacombs[key][floorId];
      }
    });
    
    return {
      id: floorId,
      name: floorId === "0" ? "Entrance" : `Floor ${floorId}`,
      times_played,
      completions: tier_completions,
      best_score,
      fastest_times: {
        normal: {
          time_ms: fastest_time,
          formatted: formatTime(fastest_time)
        },
        s_rank: {
          time_ms: fastest_time_s,
          formatted: formatTime(fastest_time_s)
        },
        s_plus_rank: {
          time_ms: fastest_time_s_plus,
          formatted: formatTime(fastest_time_s_plus)
        }
      },
      stats: {
        mobs_killed,
        most_mobs_killed,
        watcher_kills,
        most_damage
      },
      best_run
    };
  };
  
  // Process the dungeons data
  const processDungeonsData = (dungeons) => {
    if (!dungeons || !dungeons.dungeon_types) {
      return { unlocked: false };
    }
    
    // Get catacombs data
    const catacombs = dungeons.dungeon_types.catacombs || {};
    const masterCatacombs = dungeons.dungeon_types.master_catacombs || {};
    
    // Process classes
    const classes = {};
    const classData = dungeons.player_classes || {};
    let classSum = 0;
    let classCount = 0;
    
    for (const className in classData) {
      const xp = classData[className]?.experience || 0;
      const levelInfo = getLevelFromXp(xp);
      
      classes[className] = levelInfo;
      classSum += levelInfo.level;
      classCount++;
    }
    
    const classAverage = classCount > 0 ? classSum / classCount : 0;
    
    // Get completions
    const normalCompletions = {};
    const masterCompletions = {};
    
    for (const key in catacombs.tier_completions || {}) {
      if (key !== "0" && key !== "total") {
        normalCompletions[key] = catacombs.tier_completions[key];
      }
    }
    
    for (const key in masterCatacombs.tier_completions || {}) {
      if (key !== "0" && key !== "total") {
        masterCompletions[key] = masterCatacombs.tier_completions[key];
      }
    }
    
    // Get floor data
    const normalFloors = {};
    const masterFloors = {};
    
    for (let i = 0; i <= 7; i++) {
      const floorData = processFloorData(catacombs, i.toString());
      if (floorData && floorData.times_played > 0) {
        normalFloors[i] = floorData;
      }
    }
    
    for (let i = 1; i <= 7; i++) {
      const floorData = processFloorData(masterCatacombs, i.toString());
      if (floorData && floorData.times_played > 0) {
        masterFloors[i] = floorData;
      }
    }
    
    // Calculate total stats
    const secretsFound = dungeons.secrets || 0;
    const totalNormalRuns = Object.values(normalCompletions).reduce((sum, val) => sum + val, 0);
    const totalMasterRuns = Object.values(masterCompletions).reduce((sum, val) => sum + val, 0);
    const totalRuns = totalNormalRuns + totalMasterRuns;
    
    return {
      catacombs: getLevelFromXp(catacombs.experience || 0),
      classes: {
        selectedClass: dungeons.selected_dungeon_class || "Unknown",
        classAverage: parseFloat(classAverage.toFixed(2)),
        classes: classes
      },
      floors: {
        normal: normalFloors,
        master: masterFloors
      },
      completions: {
        normal: normalCompletions,
        master: masterCompletions
      },
      stats: {
        secrets: secretsFound,
        secretsPerRun: totalRuns > 0 ? parseFloat((secretsFound / totalRuns).toFixed(2)) : 0,
        totalRuns: totalRuns,
        normalRuns: totalNormalRuns,
        masterRuns: totalMasterRuns,
        highestFloorNormal: catacombs.highest_tier_completed || 0,
        highestFloorMaster: masterCatacombs.highest_tier_completed || 0
      },
      essence: dungeons.essence || {}
    };
  };
  
  // Fetch player data for comparison
  const fetchPlayerDataForComparison = async (name) => {
    // Same improved robustness as the main data fetch function
    if (!name) return null;
    
    setLoadingComparison(true);
    setComparisonError("");

    try {
      const avatarUrl = await fetchPlayerAvatar(name);
      
      // Get UUID with robust error handling
      let uuid;
      try {
        uuid = await getUuid(name);
      } catch (uuidError) {
        throw new Error(`Failed to retrieve UUID: ${uuidError.message}`);
      }

      if (!uuid) {
        throw new Error("Could not find a UUID for this player");
      }

      // Fetch profiles with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${HYPIXEL_BASE_URL}?uuid=${uuid}`, {
        headers: { "API-Key": API_KEY },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Hypixel API error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.cause || "Hypixel API returned an error");
      }
      
      if (!data.profiles || data.profiles.length === 0) {
        throw new Error("No SkyBlock profiles found for this player");
      }

      // Process the data
      const processedData = processProfileData(data, uuid, name);
      const activeProfileId = processedData.activeProfile;
      const activeProfile = processedData.profiles[activeProfileId];
      
      // Return formatted player data for comparison
      return {
        name: name,
        avatar: avatarUrl,
        data: processedData,
        profile: activeProfile,
        weight: calculateDungeonWeight(activeProfile),
        cataLevel: activeProfile.dungeons.catacombs.level || 0,
        classAvg: activeProfile.dungeons.classes.classAverage || 0,
        secretsFound: activeProfile.dungeons.stats.secrets || 0,
        completions: activeProfile.dungeons.stats.totalRuns || 0,
        fastestF7: formatTime(activeProfile.dungeons?.floors?.normal?.[7]?.fastest_times?.normal?.time_ms || 0),
        fastestM7: formatTime(activeProfile.dungeons?.floors?.master?.[7]?.fastest_times?.normal?.time_ms || 0),
      };
    } catch (err) {
      console.error("Error fetching comparison data:", err);
      setComparisonError(err.message || "Failed to fetch player data");
      return null;
    } finally {
      setLoadingComparison(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPlayerData();

    // Dismiss keyboard on mobile
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  // Clear search input
  const clearSearch = () => {
    setPlayerNameInput("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Handle comparison form submission
  const handleComparisonSubmit = async (e) => {
    e.preventDefault();
    if (!comparisonInput) return;
    
    // Check if player is already in the comparison list
    if (comparedPlayers.some(p => p.name.toLowerCase() === comparisonInput.toLowerCase())) {
      setComparisonError("Player already in comparison list");
      return;
    }
    
    const playerData = await fetchPlayerDataForComparison(comparisonInput);
    if (playerData) {
      const newPlayers = [...comparedPlayers, playerData];
      setComparedPlayers(newPlayers);
      setComparisonInput("");
      updateUrlWithComparison(newPlayers);
    }
  };
  
  // Remove player from comparison
  const removeFromComparison = (name) => {
    const newPlayers = comparedPlayers.filter(p => p.name !== name);
    setComparedPlayers(newPlayers);
    updateUrlWithComparison(newPlayers);
    
    // If no players left in comparison, switch back to single view
    if (newPlayers.length === 0) {
      setViewMode("single");
    }
  };
  
  // Add current player to comparison
  const addCurrentPlayerToComparison = () => {
    if (!playerData || !activeProfile) return;
    
    // Check if player is already in comparison
    if (comparedPlayers.some(p => p.name.toLowerCase() === displayName.toLowerCase())) {
      return;
    }
    
    const playerForComparison = {
      name: displayName,
      avatar: playerAvatar,
      data: playerData,
      profile: activeProfile,
      weight: calculateDungeonWeight(),
      cataLevel: getCatacombsLevel().level,
      classAvg: getClassAverage(),
      secretsFound: getSecretsFound(),
      completions: getTotalCompletions(),
      fastestF7: getFastestF7Time(),
      fastestM7: getFastestM7Time(),
    };
    
    const newPlayers = [...comparedPlayers, playerForComparison];
    setComparedPlayers(newPlayers);
    setViewMode("compare");
    updateUrlWithComparison(newPlayers);
  };

  // Function to get class icon with appropriate coloring
  const getClassIcon = (className) => {
    switch (className) {
      case "tank":
        return <Shield size={20} className="text-class-tank" />;
      case "berserk":
      case "beserk": // Handle potential typo in API
        return <Sword size={20} className="text-class-berserk" />;
      case "mage":
        return <Wand size={20} className="text-class-mage" />;
      case "healer":
        return <Heart size={20} className="text-class-healer" />;
      case "archer":
        return <Target size={20} className="text-class-archer" />;
      default:
        return <Target size={20} className="text-text-secondary" />;
    }
  };

  // Get color class name for class
  const getClassColorClass = (className) => {
    switch (className) {
      case "tank":
        return "text-class-tank";
      case "berserk":
      case "beserk":
        return "text-class-berserk";
      case "mage":
        return "text-class-mage";
      case "healer":
        return "text-class-healer";
      case "archer":
        return "text-class-archer";
      default:
        return "text-text-secondary";
    }
  };

  // Function to get color based on score
  const getScoreColorClass = (score) => {
    if (score >= 300) return "text-score-splus";
    if (score >= 270) return "text-score-s";
    if (score >= 200) return "text-score-a";
    if (score >= 100) return "text-score-b";
    return "text-score-c";
  };

  // Function to get color based on catacombs level
  const getRarityColorClass = (level) => {
    if (level >= 40) return "text-rarity-mythic";
    if (level >= 30) return "text-rarity-legendary";
    if (level >= 20) return "text-rarity-epic";
    if (level >= 10) return "text-rarity-rare";
    return "text-rarity-uncommon";
  };

  // Get dungeons data from active profile
  const getDungeonsData = (profile = activeProfile) => {
    if (!profile || !profile.dungeons) {
      return null;
    }
    return profile.dungeons;
  };

  // Get catacombs data
  const getCatacombsData = () => {
    const dungeons = getDungeonsData();
    if (!dungeons) return null;

    const floors = dungeons.floors[activeTab === "catacombs" ? "normal" : "master"] || {};
    
    return {
      level: dungeons.catacombs,
      floors: floors
    };
  };

  // Get catacombs level
  const getCatacombsLevel = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return { level: 0, progress: 0 };

    return dungeons.catacombs || { level: 0, progress: 0 };
  };

  // Get floor data
  const getFloorData = () => {
    const catacombs = getCatacombsData();
    if (!catacombs || !catacombs.floors) return null;

    const floorId = activeTab === "catacombs" ? selectedFloor : selectedMasterFloor;
    return catacombs.floors[floorId];
  };

  // Get floor keys
  const getFloorKeys = () => {
    const catacombs = getCatacombsData();
    if (!catacombs || !catacombs.floors) return [];

    return Object.keys(catacombs.floors).sort((a, b) => parseInt(a) - parseInt(b));
  };

  // Get class data
  const getClassData = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.classes) return [];

    const result = [];
    const classes = dungeons.classes.classes || {};
    
    for (const className in classes) {
      const classInfo = classes[className];
      // Normalize beserk to berserk
      const normalizedName = className === "beserk" ? "berserk" : className;
      
      result.push({
        name: normalizedName,
        displayName: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1),
        level: classInfo.level || 0,
        progress: classInfo.progress || 0,
        experience: classInfo.xp || 0,
        selected: normalizedName.toLowerCase() === dungeons.classes.selectedClass.toLowerCase()
      });
    }
    
    return result;
  };

  // Get class average
  const getClassAverage = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.classes) return "0.00";

    return dungeons.classes.classAverage.toFixed(2);
  };

  // Get total completions
  const getTotalCompletions = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.stats) return 0;

    return dungeons.stats.totalRuns || 0;
  };

  // Get secrets found
  const getSecretsFound = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.stats) return 0;

    return dungeons.stats.secrets || 0;
  };

  // Get secrets per run
  const getSecretsPerRun = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.stats) return "0.00";

    return dungeons.stats.secretsPerRun.toFixed(2);
  };

  // Calculate dungeon weight
  const calculateDungeonWeight = (profile = activeProfile) => {
    if (!getDungeonsData(profile)) return 0;

    // Max level references - perfect theoretical stats
    const MAX_CATA_LEVEL = 50;
    const MAX_CLASS_LEVEL = 50;
    const MAX_CLASSES = 5; // Healer, Mage, Archer, Tank, Berserk

    // Reference values for very endgame players
    const ENDGAME_SECRETS = 150000;
    const ENDGAME_COMPLETIONS = 10000;

    // Get actual player values
    const catacombsLevel = getCatacombsLevel(profile).level;
    const classData = getClassData(profile);
    const secretsFound = getSecretsFound(profile);
    const totalCompletions = getTotalCompletions(profile);

    // Component weights - set so theoretical perfect player would score exactly 1000
    const catacombsComponent = (catacombsLevel / MAX_CATA_LEVEL) * 300;

    // Class component - considers both average and total levels
    const classLevels = classData.reduce((sum, cls) => sum + cls.level, 0);
    const maxPossibleClassLevels = MAX_CLASSES * MAX_CLASS_LEVEL;
    const classAverage = classData.length > 0 ? classLevels / classData.length : 0;
    const maxClassAverage = MAX_CLASS_LEVEL;

    // Weight both total levels and average (incentivizes balanced progression)
    const totalClassWeight = (classLevels / maxPossibleClassLevels) * 150;
    const avgClassWeight = (classAverage / maxClassAverage) * 100;
    const classComponent = totalClassWeight + avgClassWeight;

    // Secrets component - logarithmic scale to better represent value
    const secretsRatio = Math.min(1, secretsFound / ENDGAME_SECRETS);
    const secretsComponent = Math.pow(secretsRatio, 0.6) * 200;

    // Completions component - also logarithmic
    const completionsRatio = Math.min(1, totalCompletions / ENDGAME_COMPLETIONS);
    const completionsComponent = Math.pow(completionsRatio, 0.7) * 150;

    // Master Mode bonus - extra weight for master mode progress
    const masterModeComponent = 30; // Simplified

    // "Perfect score" bonuses - small boosts for perfect achievements
    const perfectScoreComponent = 20; // Simplified

    // Floor completion bonus
    const floorCompletionBonus = 30; // Simplified

    // Sum all components
    const totalWeight =
      catacombsComponent +
      classComponent +
      secretsComponent +
      completionsComponent +
      masterModeComponent +
      perfectScoreComponent +
      floorCompletionBonus;

    // Return rounded weight
    return Math.round(totalWeight);
  };

  // Get highest floor
  const getHighestFloor = (mode = "catacombs", profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.stats) return "None";

    if (mode === "catacombs") {
      return `F${dungeons.stats.highestFloorNormal || 0}`;
    } else {
      return `M${dungeons.stats.highestFloorMaster || 0}`;
    }
  };

  // Get fastest F7 time
  const getFastestF7Time = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.floors || !dungeons.floors.normal || !dungeons.floors.normal[7]) return "N/A";

    return formatTime(dungeons.floors.normal[7].fastest_times?.normal?.time_ms || 0);
  };

  // Get fastest M7 time
  const getFastestM7Time = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.floors || !dungeons.floors.master || !dungeons.floors.master[7]) return "N/A";

    return formatTime(dungeons.floors.master[7].fastest_times?.normal?.time_ms || 0);
  };

  // Get most played floor
  const getMostPlayedFloor = (mode = "catacombs", profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.floors) return "None";

    const floors = dungeons.floors[mode === "catacombs" ? "normal" : "master"] || {};
    let maxPlays = 0;
    let mostPlayedFloor = "None";

    Object.entries(floors).forEach(([floorId, floorData]) => {
      if (floorData.times_played > maxPlays) {
        maxPlays = floorData.times_played;
        mostPlayedFloor = floorId === "0" ? "Entrance" : 
                         (mode === "catacombs" ? `F${floorId}` : `M${floorId}`);
      }
    });

    return mostPlayedFloor;
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
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
      {expanded ? (
        <ChevronUp className="text-text-secondary" />
      ) : (
        <ChevronDown className="text-text-secondary" />
      )}
    </div>
  );

  // Scroll to results when stats loaded on mobile only
  useEffect(() => {
    if (statsLoaded && playerData) {
      // Check if the device is mobile (screen width less than 768px)
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Scroll to results with a small delay to ensure DOM is updated
        setTimeout(() => {
          const resultsElement = document.getElementById("results-section");
          if (resultsElement) {
            resultsElement.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 300);
      }
    }
  }, [statsLoaded, playerData]);

  // Helper function to get color for dungeon weight
  const getDungeonWeightColor = (weight) => {
    if (!weight) weight = calculateDungeonWeight();

    if (weight >= 900) return "bg-purple-600"; // Endgame
    if (weight >= 700) return "bg-purple-400"; // Late endgame
    if (weight >= 500) return "bg-green-500"; // Late game
    if (weight >= 300) return "bg-yellow-500"; // Mid game
    if (weight >= 100) return "bg-yellow-600"; // Early-mid game
    return "bg-red-500"; // Early game
  };

  const ThemeSelector = ({ currentTheme, setCurrentTheme, themes }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center bg-tertiary px-3 py-1.5 rounded-md hover:bg-accent transition"
        >
          <Palette size={16} className="mr-2" />
          <span className="text-sm">Theme</span>
          {isOpen ? (
            <ChevronUp size={16} className="ml-1" />
          ) : (
            <ChevronDown size={16} className="ml-1" />
          )}
        </button>

        {isOpen && (
          <div
            className="absolute bottom-full mb-2 right-0 bg-secondary p-3 rounded-md shadow-card z-10"
            style={{ minWidth: "200px" }}
          >
            <div className="text-xs font-semibold mb-2 pb-1 border-b border-accent">
              Select Theme
            </div>
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`theme-chip bg-tertiary ${
                  currentTheme === theme.id ? "active" : ""
                }`}
                onClick={() => {
                  setCurrentTheme(theme.id);
                  setIsOpen(false);
                }}
              >
                <div
                  className={`theme-preview ${theme.previewClass}`}
                  style={{
                    backgroundColor: theme.previewClass
                      ? "transparent"
                      : theme.color,
                    border: theme.id === "outline" ? "1px solid #444" : "none",
                  }}
                ></div>
                <span className="theme-name">{theme.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Comparison component
  const PlayerComparison = () => {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="mr-2 text-ui-warning" size={24} />
            <h2 className="text-2xl font-bold">Player Comparison</h2>
          </div>
          <button 
            onClick={() => setViewMode("single")}
            className="flex items-center bg-tertiary px-3 py-1.5 rounded-md hover:bg-accent transition"
          >
            <ArrowLeft size={16} className="mr-2" />
            <span>Back to Single View</span>
          </button>
        </div>
        
        {/* Player selection area */}
        <div className="bg-secondary p-4 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <form 
              onSubmit={handleComparisonSubmit}
              className="flex-grow flex items-center gap-2"
            >
              <input
                type="text"
                value={comparisonInput}
                onChange={(e) => setComparisonInput(e.target.value)}
                placeholder="Add player to comparison"
                className="w-full bg-tertiary text-text-primary px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-ui-primary"
              />
              <button
                type="submit"
                className="bg-ui-primary text-text-primary px-4 py-2 rounded hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-ui-primary disabled:opacity-50 transition"
                disabled={loadingComparison || !comparisonInput}
              >
                {loadingComparison ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <PlusCircle size={18} />
                )}
              </button>
            </form>
            
            {/* Quick add buttons */}
            <div className="flex gap-2 flex-wrap">
              {demoPlayers.map((player) => (
                <button
                  key={player.name}
                  onClick={() => fetchPlayerDataForComparison(player.name).then(data => {
                    if (data && !comparedPlayers.some(p => p.name === player.name)) {
                      setComparedPlayers([...comparedPlayers, data]);
                      updateUrlWithComparison([...comparedPlayers, data]);
                    }
                  })}
                  className="px-2 py-1 bg-tertiary hover:bg-accent rounded text-sm flex items-center transition"
                  disabled={comparedPlayers.some(p => p.name === player.name)}
                >
                  <span>{player.name}</span>
                </button>
              ))}
              
              {statsLoaded && playerData && displayName && (
                <button
                  onClick={addCurrentPlayerToComparison}
                  className="px-2 py-1 bg-ui-primary hover:bg-opacity-90 rounded text-sm flex items-center transition"
                  disabled={comparedPlayers.some(p => p.name === displayName)}
                >
                  <span>+ Add Current Player</span>
                </button>
              )}
            </div>
          </div>
          
          {comparisonError && (
            <div className="mt-2 p-2 bg-ui-danger bg-opacity-30 border border-ui-danger text-text-primary rounded flex items-start">
              <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{comparisonError}</span>
            </div>
          )}
        </div>
        
        {/* Player cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {comparedPlayers.map((player) => (
            <div key={player.name} className="bg-secondary rounded-lg p-4 shadow-card border border-accent relative">
              <button 
                onClick={() => removeFromComparison(player.name)}
                className="absolute top-2 right-2 p-1 bg-tertiary rounded-full hover:bg-ui-danger hover:text-text-primary transition"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="flex items-center mb-3">
                {player.avatar && (
                  <img 
                    src={player.avatar} 
                    alt={`${player.name}'s avatar`}
                    className="w-12 h-12 rounded-lg border-2 border-ui-warning mr-3"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold">{player.name}</h3>
                  <div className="flex items-center text-sm text-text-secondary">
                    <div className={getDungeonWeightColor(player.weight)} style={{width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px'}}></div>
                    <span>Weight: {player.weight}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-tertiary p-2 rounded">
                  <div className="text-xs text-text-secondary">Cata Level</div>
                  <div className={`font-bold ${getRarityColorClass(player.cataLevel)}`}>
                    {player.cataLevel}
                  </div>
                </div>
                
                <div className="bg-tertiary p-2 rounded">
                  <div className="text-xs text-text-secondary">Class Avg</div>
                  <div className="font-bold">
                    {player.classAvg}
                  </div>
                </div>
                
                <div className="bg-tertiary p-2 rounded">
                  <div className="text-xs text-text-secondary">Secrets</div>
                  <div className="font-bold">
                    {formatNumber(player.secretsFound)}
                  </div>
                </div>
                
                <div className="bg-tertiary p-2 rounded">
                  <div className="text-xs text-text-secondary">Completions</div>
                  <div className="font-bold">
                    {formatNumber(player.completions)}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-tertiary p-2 rounded">
                  <div className="text-xs text-text-secondary">Best F7</div>
                  <div className="font-bold">
                    {player.fastestF7}
                  </div>
                </div>
                
                <div className="bg-tertiary p-2 rounded">
                  <div className="text-xs text-text-secondary">Best M7</div>
                  <div className="font-bold">
                    {player.fastestM7}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Comparison Tabs */}
        {comparedPlayers.length > 1 && (
          <div className="mb-8">
            <div className="flex overflow-x-auto mb-4">
              <button
                onClick={() => setActiveComparisonTab("overview")}
                className={`px-4 py-2 font-medium rounded-t-lg transition ${
                  activeComparisonTab === "overview" 
                    ? "bg-ui-primary text-text-primary" 
                    : "bg-tertiary text-text-secondary hover:bg-opacity-80"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveComparisonTab("levels")}
                className={`px-4 py-2 font-medium rounded-t-lg transition ${
                  activeComparisonTab === "levels" 
                    ? "bg-ui-primary text-text-primary" 
                    : "bg-tertiary text-text-secondary hover:bg-opacity-80"
                }`}
              >
                Class Levels
              </button>
              <button
                onClick={() => setActiveComparisonTab("floors")}
                className={`px-4 py-2 font-medium rounded-t-lg transition ${
                  activeComparisonTab === "floors" 
                    ? "bg-ui-primary text-text-primary" 
                    : "bg-tertiary text-text-secondary hover:bg-opacity-80"
                }`}
              >
                Floor Stats
              </button>
              <button
                onClick={() => setActiveComparisonTab("weight")}
                className={`px-4 py-2 font-medium rounded-t-lg transition ${
                  activeComparisonTab === "weight" 
                    ? "bg-ui-primary text-text-primary" 
                    : "bg-tertiary text-text-secondary hover:bg-opacity-80"
                }`}
              >
                Weight Analysis
              </button>
            </div>
            
            {/* Detailed comparison content based on active tab */}
            <div className="bg-secondary p-5 rounded-lg shadow-card border border-accent">
              {activeComparisonTab === "overview" && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Player Overview Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-tertiary">
                          <th className="p-2">Player</th>
                          <th className="p-2">Cata Level</th>
                          <th className="p-2">Class Avg</th>
                          <th className="p-2">Secrets</th>
                          <th className="p-2">Completions</th>
                          <th className="p-2">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparedPlayers.map((player) => (
                          <tr key={player.name} className="border-t border-accent">
                            <td className="p-2 flex items-center">
                              {player.avatar && (
                                <img 
                                  src={player.avatar} 
                                  alt={`${player.name}`}
                                  className="w-6 h-6 rounded mr-2"
                                />
                              )}
                              <span>{player.name}</span>
                            </td>
                            <td className="p-2">
                              <span className={getRarityColorClass(player.cataLevel)}>
                                {player.cataLevel}
                              </span>
                            </td>
                            <td className="p-2">{player.classAvg}</td>
                            <td className="p-2">{formatNumber(player.secretsFound)}</td>
                            <td className="p-2">{formatNumber(player.completions)}</td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${getDungeonWeightColor(player.weight)}`}></div>
                                {player.weight}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeComparisonTab === "levels" && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Class Levels Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-tertiary">
                          <th className="p-2">Player</th>
                          <th className="p-2">
                            <Shield size={16} className="text-class-tank mr-1 inline" />
                            Tank
                          </th>
                          <th className="p-2">
                            <Heart size={16} className="text-class-healer mr-1 inline" />
                            Healer
                          </th>
                          <th className="p-2">
                            <Wand size={16} className="text-class-mage mr-1 inline" />
                            Mage
                          </th>
                          <th className="p-2">
                            <Sword size={16} className="text-class-berserk mr-1 inline" />
                            Berserk
                          </th>
                          <th className="p-2">
                            <Target size={16} className="text-class-archer mr-1 inline" />
                            Archer
                          </th>
                          <th className="p-2">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparedPlayers.map((player) => {
                          const classData = getClassData(player.profile);
                          const classByName = classData.reduce((acc, cls) => {
                            acc[cls.name] = cls.level;
                            return acc;
                          }, {});
                          
                          return (
                            <tr key={player.name} className="border-t border-accent">
                              <td className="p-2">{player.name}</td>
                              <td className="p-2">
                                <span className={getRarityColorClass(classByName.tank || 0)}>
                                  {classByName.tank || 0}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getRarityColorClass(classByName.healer || 0)}>
                                  {classByName.healer || 0}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getRarityColorClass(classByName.mage || 0)}>
                                  {classByName.mage || 0}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getRarityColorClass(classByName.berserk || 0)}>
                                  {classByName.berserk || 0}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getRarityColorClass(classByName.archer || 0)}>
                                  {classByName.archer || 0}
                                </span>
                              </td>
                              <td className="p-2 font-bold">{player.classAvg}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeComparisonTab === "floors" && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Floor Completions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-tertiary">
                          <th className="p-2">Player</th>
                          <th className="p-2">F7 Comps</th>
                          <th className="p-2">Best F7</th>
                          <th className="p-2">M7 Comps</th>
                          <th className="p-2">Best M7</th>
                          <th className="p-2">Total Runs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparedPlayers.map((player) => {
                          const dungeons = getDungeonsData(player.profile);
                          const f7Completions = dungeons?.completions?.normal?.["7"] || 0;
                          const m7Completions = dungeons?.completions?.master?.["7"] || 0;
                          
                          return (
                            <tr key={player.name} className="border-t border-accent">
                              <td className="p-2">{player.name}</td>
                              <td className="p-2">{formatNumber(f7Completions)}</td>
                              <td className="p-2">{player.fastestF7}</td>
                              <td className="p-2">{formatNumber(m7Completions)}</td>
                              <td className="p-2">{player.fastestM7}</td>
                              <td className="p-2">{formatNumber(player.completions)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <h3 className="text-xl font-bold mt-6 mb-4">Floor Scores</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-tertiary">
                          <th className="p-2">Player</th>
                          <th className="p-2">F1 Score</th>
                          <th className="p-2">F3 Score</th>
                          <th className="p-2">F5 Score</th>
                          <th className="p-2">F7 Score</th>
                          <th className="p-2">M3 Score</th>
                          <th className="p-2">M5 Score</th>
                          <th className="p-2">M7 Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparedPlayers.map((player) => {
                          const dungeons = getDungeonsData(player.profile);
                          
                          const getScore = (mode, floor) => {
                            return dungeons?.floors?.[mode === "normal" ? "normal" : "master"]?.[floor]?.best_score || 0;
                          };
                          
                          return (
                            <tr key={player.name} className="border-t border-accent">
                              <td className="p-2">{player.name}</td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", "1"))}>
                                  {getScore("normal", "1") || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", "3"))}>
                                  {getScore("normal", "3") || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", "5"))}>
                                  {getScore("normal", "5") || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", "7"))}>
                                  {getScore("normal", "7") || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("master", "3"))}>
                                  {getScore("master", "3") || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("master", "5"))}>
                                  {getScore("master", "5") || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("master", "7"))}>
                                  {getScore("master", "7") || "N/A"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeComparisonTab === "weight" && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Weight Comparison</h3>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Weight Distribution</h4>
                    <div className="flex items-center mb-2">
                      <div className="w-full">
                        {comparedPlayers.map((player) => (
                          <div key={player.name} className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">{player.name}</span>
                              <span className="text-sm font-medium">{player.weight}</span>
                            </div>
                            <div className="w-full h-4 bg-tertiary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getDungeonWeightColor(player.weight)}`}
                                style={{
                                  width: `${Math.min(100, player.weight / 10)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-tertiary p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Catacombs Level</h4>
                      {comparedPlayers.map((player) => (
                        <div key={player.name} className="flex items-center justify-between mb-2">
                          <span>{player.name}</span>
                          <span className={getRarityColorClass(player.cataLevel)}>
                            {player.cataLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-tertiary p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Secrets Found</h4>
                      {comparedPlayers.map((player) => (
                        <div key={player.name} className="flex items-center justify-between mb-2">
                          <span>{player.name}</span>
                          <span>{formatNumber(player.secretsFound)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-tertiary p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Class Average</h4>
                      {comparedPlayers.map((player) => (
                        <div key={player.name} className="flex items-center justify-between mb-2">
                          <span>{player.name}</span>
                          <span>{player.classAvg}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-tertiary p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Total Completions</h4>
                      {comparedPlayers.map((player) => (
                        <div key={player.name} className="flex items-center justify-between mb-2">
                          <span>{player.name}</span>
                          <span>{formatNumber(player.completions)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-primary text-text-primary p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Search */}
        <div className="mb-8">
          <div className="text-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-ui-warning flex items-center justify-center">
              <Trophy className="mr-2" size={32} />
              Skyblock Dungeons Stats Tracker
            </h1>
            <p className="text-center text-text-secondary mb-2">
              Enter a Hypixel Skyblock player name to view their dungeon
              statistics
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-secondary p-6 rounded-lg shadow-card">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-grow">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={playerNameInput}
                  onChange={(e) => setPlayerNameInput(e.target.value)}
                  placeholder="Enter player IGN (e.g. tommo395)"
                  className="w-full bg-tertiary text-text-primary px-4 py-2 pl-10 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-ui-primary"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
                />
                {playerNameInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-ui-danger"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-ui-primary text-text-primary px-6 py-2 rounded hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-ui-primary disabled:opacity-50 transition"
                disabled={loading || !playerNameInput}
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
                {demoPlayers.map((player) => (
                  <button
                    key={player.name}
                    onClick={() => fetchPlayerData(player.name)}
                    className="px-3 py-1 bg-tertiary hover:bg-accent rounded text-sm flex items-center transition"
                  >
                    <span>{player.name}</span>
                    <span className="text-text-tertiary ml-2 text-xs">
                      ({player.description})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-ui-danger bg-opacity-30 border border-ui-danger text-text-primary rounded flex items-start">
                <AlertTriangle
                  size={18}
                  className="mr-2 mt-0.5 flex-shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <div className="mt-4 p-3 bg-ui-info bg-opacity-30 border border-ui-info text-text-primary rounded flex items-center justify-center">
                <Loader size={18} className="mr-2 animate-spin" />
                <span>Loading player data...</span>
              </div>
            )}

            {statsLoaded && (
              <div className="mt-4 p-3 bg-ui-success bg-opacity-30 border border-ui-success text-text-primary rounded flex items-center justify-center">
                <div className="flex items-center">
                  <span>✓ Stats loaded! </span>
                  <span className="ml-1 text-ui-success">
                    Scroll down to view
                  </span>
                </div>
              </div>
            )}
            
            {/* View mode toggle */}
            {statsLoaded && (
              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={() => setViewMode("single")}
                  className={`px-4 py-2 rounded transition flex items-center ${
                    viewMode === "single" 
                      ? "bg-ui-primary text-text-primary" 
                      : "bg-tertiary text-text-secondary hover:bg-opacity-80"
                  }`}
                >
                  <User size={16} className="mr-2" />
                  Single Player
                </button>
                <button
                  onClick={() => {
                    if (comparedPlayers.length === 0 && playerData) {
                      // Add current player to comparison automatically
                      addCurrentPlayerToComparison();
                    }
                    setViewMode("compare");
                  }}
                  className={`px-4 py-2 rounded transition flex items-center ${
                    viewMode === "compare" 
                      ? "bg-ui-primary text-text-primary" 
                      : "bg-tertiary text-text-secondary hover:bg-opacity-80"
                  }`}
                >
                  <Users size={16} className="mr-2" />
                  Compare Players {comparedPlayers.length > 0 ? `(${comparedPlayers.length})` : ''}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* No data state */}
        {!playerData && !loading && !error && viewMode === "single" && comparedPlayers.length === 0 && (
          <div className="bg-secondary p-6 rounded-lg text-center shadow-card">
            <p className="text-text-secondary">
              Enter a player's IGN to view their dungeon stats.
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              Try searching for popular players like "tommo395" or "Refraction"
            </p>

            <div className="mt-6 p-4 bg-tertiary rounded-lg">
              <h3 className="font-medium mb-2 text-ui-warning flex items-center">
                <Info size={16} className="mr-2" />
                How It Works
              </h3>
              <p className="text-text-secondary text-sm">
                This tracker shows detailed statistics about a player's
                performance in Hypixel Skyblock Dungeons, including Catacombs
                level, class levels, floor completions, and best runs.
              </p>
            </div>
          </div>
        )}

        {/* Player Data Display */}
        {activeProfile && getDungeonsData() && viewMode === "single" && (
          <div id="results-section">
            {/* Player Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4">
                {playerAvatar && (
                  <div className="flex-shrink-0">
                    <img
                      src={playerAvatar}
                      alt={`${displayName}'s avatar`}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-lg border-4 border-ui-warning"
                    />
                  </div>
                )}
                <div className="text-center md:text-left flex-grow">
                  <h1 className="text-3xl md:text-4xl font-bold text-ui-warning flex items-center justify-center md:justify-start">
                    {displayName}'s Dungeons
                    {activeProfile.cute_name && (
                      <span className="text-lg ml-2 text-text-secondary">
                        ({activeProfile.cute_name})
                      </span>
                    )}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                    <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center">
                      <Search className="w-4 h-4 mr-1" />
                      <span>{getSecretsFound()} Secrets</span>
                    </div>
                    <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      <span>{getTotalCompletions()} Completions</span>
                    </div>
                    <div className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center">
                      <Calculator className="w-4 h-4 mr-1" />
                      <span>{getSecretsPerRun()} Secrets/Run</span>
                    </div>
                    <button
                      onClick={() => fetchPlayerData(displayName)}
                      className="bg-secondary hover:bg-tertiary px-3 py-1 rounded-full text-sm flex items-center transition"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={addCurrentPlayerToComparison}
                      className="bg-ui-primary hover:bg-opacity-90 px-3 py-1 rounded-full text-sm flex items-center transition"
                    >
                      <Users size={14} className="mr-1" />
                      <span>Add to Comparison</span>
                    </button>
                  </div>
                </div>

                {/* Dungeon Weight */}
                <div className="flex-shrink-0 bg-secondary px-4 py-3 rounded-lg border border-ui-warning">
                  <div className="text-center">
                    <div className="text-sm text-text-secondary">
                      Dungeon Weight
                    </div>
                    <div className="text-2xl font-bold text-ui-warning">
                      {calculateDungeonWeight()} / 1000
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Selector (if multiple profiles) */}
              {Object.keys(playerData.profiles || {}).length > 1 && (
                <div className="bg-secondary p-4 rounded-lg mt-4 shadow-card">
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Profiles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(playerData.profiles).map((profile) => (
                      <button
                        key={profile.profile_id}
                        className={`px-3 py-1 rounded transition ${
                          activeProfile?.profile_id === profile.profile_id
                            ? "bg-ui-primary text-text-primary"
                            : "bg-tertiary text-text-secondary hover:bg-opacity-80"
                        }`}
                        onClick={() => setActiveProfile(profile)}
                      >
                        {profile.cute_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
                      className={`text-2xl font-bold px-3 py-0.5 border-2 rounded ${getRarityColorClass(
                        getCatacombsLevel().level
                      )}`}
                      style={{ borderColor: "currentColor" }}
                    >
                      {getCatacombsLevel().level}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        Progress to level {getCatacombsLevel().level + 1}
                      </span>
                      <span>
                        {Math.round(getCatacombsLevel().progress * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-primary rounded-full h-2">
                      <div
                        className="bg-ui-primary h-2 rounded-full"
                        style={{
                          width: `${getCatacombsLevel().progress * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-text-secondary grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between">
                        <span>Current XP</span>
                        <span>
                          {formatNumber(getCatacombsLevel().xpCurrent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Needed XP</span>
                        <span>
                          {formatNumber(getCatacombsLevel().xpForNext)}
                        </span>
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
                          {getClassIcon(
                            getDungeonsData()?.classes?.selectedClass || "none"
                          )}
                          <span className="ml-1 capitalize">
                            {getDungeonsData()?.classes?.selectedClass ||
                              "None"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Class Levels */}
                <div className="bg-tertiary rounded-lg p-4 border border-accent mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">Class Levels</h3>
                    <div className="text-lg font-bold flex items-center">
                      <span className="text-sm text-text-secondary mr-2">
                        Average:
                      </span>
                      <span
                        className={getRarityColorClass(
                          parseFloat(getClassAverage())
                        )}
                      >
                        {getClassAverage()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getClassData().map((classData) => (
                      <div
                        key={classData.name}
                        className={`bg-secondary p-3 rounded-lg border ${
                          classData.selected
                            ? "border-ui-warning"
                            : "border-accent"
                        } transition hover:shadow-card-hover`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getClassIcon(classData.name)}
                            <span className="ml-2 capitalize font-medium">
                              {classData.displayName}
                            </span>
                          </div>
                          <div
                            className={`text-2xl font-bold ${getRarityColorClass(
                              classData.level
                            )}`}
                          >
                            {classData.level}
                          </div>
                        </div>
                        <div className="w-full bg-primary rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full ${getClassColorClass(
                              classData.name
                            )}`}
                            style={{
                              width: `${classData.progress * 100}%`,
                              backgroundColor: "currentColor",
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
              </div>

              {/* Dungeon Stats */}
              <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent">
                <h2 className="text-2xl font-bold flex items-center mb-4">
                  <FlaskConical className="mr-2 text-class-mage" />
                  <span>Dungeon Statistics</span>
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-tertiary rounded-lg p-4 border border-accent">
                    <h3 className="text-lg font-medium mb-3 text-mode-normal">
                      Catacombs
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Highest Floor
                        </span>
                        <span>{getHighestFloor("catacombs")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Most Played</span>
                        <span>{getMostPlayedFloor("catacombs")}</span>
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
                        <span>
                          {formatNumber(
                            Object.values(
                              getDungeonsData()?.completions?.normal || {}
                            ).reduce(
                              (sum, count) => sum + (count || 0),
                              0
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-tertiary rounded-lg p-4 border border-accent">
                    <h3 className="text-lg font-medium mb-3 text-mode-master">
                      Master Mode
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Highest Floor
                        </span>
                        <span>{getHighestFloor("master")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Most Played</span>
                        <span>{getMostPlayedFloor("master")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Fastest M7</span>
                        <span className="flex items-center">
                          <Clock size={14} className="mr-1 text-ui-danger" />
                          {getFastestM7Time()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Completions</span>
                        <span>
                          {formatNumber(
                            Object.values(
                              getDungeonsData()?.completions?.master || {}
                            ).reduce(
                              (sum, count) => sum + (count || 0),
                              0
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-tertiary rounded-lg p-4 border border-accent">
                  <h3 className="text-lg font-medium mb-2">
                    Performance Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">
                        Total Runs
                      </div>
                      <div className="font-bold text-lg">
                        {formatNumber(getTotalCompletions())}
                      </div>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">
                        Secrets Found
                      </div>
                      <div className="font-bold text-lg">
                        {formatNumber(getSecretsFound())}
                      </div>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">
                        Secrets Per Run
                      </div>
                      <div className="font-bold text-lg">
                        {getSecretsPerRun()}
                      </div>
                    </div>
                    <div className="bg-secondary p-3 rounded-lg">
                      <div className="text-xs text-text-secondary">
                        Best F7 S+ Time
                      </div>
                      <div className="font-bold text-lg">
                        {formatTime(
                          getDungeonsData()?.floors?.normal?.[7]?.fastest_times?.s_plus_rank?.time_ms || 0
                        )}
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
                      onClick={() => setActiveTab("catacombs")}
                      className={`px-3 py-1 rounded transition ${
                        activeTab === "catacombs"
                          ? "bg-mode-normal"
                          : "bg-tertiary hover:bg-opacity-80"
                      }`}
                    >
                      Catacombs
                    </button>
                    <button
                      onClick={() => setActiveTab("master")}
                      className={`px-3 py-1 rounded transition ${
                        activeTab === "master"
                          ? "bg-mode-master"
                          : "bg-tertiary hover:bg-opacity-80"
                      }`}
                    >
                      Master Mode
                    </button>
                  </div>
                  {/* Floor Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getFloorKeys().map((floor) => (
                      <button
                        key={floor}
                        onClick={() =>
                          activeTab === "catacombs"
                            ? setSelectedFloor(floor)
                            : setSelectedMasterFloor(floor)
                        }
                        className={`px-3 py-1 rounded text-sm font-medium transition ${
                          activeTab === "catacombs" && selectedFloor === floor
                            ? "bg-mode-normal"
                            : activeTab === "master" &&
                              selectedMasterFloor === floor
                            ? "bg-mode-master"
                            : "bg-tertiary hover:bg-opacity-80"
                        }`}
                      >
                        {floor === "0" ? "Entrance" : `F${floor}`}
                      </button>
                    ))}
                  </div>

                  {/* Floor Details */}
                  {getFloorData() ? (
                    <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold">
                            {activeTab === "catacombs" && selectedFloor === "0"
                              ? "The Entrance"
                              : `${
                                  activeTab === "catacombs" ? "Floor" : "Master"
                                } ${
                                  activeTab === "catacombs"
                                    ? selectedFloor
                                    : selectedMasterFloor
                                }`}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {getFloorData().completions || 0}{" "}
                            completions,{" "}
                            {getFloorData().times_played || 0} total runs
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0 flex items-center">
                          <div
                            className={`px-4 py-2 rounded font-bold ${getScoreColorClass(
                              getFloorData().best_score || 0
                            )}`}
                          >
                            Best Score:{" "}
                            {getFloorData().best_score || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Floor Stats */}
                        <div>
                          <h4 className="font-semibold mb-3 border-b pb-2 border-accent">
                            Performance
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-tertiary p-3 rounded-lg">
                              <div className="text-xs text-text-secondary">
                                Fastest Time
                              </div>
                              <div className="flex items-center text-lg font-semibold">
                                <Clock className="w-4 h-4 mr-1 text-ui-success" />
                                {formatTime(getFloorData().fastest_times?.normal?.time_ms)}
                              </div>
                            </div>

                            {getFloorData().fastest_times?.s_rank?.time_ms && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">
                                  Fastest S Time
                                </div>
                                <div className="flex items-center text-lg font-semibold">
                                  <Clock className="w-4 h-4 mr-1 text-ui-primary" />
                                  {formatTime(
                                    getFloorData().fastest_times.s_rank.time_ms
                                  )}
                                </div>
                              </div>
                            )}

                            {getFloorData().fastest_times?.s_plus_rank?.time_ms && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">
                                  Fastest S+ Time
                                </div>
                                <div className="flex items-center text-lg font-semibold">
                                  <Clock className="w-4 h-4 mr-1 text-score-splus" />
                                  {formatTime(
                                    getFloorData().fastest_times.s_plus_rank.time_ms
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="bg-tertiary p-3 rounded-lg">
                              <div className="text-xs text-text-secondary">
                                Mobs Killed
                              </div>
                              <div className="text-lg font-semibold">
                                {formatNumber(
                                  getFloorData().stats?.mobs_killed || 0
                                )}
                              </div>
                            </div>

                            <div className="bg-tertiary p-3 rounded-lg">
                              <div className="text-xs text-text-secondary">
                                Most Mobs in Run
                              </div>
                              <div className="text-lg font-semibold">
                                {getFloorData().stats?.most_mobs_killed || 0}
                              </div>
                            </div>

                            {getFloorData().stats?.watcher_kills && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">
                                  Watcher Kills
                                </div>
                                <div className="text-lg font-semibold">
                                  {getFloorData().stats?.watcher_kills}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Damage Stats */}
                        <div>
                          <h4 className="font-semibold mb-3 border-b pb-2 border-accent">
                            Highest Damage
                          </h4>
                          {getFloorData().stats?.most_damage ? (
                            <div className="bg-tertiary p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {getClassIcon(
                                    Object.keys(getFloorData().stats.most_damage)[0]
                                  )}
                                  <span className="ml-2 capitalize font-medium">
                                    {Object.keys(getFloorData().stats.most_damage)[0]}
                                  </span>
                                </div>
                                <div className="text-xl font-bold">
                                  {formatNumber(
                                    Object.values(getFloorData().stats.most_damage)[0]
                                  )}
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
                              <h4 className="font-semibold mb-2">
                                Most Healing Done
                              </h4>
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-lg font-semibold">
                                  {formatNumber(
                                    getFloorData().stats.most_healing
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Best Runs */}
                      {getFloorData().best_run && (
                        <div className="mt-6">
                          <h4 className="font-semibold mb-3 border-b pb-2 border-accent">
                            Best Run
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-tertiary">
                                  <th className="p-2 text-xs">Grade</th>
                                  <th className="p-2 text-xs">Class</th>
                                  <th className="p-2 text-xs">Score</th>
                                  <th className="p-2 text-xs">Time</th>
                                  <th className="p-2 text-xs">Damage</th>
                                  <th className="p-2 text-xs">Secrets</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t border-accent">
                                  <td className="p-2 text-xs">
                                    {getFloorData().best_run.grade}
                                  </td>
                                  <td className="p-2 text-xs flex items-center">
                                    {getClassIcon(getFloorData().best_run.dungeon_class)}
                                    <span className="ml-1 capitalize">
                                      {getFloorData().best_run.dungeon_class}
                                    </span>
                                  </td>
                                  <td className="p-2 text-xs">
                                    <span
                                      className={getScoreColorClass(
                                        getFloorData().best_run.score
                                      )}
                                    >
                                      {getFloorData().best_run.score}
                                    </span>
                                  </td>
                                  <td className="p-2 text-xs">
                                    {getFloorData().best_run.elapsed_time_formatted}
                                  </td>
                                  <td className="p-2 text-xs">
                                    {formatNumber(getFloorData().best_run.damage_dealt)}
                                  </td>
                                  <td className="p-2 text-xs">
                                    {getFloorData().best_run.secrets_found}
                                  </td>
                                </tr>
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

            {/* Dungeon Weight Explanation */}
            <div className="bg-secondary rounded-lg p-5 shadow-card border border-accent mb-8">
              <SectionHeader
                title="Dungeon Weight"
                icon={<BrainCircuit className="text-ui-warning" />}
                section="weightDetails"
                expanded={expandedSections.weightDetails}
              />

              {expandedSections.weightDetails && (
                <div className="bg-tertiary p-4 rounded-lg">
                  <p className="text-sm mb-2">
                    Dungeon Weight is a comprehensive metric that precisely
                    measures your dungeon progression. A score of 1000
                    represents the theoretical maximum achievable with perfect
                    stats across all categories.
                  </p>

                  <div className="mt-4 bg-secondary p-3 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-ui-success">
                      Your Dungeon Weight
                    </h3>
                    <div className="flex flex-col md:flex-row items-center">
                      <div className="w-full h-6 bg-tertiary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getDungeonWeightColor()}`}
                          style={{
                            width: `${Math.min(
                              100,
                              calculateDungeonWeight() / 10
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <div className="mt-2 md:mt-0 md:ml-4 font-bold text-xl">
                        {calculateDungeonWeight()}
                        <span className="text-text-secondary"> / 1000</span>
                      </div>
                    </div>
                  </div>

                  <SectionHeader
                    title="Weight Distribution"
                    icon={<Calculator className="text-ui-primary" size={18} />}
                    section="advancedWeightInfo"
                    expanded={expandedSections.advancedWeightInfo}
                  />

                  {expandedSections.advancedWeightInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-secondary p-3 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-ui-primary">
                          Weight Distribution
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span>Catacombs Level (max 50)</span>
                            <span className="font-medium">300 points</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Class Levels (all classes)</span>
                            <span className="font-medium">250 points</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Secrets Found</span>
                            <span className="font-medium">200 points</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Completions</span>
                            <span className="font-medium">150 points</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Master Mode Progress</span>
                            <span className="font-medium">50 points</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Perfect Scores</span>
                            <span className="font-medium">20 points</span>
                          </li>
                          <li className="flex justify-between">
                            <span>All Floors Completed</span>
                            <span className="font-medium">30 points</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-secondary p-3 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-ui-info">
                          Progression Stages
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                            <div className="flex justify-between w-full">
                              <span>Early Game</span>
                              <span className="font-medium">0-100</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-600 mr-2"></div>
                            <div className="flex justify-between w-full">
                              <span>Early-Mid Game</span>
                              <span className="font-medium">100-300</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                            <div className="flex justify-between w-full">
                              <span>Mid Game</span>
                              <span className="font-medium">300-500</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <div className="flex justify-between w-full">
                              <span>Late Game</span>
                              <span className="font-medium">500-700</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                            <div className="flex justify-between w-full">
                              <span>Late Endgame</span>
                              <span className="font-medium">700-900</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                            <div className="flex justify-between w-full">
                              <span>Endgame / Maxed</span>
                              <span className="font-medium">900+</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Essence Collection */}
            {getDungeonsData().essence &&
              Object.keys(getDungeonsData().essence).length > 0 && (
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
                        {Object.entries(getDungeonsData().essence).map(
                          ([type, amount]) => (
                            <div
                              key={type}
                              className="bg-tertiary px-3 py-3 rounded-lg text-center transition hover:shadow-card-hover"
                            >
                              <div className="text-sm text-text-secondary capitalize">
                                {type}
                              </div>
                              <div className="font-bold text-lg">
                                {formatNumber(amount)}
                              </div>
                            </div>
                          )
                        )}
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
                  <h3 className="text-lg font-semibold mb-2 text-ui-info">
                    Exploration
                  </h3>
                  <p className="text-sm">
                    Based on the percentage of rooms cleared and secrets found.
                    Max: 100 points
                  </p>
                </div>

                <div className="bg-tertiary p-4 rounded-lg border-l-4 border-ui-success">
                  <h3 className="text-lg font-semibold mb-2 text-ui-success">
                    Speed
                  </h3>
                  <p className="text-sm">
                    Based on completion time. Faster completion means higher
                    score. Max: 100 points
                  </p>
                </div>

                <div className="bg-tertiary p-4 rounded-lg border-l-4 border-ui-danger">
                  <h3 className="text-lg font-semibold mb-2 text-ui-danger">
                    Skill
                  </h3>
                  <p className="text-sm">
                    Based on deaths, puzzles completion, and mob kills. Max: 100
                    points
                  </p>
                </div>

                <div className="bg-tertiary p-4 rounded-lg border-l-4 border-ui-warning">
                  <h3 className="text-lg font-semibold mb-2 text-ui-warning">
                    Bonus
                  </h3>
                  <p className="text-sm">
                    Additional points for special achievements like solving all
                    puzzles. Max: 20 points
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-tertiary p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Score Tiers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-score-c"></div>
                    <span>C: Less than 100</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-score-b"></div>
                    <span>B: 100-199</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-score-a"></div>
                    <span>A: 200-269</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-score-s"></div>
                    <span>S: 270-299</span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-2 bg-score-splus"></div>
                    <span>S+: 300+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison view */}
        {viewMode === "compare" && <PlayerComparison />}

        {/* Footer */}
        <div className="text-center text-text-tertiary text-sm pt-4 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-center md:text-left">
              <p>
                Data provided by custom Hypixel API. Not affiliated with Hypixel
                or Mojang.
              </p>
            </div>
            <div>
              <ThemeSelector
                currentTheme={currentTheme}
                setCurrentTheme={setCurrentTheme}
                themes={themes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkyblockDungeonTracker;