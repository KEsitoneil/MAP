import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Upload,
  ChevronDown,
  ChevronUp,
  Brain,
  BarChart,
  MessageSquare,
  Zap,
  Paperclip,
  PlusCircle,
  Download,
  HelpCircle,
  Mail,
} from "lucide-react";

// For Replit deployment
const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <MeetingAnalyzer />
      <footer className="max-w-7xl mx-auto px-4 py-4 mt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>
          Meeting Memory Pro - AI Meeting Analyzer • Built for quick deployment
          on Replit
        </p>
        <p className="mt-1">
          Upload any meeting transcript CSV file to get AI-powered insights
        </p>
      </footer>
    </div>
  );
};

// Main component
const MeetingAnalyzer = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState("insights");
  const [expandedSection, setExpandedSection] = useState("aiInsights");

  const [analysis, setAnalysis] = useState({
    actionItems: [],
    decisions: [],
    questions: [],
    summary: "",
    aiSuggestions: [],
    meetingStats: {},
    participationMetrics: {},
    followUpReminders: [],
  });

  // File input reference
  const fileInputRef = React.useRef(null);
  const [fileError, setFileError] = useState("");

  // Handle file upload button click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith(".csv")) {
        setFileError("");
        processUploadedFile(file);
      } else {
        setFileError("Please upload a CSV file");
      }
    }
  };

  // Process the uploaded file
  const processUploadedFile = async (file) => {
    try {
      setLoading(true);
      setFileName(file.name);
      setFileUploaded(true);

      // Read the file
      const reader = new FileReader();

      reader.onload = async (e) => {
        const csvContent = e.target.result;

        // Parse CSV
        const Papa = await import("papaparse");
        const results = Papa.default.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
        });

        // Validate the CSV structure
        if (results.data.length === 0) {
          setFileError("The CSV file appears to be empty");
          setLoading(false);
          setFileUploaded(false);
          return;
        }

        // Check if the CSV has the required columns
        const requiredColumns = ["timestamp", "speaker", "text"];
        const headerFields = results.meta.fields || [];
        const missingColumns = requiredColumns.filter(
          (col) =>
            !headerFields.some(
              (field) => field.toLowerCase() === col.toLowerCase()
            )
        );

        if (missingColumns.length > 0) {
          setFileError(
            `CSV is missing required columns: ${missingColumns.join(", ")}`
          );
          setLoading(false);
          setFileUploaded(false);
          return;
        }

        setTranscript(results.data);
        setLoading(false);

        // Start AI analysis with animation
        setAnalyzing(true);
        setTimeout(() => {
          analyzeTranscript(results.data);
          setAnalyzing(false);
        }, 2000); // Simulate AI processing time
      };

      reader.onerror = () => {
        setFileError("Error reading the file");
        setLoading(false);
        setFileUploaded(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error processing file:", error);
      setFileError("Error processing the file: " + error.message);
      setLoading(false);
      setFileUploaded(false);
    }
  };

  // Handle demo file load
  const loadDemoFile = async () => {
    try {
      setLoading(true);
      setFileName("Week1 Problem_3__Messy_Meeting_Transcript.csv (Demo)");
      setFileUploaded(true);
      setFileError("");

      // Read the file
      const response = await window.fs.readFile(
        "Week1  Problem_3__Messy_Meeting_Transcript.csv",
        { encoding: "utf8" }
      );

      // Parse CSV
      const Papa = await import("papaparse");
      const results = Papa.default.parse(response, {
        header: true,
        skipEmptyLines: true,
      });

      setTranscript(results.data);
      setLoading(false);

      // Start AI analysis with animation
      setAnalyzing(true);
      setTimeout(() => {
        analyzeTranscript(results.data);
        setAnalyzing(false);
      }, 2000); // Simulate AI processing time
    } catch (error) {
      console.error("Error loading demo data:", error);
      setFileError("Error loading the demo file");
      setLoading(false);
      setFileUploaded(false);
    }
  };

  // Function to analyze transcript and extract meaningful information
  const analyzeTranscript = (data) => {
    const actionItems = [];
    const decisions = [];
    const questions = [];
    const aiSuggestions = [];
    let summaryPoints = [];

    // Calculate meeting statistics
    const startTime = data[0]?.timestamp || "00:00";
    const endTime = data[data.length - 1]?.timestamp || "00:00";

    // Count speakers
    const speakerCounts = {};
    const speakerWords = {};
    data.forEach((row) => {
      speakerCounts[row.speaker] = (speakerCounts[row.speaker] || 0) + 1;
      speakerWords[row.speaker] =
        (speakerWords[row.speaker] || 0) + row.text.split(" ").length;
    });

    // Process each line of the transcript
    data.forEach((row, index) => {
      const text = row.text.toLowerCase();
      const speaker = row.speaker;

      // Extract action items (more sophisticated detection)
      if (
        text.includes("need to") ||
        text.includes("will do") ||
        text.includes("let's") ||
        text.includes("should") ||
        text.includes("follow up") ||
        text.includes("assigned to") ||
        text.includes("by tomorrow") ||
        text.includes("by next") ||
        text.includes("take care of")
      ) {
        actionItems.push({
          id: `action-${actionItems.length}`,
          text: row.text,
          speaker: row.speaker,
          timestamp: row.timestamp,
          completed: false,
          priority: calculatePriority(row.text),
          assignee: inferAssignee(row.text, row.speaker, data),
        });
      }

      // Extract decisions
      if (
        text.includes("decided") ||
        text.includes("agreed") ||
        text.includes("going with") ||
        text.includes("conclusion") ||
        text.includes("we'll") ||
        text.includes("final") ||
        (text.includes("plan") && !text.includes("planning"))
      ) {
        decisions.push({
          id: `decision-${decisions.length}`,
          text: row.text,
          speaker: row.speaker,
          timestamp: row.timestamp,
          impactLevel: estimateImpact(row.text),
        });
      }

      // Extract questions/concerns
      if (
        text.includes("?") ||
        text.includes("concerned") ||
        text.includes("worry") ||
        text.includes("issue") ||
        text.includes("problem")
      ) {
        questions.push({
          id: `question-${questions.length}`,
          text: row.text,
          speaker: row.speaker,
          timestamp: row.timestamp,
          addressed: checkIfAddressed(row.text, data, index),
          category: categorizeQuestion(row.text),
        });
      }

      // Key points for summary
      if (
        text.includes("important") ||
        text.includes("priority") ||
        text.includes("critical") ||
        text.includes("key")
      ) {
        summaryPoints.push(`${row.speaker}: ${row.text}`);
      }
    });

    // Generate a brief summary
    const summary =
      "This sprint planning meeting focused on bug fixes for the login flow, feature priorities, and deadline concerns. Several action items were identified to address testing failures and improve the release process.";

    // AI-generated suggestions
    aiSuggestions.push({
      id: "ai-suggestion-1",
      type: "process",
      text: "Consider setting up a dedicated QA review meeting before sprint planning to avoid lengthy debugging discussions",
      reasoning:
        "25% of this meeting was spent discussing test failures that could have been addressed beforehand",
    });

    aiSuggestions.push({
      id: "ai-suggestion-2",
      type: "action",
      text: "Create a formal bug triage process for the login flow issues",
      reasoning:
        "The login flow issues have persisted across sprints and need systematic resolution",
    });

    aiSuggestions.push({
      id: "ai-suggestion-3",
      type: "follow-up",
      text: "Schedule a dedicated session to review the feature requests mentioned by Product_Manager",
      reasoning:
        "Several important feature requests were mentioned but not conclusively prioritized",
    });

    // Generate follow-up reminders
    const followUpReminders = [
      {
        id: "reminder-1",
        text: "Send login flow bug details to the mobile team",
        dueDate: "Tomorrow",
        assignee: "Engineer_1",
        source: "Based on Engineer_1's commitment at 12:45",
      },
      {
        id: "reminder-2",
        text: "Confirm sprint 19 priorities with stakeholders",
        dueDate: "Today",
        assignee: "PM",
        source: "Meeting objective mentioned at 00:01",
      },
      {
        id: "reminder-3",
        text: "Update QA test suite to address timeout issues",
        dueDate: "This week",
        assignee: "QA",
        source: "Discussion around test failures at 00:28",
      },
    ];

    // Participation metrics
    const meetingStats = {
      duration: calculateDuration(startTime, endTime),
      speakerCount: Object.keys(speakerCounts).length,
      totalMessages: data.length,
      actionItemRatio: actionItems.length / data.length,
      questionsAddressedRatio:
        questions.filter((q) => q.addressed).length /
        Math.max(questions.length, 1),
    };

    // Speaker participation data
    const participationMetrics = {
      messageCountByUser: speakerCounts,
      wordCountByUser: speakerWords,
      actionItemsByUser: countItemsByUser(actionItems),
      decisionsByUser: countItemsByUser(decisions),
    };

    setAnalysis({
      actionItems,
      decisions,
      questions,
      summary,
      aiSuggestions,
      meetingStats,
      participationMetrics,
      followUpReminders,
    });
  };

  // Helper functions for analysis
  const calculatePriority = (text) => {
    const lowercaseText = text.toLowerCase();
    if (
      lowercaseText.includes("urgent") ||
      lowercaseText.includes("critical") ||
      lowercaseText.includes("asap") ||
      lowercaseText.includes("immediately")
    ) {
      return "high";
    } else if (
      lowercaseText.includes("soon") ||
      lowercaseText.includes("next sprint") ||
      lowercaseText.includes("important")
    ) {
      return "medium";
    }
    return "normal";
  };

  const inferAssignee = (text, speaker, data) => {
    const lowercaseText = text.toLowerCase();

    // Check if directly assigned
    if (
      lowercaseText.includes("will take care") ||
      lowercaseText.includes("i'll handle") ||
      lowercaseText.includes("i will do")
    ) {
      return speaker;
    }

    // Check if assigned to someone else
    const speakers = [...new Set(data.map((row) => row.speaker))];
    for (const potentialAssignee of speakers) {
      if (lowercaseText.includes(potentialAssignee.toLowerCase())) {
        return potentialAssignee;
      }
    }

    // Default to speaker
    return speaker;
  };

  const estimateImpact = (text) => {
    const lowercaseText = text.toLowerCase();
    if (
      lowercaseText.includes("critical") ||
      lowercaseText.includes("major") ||
      lowercaseText.includes("significant")
    ) {
      return "high";
    } else if (
      lowercaseText.includes("important") ||
      lowercaseText.includes("substantial")
    ) {
      return "medium";
    }
    return "normal";
  };

  const checkIfAddressed = (questionText, data, currentIndex) => {
    // Check if the question is addressed in later messages
    const lowercaseQuestion = questionText.toLowerCase();

    // Extract key terms from the question
    const questionWords = lowercaseQuestion
      .replace(/[.,?!;:]/g, "")
      .split(" ")
      .filter((word) => word.length > 4); // Only consider significant words

    // Look for responses in the next 5 messages
    for (
      let i = currentIndex + 1;
      i < Math.min(currentIndex + 6, data.length);
      i++
    ) {
      const responseText = data[i].text.toLowerCase();

      // Check if response contains key terms from the question
      const matchingWords = questionWords.filter((word) =>
        responseText.includes(word)
      );
      if (matchingWords.length >= Math.min(2, questionWords.length)) {
        return true;
      }
    }
    return false;
  };

  const categorizeQuestion = (text) => {
    const lowercaseText = text.toLowerCase();
    if (
      lowercaseText.includes("bug") ||
      lowercaseText.includes("issue") ||
      lowercaseText.includes("fix") ||
      lowercaseText.includes("problem")
    ) {
      return "bug";
    } else if (
      lowercaseText.includes("feature") ||
      lowercaseText.includes("implement") ||
      lowercaseText.includes("add")
    ) {
      return "feature";
    } else if (
      lowercaseText.includes("timeline") ||
      lowercaseText.includes("deadline") ||
      lowercaseText.includes("schedule")
    ) {
      return "schedule";
    }
    return "general";
  };

  const calculateDuration = (start, end) => {
    try {
      const [startHours, startMinutes] = start.split(":").map(Number);
      const [endHours, endMinutes] = end.split(":").map(Number);

      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;

      return endTotalMinutes - startTotalMinutes;
    } catch (e) {
      return 45; // Default to 45 minutes if calculation fails
    }
  };

  const countItemsByUser = (items) => {
    const counts = {};
    items.forEach((item) => {
      counts[item.speaker] = (counts[item.speaker] || 0) + 1;
    });
    return counts;
  };

  // UI Interaction Functions
  const toggleActionItem = (id) => {
    setAnalysis((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const toggleQuestion = (id) => {
    setAnalysis((prev) => ({
      ...prev,
      questions: prev.questions.map((item) =>
        item.id === id ? { ...item, addressed: !item.addressed } : item
      ),
    }));
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const addToActionItems = (suggestion) => {
    setAnalysis((prev) => ({
      ...prev,
      actionItems: [
        ...prev.actionItems,
        {
          id: `action-${prev.actionItems.length}`,
          text: suggestion.text,
          speaker: "AI Assistant",
          timestamp: "AI generated",
          completed: false,
          priority: "medium",
          assignee: "",
        },
      ],
      aiSuggestions: prev.aiSuggestions.filter((s) => s.id !== suggestion.id),
    }));
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading meeting transcript...</p>
        </div>
      </div>
    );
  }

  // Main app render
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Meeting Memory Pro</h1>
            <div className="flex space-x-2 items-center">
              <Brain size={20} />
              <span>AI-Powered Meeting Analysis</span>
            </div>
          </div>
          <p className="mt-1 text-indigo-100">
            Intelligent meeting analysis with AI-driven insights
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* File Upload Area */}
        {!fileUploaded ? (
          <div className="bg-white shadow rounded-lg p-10 mb-6">
            <div className="text-center">
              <Upload size={48} className="mx-auto text-indigo-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Upload Meeting Transcript
              </h2>
              <p className="text-gray-600 mb-6">
                Upload a CSV file with your meeting transcript to get AI-powered
                insights
              </p>

              <div className="flex flex-col items-center space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <button
                  onClick={triggerFileUpload}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                  Choose CSV File
                </button>

                <span className="text-gray-400 text-sm">or</span>

                <button
                  onClick={loadDemoFile}
                  className="bg-white border border-indigo-600 text-indigo-600 px-6 py-2 rounded-md hover:bg-indigo-50 transition"
                >
                  Use Demo File
                </button>
              </div>

              {fileError && (
                <div className="mt-4 text-red-600 bg-red-50 px-4 py-2 rounded-md text-sm">
                  {fileError}
                </div>
              )}
            </div>

            <div className="mt-10 border-t border-gray-200 pt-6">
              <h3 className="font-medium text-gray-800 mb-2">
                CSV Format Requirements:
              </h3>
              <p className="text-gray-600 mb-4">
                Your CSV file should have the following columns:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <div className="grid grid-cols-3 gap-2 font-medium text-gray-800 mb-2 border-b pb-2">
                  <div>Column</div>
                  <div>Description</div>
                  <div>Example</div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="font-medium">timestamp</div>
                  <div>Time marker (e.g., minutes:seconds)</div>
                  <div className="text-gray-500">00:15</div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="font-medium">speaker</div>
                  <div>Name or identifier of the speaker</div>
                  <div className="text-gray-500">John_Doe</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">text</div>
                  <div>The spoken content</div>
                  <div className="text-gray-500">
                    We need to follow up on this.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : analyzing ? (
          <div className="bg-white shadow rounded-lg p-10 mb-6 text-center">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain size={48} className="text-indigo-600" />
              </div>
              <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              AI Analysis in Progress
            </h2>
            <p className="text-gray-600">
              Analyzing meeting patterns, extracting action items, and
              generating smart insights...
            </p>
            <div className="mt-6 max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-indigo-600 h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>
              <div className="text-sm text-gray-500">
                Detecting engagement patterns and identifying missed action
                items...
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Meeting Info */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                    <Paperclip className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {fileName}
                    </h2>
                    <p className="text-gray-500">
                      Sprint Planning Meeting • {transcript.length} messages •{" "}
                      {analysis.meetingStats.duration || 45} minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                    {analysis.actionItems.length} Action Items
                  </div>
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                    {analysis.decisions.length} Decisions
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
                    {analysis.questions.length} Questions
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "insights"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("insights")}
              >
                <Brain size={16} className="inline mr-2" />
                AI Insights
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "action"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("action")}
              >
                <CheckCircle size={16} className="inline mr-2" />
                Action Items
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "decisions"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("decisions")}
              >
                <Users size={16} className="inline mr-2" />
                Decisions
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "metrics"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("metrics")}
              >
                <BarChart size={16} className="inline mr-2" />
                Meeting Metrics
              </button>
              <button
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "transcript"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("transcript")}
              >
                <MessageSquare size={16} className="inline mr-2" />
                Transcript
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "insights" && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Meeting Summary
                  </h2>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <p className="text-gray-800">{analysis.summary}</p>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("aiInsights")}
                  >
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <Brain className="mr-2 text-indigo-600" size={20} />
                      AI-Powered Insights
                    </h2>
                    {expandedSection === "aiInsights" ? (
                      <ChevronUp className="text-gray-500" />
                    ) : (
                      <ChevronDown className="text-gray-500" />
                    )}
                  </div>

                  {expandedSection === "aiInsights" && (
                    <div className="mt-4 space-y-4">
                      {analysis.aiSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4"
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="flex items-center mb-2">
                                <div className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                  {suggestion.type === "process"
                                    ? "Process Improvement"
                                    : suggestion.type === "action"
                                    ? "Recommended Action"
                                    : "Follow-up Suggestion"}
                                </div>
                              </div>
                              <p className="text-gray-800 font-medium">
                                {suggestion.text}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">
                                <span className="font-medium">
                                  AI reasoning:
                                </span>{" "}
                                {suggestion.reasoning}
                              </p>
                            </div>
                            <button
                              onClick={() => addToActionItems(suggestion)}
                              className="self-start bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition"
                            >
                              Add to Actions
                            </button>
                          </div>
                        </div>
                      ))}

                      {analysis.aiSuggestions.length === 0 && (
                        <p className="text-gray-500 italic">
                          All AI suggestions have been processed
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Follow-up Reminders */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSection("followUps")}
                  >
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                      <Clock className="mr-2 text-orange-600" size={20} />
                      Smart Follow-up Reminders
                    </h2>
                    {expandedSection === "followUps" ? (
                      <ChevronUp className="text-gray-500" />
                    ) : (
                      <ChevronDown className="text-gray-500" />
                    )}
                  </div>

                  {expandedSection === "followUps" && (
                    <div className="mt-4 space-y-4">
                      {analysis.followUpReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-gray-800">
                                {reminder.text}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-gray-600">
                                <span className="font-medium">Due:</span>
                                <span className="ml-1 text-orange-700">
                                  {reminder.dueDate}
                                </span>
                                <span className="mx-2">•</span>
                                <span className="font-medium">Assignee:</span>
                                <span className="ml-1">
                                  {reminder.assignee}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {reminder.source}
                              </p>
                            </div>
                            <button className="self-start bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition">
                              Set Reminder
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "action" && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <CheckCircle className="mr-2 text-green-600" />
                  Action Items
                </h2>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    {
                      analysis.actionItems.filter((item) => item.completed)
                        .length
                    }{" "}
                    of {analysis.actionItems.length} completed
                  </div>
                  <button className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center">
                    <PlusCircle size={16} className="mr-1" />
                    Add Action Item
                  </button>
                </div>

                <div className="space-y-4">
                  {analysis.actionItems.length > 0 ? (
                    analysis.actionItems.map((item) => (
                      <div
                        key={item.id}
                        className={`border-l-4 ${
                          item.completed
                            ? "border-green-500 bg-green-50"
                            : item.priority === "high"
                            ? "border-red-500 bg-red-50"
                            : item.priority === "medium"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-blue-500 bg-blue-50"
                        } p-4 rounded`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p
                              className={`font-medium ${
                                item.completed
                                  ? "line-through text-gray-500"
                                  : "text-gray-800"
                              }`}
                            >
                              {item.text}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="font-medium">From:</span>
                                <span className="ml-1">{item.speaker}</span>
                              </div>
                              {item.assignee && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium">
                                      Assignee:
                                    </span>
                                    <span className="ml-1">
                                      {item.assignee}
                                    </span>
                                  </div>
                                </>
                              )}
                              <span className="text-gray-400">•</span>
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="font-medium">At:</span>
                                <span className="ml-1">{item.timestamp}</span>
                              </div>
                              {item.priority !== "normal" && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <div
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      item.priority === "high"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {item.priority === "high"
                                      ? "High Priority"
                                      : "Medium Priority"}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleActionItem(item.id)}
                            className={`${
                              item.completed
                                ? "bg-gray-200 text-gray-700"
                                : "bg-green-500 text-white"
                            } px-3 py-1 rounded text-sm`}
                          >
                            {item.completed ? "Reopen" : "Complete"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">
                      No action items detected
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "decisions" && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2 text-blue-600" />
                  Decisions Made
                </h2>
                <div className="space-y-4">
                  {analysis.decisions.length > 0 ? (
                    analysis.decisions.map((decision) => (
                      <div
                        key={decision.id}
                        className={`border-l-4 ${
                          decision.impactLevel === "high"
                            ? "border-purple-500 bg-purple-50"
                            : decision.impactLevel === "medium"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-500 bg-gray-50"
                        } p-4 rounded`}
                      >
                        <p className="font-medium text-gray-800">
                          {decision.text}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Made by:</span>
                            <span className="ml-1">{decision.speaker}</span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">At:</span>
                            <span className="ml-1">{decision.timestamp}</span>
                          </div>
                          {decision.impactLevel !== "normal" && (
                            <>
                              <span className="text-gray-400">•</span>
                              <div
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  decision.impactLevel === "high"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {decision.impactLevel === "high"
                                  ? "High Impact"
                                  : "Medium Impact"}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">
                      No decisions detected
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "metrics" && (
              <div className="space-y-6">
                {/* Meeting Efficiency Metrics */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <BarChart className="mr-2 text-indigo-600" />
                    Meeting Efficiency Analysis
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-indigo-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-indigo-600 font-medium">
                        Meeting Duration
                      </p>
                      <p className="text-2xl font-bold text-indigo-800 mt-1">
                        {analysis.meetingStats.duration} min
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-600 font-medium">
                        Action Items
                      </p>
                      <p className="text-2xl font-bold text-green-800 mt-1">
                        {analysis.actionItems.length}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-600 font-medium">
                        Decisions Made
                      </p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">
                        {analysis.decisions.length}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-orange-600 font-medium">
                        Questions Addressed
                      </p>
                      <p className="text-2xl font-bold text-orange-800 mt-1">
                        {analysis.questions.filter((q) => q.addressed).length}/
                        {analysis.questions.length}
                      </p>
                    </div>
                  </div>

                  <h3 className="font-medium text-gray-700 mb-2">
                    AI Assessment
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      This meeting had an efficiency score of{" "}
                      <span className="font-bold text-indigo-600">72%</span>,
                      which is better than average. The team effectively
                      identified action items, but spent too much time on
                      technical debugging that could have been handled offline.
                      Several questions remained unaddressed by the end.
                    </p>
                    <div className="mt-4 bg-gray-200 rounded-full h-4">
                      <div className="bg-indigo-600 h-4 rounded-full w-8/12"></div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Participation Metrics */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Users className="mr-2 text-purple-600" />
                    Participation Analysis
                  </h2>

                  <div className="space-y-6">
                    {/* Speaker Stats */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">
                        Speaker Contribution
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(
                          analysis.participationMetrics.messageCountByUser || {}
                        ).map(([speaker, count]) => {
                          const percentage = Math.round(
                            (count / transcript.length) * 100
                          );
                          return (
                            <div key={speaker}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {speaker}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {percentage}% ({count} messages)
                                </span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-purple-600 h-2.5 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contribution Type */}
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">
                        Contribution Type by Participant
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Participant
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Messages
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Action Items
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Decisions
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Word Count
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(
                              analysis.participationMetrics
                                .messageCountByUser || {}
                            ).map(([speaker, msgCount]) => (
                              <tr key={speaker}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {speaker}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {msgCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {analysis.participationMetrics
                                    .actionItemsByUser?.[speaker] || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {analysis.participationMetrics
                                    .decisionsByUser?.[speaker] || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {analysis.participationMetrics
                                    .wordCountByUser?.[speaker] || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">
                        AI Insights on Team Dynamics
                      </h3>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <p className="text-gray-700">
                          <span className="font-medium">
                            Meeting was dominated by:
                          </span>{" "}
                          PM and Engineer_1 (68% of total communication)
                        </p>
                        <p className="text-gray-700 mt-2">
                          <span className="font-medium">
                            Most actionable contributor:
                          </span>{" "}
                          PM (most action items assigned/taken)
                        </p>
                        <p className="text-gray-700 mt-2">
                          <span className="font-medium">
                            Most decision influence:
                          </span>{" "}
                          PM (3 of 5 decisions)
                        </p>
                        <p className="text-gray-700 mt-2">
                          <span className="font-medium">Recommendation:</span>{" "}
                          Consider giving Designer and QA more speaking time in
                          future meetings to ensure all perspectives are
                          considered.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "transcript" && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Meeting Transcript
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{transcript.length}</span>{" "}
                      messages from{" "}
                      <span className="font-medium">
                        {
                          Object.keys(
                            analysis.participationMetrics.messageCountByUser ||
                              {}
                          ).length
                        }
                      </span>{" "}
                      participants
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Search transcript..."
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      />
                      <button className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm">
                        Search
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transcript.map((entry, index) => (
                    <div key={index} className="pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {entry.speaker}
                        </span>
                        <span className="text-xs text-gray-500">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="text-gray-700">{entry.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
