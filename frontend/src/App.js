import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [resumeText, setResumeText] = useState("");
  const [skills, setSkills] = useState([]);
  const [score, setScore] = useState(0);
  const [jobs, setJobs] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Parse the resume and extract skills
      const parseResponse = await axios.post(
        "http://localhost:5000/parse-resume",
        {
          resume: resumeText,
        }
      );
      setSkills(parseResponse.data.skills);
      setScore(parseResponse.data.score);

      // Step 2: Fetch job recommendations based on extracted skills
      const jobResponse = await axios.post(
        "http://localhost:5000/recommend-jobs",
        {
          skills: parseResponse.data.skills,
        }
      );
      setJobs(jobResponse.data);
      console.log(jobResponse.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const chartData = {
    labels: ["Resume Score"],
    datasets: [
      {
        label: "Score",
        data: [score],
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Resume Score",
        font: {
          size: 18,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
      },
    },
  };
  const getBackgroundColor = (matchPercentage) => {
    if (matchPercentage < 39) return "#FF0000"; // Dark Red
    if (matchPercentage < 40) return "#ffffff"; // Lightest red
    if (matchPercentage < 50) return "#efffef"; // Lightest green
    if (matchPercentage < 75) return "#d5ffd5"; // Light green
    if (matchPercentage < 90) return "#119011"; // Darker green
    return "#119011"; // Darkest green
  };
  const getTextColor = (bgColor) => {
    // Extract RGB values from hex color
    const r = parseInt(bgColor.substring(1, 3), 16);
    const g = parseInt(bgColor.substring(3, 5), 16);
    const b = parseInt(bgColor.substring(5, 7), 16);

    // Calculate brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? "#000000" : "#FFFFFF"; // Dark text for light background, white text for dark background
  };
  return (
    <div className="app">
      <h1>AI-Powered Resume Screening</h1>
      <form onSubmit={handleSubmit} className="resume-form">
        <textarea
          placeholder="Paste your resume here..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        ></textarea>
        <button type="submit">Submit</button>
      </form>

      {skills.length > 0 && (
        <div className="results">
          <div className="skills-section">
            <h2>Extracted Skills</h2>
            <ul>
              {skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>

          <div className="chart-section">
            <h2>Resume Score</h2>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="jobs-section">
          <h2>Recommended Jobs</h2>
          <ul>
            {jobs.map((job, index) => {
              const backgroundColor = getBackgroundColor(job.matchPercentage);
              const textColor = getTextColor(backgroundColor);

              return (
                <li
                  key={index}
                  className="job-card"
                  style={{ backgroundColor, color: textColor }}
                >
                  <h3>{job.title}</h3>
                  <p>
                    <strong>Match:</strong> {job.matchPercentage.toFixed(2)}%
                  </p>
                  <p>
                    <strong>Required Skills:</strong>{" "}
                    {job.requiredSkills.join(", ")}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
