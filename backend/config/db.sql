CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL
);

CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE user_goals (
    user_id INT,
    goal_id INT,
    PRIMARY KEY (user_id, goal_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE user_skills (
    user_id INT,
    skill_id INT,
    level INT NOT NULL,
    PRIMARY KEY (user_id, skill_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE project_goals (
    project_id INT,
    goal_id INT,
    PRIMARY KEY (project_id, goal_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE TABLE project_skills (
    project_id INT,
    skill_id INT,
    required_level INT NOT NULL,
    PRIMARY KEY (project_id, skill_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE user_projects (
    user_id INT,
    project_id INT,
    status ENUM('in_progress', 'completed') NOT NULL,
    start_date DATE,
    completion_date DATE,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE goal_skills (
    goal_id INT NOT NULL,
    skill_id INT NOT NULL,
    PRIMARY KEY (goal_id, skill_id),
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE user_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  project_id INT NULL,
  module_id INT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id, created_at),
  INDEX (action)
);

CREATE TABLE user_xp (
  user_id INT PRIMARY KEY,
  xp_total INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  last_level_up_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_streaks (
  user_id INT PRIMARY KEY,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Skills Roadmap & Resources Database Schema
-- Extends existing SkillQuest database with roadmap functionality

-- 1. SKILL MODULES: Logical groupings of related skills for projects
CREATE TABLE skill_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_sequence INT NOT NULL DEFAULT 1,
    estimated_hours INT DEFAULT 0,
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX (project_id, order_sequence),
    UNIQUE KEY unique_project_order (project_id, order_sequence)
);

-- 2. MODULE PREREQUISITES: Define learning dependencies between modules
CREATE TABLE module_prerequisites (
    module_id INT NOT NULL,
    prerequisite_module_id INT NOT NULL,
    is_strict BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (module_id, prerequisite_module_id),
    FOREIGN KEY (module_id) REFERENCES skill_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_module_id) REFERENCES skill_modules(id) ON DELETE CASCADE,
    -- Prevent self-referencing prerequisites
    CHECK (module_id != prerequisite_module_id)
);

-- 3. MODULE SKILLS: Connect modules to specific skills from existing skills table
CREATE TABLE module_skills (
    module_id INT NOT NULL,
    skill_id INT NOT NULL,
    target_level INT NOT NULL DEFAULT 1, -- Target proficiency level (1-5)
    is_primary BOOLEAN DEFAULT TRUE, -- Primary vs supporting skill
    weight DECIMAL(3,2) DEFAULT 1.0, -- Importance weight (0.1 - 1.0)
    PRIMARY KEY (module_id, skill_id),
    FOREIGN KEY (module_id) REFERENCES skill_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    CHECK (target_level >= 1 AND target_level <= 5),
    CHECK (weight >= 0.1 AND weight <= 1.0)
);

-- 4. LEARNING RESOURCES: Enhanced resource management per module
CREATE TABLE learning_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT,
    resource_type ENUM('article', 'video', 'course', 'documentation', 'exercise', 'quiz', 'project') NOT NULL,
    resource_category ENUM('prerequisite', 'core', 'practice', 'assessment', 'supplementary') NOT NULL DEFAULT 'core',
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
    estimated_duration INT DEFAULT 0, -- in minutes
    order_sequence INT DEFAULT 1,
    is_free BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    rating DECIMAL(3,2) DEFAULT 0.0, -- User rating 0-5
    vote_count INT DEFAULT 0,
    created_by INT, -- User who added this resource
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES skill_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (module_id, resource_category, order_sequence),
    INDEX (resource_type, is_approved),
    CHECK (rating >= 0 AND rating <= 5)
);

-- 5. USER MODULE PROGRESS: Track individual user progress through modules
CREATE TABLE user_module_progress (
    user_id INT NOT NULL,
    module_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'skipped') NOT NULL DEFAULT 'not_started',
    progress_percentage INT DEFAULT 0,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    estimated_completion_date DATE NULL,
    time_spent_minutes INT DEFAULT 0,
    notes TEXT, -- User notes for this module
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES skill_modules(id) ON DELETE CASCADE,
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    INDEX (user_id, status),
    INDEX (module_id, status)
);

-- 6. USER RESOURCE INTERACTIONS: Track resource usage and feedback
CREATE TABLE user_resource_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    interaction_type ENUM('viewed', 'completed', 'bookmarked', 'rated', 'reported') NOT NULL,
    rating INT NULL, -- 1-5 star rating
    feedback TEXT,
    time_spent_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES learning_resources(id) ON DELETE CASCADE,
    INDEX (user_id, interaction_type),
    INDEX (resource_id, interaction_type),
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    -- Prevent duplicate ratings from same user
    UNIQUE KEY unique_user_resource_rating (user_id, resource_id, interaction_type)
);

-- 7. ROADMAP TEMPLATES: Predefined learning paths for common skill combinations
CREATE TABLE roadmap_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., 'web-development', 'data-science', 'mobile-dev'
    difficulty ENUM('Beginner', 'Intermediate', 'Advanced', 'Mixed') NOT NULL,
    estimated_total_hours INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (category, difficulty, is_active)
);

-- 8. TEMPLATE MODULES: Connect roadmap templates to skill modules
CREATE TABLE template_modules (
    template_id INT NOT NULL,
    module_id INT NOT NULL,
    order_sequence INT NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (template_id, module_id),
    FOREIGN KEY (template_id) REFERENCES roadmap_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES skill_modules(id) ON DELETE CASCADE,
    INDEX (template_id, order_sequence)
);

-- 9. EXTEND user_activity table to support module-level tracking
-- Add new action types: 'started_module', 'completed_module', 'viewed_resource', 'completed_resource'
-- (No schema change needed, just new action types in application logic)

-- 10. VIEWS for common queries

-- View: User's current roadmap progress
CREATE VIEW user_roadmap_progress AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    p.id as project_id,
    p.name as project_name,
    sm.id as module_id,
    sm.title as module_title,
    sm.order_sequence,
    sm.estimated_hours,
    ump.status,
    ump.progress_percentage,
    ump.started_at,
    ump.completed_at,
    ump.time_spent_minutes,
    COUNT(lr.id) as total_resources,
    COUNT(uri.id) as completed_resources
FROM users u
JOIN user_projects up ON u.id = up.user_id
JOIN projects p ON up.project_id = p.id
JOIN skill_modules sm ON p.id = sm.project_id
LEFT JOIN user_module_progress ump ON u.id = ump.user_id AND sm.id = ump.module_id
LEFT JOIN learning_resources lr ON sm.id = lr.module_id AND lr.is_approved = TRUE
LEFT JOIN user_resource_interactions uri ON u.id = uri.user_id AND lr.id = uri.resource_id AND uri.interaction_type = 'completed'
GROUP BY u.id, p.id, sm.id, ump.user_id, ump.module_id;

-- View: Module completion statistics
CREATE VIEW module_completion_stats AS
SELECT 
    sm.id as module_id,
    sm.title as module_title,
    p.name as project_name,
    sm.difficulty,
    COUNT(DISTINCT ump.user_id) as enrolled_users,
    COUNT(DISTINCT CASE WHEN ump.status = 'completed' THEN ump.user_id END) as completed_users,
    ROUND(
        COUNT(DISTINCT CASE WHEN ump.status = 'completed' THEN ump.user_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT ump.user_id), 0), 2
    ) as completion_rate,
    AVG(CASE WHEN ump.status = 'completed' THEN ump.time_spent_minutes END) as avg_completion_time,
    AVG(lr.rating) as avg_resource_rating
FROM skill_modules sm
JOIN projects p ON sm.project_id = p.id
LEFT JOIN user_module_progress ump ON sm.id = ump.module_id
LEFT JOIN learning_resources lr ON sm.id = lr.module_id
GROUP BY sm.id, sm.title, p.name, sm.difficulty;

-- Sample Data Indexes for Performance
CREATE INDEX idx_user_module_progress_status ON user_module_progress(status, updated_at);
CREATE INDEX idx_learning_resources_rating ON learning_resources(rating DESC, vote_count DESC);
CREATE INDEX idx_resource_interactions_time ON user_resource_interactions(created_at DESC, interaction_type);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    completion_date DATE NOT NULL,
    issued_date DATETIME NOT NULL,
    status ENUM('issued', 'revoked') DEFAULT 'issued',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for certificates table
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_project_id ON certificates(project_id);
CREATE INDEX idx_certificates_issued_date ON certificates(issued_date DESC);
