-- Sample data for SkillQuest database

-- Insert sample goals
INSERT INTO goals (name) VALUES 
('Web Development'),
('Mobile App Development'),
('Data Science'),
('Machine Learning'),
('Cybersecurity'),
('Cloud Computing'),
('DevOps'),
('UI/UX Design'),
('Game Development'),
('Blockchain Development');

-- Insert sample skills
INSERT INTO skills (name) VALUES 
('HTML'),
('CSS'),
('JavaScript'),
('Python'),
('Java'),
('React'),
('Node.js'),
('SQL'),
('Git'),
('Docker'),
('AWS'),
('MongoDB'),
('TypeScript'),
('Vue.js'),
('Angular'),
('PHP'),
('C++'),
('C#'),
('Swift'),
('Kotlin'),
('TensorFlow'),
('PyTorch'),
('Pandas'),
('NumPy'),
('Scikit-learn'),
('Linux'),
('Kubernetes'),
('Jenkins'),
('Ansible'),
('Figma'),
('Adobe XD'),
('Unity'),
('Unreal Engine'),
('Solidity'),
('Ethereum'),
('Bitcoin');

-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (name, email, password_hash, role) VALUES 
('John Student', 'john@example.com', '$2b$10$y4QSGuqAZk81AuG26G.FpuPM/5W43bWZgYiB38lK7wXA6N1cw59qG', 'student'),
('Jane Mentor', 'jane@example.com', '$2b$10$y4QSGuqAZk81AuG26G.FpuPM/5W43bWZgYiB38lK7wXA6N1cw59qG', 'mentor'),
('Bob Student', 'bob@example.com', '$2b$10$y4QSGuqAZk81AuG26G.FpuPM/5W43bWZgYiB38lK7wXA6N1cw59qG', 'student'),
('Alice Mentor', 'alice@example.com', '$2b$10$y4QSGuqAZk81AuG26G.FpuPM/5W43bWZgYiB38lK7wXA6N1cw59qG', 'mentor');

-- Insert sample projects
INSERT INTO projects (name, description, difficulty, created_by) VALUES 
('Build a React Todo App', 'Learn React fundamentals by building a complete todo application with CRUD operations', 'Beginner', 2),
('Full Stack E-commerce Platform', 'Create a complete e-commerce website with user authentication, product management, and payment integration', 'Intermediate', 2),
('Machine Learning Image Classifier', 'Build an image classification model using Python and TensorFlow', 'Advanced', 4),
('Mobile App with React Native', 'Develop a cross-platform mobile application using React Native', 'Intermediate', 4),
('Web Security Fundamentals', 'Learn about web security vulnerabilities and how to prevent them', 'Intermediate', 2),
('Data Analysis with Python', 'Master data analysis techniques using Python libraries like Pandas and NumPy', 'Beginner', 4);

-- Insert project-goal relationships
INSERT INTO project_goals (project_id, goal_id) VALUES 
(1, 1), -- React Todo App -> Web Development
(2, 1), -- E-commerce Platform -> Web Development
(3, 4), -- ML Image Classifier -> Machine Learning
(4, 2), -- React Native App -> Mobile App Development
(5, 5), -- Web Security -> Cybersecurity
(6, 3); -- Data Analysis -> Data Science

-- Insert project-skill relationships
INSERT INTO project_skills (project_id, skill_id, required_level) VALUES 
-- React Todo App skills
(1, 1, 1), -- HTML
(1, 2, 1), -- CSS
(1, 3, 2), -- JavaScript
(1, 6, 1), -- React

-- E-commerce Platform skills
(2, 1, 2), -- HTML
(2, 2, 2), -- CSS
(2, 3, 3), -- JavaScript
(2, 6, 2), -- React
(2, 7, 2), -- Node.js
(2, 8, 2), -- SQL

-- ML Image Classifier skills
(3, 4, 3), -- Python
(3, 21, 2), -- TensorFlow
(3, 23, 2), -- Pandas
(3, 24, 2), -- NumPy

-- React Native App skills
(4, 3, 3), -- JavaScript
(4, 6, 2), -- React
(4, 13, 1), -- TypeScript

-- Web Security skills
(5, 1, 2), -- HTML
(5, 2, 2), -- CSS
(5, 3, 2), -- JavaScript
(5, 8, 1), -- SQL

-- Data Analysis skills
(6, 4, 2), -- Python
(6, 23, 2), -- Pandas
(6, 24, 2), -- NumPy
(6, 25, 1); -- Scikit-learn

-- Insert user goals (John and Bob have some goals)
INSERT INTO user_goals (user_id, goal_id) VALUES 
(1, 1), -- John -> Web Development
(1, 2), -- John -> Mobile App Development
(3, 1), -- Bob -> Web Development
(3, 3); -- Bob -> Data Science

-- Insert user skills (John and Bob have some skills)
INSERT INTO user_skills (user_id, skill_id, level) VALUES 
(1, 1, 3), -- John: HTML level 3
(1, 2, 2), -- John: CSS level 2
(1, 3, 2), -- John: JavaScript level 2
(1, 6, 1), -- John: React level 1
(3, 4, 2), -- Bob: Python level 2
(3, 23, 1), -- Bob: Pandas level 1
(3, 24, 1); -- Bob: NumPy level 1

-- Insert goal-skill relationships
INSERT INTO goal_skills (goal_id, skill_id) VALUES 
-- Web Development skills
(1, 1), -- HTML
(1, 2), -- CSS
(1, 3), -- JavaScript
(1, 6), -- React
(1, 7), -- Node.js
(1, 8), -- SQL

-- Mobile App Development skills
(2, 3), -- JavaScript
(2, 6), -- React
(2, 13), -- TypeScript
(2, 19), -- Swift
(2, 20), -- Kotlin

-- Data Science skills
(3, 4), -- Python
(3, 8), -- SQL
(3, 23), -- Pandas
(3, 24), -- NumPy
(3, 25), -- Scikit-learn

-- Machine Learning skills
(4, 4), -- Python
(4, 21), -- TensorFlow
(4, 22), -- PyTorch
(4, 23), -- Pandas
(4, 24), -- NumPy
(4, 25); -- Scikit-learn

-- Insert sample skill modules for projects
INSERT INTO skill_modules (project_id, title, description, order_sequence, estimated_hours, difficulty) VALUES 
-- React Todo App modules
(1, 'HTML & CSS Basics', 'Learn the fundamentals of HTML and CSS to create the structure and styling', 1, 4, 'Beginner'),
(1, 'JavaScript Fundamentals', 'Master JavaScript basics including variables, functions, and DOM manipulation', 2, 6, 'Beginner'),
(1, 'React Introduction', 'Learn React components, props, and state management', 3, 8, 'Beginner'),
(1, 'Building the Todo App', 'Put it all together to create a functional todo application', 4, 6, 'Beginner'),

-- E-commerce Platform modules
(2, 'Advanced React', 'Learn advanced React concepts like hooks, context, and routing', 1, 10, 'Intermediate'),
(2, 'Backend with Node.js', 'Create a RESTful API using Node.js and Express', 2, 12, 'Intermediate'),
(2, 'Database Design', 'Design and implement a database schema for the e-commerce platform', 3, 8, 'Intermediate'),
(2, 'Payment Integration', 'Integrate payment processing with Stripe or PayPal', 4, 10, 'Intermediate'),

-- ML Image Classifier modules
(3, 'Python for ML', 'Review Python fundamentals and learn ML-specific libraries', 1, 8, 'Advanced'),
(3, 'TensorFlow Basics', 'Introduction to TensorFlow and neural networks', 2, 12, 'Advanced'),
(3, 'Image Processing', 'Learn techniques for processing and preparing image data', 3, 10, 'Advanced'),
(3, 'Model Training & Deployment', 'Train your model and deploy it for real-world use', 4, 14, 'Advanced');

-- Insert sample learning resources
INSERT INTO learning_resources (module_id, title, description, url, resource_type, resource_category, difficulty_level, estimated_duration, order_sequence, is_free, language, created_by, is_approved) VALUES 
-- HTML & CSS Basics resources
(1, 'HTML Tutorial for Beginners', 'Complete HTML tutorial covering all essential elements', 'https://www.w3schools.com/html/', 'course', 'prerequisite', 'Beginner', 120, 1, true, 'en', 2, true),
(1, 'CSS Fundamentals', 'Learn CSS styling, layouts, and responsive design', 'https://developer.mozilla.org/en-US/docs/Web/CSS', 'documentation', 'core', 'Beginner', 90, 2, true, 'en', 2, true),
(1, 'CSS Grid Layout', 'Master CSS Grid for modern layouts', 'https://css-tricks.com/snippets/css/complete-guide-grid/', 'article', 'practice', 'Beginner', 60, 3, true, 'en', 2, true),

-- JavaScript Fundamentals resources
(2, 'JavaScript Basics', 'Learn JavaScript fundamentals from scratch', 'https://javascript.info/', 'course', 'prerequisite', 'Beginner', 180, 1, true, 'en', 2, true),
(2, 'DOM Manipulation', 'Learn how to interact with the Document Object Model', 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model', 'documentation', 'core', 'Beginner', 90, 2, true, 'en', 2, true),
(2, 'JavaScript Exercises', 'Practice JavaScript with interactive exercises', 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', 'exercise', 'practice', 'Beginner', 120, 3, true, 'en', 2, true),

-- React Introduction resources
(3, 'React Official Tutorial', 'Official React tutorial from Facebook', 'https://reactjs.org/tutorial/tutorial.html', 'course', 'core', 'Beginner', 240, 1, true, 'en', 2, true),
(3, 'React Hooks Guide', 'Learn about React hooks and functional components', 'https://reactjs.org/docs/hooks-intro.html', 'documentation', 'core', 'Beginner', 90, 2, true, 'en', 2, true),
(3, 'Build a Simple React App', 'Step-by-step guide to building your first React app', 'https://www.youtube.com/watch?v=DLX62G4lc44', 'video', 'practice', 'Beginner', 60, 3, true, 'en', 2, true);

-- Insert user projects (enrollments)
INSERT INTO user_projects (user_id, project_id, status, start_date) VALUES 
(1, 1, 'in_progress', '2024-01-15'), -- John enrolled in React Todo App
(1, 2, 'completed', '2024-01-01'), -- John completed E-commerce Platform
(3, 6, 'in_progress', '2024-01-20'); -- Bob enrolled in Data Analysis

-- Insert user XP and streaks
INSERT INTO user_xp (user_id, xp_total, level) VALUES 
(1, 450, 2), -- John has 450 XP, level 2
(3, 120, 1); -- Bob has 120 XP, level 1

INSERT INTO user_streaks (user_id, current_streak, best_streak, last_active_date) VALUES 
(1, 5, 12, '2024-01-20'), -- John: 5 day streak, best was 12
(3, 2, 5, '2024-01-19'); -- Bob: 2 day streak, best was 5

-- Insert user activity logs
INSERT INTO user_activity (user_id, action, project_id, module_id, metadata) VALUES 
(1, 'enrolled_project', 1, NULL, '{"source": "home_page"}'),
(1, 'started_module', 1, 1, '{"module_title": "HTML & CSS Basics"}'),
(1, 'completed_resource', 1, 1, '{"resource_title": "HTML Tutorial for Beginners"}'),
(1, 'completed_project', 2, NULL, '{"completion_time_days": 45}'),
(3, 'enrolled_project', 6, NULL, '{"source": "recommendations"}'),
(3, 'started_module', 6, 1, '{"module_title": "Python for ML"}');

-- Insert sample certificates for completed projects
INSERT INTO certificates (certificate_id, user_id, project_id, project_name, student_name, difficulty, completion_date, issued_date, status) VALUES
('CERT-1703123456789-1-1', 1, 1, 'Web Development Fundamentals', 'John Doe', 'beginner', '2024-01-15', '2024-01-15 10:30:00', 'issued'),
('CERT-1703123456790-1-2', 1, 2, 'JavaScript Mastery', 'John Doe', 'intermediate', '2024-01-20', '2024-01-20 14:45:00', 'issued'),
('CERT-1703123456791-3-3', 3, 3, 'Python for Machine Learning', 'Bob Smith', 'advanced', '2024-01-25', '2024-01-25 09:15:00', 'issued');
