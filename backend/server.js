const express = require("express");
const cors = require("cors");
const nlp = require("compromise");

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample job data
const jobs = [
  { title: "Software Engineer", requiredSkills: ["Python", "JavaScript", "React", "Node.js", "Git", "REST APIs"] },
  { title: "Data Scientist", requiredSkills: ["Python", "Machine Learning", "SQL", "Pandas", "NumPy", "Data Visualization"] },
  { title: "Frontend Developer", requiredSkills: ["JavaScript", "React", "HTML", "CSS", "Redux", "Bootstrap"] },
  { title: "Backend Developer", requiredSkills: ["Node.js", "Express", "MongoDB", "SQL", "REST APIs", "Docker"] },
  { title: "DevOps Engineer", requiredSkills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"] },
  { title: "Mobile App Developer", requiredSkills: ["React Native", "JavaScript", "iOS", "Android", "Firebase", "Redux"] },
  { title: "UI/UX Designer", requiredSkills: ["Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping", "User Research"] },
  { title: "Cloud Engineer", requiredSkills: ["AWS", "Azure", "Google Cloud", "Terraform", "Kubernetes", "Docker"] },
  { title: "Full Stack Developer", requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "REST APIs", "HTML", "CSS"] },
  { title: "Machine Learning Engineer", requiredSkills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "Data Preprocessing"] },
];

app.post("/parse-resume", (req, res) => {
  const { resume } = req.body;

  // Predefined list of skills (including multi-word skills)
  const predefinedSkills = [
    "Python", "JavaScript", "React", "Node.js", "Git", "REST APIs", "Machine Learning", "SQL", "Pandas", "NumPy",
    "Data Visualization", "HTML", "CSS", "Redux", "Bootstrap", "Express", "MongoDB", "Docker", "Kubernetes", "AWS",
    "CI/CD", "Linux", "Terraform", "React Native", "iOS", "Android", "Firebase", "Figma", "Adobe XD", "Sketch",
    "Wireframing", "Prototyping", "User Research", "Azure", "Google Cloud", "TensorFlow", "PyTorch", "Deep Learning",
    "Data Preprocessing"
  ];

  // Convert predefined skills to lowercase for case-insensitive matching
  const lowercasePredefinedSkills = predefinedSkills.map((skill) => skill.toLowerCase());

  // Extract skills from the resume
  const extractedSkills = [];

  // Step 1: Check for multi-word skills first
  for (const skill of predefinedSkills) {
    const lowercaseSkill = skill.toLowerCase();
    if (resume.toLowerCase().includes(lowercaseSkill)) {
      extractedSkills.push(skill);
    }
  }

  // Step 2: Check for single-word skills (excluding those already matched in multi-word skills)
  const singleWordSkills = predefinedSkills.filter((skill) => !skill.includes(" "));
  const doc = nlp(resume);
  const nouns = doc.nouns().out("array");

  for (const noun of nouns) {
    const lowercaseNoun = noun.toLowerCase();

    // Check if the noun is part of a multi-word skill
    const isPartOfMultiWordSkill = extractedSkills.some((skill) =>
      skill.toLowerCase().includes(lowercaseNoun)
    );

    // If the noun is not part of a multi-word skill, add it as a single-word skill
    if (
      singleWordSkills.map((skill) => skill.toLowerCase()).includes(lowercaseNoun) &&
      !isPartOfMultiWordSkill
    ) {
      extractedSkills.push(noun);
    }
  }

  // Step 3: Handle skills provided as comma-separated or space-separated strings
  const additionalSkills = resume
    .split(/[,\s]+/) // Split by commas or spaces
    .map((skill) => skill.trim()) // Remove extra spaces
    .filter((skill) => lowercasePredefinedSkills.includes(skill.toLowerCase())); // Filter valid skills

  // Combine extracted skills and additional skills
  const allSkills = [...new Set([...extractedSkills, ...additionalSkills])]; // Remove duplicates

  // Calculate a simple score (example: number of skills)
  const score = allSkills.length;

  res.json({
    skills: allSkills,
    score,
  });
});

// Route for job recommendations (percentage-based matching)
app.post("/recommend-jobs", (req, res) => {
  const { skills } = req.body;

  // Convert skills to lowercase for case-insensitive matching
  const lowercaseSkills = skills.map((skill) => skill.toLowerCase());

  // Find jobs that match at least 75% of the required skills
  const recommendedJobs = jobs
    .map((job) => {
      // Convert job's required skills to lowercase
      const lowercaseRequiredSkills = job.requiredSkills.map((skill) => skill.toLowerCase());

      // Calculate the number of matching skills
      const matchingSkills = lowercaseRequiredSkills.filter((requiredSkill) =>
        lowercaseSkills.includes(requiredSkill)
      ).length;

      // Calculate the match percentage
      const matchPercentage = (matchingSkills / lowercaseRequiredSkills.length) * 100;

      return {
        ...job,
        matchPercentage,
      };
    }).sort((a,b)=>{
      if (a.matchPercentage>b.matchPercentage) {
        return -1;
      }
    })

  res.json(recommendedJobs);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});