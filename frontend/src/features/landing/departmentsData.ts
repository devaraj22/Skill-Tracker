export interface DepartmentInfo {
  code: string;
  name: string;
  category: "School of Computing" | "Circuit Engineering" | "Core Engineering";
  schoolGroup: "soc" | "non_soc";
  description: string;
  skills: string[];
  careers: string[];
}

export const SSMIET_DEPARTMENTS: DepartmentInfo[] = [
  {
    code: "CSE",
    name: "Computer Science and Engineering",
    category: "School of Computing",
    schoolGroup: "soc",
    description: "Core algorithms, distributed systems, cloud computing, and modern full-stack web architectures.",
    skills: ["Data Structures & Algorithms", "Full Stack Web", "Cloud Architecture", "System Design"],
    careers: ["Software Engineer", "Cloud Architect", "Full Stack Developer"],
  },
  {
    code: "AIDS",
    name: "Artificial Intelligence and Data Science",
    category: "School of Computing",
    schoolGroup: "soc",
    description: "Machine learning pipelines, deep neural networks, big data analysis, and predictive modeling.",
    skills: ["Deep Learning & PyTorch", "Big Data Analytics", "Computer Vision", "NLP & LLMs"],
    careers: ["AI/ML Engineer", "Data Scientist", "Data Analyst"],
  },
  {
    code: "AIML",
    name: "Computer Science and Engineering (AI & ML)",
    category: "School of Computing",
    schoolGroup: "soc",
    description: "Specialized algorithmic intelligence, autonomous systems, reinforcement learning, and cognitive computing.",
    skills: ["Reinforcement Learning", "Neural Network Architecture", "Model Deployment (MLOps)", "Python & TensorFlow"],
    careers: ["Machine Learning Engineer", "Cognitive Systems Specialist", "Research Associate"],
  },
  {
    code: "IT",
    name: "Information Technology",
    category: "School of Computing",
    schoolGroup: "soc",
    description: "Enterprise software, cloud services, secure database engineering, and mobile computing.",
    skills: ["Enterprise Java", "API Design & Microservices", "Database Systems", "DevOps & CI/CD"],
    careers: ["Enterprise Developer", "DevOps Engineer", "Solutions Architect"],
  },
  {
    code: "CSBS",
    name: "Computer Science and Business Systems",
    category: "School of Computing",
    schoolGroup: "soc",
    description: "Integration of modern computational systems with business analytics, financial tech, and enterprise management.",
    skills: ["Business Analytics", "FinTech & Enterprise ERP", "Applied Machine Learning", "Product Strategy"],
    careers: ["Tech Consultant", "Business Systems Analyst", "Product Operations Lead"],
  },
  {
    code: "CS",
    name: "Computer Science and Engineering (Cyber Security)",
    category: "School of Computing",
    schoolGroup: "soc",
    description: "Network defense, vulnerability assessments, penetration testing, cryptography, and secure software engineering.",
    skills: ["Network Security & Wireshark", "Penetration Testing", "Applied Cryptography", "Threat Intelligence"],
    careers: ["Security Analyst", "Penetration Tester", "Information Security Specialist"],
  },
  {
    code: "ECE",
    name: "Electronics and Communication Engineering",
    category: "Circuit Engineering",
    schoolGroup: "non_soc",
    description: "Semiconductor design, embedded microcontrollers, wireless communications, and IoT hardware platforms.",
    skills: ["VLSI Design (Verilog)", "Embedded C & RTOS", "Digital Signal Processing", "IoT Hardware"],
    careers: ["VLSI Engineer", "Embedded Systems Developer", "Firmware Engineer"],
  },
  {
    code: "EEE",
    name: "Electrical and Electronics Engineering",
    category: "Circuit Engineering",
    schoolGroup: "non_soc",
    description: "Power electronics, renewable energy grids, smart electric vehicle powertrains, and industrial automation.",
    skills: ["Power Electronics", "PLC & SCADA", "Electric Vehicles & Batteries", "Smart Grids"],
    careers: ["Power Systems Engineer", "EV Powertrain Specialist", "Automation Lead"],
  },
  {
    code: "MECH",
    name: "Mechanical Engineering",
    category: "Core Engineering",
    schoolGroup: "non_soc",
    description: "Precision manufacturing, robotics, CAD/CAM simulation, computational thermodynamics, and industrial engineering.",
    skills: ["CAD/CAM & FEA", "Robotics & Automation", "Thermal Analysis", "Additive 3D Prototyping"],
    careers: ["Mechanical Design Engineer", "Robotics Specialist", "Manufacturing Engineer"],
  },
  {
    code: "CIVIL",
    name: "Civil Engineering",
    category: "Core Engineering",
    schoolGroup: "non_soc",
    description: "Sustainable infrastructure development, structural simulation, geotechnical analysis, and smart construction management.",
    skills: ["BIM & Revit", "Structural Analysis", "Total Station & GIS", "Project Management"],
    careers: ["Structural Consultant", "BIM Specialist", "Civil Project Manager"],
  },
];
