import type { ResumeWorkExperience } from "lib/redux/types";
import type {
  TextItem,
  FeatureSet,
  ResumeSectionToLines,
} from "lib/parse-resume-from-pdf/types";
import { getSectionLinesByKeywords } from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/get-section-lines";
import {
  DATE_FEATURE_SETS,
  hasNumber,
  getHasText,
  isBold,
} from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/common-features";
import { divideSectionIntoSubsections } from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/subsections";
import { getTextWithHighestFeatureScore } from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/feature-scoring-system";
import {
  getBulletPointsFromLines,
  getDescriptionsLineIdx,
} from "lib/parse-resume-from-pdf/extract-resume-from-sections/lib/bullet-points";

// prettier-ignore
const WORK_EXPERIENCE_KEYWORDS_LOWERCASE = ['work', 'experience', 'employment', 'history', 'job'];
// prettier-ignore
// const JOB_TITLES = ['Accountant', 'Administrator', 'Advisor', 'Agent', 'Analyst', 'Apprentice', 'Architect', 'Assistant', 'Associate', 'Auditor', 'Bartender', 'Biologist', 'Bookkeeper', 'Buyer', 'Carpenter', 'Cashier', 'CEO', 'Clerk', 'Co-op', 'Co-Founder', 'Consultant', 'Coordinator', 'CTO', 'Developer', 'Designer', 'Director', 'Driver', 'Editor', 'Electrician', 'Engineer', 'Extern', 'Founder', 'Freelancer', 'Head', 'Intern', 'Janitor', 'Journalist', 'Laborer', 'Lawyer', 'Lead', 'Manager', 'Mechanic', 'Member', 'Nurse', 'Officer', 'Operator', 'Operation', 'Photographer', 'President', 'Producer', 'Recruiter', 'Representative', 'Researcher', 'Sales', 'Server', 'Scientist', 'Specialist', 'Supervisor', 'Teacher', 'Technician', 'Trader', 'Trainee', 'Treasurer', 'Tutor', 'Vice', 'VP', 'Volunteer', 'Webmaster', 'Worker','front end developer'];

const JOB_TITLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Web Developer', 'Mobile Developer', 'JavaScript Developer', 'React Developer', 'Node.js Developer', 'Angular Developer', 'Vue.js Developer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'UI/UX Developer', 'UI/UX Engineer', 'Frontend Software Engineer', 'Backend Software Engineer', 'Full Stack Software Engineer', 'API Developer', 'Mobile App Developer', 'iOS Developer', 'Android Developer', 'Cross-Platform Mobile Developer', 'Flutter Developer', 'React Native Developer', 'DevOps Engineer', 'Software Architect', 'Junior Software Developer', 'Senior Software Developer', 'Lead Developer', 'Principal Software Engineer', 'Cloud Engineer', 'Web Engineer', 'Frontend Architect', 'Backend Architect', 'Full Stack Architect', 'Machine Learning Engineer', 'Data Engineer', 'Big Data Developer', 'Site Reliability Engineer (SRE)', 'Test Automation Engineer', 'Quality Assurance (QA) Engineer', 'API Engineer', 'Software Consultant', 'Software Development Manager', 'Software Development Lead', 'Engineering Manager', 'CTO (Chief Technology Officer)', 'Technical Lead', 'Technical Architect', 'Software Product Manager', 'Software Solutions Architect', 'Embedded Systems Developer', 'Game Developer', 'Blockchain Developer', 'AI Developer', 'Data Scientist', 'Software Trainer', 'Application Developer', 'DevOps Developer', 'Platform Engineer', 'System Architect', 'Integration Engineer', 'Technical Specialist', 'Java Developer', 'Python Developer', 'PHP Developer', 'Ruby Developer', 'C++ Developer', 'C# Developer', 'Go Developer', 'Kotlin Developer', 'Swift Developer', 'SQL Developer', 'NoSQL Developer', 'Rust Developer', 'Scala Developer', 'Django Developer', 'Spring Boot Developer', 'Microservices Developer', 'API Integrations Developer', 'Mobile Architect', 'Technical Program Manager', 'Scrum Master',"Intern",'Server','Database Administrator (DBA)', 'Data Analyst', 'Data Warehouse Engineer', 'Data Migration Engineer', 'Database Architect', 'ETL Developer', 'Database Manager', 'SQL Server Developer', 'Oracle Database Administrator', 'MongoDB Administrator', 'PostgreSQL Developer', 'Database Reliability Engineer', 'Cloud Database Engineer', 'NoSQL Administrator', 'Data Governance Specialist', 'Database Performance Tuner', 'Database Security Specialist', 'MySQL Database Administrator', 'Data Integration Specialist','Database','SQL'
];

const hasJobTitle = (item: TextItem) =>
  JOB_TITLES.some((jobTitle) =>
    item.text.split(/\s/).some((word) => word === jobTitle)
  );
const hasMoreThan5Words = (item: TextItem) => item.text.split(/\s/).length > 5;
const JOB_TITLE_FEATURE_SET: FeatureSet[] = [
  [hasJobTitle, 4],
  [hasNumber, -4],
  [hasMoreThan5Words, -2],
];

export const extractWorkExperience = (sections: ResumeSectionToLines) => {
  const workExperiences: ResumeWorkExperience[] = [];
  const workExperiencesScores = [];
  const lines = getSectionLinesByKeywords(
    sections,
    WORK_EXPERIENCE_KEYWORDS_LOWERCASE
  );
  const subsections = divideSectionIntoSubsections(lines);

  for (const subsectionLines of subsections) {
    const descriptionsLineIdx = getDescriptionsLineIdx(subsectionLines) ?? 2;

    const subsectionInfoTextItems = subsectionLines
      .slice(0, descriptionsLineIdx)
      .flat();
    const [date, dateScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      DATE_FEATURE_SETS
    );
    const [jobTitle, jobTitleScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      JOB_TITLE_FEATURE_SET
    );
    const COMPANY_FEATURE_SET: FeatureSet[] = [
      [isBold, 2],
      [getHasText(date), -4],
      [getHasText(jobTitle), -4],
    ];
    const [company, companyScores] = getTextWithHighestFeatureScore(
      subsectionInfoTextItems,
      COMPANY_FEATURE_SET,
      false
    );

    const subsectionDescriptionsLines =
      subsectionLines.slice(descriptionsLineIdx);
    const descriptions = getBulletPointsFromLines(subsectionDescriptionsLines);

    workExperiences.push({ company, jobTitle, date, descriptions });
    workExperiencesScores.push({
      companyScores,
      jobTitleScores,
      dateScores,
    });
  }
  return { workExperiences, workExperiencesScores };
};
