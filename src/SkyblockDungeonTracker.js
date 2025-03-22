import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Sword,
  Wand,
  Heart,
  Target,
  Clock,
  Trophy,
  Award,
  Star,
  Activity,
  Search,
  FlaskConical,
  Loader,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  X,
  User,
  BrainCircuit,
  Calculator,
  Palette,
  Coins,
  Users,
  PlusCircle,
  Trash2,
  BarChart2,
  ArrowLeft,
} from "lucide-react";
import "./theme.css"; // We'll create this file next

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
  const [networkValue, setNetworkValue] = useState(null);
  const [currentTheme, setCurrentTheme] = useState("classic");
  const searchInputRef = useRef(null);
  
  // Comparison mode state
  const [viewMode, setViewMode] = useState("single"); // "single" or "compare"
  const [comparedPlayers, setComparedPlayers] = useState([]);
  const [comparisonInput, setComparisonInput] = useState("");
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [activeComparisonTab, setActiveComparisonTab] = useState("overview"); // "overview", "levels", "floors", "weight"

  // Update themes array with creative options
  const themes = [
    {
      id: "classic",
      name: "Classic Dark",
      color: "#0f172a",
      previewClass: "",
    },
    {
      id: "light",
      name: "Light Mode",
      color: "#f8fafc",
      previewClass: "",
    },
    {
      id: "hypixel",
      name: "Hypixel",
      color: "#0e1823",
      previewClass: "",
    },
    {
      id: "outline",
      name: "Wireframe",
      color: "#000000",
      previewClass: "",
    },
  ];

  // Demo players for quick access
  const demoPlayers = [
    { name: "tommo395", description: "creator" },
    { name: "midori642", description: "cold guy" },
    { name: "LeDucTaep", description: "geko man" },
    { name: "boolfalse", description: "im scared" },
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

  // Fetch player avatar
  const fetchPlayerAvatar = async (name) => {
    try {
      // Use Minecraft API to get player avatar
      const avatarUrl = `https://mc-heads.net/avatar/${name}/64`;
      setPlayerAvatar(avatarUrl);
      return avatarUrl;
    } catch (err) {
      console.error("Failed to fetch player avatar:", err);
      setPlayerAvatar(null);
      return null;
    }
  };

  // Fetch player data
  const fetchPlayerData = async (name = playerNameInput) => {
    if (!name) return;

    setLoading(true);
    setStatsLoaded(false);
    setError("");

    try {
      // Fetch player avatar
      fetchPlayerAvatar(name);

      const response = await fetch(
        `https://sky.shiiyu.moe/api/v2/dungeons/${name}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch player data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.profiles || Object.keys(data.profiles).length === 0) {
        throw new Error("No profiles found for this player");
      }

      setPlayerData(data);
      setDisplayName(name);
      updateUrlWithPlayer(name);

      // Find the active profile
      const activeProfileKey =
        Object.keys(data.profiles).find(
          (key) => data.profiles[key].selected === true
        ) || Object.keys(data.profiles)[0];

      setActiveProfile(data.profiles[activeProfileKey]);

      // Set default selected floor based on data
      if (data.profiles[activeProfileKey].dungeons?.catacombs?.highest_floor) {
        const highestFloor =
          data.profiles[activeProfileKey].dungeons.catacombs.highest_floor;
        setSelectedFloor(highestFloor.replace("floor_", ""));
      }

      if (
        data.profiles[activeProfileKey].dungeons?.master_catacombs
          ?.highest_floor
      ) {
        const highestMasterFloor =
          data.profiles[activeProfileKey].dungeons.master_catacombs
            .highest_floor;
        setSelectedMasterFloor(highestMasterFloor.replace("floor_", ""));
      }

      setStatsLoaded(true);
      return data;
    } catch (err) {
      setError(err.message || "Failed to fetch player data");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch player data for comparison
  const fetchPlayerDataForComparison = async (name) => {
    if (!name) return null;
    
    setLoadingComparison(true);
    setComparisonError("");

    try {
      const avatarUrl = await fetchPlayerAvatar(name);
      
      const response = await fetch(
        `https://sky.shiiyu.moe/api/v2/dungeons/${name}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch player data: ${response.status}`);
      }

      const data = await response.json();

      if (!data.profiles || Object.keys(data.profiles).length === 0) {
        throw new Error("No profiles found for this player");
      }
      
      // Find the active profile
      const activeProfileKey =
        Object.keys(data.profiles).find(
          (key) => data.profiles[key].selected === true
        ) || Object.keys(data.profiles)[0];
      
      const profileData = data.profiles[activeProfileKey];
      
      // Return formatted player data for comparison
      return {
        name: name,
        avatar: avatarUrl,
        data: data,
        profile: profileData,
        weight: calculateDungeonWeight(profileData),
        cataLevel: getCatacombsLevel(profileData)?.level || 0,
        classAvg: getClassAverage(profileData),
        secretsFound: getSecretsFound(profileData),
        completions: getTotalCompletions(profileData),
        fastestF7: formatTime(profileData.dungeons?.catacombs?.floors?.[7]?.stats?.fastest_time || 0),
        fastestM7: formatTime(profileData.dungeons?.master_catacombs?.floors?.[7]?.stats?.fastest_time || 0),
      };
    } catch (err) {
      setComparisonError(err.message || "Failed to fetch player data");
      return null;
    } finally {
      setLoadingComparison(false);
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

    return activeTab === "catacombs"
      ? dungeons.catacombs
      : dungeons.master_catacombs;
  };

  // Get catacombs level
  const getCatacombsLevel = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return { level: 0, progress: 0 };

    const catacombs = dungeons.catacombs;
    if (!catacombs || !catacombs.level) return { level: 0, progress: 0 };

    return {
      level: catacombs.level.level || 0,
      progress: catacombs.level.progress || 0,
      xpCurrent: catacombs.level.xpCurrent || 0,
      xpForNext: catacombs.level.xpForNext || 0,
      totalXp: catacombs.level.xp || 0,
    };
  };

  // Get floor data
  const getFloorData = () => {
    const catacombs = getCatacombsData();
    if (!catacombs || !catacombs.floors) return null;

    const floorId =
      activeTab === "catacombs" ? selectedFloor : selectedMasterFloor;
    return catacombs.floors?.[floorId];
  };

  // Get floor keys
  const getFloorKeys = () => {
    const catacombs = getCatacombsData();
    if (!catacombs || !catacombs.floors) return [];

    return Object.keys(catacombs.floors).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );
  };

  // Get class data
  const getClassData = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.classes) return [];

    // Extract class data from the API response - handle nested structure
    // In the dungeons API, classes are nested as: classes.classes.{className}
    const classContainer = dungeons.classes.classes || {};
    const classNames = [
      "healer",
      "mage",
      "berserk",
      "beserk",
      "archer",
      "tank",
    ];
    const classData = [];

    for (const className of classNames) {
      if (classContainer[className]) {
        // Normalize the "beserk" to "berserk" if needed
        const normalizedName = className === "beserk" ? "berserk" : className;

        const classInfo = classContainer[className];
        // In the dungeons API, level info is directly in the level field
        const levelData = classInfo.level || {};

        classData.push({
          name: normalizedName,
          displayName:
            normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1),
          level: levelData.level || 0,
          progress: levelData.progress || 0,
          experience: levelData.xp || 0,
          selected: normalizedName === dungeons.classes.selected_class,
        });
      }
    }

    return classData;
  };

  // Calculate class average
  const getClassAverage = (profile = activeProfile) => {
    const classData = getClassData(profile);
    if (!classData || classData.length === 0) return 0;

    const totalLevels = classData.reduce((sum, cls) => sum + cls.level, 0);
    return (totalLevels / classData.length).toFixed(2);
  };

  // Get total completions
  const getTotalCompletions = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return 0;

    // Calculate manually from all floors and modes
    let total = 0;

    // Add normal catacombs completions
    if (dungeons.catacombs && dungeons.catacombs.floors) {
      Object.keys(dungeons.catacombs.floors).forEach((floor) => {
        const completions =
          dungeons.catacombs.floors[floor]?.stats?.tier_completions || 0;
        total += completions;
      });
    }

    // Add master mode completions
    if (dungeons.master_catacombs && dungeons.master_catacombs.floors) {
      Object.keys(dungeons.master_catacombs.floors).forEach((floor) => {
        const completions =
          dungeons.master_catacombs.floors[floor]?.stats?.tier_completions || 0;
        total += completions;
      });
    }

    return total;
  };

  // Get secrets found
  const getSecretsFound = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return 0;

    return dungeons.secrets_found || 0;
  };

  // Get secrets per run
  const getSecretsPerRun = (profile = activeProfile) => {
    const totalSecrets = getSecretsFound(profile);
    const totalRuns = getTotalCompletions(profile);

    if (!totalRuns) return 0;
    return (totalSecrets / totalRuns).toFixed(2);
  };

  // Calculate dungeon weight with no artificial cap - 1000 is achievable only with perfect stats
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
    const catacombsXp = getCatacombsLevel(profile).totalXp || 0;
    const classData = getClassData(profile);
    const secretsFound = getSecretsFound(profile);
    const totalCompletions = getTotalCompletions(profile);

    // Component weights - set so theoretical perfect player would score exactly 1000
    const catacombsComponent = (catacombsLevel / MAX_CATA_LEVEL) * 300;

    // Class component - considers both average and total levels
    const classLevels = classData.reduce((sum, cls) => sum + cls.level, 0);
    const maxPossibleClassLevels = MAX_CLASSES * MAX_CLASS_LEVEL;
    const classAverage =
      classData.length > 0 ? classLevels / classData.length : 0;
    const maxClassAverage = MAX_CLASS_LEVEL;

    // Weight both total levels and average (incentivizes balanced progression)
    const totalClassWeight = (classLevels / maxPossibleClassLevels) * 150;
    const avgClassWeight = (classAverage / maxClassAverage) * 100;
    const classComponent = totalClassWeight + avgClassWeight;

    // Secrets component - logarithmic scale to better represent value
    // No player will reach the theoretical maximum of ENDGAME_SECRETS
    const secretsRatio = Math.min(1, secretsFound / ENDGAME_SECRETS);
    const secretsComponent = Math.pow(secretsRatio, 0.6) * 200;

    // Completions component - also logarithmic
    const completionsRatio = Math.min(
      1,
      totalCompletions / ENDGAME_COMPLETIONS
    );
    const completionsComponent = Math.pow(completionsRatio, 0.7) * 150;

    // Master Mode bonus - extra weight for master mode progress
    const masterModeComponent = calculateMasterModeWeight(profile);

    // "Perfect score" bonuses - small boosts for perfect achievements
    const perfectScoreComponent = calculatePerfectScoreBonus(profile);

    // Floor completion bonus
    const floorCompletionBonus = hasCompletedAllFloors(profile) ? 30 : 0;

    // Sum all components - will naturally approach 1000 as player approaches perfect stats
    const totalWeight =
      catacombsComponent +
      classComponent +
      secretsComponent +
      completionsComponent +
      masterModeComponent +
      perfectScoreComponent +
      floorCompletionBonus;

    // Return rounded weight (no artificial cap at 1000)
    return Math.round(totalWeight);
  };

  // Calculate master mode weight component (up to 50 points)
  const calculateMasterModeWeight = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (
      !dungeons ||
      !dungeons.master_catacombs ||
      !dungeons.master_catacombs.floors
    ) {
      return 0;
    }

    let totalWeight = 0;
    // Award points for each master floor completion (higher floors worth more)
    for (let i = 1; i <= 7; i++) {
      const floor = dungeons.master_catacombs.floors[i];
      if (floor && floor.stats && floor.stats.tier_completions) {
        // Higher floors worth more, logarithmic scaling with completions
        const completions = floor.stats.tier_completions;
        const floorMultiplier = i; // M1=1, M2=2, etc.
        totalWeight += Math.min(
          floorMultiplier * 5,
          Math.log10(completions + 1) * floorMultiplier * 3
        );
      }
    }

    return Math.min(50, totalWeight);
  };

  // Calculate bonus for perfect scores (up to 20 points)
  const calculatePerfectScoreBonus = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return 0;

    let totalBonus = 0;

    // Check for S+ scores in normal mode
    if (dungeons.catacombs && dungeons.catacombs.floors) {
      for (let i = 1; i <= 7; i++) {
        const floor = dungeons.catacombs.floors[i];
        if (floor && floor.stats && floor.stats.best_score >= 300) {
          totalBonus += i * 0.5; // 0.5 points for F1, 1 for F2, etc.
        }
      }
    }

    // Check for S+ scores in master mode (worth more)
    if (dungeons.master_catacombs && dungeons.master_catacombs.floors) {
      for (let i = 1; i <= 7; i++) {
        const floor = dungeons.master_catacombs.floors[i];
        if (floor && floor.stats && floor.stats.best_score >= 300) {
          totalBonus += i * 1; // 1 point for M1, 2 for M2, etc.
        }
      }
    }

    return Math.min(20, totalBonus);
  };

  // Helper function to check if player has completed all floors
  const hasCompletedAllFloors = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons || !dungeons.catacombs || !dungeons.catacombs.floors)
      return false;

    // Check if player has completed floors 0-7
    for (let i = 0; i <= 7; i++) {
      const floor = dungeons.catacombs.floors[i];
      if (
        !floor ||
        !floor.stats ||
        !floor.stats.tier_completions ||
        floor.stats.tier_completions < 1
      ) {
        return false;
      }
    }

    // Check master mode floors (M1-M7)
    if (dungeons.master_catacombs && dungeons.master_catacombs.floors) {
      for (let i = 1; i <= 7; i++) {
        const floor = dungeons.master_catacombs.floors[i];
        if (
          !floor ||
          !floor.stats ||
          !floor.stats.tier_completions ||
          floor.stats.tier_completions < 1
        ) {
          return false;
        }
      }
      return true; // All normal and master floors completed
    }

    return false; // Didn't complete all master floors
  };

  // Helper function to get color class based on dungeon weight
  const getDungeonWeightColor = (weight) => {
    if (!weight) weight = calculateDungeonWeight();

    if (weight >= 900) return "bg-purple-600"; // Endgame
    if (weight >= 700) return "bg-purple-400"; // Late endgame
    if (weight >= 500) return "bg-green-500"; // Late game
    if (weight >= 300) return "bg-yellow-500"; // Mid game
    if (weight >= 100) return "bg-yellow-600"; // Early-mid game
    return "bg-red-500"; // Early game
  };

  // Get highest floor
  const getHighestFloor = (mode = "catacombs", profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return "None";

    const dungeonType =
      mode === "catacombs" ? dungeons.catacombs : dungeons.master_catacombs;

    if (!dungeonType?.highest_floor) return "None";

    return dungeonType.highest_floor.replace("floor_", "F");
  };

  // Get fastest F7 time
  const getFastestF7Time = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return "N/A";

    const f7Data = dungeons.catacombs?.floors?.[7];
    if (!f7Data || !f7Data.stats?.fastest_time) return "N/A";

    return formatTime(f7Data.stats.fastest_time);
  };

  // Get fastest M7 time
  const getFastestM7Time = (profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return "N/A";

    const m7Data = dungeons.master_catacombs?.floors?.[7];
    if (!m7Data || !m7Data.stats?.fastest_time) return "N/A";

    return formatTime(m7Data.stats.fastest_time);
  };

  // Get most played floor
  const getMostPlayedFloor = (mode = "catacombs", profile = activeProfile) => {
    const dungeons = getDungeonsData(profile);
    if (!dungeons) return "None";

    const dungeonType =
      mode === "catacombs" ? dungeons.catacombs : dungeons.master_catacombs;

    if (!dungeonType || !dungeonType.floors) return "None";

    let maxPlays = 0;
    let mostPlayedFloor = "None";

    Object.entries(dungeonType.floors).forEach(([floor, data]) => {
      const plays = data.stats?.times_played || 0;
      if (plays > maxPlays) {
        maxPlays = plays;
        mostPlayedFloor = floor === "0" ? "Entrance" : `F${floor}`;
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
                          const f7Completions = dungeons?.catacombs?.floors?.[7]?.stats?.tier_completions || 0;
                          const m7Completions = dungeons?.master_catacombs?.floors?.[7]?.stats?.tier_completions || 0;
                          
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
                            const floorData = mode === "normal" 
                              ? dungeons?.catacombs?.floors?.[floor]
                              : dungeons?.master_catacombs?.floors?.[floor];
                            
                            return floorData?.stats?.best_score || 0;
                          };
                          
                          return (
                            <tr key={player.name} className="border-t border-accent">
                              <td className="p-2">{player.name}</td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", 1))}>
                                  {getScore("normal", 1) || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", 3))}>
                                  {getScore("normal", 3) || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", 5))}>
                                  {getScore("normal", 5) || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("normal", 7))}>
                                  {getScore("normal", 7) || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("master", 3))}>
                                  {getScore("master", 3) || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("master", 5))}>
                                  {getScore("master", 5) || "N/A"}
                                </span>
                              </td>
                              <td className="p-2">
                                <span className={getScoreColorClass(getScore("master", 7))}>
                                  {getScore("master", 7) || "N/A"}
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
                            getDungeonsData()?.classes?.selected_class || "none"
                          )}
                          <span className="ml-1 capitalize">
                            {getDungeonsData()?.classes?.selected_class ||
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
                              getDungeonsData()?.catacombs?.floors || {}
                            ).reduce(
                              (sum, floor) =>
                                sum + (floor?.stats?.tier_completions || 0),
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
                              getDungeonsData()?.master_catacombs?.floors || {}
                            ).reduce(
                              (sum, floor) =>
                                sum + (floor?.stats?.tier_completions || 0),
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
                          getDungeonsData()?.catacombs?.floors?.[7]?.stats
                            ?.fastest_time_s_plus || 0
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
                            {getFloorData().stats?.tier_completions || 0}{" "}
                            completions,{" "}
                            {getFloorData().stats?.times_played || 0} total runs
                          </p>
                        </div>
                        <div className="mt-2 md:mt-0 flex items-center">
                          <div
                            className={`px-4 py-2 rounded font-bold ${getScoreColorClass(
                              getFloorData().stats?.best_score || 0
                            )}`}
                          >
                            Best Score:{" "}
                            {getFloorData().stats?.best_score || "N/A"}
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
                                {formatTime(getFloorData().stats?.fastest_time)}
                              </div>
                            </div>

                            {getFloorData().stats?.fastest_time_s && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">
                                  Fastest S Time
                                </div>
                                <div className="flex items-center text-lg font-semibold">
                                  <Clock className="w-4 h-4 mr-1 text-ui-primary" />
                                  {formatTime(
                                    getFloorData().stats?.fastest_time_s
                                  )}
                                </div>
                              </div>
                            )}

                            {getFloorData().stats?.fastest_time_s_plus && (
                              <div className="bg-tertiary p-3 rounded-lg">
                                <div className="text-xs text-text-secondary">
                                  Fastest S+ Time
                                </div>
                                <div className="flex items-center text-lg font-semibold">
                                  <Clock className="w-4 h-4 mr-1 text-score-splus" />
                                  {formatTime(
                                    getFloorData().stats?.fastest_time_s_plus
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
                          {getFloorData().most_damage ? (
                            <div className="bg-tertiary p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {getClassIcon(
                                    getFloorData().most_damage.class
                                  )}
                                  <span className="ml-2 capitalize font-medium">
                                    {getFloorData().most_damage.class}
                                  </span>
                                </div>
                                <div className="text-xl font-bold">
                                  {formatNumber(
                                    getFloorData().most_damage.value
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
                      {getFloorData().best_runs &&
                        getFloorData().best_runs.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-3 border-b pb-2 border-accent">
                              Best Runs
                            </h4>
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
                                  {getFloorData()
                                    .best_runs.slice(0, 3)
                                    .map((run, index) => (
                                      <tr
                                        key={index}
                                        className="border-t border-accent"
                                      >
                                        <td className="p-2 text-xs">
                                          {formatDate(run.timestamp)}
                                        </td>
                                        <td className="p-2 text-xs flex items-center">
                                          {getClassIcon(run.dungeon_class)}
                                          <span className="ml-1 capitalize">
                                            {run.dungeon_class}
                                          </span>
                                        </td>
                                        <td className="p-2 text-xs">
                                          <span
                                            className={getScoreColorClass(
                                              run.score_exploration +
                                                run.score_speed +
                                                run.score_skill +
                                                run.score_bonus
                                            )}
                                          >
                                            {run.score_exploration +
                                              run.score_speed +
                                              run.score_skill +
                                              run.score_bonus}
                                          </span>
                                        </td>
                                        <td className="p-2 text-xs">
                                          {formatTime(run.elapsed_time)}
                                        </td>
                                        <td className="p-2 text-xs">
                                          {formatNumber(run.damage_dealt)}
                                        </td>
                                        <td className="p-2 text-xs">
                                          {run.secrets_found}
                                        </td>
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
                    section="weightDistribution"
                    expanded={expandedSections.weightDistribution}
                  />

                  {expandedSections.weightDistribution && (
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

                  <SectionHeader
                    title="Advanced Scoring Details"
                    icon={<Info size={18} className="text-ui-info" />}
                    section="advancedWeightInfo"
                    expanded={expandedSections.advancedWeightInfo}
                  />

                  {expandedSections.advancedWeightInfo && (
                    <div className="mt-4 bg-secondary p-3 rounded-lg">
                      <p className="text-xs text-text-secondary mb-1">
                        The system uses proportional scaling with minor bonuses
                        for exceptional achievements:
                      </p>
                      <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-primary p-2 rounded">
                          <div className="font-semibold mb-1 text-ui-primary">
                            Catacombs (300 pts)
                          </div>
                          <div>• Linear scaling with level</div>
                          <div>• Catacombs 50 = 300 points</div>
                        </div>

                        <div className="bg-primary p-2 rounded">
                          <div className="font-semibold mb-1 text-ui-primary">
                            Classes (250 pts)
                          </div>
                          <div>• Total level contribution (150 pts)</div>
                          <div>• Average level contribution (100 pts)</div>
                          <div>• Rewards balanced class progression</div>
                        </div>

                        <div className="bg-primary p-2 rounded">
                          <div className="font-semibold mb-1 text-ui-primary">
                            Secrets (200 pts)
                          </div>
                          <div>• Logarithmic scaling (diminishing returns)</div>
                          <div>• Reference: 150,000 secrets = 200 pts</div>
                          <div>• Biased toward quality over quantity</div>
                        </div>

                        <div className="bg-primary p-2 rounded">
                          <div className="font-semibold mb-1 text-ui-primary">
                            Completions (150 pts)
                          </div>
                          <div>• Logarithmic scaling</div>
                          <div>• Reference: 10,000 completions = 150 pts</div>
                        </div>

                        <div className="bg-primary p-2 rounded">
                          <div className="font-semibold mb-1 text-ui-primary">
                            Master Mode (50 pts)
                          </div>
                          <div>• Points awarded per floor</div>
                          <div>• Higher floors worth more points</div>
                          <div>• Scales with completion count</div>
                        </div>

                        <div className="bg-primary p-2 rounded">
                          <div className="font-semibold mb-1 text-ui-primary">
                            Bonuses (50 pts)
                          </div>
                          <div>• Perfect scores (up to 20 pts)</div>
                          <div>• All floors completed (30 pts)</div>
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
                Data provided by sky.shiiyu.moe API. Not affiliated with Hypixel
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
